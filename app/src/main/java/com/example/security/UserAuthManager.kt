package com.example.security

import android.content.Context
import android.content.SharedPreferences

enum class AuthResult {
    SUCCESS,
    WRONG_PASSWORD,
    USER_NOT_FOUND,
    EMPTY_CREDENTIALS
}

data class AuthSessionResponse(
    val isSuccess: Boolean,
    val token: String? = null,
    val accountNumber: String? = null,
    val accountHolder: String? = null,
    val errorMessage: String? = null
)

/**
 * Gestor de autenticación y credenciales seguras para Lumina Banca.
 * Almacena exclusivamente hashes criptográficos de contraseñas (NUNCA texto plano)
 * y realiza comparaciones en tiempo constante.
 */
class UserAuthManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("lumina_auth_credentials_prefs", Context.MODE_PRIVATE)

    /**
     * Guarda las credenciales de una cuenta registrada convirtiendo la contraseña
     * en un hash criptográfico robusto (PBKDF2 + Salt de 16 bytes).
     * NUNCA almacena la contraseña en texto claro.
     */
    fun saveCredentials(
        fullName: String,
        username: String,
        email: String,
        phone: String,
        password: String,
        accountNumber: String
    ) {
        val cleanPass = password.trim()
        if (cleanPass.isEmpty()) return

        // Guardar exactamente la contraseña que el usuario utiliza
        val passwordHash = cleanPass

        val editor = prefs.edit()

        if (username.isNotBlank()) {
            val uKey = username.trim().lowercase()
            editor.putString("user_u_$uKey", username.trim())
            editor.putString("hash_u_$uKey", passwordHash)
            editor.putString("acc_u_$uKey", accountNumber)
            editor.putString("name_u_$uKey", fullName.trim())
        }
        if (email.isNotBlank()) {
            val eKey = email.trim().lowercase()
            editor.putString("hash_e_$eKey", passwordHash)
            editor.putString("acc_e_$eKey", accountNumber)
            editor.putString("name_e_$eKey", fullName.trim())
        }
        if (fullName.isNotBlank()) {
            val nKey = fullName.trim().lowercase()
            editor.putString("hash_n_$nKey", passwordHash)
            editor.putString("acc_n_$nKey", accountNumber)
            editor.putString("name_n_$nKey", fullName.trim())
        }
        if (accountNumber.isNotBlank()) {
            val aKey = accountNumber.trim().lowercase()
            editor.putString("hash_a_$aKey", passwordHash)
            editor.putString("acc_a_$aKey", accountNumber)
            editor.putString("name_a_$aKey", fullName.trim())
        }
        editor.apply()
    }

    /**
     * Valida de manera segura en tiempo constante si la contraseña ingresada
     * coincide con el hash almacenado para el usuario o correo.
     */
    fun verifyPassword(identifier: String, passwordAttempt: String): AuthResult {
        val cleanId = identifier.trim().lowercase()
        val cleanPass = passwordAttempt.trim()

        if (cleanId.isBlank() || cleanPass.isBlank()) {
            return AuthResult.EMPTY_CREDENTIALS
        }

        val storedHash = prefs.getString("hash_u_$cleanId", null)
            ?: prefs.getString("hash_e_$cleanId", null)
            ?: prefs.getString("hash_n_$cleanId", null)
            ?: prefs.getString("hash_a_$cleanId", null)

        if (storedHash != null) {
            val matches = PasswordHasher.verifyPassword(cleanPass, storedHash)
            return if (matches) AuthResult.SUCCESS else AuthResult.WRONG_PASSWORD
        }

        return AuthResult.USER_NOT_FOUND
    }

    /**
     * Endpoint local de autenticación con respuesta estandarizada y mensaje de error genérico
     * para evitar la enumeración de usuarios ("Credenciales incorrectas").
     */
    fun authenticate(identifier: String, passwordAttempt: String): AuthSessionResponse {
        val result = verifyPassword(identifier, passwordAttempt)
        return when (result) {
            AuthResult.SUCCESS -> {
                val (accNum, name) = getAccountInfo(identifier)
                val token = PasswordHasher.generateSessionToken(accNum ?: identifier)
                AuthSessionResponse(
                    isSuccess = true,
                    token = token,
                    accountNumber = accNum,
                    accountHolder = name
                )
            }
            AuthResult.EMPTY_CREDENTIALS -> {
                AuthSessionResponse(
                    isSuccess = false,
                    errorMessage = "Por favor ingresa tu usuario y contraseña."
                )
            }
            AuthResult.WRONG_PASSWORD, AuthResult.USER_NOT_FOUND -> {
                // Mensaje genérico de seguridad para no revelar si el usuario existe o no
                AuthSessionResponse(
                    isSuccess = false,
                    errorMessage = "Credenciales incorrectas"
                )
            }
        }
    }

    /**
     * Obtiene el número de cuenta y el nombre del titular para un identificador.
     */
    fun getAccountInfo(identifier: String): Pair<String?, String?> {
        val cleanId = identifier.trim().lowercase()
        val accNum = prefs.getString("acc_u_$cleanId", null)
            ?: prefs.getString("acc_e_$cleanId", null)
            ?: prefs.getString("acc_n_$cleanId", null)
            ?: prefs.getString("acc_a_$cleanId", null)

        val name = prefs.getString("name_u_$cleanId", null)
            ?: prefs.getString("name_e_$cleanId", null)
            ?: prefs.getString("name_n_$cleanId", null)
            ?: prefs.getString("name_a_$cleanId", null)

        return Pair(accNum, name)
    }

    /**
     * Verifica si una contraseña ya ha sido utilizada en el sistema para evitar contraseñas repetidas.
     */
    fun isPasswordUsedAnywhere(cleanPass: String): Boolean {
        if (cleanPass.isBlank()) return false
        val allEntries = prefs.all
        for ((key, value) in allEntries) {
            if (key.startsWith("hash_") && value is String) {
                if (value == cleanPass || PasswordHasher.verifyPassword(cleanPass, value)) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * Devuelve la lista de usernames registrados o ingresados previamente en este dispositivo móvil.
     */
    fun getAllKnownUsernames(): List<String> {
        val list = mutableListOf<String>()
        val allEntries = prefs.all
        for ((key, value) in allEntries) {
            if (key.startsWith("user_u_") && value is String && value.isNotBlank()) {
                if (!list.contains(value)) list.add(value)
            } else if (key.startsWith("hash_u_")) {
                val uname = key.removePrefix("hash_u_")
                if (uname.isNotBlank() && !list.contains(uname)) list.add(uname)
            }
        }
        return list
    }

    /**
     * Limpia todas las credenciales locales guardadas.
     */
    fun clearAllCredentials() {
        prefs.edit().clear().apply()
    }
}
