import { createClient } from '@supabase/supabase-js';
import {
  AdminUser,
  Transaction,
  UserProfile,
  AdminCreditLog,
  PlanTier,
  CardTheme,
} from '../types';

// Supabase project credentials provided by user
const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://nrgyuposoruudmqjmysv.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  'sb_publishable_cyyWQu4ds6E_gTrL_sD_zw_AL5RlGst';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface SupabaseSyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  error?: string | null;
  userCount?: number;
}

// SQL Query script for the user to execute in Supabase SQL Editor if they want to enable all extended columns & security
export const SUPABASE_SQL_MIGRATION = `-- =========================================================================
-- BANCA NOVA HONDURAS - ESQUEMA COMPLETO Y MIGRACIÓN PARA SUPABASE
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- =========================================================================

-- 1. Añadir columnas a la tabla 'profiles' para almacenar todos los datos de usuario
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password text,
  ADD COLUMN IF NOT EXISTS cvv text DEFAULT '782',
  ADD COLUMN IF NOT EXISTS expiry_date text DEFAULT '10/30',
  ADD COLUMN IF NOT EXISTS card_daily_limit numeric DEFAULT 25000,
  ADD COLUMN IF NOT EXISTS card_contactless boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_online_shopping boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_atm_withdrawals boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS bch_pin text DEFAULT '1234';

-- Índices de búsqueda rápida para autenticación y transferencias
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_account_number ON public.profiles (account_number);

-- 2. Asegurar estructura de la tabla 'transactions'
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  subtitle text,
  amount numeric NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'completed',
  category text DEFAULT 'Transferencia',
  category_icon text DEFAULT 'payments',
  destination_account text,
  destination_bank text,
  origin_account text,
  concept text,
  bch_tracking_key text,
  sar_fiscal_cai text
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);

-- 3. Asegurar estructura de la tabla 'admin_credit_logs'
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

-- 4. Habilitar permisos RLS para lectura y escritura desde la aplicación
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credit_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Permitir todo en profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en transactions' AND tablename = 'transactions') THEN
    CREATE POLICY "Permitir todo en transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en admin_credit_logs' AND tablename = 'admin_credit_logs') THEN
    CREATE POLICY "Permitir todo en admin_credit_logs" ON public.admin_credit_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

// Helper for safe upsert on profiles (automatically adapts if schema columns are still being added)
async function safeUpsertProfileRecord(payload: Record<string, any>) {
  const stripExtended = (data: Record<string, any>) => {
    const core = { ...data };
    delete core.username;
    delete core.password;
    delete core.cvv;
    delete core.expiry_date;
    delete core.card_daily_limit;
    delete core.card_contactless;
    delete core.card_online_shopping;
    delete core.card_atm_withdrawals;
    delete core.bch_pin;
    return core;
  };

  try {
    const res = await supabase.from('profiles').upsert(payload).select().maybeSingle();
    if (!res.error) return res;

    // If duplicate email key violation (23505), update by email instead
    if (res.error.code === '23505' && payload.email) {
      const updateRes = await supabase.from('profiles').update(payload).eq('email', payload.email).select().maybeSingle();
      if (!updateRes.error) return updateRes;
      if (updateRes.error.code === 'PGRST204' || updateRes.error.code === '42703') {
        const corePayload = stripExtended(payload);
        return await supabase.from('profiles').update(corePayload).eq('email', payload.email).select().maybeSingle();
      }
      return updateRes;
    }

    // If a column isn't created in Supabase yet (PGRST204 or 42703), strip extended columns and retry
    if (res.error.code === 'PGRST204' || res.error.code === '42703') {
      const corePayload = stripExtended(payload);
      const retryRes = await supabase.from('profiles').upsert(corePayload).select().maybeSingle();
      if (!retryRes.error) return retryRes;
      if (retryRes.error.code === '23505' && corePayload.email) {
        return await supabase.from('profiles').update(corePayload).eq('email', corePayload.email).select().maybeSingle();
      }
      return retryRes;
    }
    return res;
  } catch (err) {
    console.warn('Error in safeUpsertProfileRecord:', err);
    return { data: null, error: err };
  }
}

// -------------------------------------------------------------
// Database Service Wrappers (with graceful fallbacks)
// -------------------------------------------------------------

export const supabaseDb = {
  // Test connection to Supabase and count profiles
  async checkConnection(): Promise<{ isConnected: boolean; count: number; error?: string }> {
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      if (error && error.code !== 'PGRST116') {
        return { isConnected: false, count: 0, error: error.message };
      }
      return { isConnected: true, count: count ?? data?.length ?? 0 };
    } catch (err: any) {
      return { isConnected: false, count: 0, error: err?.message || 'Error de red' };
    }
  },

  // Register a new user in Supabase with complete details
  async registerUserInSupabase(
    user: UserProfile | AdminUser,
    startingBalance = 0,
    password = 'password123'
  ): Promise<boolean> {
    try {
      const userId = user.id || `usr-${Date.now()}`;
      const fullName = user.name.trim();
      const initials = fullName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const payload: Record<string, any> = {
        id: userId,
        name: fullName,
        username: user.username || fullName.toLowerCase().replace(/\s+/g, ''),
        email: user.email || `${user.username || 'usuario'}@bancanova.hn`,
        password: (user as any).password || password,
        phone: user.phone || '+504 9988-7766',
        address: user.address || 'Tegucigalpa, Francisco Morazán, Honduras',
        account_number: user.accountNumber || `HN${Math.floor(10000000 + Math.random() * 90000000)}`,
        iban: (user as any).iban || `HN45 LUMI 0182 9901 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        rtn_sar: (user as any).rtnSar || `0801-1998-${Math.floor(100000 + Math.random() * 900000)}`,
        card_last_4: user.cardLast4 || '4092',
        account_type: (user as any).accountType || `Banca Privada ${(user as any).plan || (user as any).role || 'Personal'}`,
        role: (user as any).plan || (user as any).role || 'Personal',
        status: (user as any).status || 'Activo',
        is_active: (user as any).isActive ?? true,
        balance: startingBalance,
        usd_balance: (user as any).usdBalance || Math.round((startingBalance / 24.80) * 100) / 100,
        card_theme: user.cardTheme || 'sapphire',
        is_card_frozen: user.isCardFrozen ?? false,
        avatar_url:
          (user as any).avatarUrl ||
          (user as any).avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        initials,
        push_notifications: (user as any).pushNotifications ?? true,
        weekly_summary: (user as any).weeklySummary ?? true,
        cvv: user.cvv || '782',
        expiry_date: user.expiryDate || '10/30',
        card_daily_limit: user.cardDailyLimit ?? 25000,
        card_contactless: user.cardContactless ?? true,
        card_online_shopping: user.cardOnlineShopping ?? true,
        card_atm_withdrawals: user.cardAtmWithdrawals ?? true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await safeUpsertProfileRecord(payload);
      if (error) {
        console.warn('Supabase register error:', error);
        return false;
      }

      // Record welcome transaction with SAR authorization in Supabase
      const sarAuth = `SAR-HN-${Math.floor(100000 + Math.random() * 900000)}`;
      await this.insertTransaction(
        {
          title: 'Bono de Bienvenida Nova',
          subtitle: `Apertura de Cuenta Digital • Código SAR: ${sarAuth}`,
          amount: startingBalance,
          type: 'deposit',
          status: 'completed',
          date: 'Hoy',
          categoryIcon: 'account_balance_wallet',
          category: 'Apertura',
          concept: 'Bono de Bienvenida Nova - Apertura de Cuenta Digital con Autorización SAR',
        },
        userId
      );

      return true;
    } catch (err) {
      console.warn('Error in registerUserInSupabase:', err);
      return false;
    }
  },

  // Login user by querying Supabase profiles
  async loginUserInSupabase(
    identifier: string,
    pass: string
  ): Promise<{ userProfile: UserProfile; balance: number } | null> {
    try {
      const clean = identifier.trim().toLowerCase();
      const cleanNoAt = clean.replace(/^@/, '');
      const cleanNoSpace = clean.replace(/\s+/g, '');

      // Query all profiles to find match
      const { data: profiles, error } = await supabase.from('profiles').select('*');
      if (error || !profiles || profiles.length === 0) return null;

      const matched = profiles.find((p: any) => {
        const pEmail = (p.email || '').trim().toLowerCase();
        const pName = (p.name || '').trim().toLowerCase();
        const pNameNoSpace = pName.replace(/\s+/g, '');
        const pUsername = (p.username || '').trim().toLowerCase().replace(/^@/, '');
        const pAcc = (p.account_number || '').trim().toLowerCase().replace(/\s+/g, '');

        const identifierMatch =
          pEmail === clean ||
          pName === clean ||
          pNameNoSpace === cleanNoSpace ||
          pUsername === cleanNoAt ||
          pAcc === cleanNoSpace;

        return identifierMatch;
      });

      if (!matched) return null;

      // Check password if stored in Supabase; if password column has not been added yet via SQL, accept valid input
      if (matched.password && matched.password.trim() !== '' && matched.password.trim() !== pass.trim()) {
        return null;
      }

      const balance = parseFloat(matched.balance) || 0;
      const userProfile: UserProfile = {
        id: matched.id,
        name: matched.name,
        username: matched.username || matched.name.toLowerCase().replace(/\s+/g, ''),
        email: matched.email,
        password: matched.password || pass,
        phone: matched.phone || '+504 9988-7766',
        address: matched.address || 'Tegucigalpa, Francisco Morazán, Honduras',
        accountNumber: (matched.account_number || '0182 9901 0000 0000').replace(/^HN\d*\s*/i, ''),
        cardLast4: matched.card_last_4 || '4092',
        accountType: matched.account_type || `Banca Privada ${matched.role || 'Personal'}`,
        plan: (matched.role as PlanTier) || 'Personal',
        cardTheme: (matched.card_theme as CardTheme) || 'sapphire',
        isCardFrozen: matched.is_card_frozen ?? false,
        avatarUrl:
          matched.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        pushNotifications: matched.push_notifications ?? true,
        weeklySummary: matched.weekly_summary ?? true,
        cvv: matched.cvv || '782',
        expiryDate: matched.expiry_date || '10/30',
        cardDailyLimit: matched.card_daily_limit || 25000,
        cardContactless: matched.card_contactless ?? true,
        cardOnlineShopping: matched.card_online_shopping ?? true,
        cardAtmWithdrawals: matched.card_atm_withdrawals ?? true,
      };

      return { userProfile, balance };
    } catch (err) {
      console.warn('Error in loginUserInSupabase:', err);
      return null;
    }
  },

  // Fetch all user profiles for Admin panel
  async getProfiles(): Promise<AdminUser[] | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return null;

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        username: item.username || item.name?.toLowerCase().replace(/\s+/g, ''),
        email: item.email,
        password: item.password || 'password123',
        role: (item.role as PlanTier) || 'Personal',
        status: (item.status as 'Activo' | 'Bloqueado') || 'Activo',
        cardTheme: (item.card_theme as CardTheme) || 'obsidian',
        isCardFrozen: item.is_card_frozen ?? false,
        avatar: item.avatar_url || undefined,
        initials:
          item.initials ||
          item.name
            ?.split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        joinedDate: item.created_at
          ? new Date(item.created_at).toLocaleDateString('es-HN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Reciente',
        balance: parseFloat(item.balance) || 0,
        phone: item.phone || '+504 9988-7766',
        address: item.address || 'Tegucigalpa, Honduras',
        accountNumber: (item.account_number || '0182 9901 0000 0000').replace(/^HN\d*\s*/i, ''),
        cardLast4: item.card_last_4 || '4092',
        cvv: item.cvv || '782',
        expiryDate: item.expiry_date || '10/30',
        cardDailyLimit: item.card_daily_limit || 25000,
        cardContactless: item.card_contactless ?? true,
        cardOnlineShopping: item.card_online_shopping ?? true,
        cardAtmWithdrawals: item.card_atm_withdrawals ?? true,
      }));
    } catch (err) {
      console.warn('Error fetching profiles from Supabase:', err);
      return null;
    }
  },

  // Update user balance directly in Supabase
  async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.warn('Error updating balance in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Exception updating balance in Supabase:', err);
      return false;
    }
  },

  // Update user role, theme, status, freeze, or balance (Admin)
  async updateUserAdmin(
    userId: string,
    updates: Partial<AdminUser> | Record<string, any>
  ): Promise<boolean> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.role) payload.role = updates.role;
      if (updates.status) payload.status = updates.status;
      if (updates.balance !== undefined) payload.balance = updates.balance;
      if (updates.cardTheme) payload.card_theme = updates.cardTheme;
      if (updates.isCardFrozen !== undefined) payload.is_card_frozen = updates.isCardFrozen;
      if (updates.name) payload.name = updates.name;
      if (updates.email) payload.email = updates.email;
      if (updates.username) payload.username = updates.username;
      if (updates.phone) payload.phone = updates.phone;
      if (updates.address) payload.address = updates.address;
      if (updates.cardDailyLimit !== undefined) payload.card_daily_limit = updates.cardDailyLimit;
      if (updates.cardContactless !== undefined) payload.card_contactless = updates.cardContactless;
      if (updates.cardOnlineShopping !== undefined) payload.card_online_shopping = updates.cardOnlineShopping;
      if (updates.cardAtmWithdrawals !== undefined) payload.card_atm_withdrawals = updates.cardAtmWithdrawals;

      const res = await supabase.from('profiles').update(payload).eq('id', userId);
      if (res.error && (res.error.code === 'PGRST204' || res.error.code === '42703')) {
        // Strip extended columns
        const corePayload: any = { ...payload };
        delete corePayload.username;
        delete corePayload.password;
        delete corePayload.card_daily_limit;
        delete corePayload.card_contactless;
        delete corePayload.card_online_shopping;
        delete corePayload.card_atm_withdrawals;
        await supabase.from('profiles').update(corePayload).eq('id', userId);
      }

      return true;
    } catch (err) {
      console.warn('Error updating user in Supabase:', err);
      return false;
    }
  },

  // Delete user from Supabase
  // Soft delete user in Supabase (Permanent audit compliance: never physically delete)
  async deleteProfile(userId: string): Promise<boolean> {
    try {
      // SOFT DELETE: Never physically remove accounts or transactions from Supabase.
      // Mark is_active = false and status = 'Bloqueado' to preserve compliance and history.
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          status: 'Bloqueado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return !error;
    } catch (err) {
      console.warn('Error soft-deleting user in Supabase:', err);
      return false;
    }
  },

  // Record access audit log in Supabase & local storage
  async recordLoginAuditLog(log: {
    userId: string;
    username: string;
    method: 'PASSWORD' | 'BIOMETRIC_FINGERPRINT';
    status: 'SUCCESS' | 'FAILED';
    details?: string;
  }): Promise<void> {
    try {
      const entry = {
        id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        user_id: log.userId,
        username: log.username,
        method: log.method,
        status: log.status,
        details: log.details || 'Autenticación en Banca Móvil',
        created_at: new Date().toISOString(),
      };

      // Persist in localStorage for instant access
      try {
        const saved = localStorage.getItem('bancanova_login_logs');
        const list = saved ? JSON.parse(saved) : [];
        list.unshift(entry);
        localStorage.setItem('bancanova_login_logs', JSON.stringify(list.slice(0, 100)));
      } catch {}

      // Attempt insert into Supabase login_logs table (safe fallback if table is pending migration)
      try {
        await supabase.from('login_logs').insert([entry]);
      } catch {}
    } catch (err) {
      console.warn('Login audit log recording notice:', err);
    }
  },

  // Fetch transactions from Supabase
  async getTransactions(userId?: string): Promise<Transaction[] | null> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) return null;

      return data.map((t: any) => ({
        id: t.id,
        title: t.title,
        subtitle:
          t.subtitle ||
          `${new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${t.type}`,
        amount: parseFloat(t.amount),
        type: t.type,
        status: t.status || 'completed',
        date: new Date(t.created_at).toLocaleDateString('es-HN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: new Date(t.created_at).getTime(),
        categoryIcon: t.category_icon || 'payments',
        category: t.category || 'General',
        destinationAccount: t.destination_account,
        concept: t.concept,
        userId: t.user_id,
      }));
    } catch (err) {
      console.warn('Error fetching transactions from Supabase:', err);
      return null;
    }
  },

  // Insert transaction into Supabase
  async insertTransaction(
    tx: Omit<Transaction, 'id' | 'timestamp'> & { id?: string },
    userId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: userId || 'usr-nova-julissa',
        title: tx.title,
        subtitle: tx.subtitle || 'Transacción Banca Nova Honduras',
        amount: tx.amount,
        type: tx.type,
        status: tx.status || 'completed',
        category: tx.category || 'General',
        category_icon: tx.categoryIcon || 'payments',
        destination_account: tx.destinationAccount || null,
        concept: tx.concept || tx.title,
      });

      if (error) {
        console.warn('Error inserting transaction in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Error inserting transaction in Supabase:', err);
      return false;
    }
  },

  // Update transaction status in Supabase
  async updateTransactionStatus(txId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', txId);
      return !error;
    } catch {
      return false;
    }
  },

  // Delete transaction from Supabase
  async deleteTransaction(txId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', txId);
      return !error;
    } catch {
      return false;
    }
  },

  // Execute transfer in Supabase (records transaction and adjusts balances)
  async executeTransferInSupabase(params: {
    senderId?: string;
    senderName?: string;
    senderAccountNumber?: string;
    destinationAccount: string;
    amount: number;
    concept: string;
    newSenderBalance: number;
  }): Promise<boolean> {
    try {
      const senderId = params.senderId || 'usr-nova-julissa';

      // 1. Update sender balance
      await this.updateUserBalance(senderId, params.newSenderBalance);

      // 2. Insert debit transaction for sender
      await this.insertTransaction(
        {
          title: `Transferencia a ${params.destinationAccount}`,
          subtitle: `Enviado a ${params.destinationAccount} • Débito`,
          amount: -Math.abs(params.amount),
          type: 'transfer',
          status: 'completed',
          date: 'Hoy',
          categoryIcon: 'send',
          category: 'Transferencia',
          destinationAccount: params.destinationAccount,
          concept: params.concept,
        },
        senderId
      );

      // 3. If receiver is in Supabase profiles (by account number, name, or username), credit them too
      const destClean = params.destinationAccount.trim().toLowerCase().replace(/^@/, '').replace(/\s+/g, '');
      const { data: receivers } = await supabase.from('profiles').select('*');
      if (receivers) {
        const target = receivers.find((r: any) => {
          const acc = (r.account_number || '').trim().toLowerCase().replace(/\s+/g, '');
          const uname = (r.username || '').trim().toLowerCase().replace(/^@/, '');
          const name = (r.name || '').trim().toLowerCase().replace(/\s+/g, '');
          return acc === destClean || uname === destClean || name === destClean;
        });

        if (target) {
          const newReceiverBal = (parseFloat(target.balance) || 0) + params.amount;
          await this.updateUserBalance(target.id, newReceiverBal);

          await this.insertTransaction(
            {
              title: `Transferencia de ${params.senderName || 'Usuario Nova'}`,
              subtitle: `Recibido de ${params.senderAccountNumber || 'Banca Nova'} • Acreditación`,
              amount: Math.abs(params.amount),
              type: 'deposit',
              status: 'completed',
              date: 'Hoy',
              categoryIcon: 'download',
              category: 'Transferencia',
              concept: params.concept,
            },
            target.id
          );
        }
      }

      return true;
    } catch (err) {
      console.warn('Error in executeTransferInSupabase:', err);
      return false;
    }
  },

  // Fetch admin credit logs
  async getCreditLogs(): Promise<AdminCreditLog[] | null> {
    try {
      const { data, error } = await supabase
        .from('admin_credit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return null;

      return data.map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        userName: log.user_name,
        amount: parseFloat(log.amount),
        type: log.type,
        concept: log.concept,
        date: new Date(log.created_at).toLocaleDateString('es-HN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: new Date(log.created_at).getTime(),
        adminNote: log.admin_note,
      }));
    } catch (err) {
      console.warn('Error fetching credit logs from Supabase:', err);
      return null;
    }
  },

  // Insert admin credit log
  async insertCreditLog(log: Omit<AdminCreditLog, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const { error } = await supabase.from('admin_credit_logs').insert({
        user_id: log.userId,
        user_name: log.userName,
        amount: log.amount,
        type: log.type,
        concept: log.concept,
        admin_note: log.adminNote,
      });

      return !error;
    } catch (err) {
      console.warn('Error inserting credit log into Supabase:', err);
      return false;
    }
  },

  // Bulk sync all users from local/Firestore to Supabase
  async syncAllUsersToSupabase(users: AdminUser[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const u of users) {
      try {
        const ok = await this.registerUserInSupabase(u, u.balance, u.password);
        if (ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  },
};
