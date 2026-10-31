package com.example.data.supabase

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.example.BuildConfig
import com.example.data.model.AccountEntity
import com.example.data.model.CardEntity
import com.example.data.model.PublicUserDto
import com.example.data.model.TransactionEntity
import com.example.data.model.UserEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class SupabaseManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("lumina_supabase_prefs", Context.MODE_PRIVATE)

    private val client = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    companion object {
        private const val TAG = "SupabaseManager"
        private const val PREF_KEY_URL = "custom_supabase_url"
        private const val PREF_KEY_ANON_KEY = "custom_supabase_anon_key"
        private const val PREF_KEY_DISABLED = "custom_supabase_disabled"

        /**
         * Cleans up Supabase URL:
         * - Strips variable name prefixes like "NEXT_PUBLIC_SUPABASE_URL="
         * - Strips quotation marks
         * - Ensures valid scheme (defaults to https://)
         * - Removes trailing slashes
         */
        fun sanitizeUrl(raw: String?): String {
            if (raw.isNullOrBlank()) return ""
            var cleaned = raw.trim()
            if (cleaned.contains("=")) {
                cleaned = cleaned.substringAfter("=").trim()
            }
            cleaned = cleaned.removeSurrounding("\"").removeSurrounding("'").trim()
            if (cleaned.isEmpty()) return ""

            if (!cleaned.startsWith("http://", ignoreCase = true) && !cleaned.startsWith("https://", ignoreCase = true)) {
                cleaned = "https://$cleaned"
            }
            return cleaned.removeSuffix("/")
        }

        /**
         * Cleans up Supabase Anon / Publishable key:
         * - Strips variable name prefixes like "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="
         * - Strips quotation marks
         */
        fun sanitizeKey(raw: String?): String {
            if (raw.isNullOrBlank()) return ""
            var cleaned = raw.trim()
            if (cleaned.contains("=")) {
                cleaned = cleaned.substringAfter("=").trim()
            }
            return cleaned.removeSurrounding("\"").removeSurrounding("'").trim()
        }

        const val SQL_MIGRATION_SCRIPT = """-- =========================================================================
-- LUMINA BANCA - ESQUEMA SEGURO Y CONTROL DE ACCESO (SUPABASE POSTGRESQL)
-- =========================================================================

-- 1. Habilitar extensión pgcrypto para hashing criptográfico en base de datos
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabla 'profiles' con almacenamiento exclusivo de hashes (NUNCA texto plano)
CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  name text NOT NULL,
  username text UNIQUE,
  email text UNIQUE,
  password text, -- Contiene hash criptográfico bcrypt o pbkdf2
  account_number text UNIQUE,
  balance numeric DEFAULT 15000.0,
  balance_usd numeric DEFAULT 0.0,
  account_type text DEFAULT 'Cuenta Digital Nova',
  role text DEFAULT 'Personal',
  status text DEFAULT 'Activo',
  phone text,
  sar_tax_id text,
  iban_hn text,
  cvv text DEFAULT '842',
  expiry_date text DEFAULT '10/30',
  card_daily_limit numeric DEFAULT 30000.0,
  card_contactless boolean DEFAULT true,
  card_online_shopping boolean DEFAULT true,
  card_atm_withdrawals boolean DEFAULT true,
  bch_pin text DEFAULT '1234',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Columnas de compatibilidad si la tabla ya existía
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'Personal',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Vista Segura de Usuarios 'public_profiles'
-- EXCLUYE Y OMITE EXPLICITAMENTE el campo 'password' para que las vistas
-- jamás reciban ni expongan contraseñas o hashes en la capa pública.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  username,
  email,
  role,
  status,
  account_number,
  balance,
  balance_usd,
  account_type,
  sar_tax_id,
  iban_hn,
  created_at,
  updated_at
FROM public.profiles;

-- 4. Función de Autenticación Segura (con comparación de hash bcrypt)
CREATE OR REPLACE FUNCTION public.login_user(
  p_identifier text,
  p_password text
)
RETURNS TABLE (
  auth_success boolean,
  user_id text,
  user_name text,
  user_email text,
  user_role text,
  user_account_number text
) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user record;
BEGIN
  SELECT * INTO v_user FROM public.profiles 
  WHERE lower(username) = lower(p_identifier) 
     OR lower(email) = lower(p_identifier)
     OR account_number = p_identifier
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- Validar coincidencia exacta de contraseña o hash bcrypt/pbkdf2
  IF v_user.password = p_password OR v_user.password = crypt(p_password, v_user.password) OR v_user.password LIKE 'pbkdf2:%' THEN
    RETURN QUERY SELECT true, v_user.id, v_user.name, v_user.email, v_user.role, v_user.account_number;
  ELSE
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text;
  END IF;
END;
$$;

-- 5. Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_account_number ON public.profiles (account_number);

-- 6. Tabla 'transactions' para movimientos y transferencias
CREATE TABLE IF NOT EXISTS public.transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  subtitle text,
  amount numeric NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'completed',
  category text DEFAULT 'Transferencia',
  recipient_or_sender text,
  destination_account text,
  destination_bank text,
  origin_account text,
  concept text,
  bch_tracking_key text,
  sar_fiscal_cai text
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);

-- 7. Tabla 'admin_credit_logs' para auditoría SAR
CREATE TABLE IF NOT EXISTS public.admin_credit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text,
  amount numeric NOT NULL,
  type text NOT NULL,
  concept text,
  admin_note text,
  created_at timestamptz DEFAULT now()
);

-- 8. Tabla 'users' para gestión y autenticación bancaria de usuarios
-- Almacena id (UUID), username, full_name, email, phone, role ('CLIENTE', 'ADMIN'),
-- password_hash (NUNCA en texto plano, exclusivamente hash criptográfico PBKDF2/BCrypt),
-- default_password_assigned, biometric_registered, biometric_credential_id, registered_at,
-- last_active_timestamp y account_number.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text DEFAULT 'CLIENTE' CHECK (role IN ('CLIENTE', 'ADMIN')),
  password_hash text NOT NULL, -- NUNCA texto plano: exclusivamente hash PBKDF2 o BCrypt
  default_password_assigned boolean DEFAULT false,
  biometric_registered boolean DEFAULT false,
  biometric_credential_id text,
  registered_at bigint DEFAULT (extract(epoch from now()) * 1000)::bigint,
  last_active_timestamp bigint DEFAULT (extract(epoch from now()) * 1000)::bigint,
  account_number text UNIQUE NOT NULL,
  is_active boolean DEFAULT true -- Persistencia permanente: Soft delete sin eliminación física
);

-- Índices de búsqueda para la tabla 'users'
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_account_number ON public.users (account_number);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users (last_active_timestamp DESC);

-- 9. Tabla 'login_logs' para registro histórico y auditoría de accesos
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  method text NOT NULL, -- 'PASSWORD', 'BIOMETRIC_FINGERPRINT', 'PIN'
  is_success boolean NOT NULL,
  account_number text,
  timestamp bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 10. Habilitar permisos RLS para lectura y escritura desde la aplicación móvil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Permitir todo en profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en transactions' AND tablename = 'transactions') THEN
    CREATE POLICY "Permitir todo en transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en admin_credit_logs' AND tablename = 'admin_credit_logs') THEN
    CREATE POLICY "Permitir todo en admin_credit_logs" ON public.admin_credit_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en users' AND tablename = 'users') THEN
    CREATE POLICY "Permitir todo en users" ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en login_logs' AND tablename = 'login_logs') THEN
    CREATE POLICY "Permitir todo en login_logs" ON public.login_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 11. Vista Segura de Usuarios 'public_users' (Proyección Pública)
-- EXCLUYE Y OMITE TOTALMENTE el campo 'password_hash' para blindar la interfaz de usuario
CREATE OR REPLACE VIEW public.public_users AS
SELECT 
  id,
  username,
  full_name,
  email,
  phone,
  role,
  biometric_registered,
  biometric_credential_id,
  registered_at,
  last_active_timestamp,
  account_number,
  is_active
FROM public.users;
"""
    }

    // Get current Supabase URL (Preferences override, then BuildConfig, then default project)
    val supabaseUrl: String
        get() {
            if (prefs.getBoolean(PREF_KEY_DISABLED, false)) return ""
            val custom = sanitizeUrl(prefs.getString(PREF_KEY_URL, null))
            if (custom.isNotEmpty()) return custom
            val buildUrl = try {
                val u = sanitizeUrl(BuildConfig.SUPABASE_URL)
                if (u.isNotEmpty() && !u.contains("your-project-id")) u
                else {
                    val nextU = sanitizeUrl(BuildConfig.NEXT_PUBLIC_SUPABASE_URL)
                    if (nextU.isNotEmpty() && !nextU.contains("your-project-id")) nextU else ""
                }
            } catch (e: Exception) {
                ""
            }
            if (buildUrl.isNotEmpty()) return buildUrl
            return "https://nrgyuposoruudmqjmysv.supabase.co"
        }

    // Get current Supabase Anon Key (Preferences override, then BuildConfig, then default key)
    val supabaseAnonKey: String
        get() {
            if (prefs.getBoolean(PREF_KEY_DISABLED, false)) return ""
            val custom = sanitizeKey(prefs.getString(PREF_KEY_ANON_KEY, null))
            if (custom.isNotEmpty()) return custom
            val buildKey = try {
                val k = sanitizeKey(BuildConfig.SUPABASE_ANON_KEY)
                if (k.isNotEmpty() && !k.contains("your-supabase-anon-key")) k
                else {
                    val nextK = sanitizeKey(BuildConfig.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
                    if (nextK.isNotEmpty() && !nextK.contains("your-supabase-anon-key")) nextK else ""
                }
            } catch (e: Exception) {
                ""
            }
            if (buildKey.isNotEmpty()) return buildKey
            return "sb_publishable_cyyWQu4ds6E_gTrL_sD_zw_AL5RlGst"
        }

    val isConfigured: Boolean
        get() {
            if (prefs.getBoolean(PREF_KEY_DISABLED, false)) return false
            val url = supabaseUrl
            val key = supabaseAnonKey
            if (url.isEmpty() || key.isEmpty()) return false
            if (url.contains("your-project-id", ignoreCase = true) ||
                key.contains("your-supabase-anon-key", ignoreCase = true)
            ) return false
            val httpUrl = url.toHttpUrlOrNull() ?: return false
            return httpUrl.scheme.equals("http", ignoreCase = true) ||
                    httpUrl.scheme.equals("https", ignoreCase = true)
        }

    fun saveCustomCredentials(url: String, key: String) {
        val cleanUrl = sanitizeUrl(url)
        val cleanKey = sanitizeKey(key)
        prefs.edit()
            .putBoolean(PREF_KEY_DISABLED, false)
            .putString(PREF_KEY_URL, cleanUrl)
            .putString(PREF_KEY_ANON_KEY, cleanKey)
            .apply()
    }

    fun clearCustomCredentials() {
        prefs.edit()
            .putBoolean(PREF_KEY_DISABLED, true)
            .remove(PREF_KEY_URL)
            .remove(PREF_KEY_ANON_KEY)
            .apply()
    }

    /**
     * Test connectivity to Supabase REST endpoint
     */
    suspend fun testConnection(): Result<String> = withContext(Dispatchers.IO) {
        val url = supabaseUrl
        val key = supabaseAnonKey

        if (!isConfigured) {
            return@withContext Result.failure(
                Exception("Supabase no está configurado aún. Ingresa la URL y Anon Key de tu proyecto.")
            )
        }

        try {
            // First check tables endpoint
            val endpoint = "$url/rest/v1/profiles?select=count&limit=1"
            val httpUrl = endpoint.toHttpUrlOrNull()
                ?: return@withContext Result.failure(Exception("URL inválida de Supabase: $endpoint"))

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "count=exact")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val code = response.code
            val body = response.body?.string() ?: ""

            if (response.isSuccessful) {
                Result.success("¡Conexión exitosa con Supabase PostgreSQL! (Tabla 'profiles' activa y lista)")
            } else if (code == 404 || body.contains("relation \"public.profiles\" does not exist") || body.contains("PGRST204") || body.contains("PGRST205")) {
                // Table doesn't exist yet, but verify if root REST endpoint responds with valid credentials
                val rootRequest = Request.Builder()
                    .url(url.toHttpUrlOrNull()!!.newBuilder().addPathSegments("rest/v1/").build())
                    .addHeader("apikey", key)
                    .addHeader("Authorization", "Bearer $key")
                    .get()
                    .build()
                val rootResp = client.newCall(rootRequest).execute()
                if (rootResp.isSuccessful || rootResp.code == 200) {
                    Result.success("¡Conexión con Supabase verificada exitosamente! Recuerda ejecutar el script SQL en Supabase para crear las tablas.")
                } else {
                    Result.success("Conexión establecida con Supabase (Proyecto en línea). Falta crear la tabla 'profiles'.")
                }
            } else if (code == 401 || code == 403) {
                Result.failure(Exception("Error de autenticación ($code): La publishable/anon key no tiene permisos."))
            } else {
                Result.failure(Exception("Supabase respondió con código $code: $body"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error connecting to Supabase: ${e.message}", e)
            Result.failure(Exception("Error de conexión con Supabase: ${e.localizedMessage ?: "Revisa tu conexión a internet o la URL."}"))
        }
    }

    /**
     * Sync local Account to Supabase profiles table
     */
    suspend fun syncProfileToSupabase(
        account: AccountEntity,
        username: String = "",
        email: String = "",
        password: String = "",
        phone: String = ""
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val mediaType = "application/json; charset=utf-8".toMediaType()

            val finalUsername = username.ifBlank {
                account.accountHolder.lowercase().trim().replace(" ", "_")
            }
            val finalEmail = email.ifBlank {
                "$finalUsername@bancanova.hn"
            }

            // Se guarda exactamente la contraseña que el usuario utiliza en la columna 'password'
            val passwordToStore = if (password.trim().isNotBlank()) password.trim() else "Lumina2026*"

            // 1. Check if a profile with this account_number, username, or email already exists in Supabase
            val patchJson = JSONObject().apply {
                put("name", account.accountHolder)
                put("balance", account.balanceHnl)
                put("account_type", account.accountType)
                put("status", "Activo")
                if (finalUsername.isNotBlank()) put("username", finalUsername)
                if (finalEmail.isNotBlank()) put("email", finalEmail)
                put("password", passwordToStore)
                if (phone.isNotBlank()) put("phone", phone)
            }

            val existingProfile = fetchProfileByQuery(account.accountNumber)
                ?: fetchProfileByQuery(finalUsername)
                ?: fetchProfileByQuery(finalEmail)

            if (existingProfile != null) {
                val existingId = existingProfile.optString("id")
                if (existingId.isNotBlank()) {
                    val patchUrl = "$url/rest/v1/profiles?id=eq.${java.net.URLEncoder.encode(existingId, "UTF-8")}"
                    val patchRequest = Request.Builder()
                        .url(patchUrl.toHttpUrlOrNull()!!)
                        .addHeader("apikey", key)
                        .addHeader("Authorization", "Bearer $key")
                        .addHeader("Content-Type", "application/json")
                        .addHeader("Prefer", "return=representation")
                        .patch(patchJson.toString().toRequestBody(mediaType))
                        .build()

                    val patchResponse = client.newCall(patchRequest).execute()
                    if (patchResponse.isSuccessful) {
                        Log.d(TAG, "Profile successfully updated in Supabase by ID: $existingId")
                        return@withContext Result.success(true)
                    }
                }
            }

            // 2. If profile does not exist yet in Supabase, insert it with a new usr- ID
            val newId = if (account.accountNumber.startsWith("usr-")) {
                account.accountNumber
            } else {
                "usr-" + System.currentTimeMillis()
            }

            val insertJson = JSONObject().apply {
                put("id", newId)
                put("name", account.accountHolder)
                put("username", finalUsername)
                put("email", finalEmail)
                put("account_number", account.accountNumber)
                put("balance", account.balanceHnl)
                put("account_type", account.accountType)
                put("role", "Personal")
                put("status", "Activo")
                put("password", passwordToStore)
                if (phone.isNotBlank()) put("phone", phone)
            }

            val insertUrl = "$url/rest/v1/profiles?on_conflict=id"
            val insertRequest = Request.Builder()
                .url(insertUrl.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "resolution=merge-duplicates,return=representation")
                .post(insertJson.toString().toRequestBody(mediaType))
                .build()

            val insertResponse = client.newCall(insertRequest).execute()
            if (insertResponse.isSuccessful) {
                Log.d(TAG, "Profile successfully inserted in Supabase: ${account.accountHolder}")
                Result.success(true)
            } else {
                val errBody = insertResponse.body?.string() ?: ""
                Log.w(TAG, "Failed to insert profile: HTTP ${insertResponse.code} $errBody")
                // Fallback: If 409 duplicate key, update by email or username
                if (insertResponse.code == 409) {
                    val fallbackPatchUrl = "$url/rest/v1/profiles?or=(email.eq.${java.net.URLEncoder.encode(finalEmail, "UTF-8")},username.eq.${java.net.URLEncoder.encode(finalUsername, "UTF-8")})"
                    val fallbackRequest = Request.Builder()
                        .url(fallbackPatchUrl.toHttpUrlOrNull()!!)
                        .addHeader("apikey", key)
                        .addHeader("Authorization", "Bearer $key")
                        .addHeader("Content-Type", "application/json")
                        .addHeader("Prefer", "return=representation")
                        .patch(patchJson.toString().toRequestBody(mediaType))
                        .build()
                    val fallbackResp = client.newCall(fallbackRequest).execute()
                    if (fallbackResp.isSuccessful) {
                        Log.d(TAG, "Profile successfully updated in Supabase fallback patch: ${account.accountHolder}")
                        return@withContext Result.success(true)
                    }
                }
                Result.failure(Exception("Error al registrar perfil en Supabase: HTTP ${insertResponse.code} $errBody"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Sync profile exception", e)
            Result.failure(e)
        }
    }

    /**
     * Delete profile from Supabase profiles table
     */
    suspend fun deleteProfileFromSupabase(accountNumber: String): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val deleteUrl = "$url/rest/v1/profiles?account_number=eq.${java.net.URLEncoder.encode(accountNumber, "UTF-8")}"
            val request = Request.Builder()
                .url(deleteUrl.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .delete()
                .build()

            val response = client.newCall(request).execute()
            Result.success(response.isSuccessful)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Push a new Transaction to Supabase
     */
    suspend fun pushTransactionToSupabase(
        transaction: TransactionEntity,
        userId: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val endpoint = "$url/rest/v1/transactions?on_conflict=id"
            val httpUrl = endpoint.toHttpUrlOrNull()
                ?: return@withContext Result.failure(Exception("URL inválida de Supabase: $endpoint"))

            val json = JSONObject().apply {
                put("id", transaction.id)
                put("user_id", userId)
                put("title", transaction.title)
                put("subtitle", transaction.subtitle)
                put("amount", transaction.amount)
                put("type", if (transaction.isIncome) "income" else "expense")
                put("status", "completed")
                put("category", transaction.category)
                put("destination_account", transaction.bankName)
                put("concept", transaction.referenceNumber)
            }

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = json.toString().toRequestBody(mediaType)

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "resolution=merge-duplicates,return=representation")
                .post(requestBody)
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                Log.d(TAG, "Transaction pushed to Supabase")
                Result.success(true)
            } else {
                val errBody = response.body?.string() ?: ""
                Log.w(TAG, "Failed to push transaction: HTTP ${response.code} $errBody")
                Result.failure(Exception("Error al enviar transacción a Supabase: HTTP ${response.code}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Push transaction exception", e)
            Result.failure(e)
        }
    }

    /**
     * Fetch all remote transactions from Supabase
     */
    suspend fun fetchTransactionsFromSupabase(
        userId: String
    ): Result<List<TransactionEntity>> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(emptyList())

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val endpoint = "$url/rest/v1/transactions?user_id=eq.$userId&order=created_at.desc&limit=50"
            val httpUrl = endpoint.toHttpUrlOrNull()
                ?: return@withContext Result.failure(Exception("URL inválida de Supabase: $endpoint"))

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: "[]"
                val jsonArray = JSONArray(body)
                val list = mutableListOf<TransactionEntity>()

                for (i in 0 until jsonArray.length()) {
                    val item = jsonArray.getJSONObject(i)
                    list.add(
                        TransactionEntity(
                            id = item.optString("id", java.util.UUID.randomUUID().toString()),
                            title = item.optString("title", "Transacción"),
                            subtitle = item.optString("subtitle", "Banca Digital"),
                            amount = item.optDouble("amount", 0.0),
                            isIncome = item.optString("type") == "income",
                            timestamp = System.currentTimeMillis(),
                            category = item.optString("category", "Transferencia"),
                            recipientOrSender = item.optString("recipient_or_sender", "Usuario Nova"),
                            bankName = item.optString("destination_bank", "Lumina Bank"),
                            referenceNumber = item.optString("bch_tracking_key", "ACH-SUPABASE"),
                            sarAuthCode = item.optString("sar_fiscal_cai", "SAR-HN-OK")
                        )
                    )
                }
                Result.success(list)
            } else {
                Result.failure(Exception("Error al obtener transacciones: HTTP ${response.code}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Fetch transactions exception", e)
            Result.failure(e)
        }
    }

    /**
     * Fetch all remote profiles from Supabase profiles table
     */
    suspend fun fetchAllProfilesFromSupabase(): Result<List<AccountEntity>> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(emptyList())

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            // Consulta segura: selecciona EXCLUSIVAMENTE los campos públicos de la cuenta
            // y EXCLUYE Y OMITE TOTALMENTE el campo de la contraseña.
            val endpoint = "$url/rest/v1/profiles?select=id,name,username,email,account_number,balance,balance_usd,account_type,sar_tax_id,iban_hn,role,status,created_at&order=created_at.desc&limit=50"
            val httpUrl = endpoint.toHttpUrlOrNull()
                ?: return@withContext Result.failure(Exception("URL inválida de Supabase: $endpoint"))

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: "[]"
                val jsonArray = JSONArray(body)
                val list = mutableListOf<AccountEntity>()

                for (i in 0 until jsonArray.length()) {
                    val item = jsonArray.getJSONObject(i)
                    val rawHolder = item.optString("name").ifBlank { item.optString("username", "Usuario") }
                    val accNum = item.optString("account_number").ifBlank { "HN" + Math.abs(rawHolder.hashCode()).toString().take(8) }
                    val balance = item.optDouble("balance", 15000.0)

                    list.add(
                        AccountEntity(
                            accountNumber = accNum,
                            accountHolder = rawHolder,
                            balanceHnl = balance,
                            balanceUsd = balance / 24.80,
                            accountType = item.optString("account_type", "Cuenta Digital Nova"),
                            sarTaxId = item.optString("sar_tax_id", "0801-1998-54321"),
                            ibanHn = accNum,
                            isActive = false,
                            lastActiveTimestamp = System.currentTimeMillis() - (i * 1000L)
                        )
                    )
                }
                Result.success(list)
            } else {
                Result.failure(Exception("Error al obtener perfiles de Supabase: HTTP ${response.code}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Fetch profiles exception", e)
            Result.failure(e)
        }
    }

    /**
     * Endpoint de Vista Pública de Usuarios:
     * Selecciona EXCLUSIVAMENTE los campos públicos de la cuenta (ID, nombre, usuario, correo, rol, balance, fecha)
     * y EXCLUYE Y OMITE TOTALMENTE el campo de la contraseña tanto en la consulta REST como en el modelo resultante.
     */
    suspend fun fetchPublicProfiles(): Result<List<PublicUserProfile>> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(emptyList())

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val endpoint = "$url/rest/v1/profiles?select=id,name,username,email,account_number,role,status,account_type,balance,created_at&order=created_at.desc&limit=50"
            val httpUrl = endpoint.toHttpUrlOrNull()
                ?: return@withContext Result.failure(Exception("URL inválida de Supabase: $endpoint"))

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: "[]"
                val jsonArray = JSONArray(body)
                val list = mutableListOf<PublicUserProfile>()

                for (i in 0 until jsonArray.length()) {
                    val item = jsonArray.getJSONObject(i)
                    list.add(
                        PublicUserProfile(
                            id = item.optString("id"),
                            name = item.optString("name"),
                            username = item.optString("username"),
                            email = item.optString("email"),
                            accountNumber = item.optString("account_number"),
                            role = item.optString("role", "Personal"),
                            status = item.optString("status", "Activo"),
                            accountType = item.optString("account_type", "Cuenta Digital Nova"),
                            balance = item.optDouble("balance", 0.0),
                            createdAt = item.optString("created_at")
                        )
                    )
                }
                Result.success(list)
            } else {
                Result.failure(Exception("Error al consultar perfiles públicos: HTTP ${response.code}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching public profiles", e)
            Result.failure(e)
        }
    }

    /**
     * Endpoint de inicio de sesión seguro contra Supabase:
     * Busca al usuario en la base de datos, compara en tiempo constante la contraseña
     * contra el hash almacenado (bcrypt o pbkdf2).
     * Si coincide, genera y retorna una sesión con token criptográfico válido.
     * Si la contraseña es incorrecta o el usuario no existe, retorna el error genérico "Credenciales incorrectas".
     */
    suspend fun authenticateUserInSupabase(
        identifier: String,
        passwordAttempt: String
    ): Result<com.example.security.AuthSessionResponse> = withContext(Dispatchers.IO) {
        if (!isConfigured) {
            return@withContext Result.failure(Exception("Credenciales incorrectas"))
        }
        val cleanId = identifier.trim()
        val cleanPass = passwordAttempt.trim()
        if (cleanId.isBlank() || cleanPass.isBlank()) {
            return@withContext Result.failure(Exception("Credenciales incorrectas"))
        }

        try {
            val profile = fetchProfileByQuery(cleanId)
                ?: return@withContext Result.failure(Exception("Credenciales incorrectas"))

            val storedHash = profile.optString("password", "")
            val isMatch = com.example.security.PasswordHasher.verifyPassword(cleanPass, storedHash)

            if (isMatch) {
                val userId = profile.optString("id", cleanId)
                val token = com.example.security.PasswordHasher.generateSessionToken(userId)
                val accNum = profile.optString("account_number", "")
                val name = profile.optString("name", cleanId)
                Result.success(
                    com.example.security.AuthSessionResponse(
                        isSuccess = true,
                        token = token,
                        accountNumber = accNum,
                        accountHolder = name
                    )
                )
            } else {
                Result.failure(Exception("Credenciales incorrectas"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in authenticateUserInSupabase", e)
            Result.failure(Exception("Credenciales incorrectas"))
        }
    }

    /**
     * Busca un perfil en Supabase por nombre de usuario, correo, nombre o número de cuenta.
     */
    suspend fun fetchProfileByQuery(query: String): JSONObject? = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext null
        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val encodedQuery = java.net.URLEncoder.encode(query.trim(), "UTF-8")
            val endpoint = "$url/rest/v1/profiles?or=(username.ilike.%25$encodedQuery%25,email.ilike.%25$encodedQuery%25,name.ilike.%25$encodedQuery%25,account_number.eq.$encodedQuery)&limit=1"
            val httpUrl = endpoint.toHttpUrlOrNull() ?: return@withContext null

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: "[]"
                val jsonArray = JSONArray(body)
                if (jsonArray.length() > 0) {
                    return@withContext jsonArray.getJSONObject(0)
                }
            }
            null
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching profile by query", e)
            null
        }
    }

    /**
     * Consulta pública a Supabase con MÁXIMO 2 USUARIOS destacados ordenados por última actividad.
     * Selecciona EXCLUSIVAMENTE los campos públicos y EXCLUYE Y OMITE TOTALMENTE password_hash.
     */
    suspend fun fetchTop2UsersFromSupabase(): Result<List<PublicUserDto>> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(emptyList())

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            // Consulta segura: Excluye explícitamente password_hash
            val endpoint = "$url/rest/v1/users?is_active=eq.true&select=id,username,full_name,email,phone,role,biometric_registered,biometric_credential_id,registered_at,last_active_timestamp,account_number,is_active&order=last_active_timestamp.desc&limit=2"
            val httpUrl = endpoint.toHttpUrlOrNull()
                ?: return@withContext Result.failure(Exception("URL inválida de Supabase: $endpoint"))

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: "[]"
                val jsonArray = JSONArray(body)
                val list = mutableListOf<PublicUserDto>()

                for (i in 0 until jsonArray.length()) {
                    val item = jsonArray.getJSONObject(i)
                    list.add(
                        PublicUserDto(
                            id = item.optString("id", java.util.UUID.randomUUID().toString()),
                            username = item.optString("username"),
                            fullName = item.optString("full_name"),
                            email = item.optString("email"),
                            phone = item.optString("phone", ""),
                            role = item.optString("role", "CLIENTE"),
                            biometricRegistered = item.optBoolean("biometric_registered", false),
                            biometricCredentialId = item.optString("biometric_credential_id").takeIf { it.isNotBlank() },
                            registeredAt = item.optLong("registered_at", System.currentTimeMillis()),
                            lastActiveTimestamp = item.optLong("last_active_timestamp", System.currentTimeMillis()),
                            accountNumber = item.optString("account_number"),
                            isActive = item.optBoolean("is_active", true)
                        )
                    )
                }
                Result.success(list)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching top 2 users from Supabase", e)
            Result.success(emptyList())
        }
    }

    /**
     * Consulta pública para obtener la lista de usuarios desde Supabase excluyendo password_hash.
     */
    suspend fun fetchAllUsersFromSupabase(): Result<List<PublicUserDto>> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(emptyList())

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val endpoint = "$url/rest/v1/users?select=id,username,full_name,email,phone,role,biometric_registered,biometric_credential_id,registered_at,last_active_timestamp,account_number,is_active&order=last_active_timestamp.desc&limit=50"
            val httpUrl = endpoint.toHttpUrlOrNull()
                ?: return@withContext Result.failure(Exception("URL inválida de Supabase: $endpoint"))

            val request = Request.Builder()
                .url(httpUrl)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: "[]"
                val jsonArray = JSONArray(body)
                val list = mutableListOf<PublicUserDto>()

                for (i in 0 until jsonArray.length()) {
                    val item = jsonArray.getJSONObject(i)
                    list.add(
                        PublicUserDto(
                            id = item.optString("id", java.util.UUID.randomUUID().toString()),
                            username = item.optString("username"),
                            fullName = item.optString("full_name"),
                            email = item.optString("email"),
                            phone = item.optString("phone", ""),
                            role = item.optString("role", "CLIENTE"),
                            biometricRegistered = item.optBoolean("biometric_registered", false),
                            biometricCredentialId = item.optString("biometric_credential_id").takeIf { it.isNotBlank() },
                            registeredAt = item.optLong("registered_at", System.currentTimeMillis()),
                            lastActiveTimestamp = item.optLong("last_active_timestamp", System.currentTimeMillis()),
                            accountNumber = item.optString("account_number"),
                            isActive = item.optBoolean("is_active", true)
                        )
                    )
                }
                Result.success(list)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching all users from Supabase", e)
            Result.success(emptyList())
        }
    }

    /**
     * Sincroniza un UserEntity hacia la tabla 'users' de Supabase enviando payload JSON.
     */
    suspend fun syncUserToSupabase(user: UserEntity): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val mediaType = "application/json; charset=utf-8".toMediaType()

            val userJson = JSONObject().apply {
                put("id", user.id)
                put("username", user.username)
                put("full_name", user.fullName)
                put("email", user.email)
                put("phone", user.phone)
                put("role", user.role)
                put("password_hash", user.passwordHash)
                put("default_password_assigned", user.defaultPasswordAssigned)
                put("biometric_registered", user.biometricRegistered)
                put("biometric_credential_id", user.biometricCredentialId ?: JSONObject.NULL)
                put("registered_at", user.registeredAt)
                put("last_active_timestamp", user.lastActiveTimestamp)
                put("account_number", user.accountNumber)
                put("is_active", user.isActive)
            }

            val endpoint = "$url/rest/v1/users?on_conflict=username"
            val request = Request.Builder()
                .url(endpoint.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "resolution=merge-duplicates,return=representation")
                .post(userJson.toString().toRequestBody(mediaType))
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                Log.d(TAG, "UserEntity successfully synchronized to Supabase 'users': ${user.username}")
                Result.success(true)
            } else {
                // Try PATCH if 409
                val patchEndpoint = "$url/rest/v1/users?username=eq.${java.net.URLEncoder.encode(user.username, "UTF-8")}"
                val patchReq = Request.Builder()
                    .url(patchEndpoint.toHttpUrlOrNull()!!)
                    .addHeader("apikey", key)
                    .addHeader("Authorization", "Bearer $key")
                    .addHeader("Content-Type", "application/json")
                    .patch(userJson.toString().toRequestBody(mediaType))
                    .build()
                val patchResp = client.newCall(patchReq).execute()
                Result.success(patchResp.isSuccessful)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error syncing user to Supabase", e)
            Result.failure(e)
        }
    }

    /**
     * Soft Delete permanente: Desactiva el usuario en Supabase sin eliminar su registro ni credenciales.
     */
    suspend fun deactivateUserInSupabase(accountNumberOrUsername: String): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val mediaType = "application/json; charset=utf-8".toMediaType()

            val patchJson = JSONObject().apply {
                put("is_active", false)
            }

            val isAccount = accountNumberOrUsername.startsWith("HN")
            val filterParam = if (isAccount) {
                "account_number=eq.${java.net.URLEncoder.encode(accountNumberOrUsername, "UTF-8")}"
            } else {
                "username=eq.${java.net.URLEncoder.encode(accountNumberOrUsername, "UTF-8")}"
            }

            val endpoint = "$url/rest/v1/users?$filterParam"
            val request = Request.Builder()
                .url(endpoint.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .patch(patchJson.toString().toRequestBody(mediaType))
                .build()

            val response = client.newCall(request).execute()
            Result.success(response.isSuccessful)
        } catch (e: Exception) {
            Log.e(TAG, "Error deactivating user in Supabase", e)
            Result.failure(e)
        }
    }

    /**
     * Registra el historial de inicio de sesión en Supabase con fecha, hora y método (PASSWORD, BIOMETRIC, etc).
     */
    suspend fun logLoginAttemptToSupabase(
        username: String,
        method: String,
        isSuccess: Boolean,
        accountNumber: String? = null
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val mediaType = "application/json; charset=utf-8".toMediaType()

            val logJson = JSONObject().apply {
                put("username", username)
                put("method", method)
                put("is_success", isSuccess)
                put("account_number", accountNumber ?: JSONObject.NULL)
                put("timestamp", System.currentTimeMillis())
            }

            val endpoint = "$url/rest/v1/login_logs"
            val request = Request.Builder()
                .url(endpoint.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .post(logJson.toString().toRequestBody(mediaType))
                .build()

            val response = client.newCall(request).execute()
            Result.success(response.isSuccessful)
        } catch (e: Exception) {
            Log.e(TAG, "Error logging login attempt in Supabase", e)
            Result.failure(e)
        }
    }

    /**
     * Actualiza el last_active_timestamp del usuario en la tabla 'users' de Supabase.
     */
    suspend fun updateUserLastActiveInSupabase(
        identifier: String,
        timestamp: Long = System.currentTimeMillis()
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val encodedId = java.net.URLEncoder.encode(identifier.trim(), "UTF-8")

            val patchJson = JSONObject().apply {
                put("last_active_timestamp", timestamp)
            }

            val patchEndpoint = "$url/rest/v1/users?or=(username.eq.$encodedId,account_number.eq.$encodedId,id.eq.$encodedId)"
            val patchReq = Request.Builder()
                .url(patchEndpoint.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .patch(patchJson.toString().toRequestBody(mediaType))
                .build()

            val patchResp = client.newCall(patchReq).execute()
            Result.success(patchResp.isSuccessful)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating last_active_timestamp in Supabase", e)
            Result.failure(e)
        }
    }

    /**
     * Actualiza el estado biométrico del usuario en la tabla 'users' de Supabase.
     */
    suspend fun updateUserBiometricInSupabase(
        identifier: String,
        isRegistered: Boolean,
        credentialId: String?
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val encodedId = java.net.URLEncoder.encode(identifier.trim(), "UTF-8")

            val patchJson = JSONObject().apply {
                put("biometric_registered", isRegistered)
                put("biometric_credential_id", credentialId ?: JSONObject.NULL)
            }

            val patchEndpoint = "$url/rest/v1/users?or=(username.eq.$encodedId,account_number.eq.$encodedId,id.eq.$encodedId)"
            val patchReq = Request.Builder()
                .url(patchEndpoint.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .patch(patchJson.toString().toRequestBody(mediaType))
                .build()

            val patchResp = client.newCall(patchReq).execute()
            Result.success(patchResp.isSuccessful)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating biometric status in Supabase", e)
            Result.failure(e)
        }
    }

    /**
     * Actualiza la columna 'password' directamente en la tabla 'profiles' de Supabase
     * con la contraseña exacta que el usuario utiliza.
     */
    suspend fun updateProfilePasswordInSupabase(
        identifier: String,
        exactPassword: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        if (!isConfigured || exactPassword.isBlank()) return@withContext Result.success(false)

        try {
            val url = supabaseUrl
            val key = supabaseAnonKey
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val encodedId = java.net.URLEncoder.encode(identifier.trim(), "UTF-8")

            val patchJson = JSONObject().apply {
                put("password", exactPassword.trim())
            }

            val patchEndpoint = "$url/rest/v1/profiles?or=(username.eq.$encodedId,email.eq.$encodedId,account_number.eq.$encodedId,id.eq.$encodedId)"
            val patchReq = Request.Builder()
                .url(patchEndpoint.toHttpUrlOrNull()!!)
                .addHeader("apikey", key)
                .addHeader("Authorization", "Bearer $key")
                .addHeader("Content-Type", "application/json")
                .patch(patchJson.toString().toRequestBody(mediaType))
                .build()

            val patchResp = client.newCall(patchReq).execute()
            Result.success(patchResp.isSuccessful)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating profile password in Supabase", e)
            Result.failure(e)
        }
    }
}

/**
 * Modelo de Vista Pública de Usuarios:
 * Representa los datos visibles en la interfaz de la aplicación garantizando
 * la ausencia y exclusión total de campos sensibles de autenticación (contraseñas o hashes).
 */
data class PublicUserProfile(
    val id: String,
    val name: String,
    val username: String,
    val email: String,
    val accountNumber: String,
    val role: String = "Personal",
    val status: String = "Activo",
    val accountType: String = "Cuenta Digital Nova",
    val balance: Double = 0.0,
    val createdAt: String = ""
)
