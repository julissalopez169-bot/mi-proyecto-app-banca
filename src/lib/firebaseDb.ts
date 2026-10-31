import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  AdminUser,
  Transaction,
  SystemSettings,
  AdminCreditLog,
  CardThemeRequest,
  PlanTier,
  CardTheme,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_ADMIN_USERS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_THEME_REQUESTS,
  APP_IMAGES,
} from '../data/initialData';
import { supabaseDb } from './supabase';

const USERS_COL = 'users';
const TRANSACTIONS_COL = 'transactions';
const SETTINGS_COL = 'system_settings';
const LOGS_COL = 'credit_logs';
const THEME_REQ_COL = 'theme_requests';

// Helper to generate Honduran Account Number (16-digit numeric format without HN prefix)
export const generateHondurasAccountNumber = (): string => {
  const bankCode = '0182';
  const branch = '9901';
  const rand1 = Math.floor(1000 + Math.random() * 9000);
  const rand2 = Math.floor(1000 + Math.random() * 9000);
  return `${bankCode} ${branch} ${rand1} ${rand2}`;
};

// Seed initial Firestore collections with Honduras Lempira accounts
export const seedInitialFirestoreDataIfEmpty = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, SETTINGS_COL, 'global_config'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, SETTINGS_COL, 'global_config'), INITIAL_SYSTEM_SETTINGS);
    }
  } catch (err) {
    console.warn('Nota de inicialización Firestore:', err);
  }
};

// Subscribe to all users in real-time (cross-computer updates)
export const subscribeToUsers = (callback: (users: AdminUser[]) => void) => {
  const q = collection(db, USERS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const users: AdminUser[] = [];
      snapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...(docSnap.data() as Omit<AdminUser, 'id'>) });
      });
      callback(users);
    },
    (err) => {
      console.warn('Error en suscripción de usuarios Firestore:', err);
    }
  );
};

// Subscribe to transactions in real-time
export const subscribeToTransactions = (
  callback: (transactions: Transaction[]) => void
) => {
  const q = query(collection(db, TRANSACTIONS_COL), orderBy('timestamp', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        txs.push({ id: docSnap.id, ...(docSnap.data() as Omit<Transaction, 'id'>) });
      });
      callback(txs);
    },
    (err) => {
      console.warn('Error en suscripción de transacciones Firestore:', err);
    }
  );
};

// Subscribe to system settings
export const subscribeToSystemSettings = (
  callback: (settings: SystemSettings) => void
) => {
  const docRef = doc(db, SETTINGS_COL, 'global_config');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as SystemSettings);
      }
    },
    (err) => {
      console.warn('Error en configuración Firestore:', err);
    }
  );
};

// Update system settings in Firestore (Realtime cross-device sync)
export const updateSystemSettingsInFirestore = async (newSettings: Partial<SystemSettings>) => {
  try {
    const docRef = doc(db, SETTINGS_COL, 'global_config');
    await setDoc(docRef, newSettings, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error al actualizar configuración en Firestore:', err);
    throw err;
  }
};

// Subscribe to theme requests
export const subscribeToThemeRequests = (
  callback: (requests: CardThemeRequest[]) => void
) => {
  const q = query(collection(db, THEME_REQ_COL), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const reqs: CardThemeRequest[] = [];
      snapshot.forEach((docSnap) => {
        reqs.push({ id: docSnap.id, ...(docSnap.data() as Omit<CardThemeRequest, 'id'>) });
      });
      callback(reqs);
    },
    (err) => {
      console.warn('Error en solicitudes Firestore:', err);
    }
  );
};

// Subscribe to credit logs
export const subscribeToCreditLogs = (
  callback: (logs: AdminCreditLog[]) => void
) => {
  const q = query(collection(db, LOGS_COL), orderBy('timestamp', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: AdminCreditLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<AdminCreditLog, 'id'>) });
      });
      callback(logs);
    },
    (err) => {
      console.warn('Error en logs Firestore:', err);
    }
  );
};

// CROSS-DEVICE REALTIME TRANSFER
export interface TransferParams {
  senderId: string;
  senderName: string;
  senderAccountNumber: string;
  destinationAccount: string;
  amount: number;
  concept: string;
}

export const executeRealtimeTransfer = async ({
  senderId,
  senderName,
  senderAccountNumber,
  destinationAccount,
  amount,
  concept,
}: TransferParams): Promise<{
  success: boolean;
  message: string;
  receiverName?: string;
  receiverAccount?: string;
  newSenderBalance?: number;
}> => {
  if (amount <= 0) {
    throw new Error('El monto a transferir debe ser mayor a L. 0.00');
  }

  const rawDest = destinationAccount.trim();
  if (!rawDest) {
    throw new Error('Por favor ingresa la cuenta o el nombre de usuario del destinatario.');
  }

  const cleanDest = rawDest.toUpperCase().replace(/\s+/g, ' ');
  const noSpaceDest = rawDest.replace(/\s+/g, '').toUpperCase();
  const cleanUsername = rawDest.replace(/^@/, '').trim().toLowerCase();

  // 1. Look up receiver in users collection BEFORE transaction
  const usersSnap = await getDocs(collection(db, USERS_COL));
  let receiverDocRef: any = null;
  let receiverData: AdminUser | null = null;
  let selfTransferAttempt = false;

  usersSnap.forEach((d) => {
    const u = d.data() as AdminUser;
    const uAcc = (u.accountNumber || '').trim().toUpperCase().replace(/\s+/g, ' ');
    const uNoSpaceAcc = (u.accountNumber || '').replace(/\s+/g, '').toUpperCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const uName = (u.name || '').trim().toLowerCase();
    const uUsername = (u.username || '').trim().toLowerCase();

    const isMatch =
      (uAcc && (uAcc === cleanDest || uNoSpaceAcc === noSpaceDest || noSpaceDest.endsWith(uNoSpaceAcc.slice(-8)))) ||
      (uUsername && uUsername === cleanUsername) ||
      (uEmail && (uEmail === cleanUsername || uEmail === rawDest.toLowerCase())) ||
      (uName && (uName === cleanUsername || uName === rawDest.toLowerCase()));

    if (isMatch) {
      if (d.id === senderId) {
        selfTransferAttempt = true;
      } else {
        receiverDocRef = doc(db, USERS_COL, d.id);
        receiverData = { id: d.id, ...u };
      }
    }
  });

  if (selfTransferAttempt) {
    throw new Error('No puedes transferirte fondos a tu propia cuenta.');
  }

  const result = await runTransaction(db, async (transaction) => {
    // 1. Get Sender Doc
    const senderRef = doc(db, USERS_COL, senderId);
    const senderDoc = await transaction.get(senderRef);

    if (!senderDoc.exists()) {
      throw new Error('La cuenta emisora no existe en la base de datos.');
    }

    const senderData = senderDoc.data() as AdminUser;
    const currentSenderBalance = senderData.balance || 0;

    if (currentSenderBalance < amount) {
      throw new Error(
        `Saldo insuficiente. Tu balance actual es L. ${currentSenderBalance.toLocaleString('es-HN', {
          minimumFractionDigits: 2,
        })}`
      );
    }

    let currentReceiverBalance = 0;
    if (receiverDocRef) {
      const recDoc = await transaction.get(receiverDocRef);
      if (recDoc.exists()) {
        currentReceiverBalance = (recDoc.data() as AdminUser).balance || 0;
      }
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const dateStr = `Hoy, ${timeStr}`;

    // 2. Deduct from Sender
    const newSenderBalance = Math.max(0, currentSenderBalance - amount);
    transaction.update(senderRef, { balance: newSenderBalance });

    // 3. Create Sender Outgoing Transaction
    const senderTxId = `tx-out-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const senderTxRef = doc(db, TRANSACTIONS_COL, senderTxId);
    const recipientDisplayName = receiverData
      ? `${receiverData.name} (@${receiverData.username || receiverData.name.toLowerCase().replace(/\s+/g, '')})`
      : destinationAccount;

    const senderTx: Transaction = {
      id: senderTxId,
      title: `Transferencia a ${recipientDisplayName}`,
      subtitle: `${dateStr} • Transferencia Enviada`,
      amount: -amount,
      type: 'transfer',
      status: 'completed',
      date: dateStr,
      timestamp: Date.now(),
      categoryIcon: 'send',
      category: 'Transferencia',
      destinationAccount: receiverData?.accountNumber || destinationAccount,
      concept: concept || 'Transferencia Interbancaria en Lempiras',
      userId: senderId,
      userName: senderName,
    };
    transaction.set(senderTxRef, senderTx);

    // 4. If receiver is on Banca Nova, Credit to Receiver and create Incoming Tx!
    if (receiverDocRef && receiverData) {
      const newReceiverBalance = currentReceiverBalance + amount;
      transaction.update(receiverDocRef, { balance: newReceiverBalance });

      const receiverTxId = `tx-in-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const receiverTxRef = doc(db, TRANSACTIONS_COL, receiverTxId);
      const receiverTx: Transaction = {
        id: receiverTxId,
        title: `Transferencia de ${senderName}`,
        subtitle: `${dateStr} • Transferencia Recibida`,
        amount: amount,
        type: 'deposit',
        status: 'completed',
        date: dateStr,
        timestamp: Date.now() + 1,
        categoryIcon: 'payments',
        category: 'Ingreso Inmediato',
        destinationAccount: senderAccountNumber,
        concept: concept || 'Transferencia Recibida en Lempiras',
        userId: receiverData.id,
        userName: receiverData.name,
      };
      transaction.set(receiverTxRef, receiverTx);

      return {
        success: true,
        message: `Transferencia de L. ${amount.toLocaleString('es-HN', {
          minimumFractionDigits: 2,
        })} acreditada en tiempo real a ${receiverData.name}.`,
        receiverName: receiverData.name,
        receiverAccount: receiverData.accountNumber,
        newSenderBalance,
      };
    }

    return {
      success: true,
      message: `Transferencia de L. ${amount.toLocaleString('es-HN', {
        minimumFractionDigits: 2,
      })} enviada a la cuenta ${destinationAccount}.`,
      newSenderBalance,
    };
  });

  // Dual sync to Supabase database
  if (result.success && result.newSenderBalance !== undefined) {
    supabaseDb
      .executeTransferInSupabase({
        senderId,
        senderName,
        senderAccountNumber,
        destinationAccount,
        amount,
        concept,
        newSenderBalance: result.newSenderBalance,
      })
      .catch((err) => console.warn('Supabase transfer sync note:', err));
  }

  return result;
};

// Deposit money in real-time
export const executeDeposit = async (
  userId: string,
  amount: number,
  origin: string
): Promise<void> => {
  const userRef = doc(db, USERS_COL, userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const currentBal = (userSnap.data() as AdminUser).balance || 0;
  const newBal = currentBal + amount;
  await updateDoc(userRef, { balance: newBal });

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const dateStr = `Hoy, ${timeStr}`;

  const txId = `tx-dep-${Date.now()}`;
  const newTx: Transaction = {
    id: txId,
    title: origin || 'Depósito en Efectivo / ACH',
    subtitle: `${dateStr} • Depósito en Lempiras`,
    amount: amount,
    type: 'deposit',
    status: 'completed',
    date: dateStr,
    timestamp: Date.now(),
    categoryIcon: 'payments',
    category: 'Depósito',
    userId,
    userName: (userSnap.data() as AdminUser).name,
  };
  await setDoc(doc(db, TRANSACTIONS_COL, txId), newTx);

  // Sync to Supabase
  supabaseDb
    .updateUserBalance(userId, newBal)
    .then(() =>
      supabaseDb.insertTransaction(
        {
          title: origin || 'Depósito en Efectivo / ACH',
          subtitle: `${dateStr} • Depósito en Lempiras`,
          amount: amount,
          type: 'deposit',
          status: 'completed',
          date: dateStr,
          categoryIcon: 'payments',
          category: 'Depósito',
        },
        userId
      )
    )
    .catch((err) => console.warn('Supabase deposit sync note:', err));
};

// Withdraw money in real-time
export const executeWithdraw = async (
  userId: string,
  amount: number,
  reason: string
): Promise<void> => {
  const userRef = doc(db, USERS_COL, userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const currentBal = (userSnap.data() as AdminUser).balance || 0;
  if (currentBal < amount) {
    throw new Error('Saldo insuficiente para realizar el retiro.');
  }

  const newBal = Math.max(0, currentBal - amount);
  await updateDoc(userRef, { balance: newBal });

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const dateStr = `Hoy, ${timeStr}`;

  const txId = `tx-wd-${Date.now()}`;
  const newTx: Transaction = {
    id: txId,
    title: reason || 'Retiro en Cajero / Bóveda',
    subtitle: `${dateStr} • Retiro en Lempiras`,
    amount: -amount,
    type: 'withdrawal',
    status: 'completed',
    date: dateStr,
    timestamp: Date.now(),
    categoryIcon: 'atm',
    category: 'Retiro',
    userId,
    userName: (userSnap.data() as AdminUser).name,
  };
  await setDoc(doc(db, TRANSACTIONS_COL, txId), newTx);

  // Sync to Supabase
  supabaseDb
    .updateUserBalance(userId, newBal)
    .then(() =>
      supabaseDb.insertTransaction(
        {
          title: reason || 'Retiro en Cajero / Bóveda',
          subtitle: `${dateStr} • Retiro en Lempiras`,
          amount: -amount,
          type: 'withdrawal',
          status: 'completed',
          date: dateStr,
          categoryIcon: 'atm',
          category: 'Retiro',
        },
        userId
      )
    )
    .catch((err) => console.warn('Supabase withdraw sync note:', err));
};

// CREATE ACCOUNT / REGISTER IN FIRESTORE
export interface RegisterAccountParams {
  name: string;
  lastName?: string;
  password: string;
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan?: PlanTier;
  avatarUrl?: string;
}

export const registerAccountInFirestore = async (
  params: RegisterAccountParams
): Promise<UserProfile> => {
  const firstName = (params.name || '').trim();
  const lastName = (params.lastName || '').trim();
  const rawFullName = lastName ? `${firstName} ${lastName}`.trim() : firstName;

  if (!firstName) {
    throw new Error('Por favor ingresa tu nombre.');
  }

  // Derive username cleanly: remove spaces and accents, lowercase
  const normalizedBase = `${firstName}${lastName ? lastName[0] : ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const cleanUsername = (
    params.username || normalizedBase || 'usuario' + Math.floor(100 + Math.random() * 900)
  )
    .trim()
    .replace(/^@/, '')
    .toLowerCase();

  const cleanEmail = (params.email || `${cleanUsername}@bancanova.hn`).trim().toLowerCase();
  const cleanName = rawFullName;
  const cleanPhone = (params.phone || '').trim();
  const normalizedPhone = cleanPhone.replace(/[^0-9]/g, '');

  if (!params.password || params.password.length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres.');
  }

  // Check if the chosen username, email or phone already exists in Firestore
  const existingUsersSnap = await getDocs(collection(db, USERS_COL));
  let usernameTaken = false;
  let emailTaken = false;
  let phoneTaken = false;

  existingUsersSnap.forEach((d) => {
    const data = d.data() as AdminUser;
    const existingUname = (data.username || '').trim().toLowerCase().replace(/^@/, '');
    const existingName = (data.name || '').trim().toLowerCase();
    const existingEmail = (data.email || '').trim().toLowerCase();
    const existingPhone = (data.phone || '').replace(/[^0-9]/g, '');

    if (existingEmail && cleanEmail && existingEmail === cleanEmail) {
      emailTaken = true;
    }

    if (normalizedPhone && existingPhone && existingPhone.length >= 8 && (
      existingPhone === normalizedPhone ||
      existingPhone.endsWith(normalizedPhone) ||
      normalizedPhone.endsWith(existingPhone)
    )) {
      phoneTaken = true;
    }

    if (
      (existingUname && existingUname === cleanUsername) ||
      (existingName && existingName === cleanName.toLowerCase())
    ) {
      usernameTaken = true;
    }
  });

  if (emailTaken) {
    throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
  }

  if (phoneTaken) {
    throw new Error('Ya existe una cuenta registrada con este número de teléfono.');
  }

  if (usernameTaken) {
    throw new Error('Este nombre de usuario ya está ocupado. Prueba con otra opción.');
  }

  const newUserId = `usr-${Date.now()}`;
  const last4 = Math.floor(1000 + Math.random() * 9000).toString();
  const cvv = Math.floor(100 + Math.random() * 900).toString();

  // Official National Account Number: HN prefix + 8 digits (Requirement 3.1)
  const accountNumber = `HN${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Structured Official IBAN & Honduran SAR/RTN (Requirement 3.2)
  const iban = `HN45 LUMI 0182 9901 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
  const rtnSar = `0801-1998-${Math.floor(100000 + Math.random() * 900000)}`;

  const selectedPlan: PlanTier = params.plan || 'Personal';
  const selectedTheme: CardTheme =
    selectedPlan === 'Black' ? 'obsidian' : selectedPlan === 'Business' ? 'gold' : 'sapphire';
  
  // Official digital account initialization with default balance in 0.00
  const startingBalance = 0.0;
  const usdBalance = 0.0;

  const now = new Date();
  const dateFormatted = `${now.getDate()} ${now.toLocaleString('es-HN', { month: 'short' })} ${now.getFullYear()}`;
  const sarAuthCode = `SAR-HN-${Math.floor(100000 + Math.random() * 900000)}`;

  // Digital Contactless Debit Card with Cardholder Name in UPPERCASE (Requirement 3.5)
  const newUserProfile: UserProfile = {
    id: newUserId,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    password: params.password,
    phone: params.phone || '+504 9988-7766',
    address: params.address || 'Tegucigalpa, Francisco Morazán, Honduras',
    accountNumber,
    iban,
    rtnSar,
    usdBalance,
    isActive: true,
    isArchived: false,
    cardLast4: last4,
    accountType: `Banca Privada ${selectedPlan}`,
    avatarUrl:
      params.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    pushNotifications: true,
    weeklySummary: true,
    plan: selectedPlan,
    cardTheme: selectedTheme,
    authorizedThemes: [selectedTheme, 'obsidian', 'gold'],
    canChangeCardThemeFreely: false,
    isCardFrozen: false,
    cardDailyLimit: selectedPlan === 'Black' ? 250000 : selectedPlan === 'Business' ? 100000 : 25000,
    cardContactless: true,
    cardOnlineShopping: true,
    cardAtmWithdrawals: true,
    cvv,
    expiryDate: '10/30',
    activeCardId: `card-${newUserId}`,
    cards: [
      {
        id: `card-${newUserId}`,
        name: 'Tarjeta Débito Digital Contactless',
        cardHolderName: cleanName.toUpperCase(),
        cardNumber: `•••• •••• •••• ${last4}`,
        cardLast4: last4,
        theme: selectedTheme,
        type: selectedPlan === 'Black' ? 'Crédito Black' : selectedPlan === 'Business' ? 'Empresarial' : 'Débito VIP',
        expiryDate: '10/30',
        cvv,
        dailyLimit: selectedPlan === 'Black' ? 250000 : 25000,
        isFrozen: false,
        isDefault: true,
      },
    ],
  };

  const adminUserData: AdminUser = {
    id: newUserId,
    name: newUserProfile.name,
    username: cleanUsername,
    email: newUserProfile.email,
    password: newUserProfile.password,
    role: selectedPlan,
    status: 'Activo',
    isActive: true,
    isArchived: false,
    iban,
    rtnSar,
    usdBalance,
    avatar: newUserProfile.avatarUrl,
    joinedDate: dateFormatted,
    balance: startingBalance,
    phone: newUserProfile.phone,
    address: newUserProfile.address,
    accountNumber: newUserProfile.accountNumber,
    cardLast4: newUserProfile.cardLast4,
    cardTheme: newUserProfile.cardTheme,
    authorizedThemes: newUserProfile.authorizedThemes,
    isCardFrozen: false,
    cardDailyLimit: newUserProfile.cardDailyLimit,
    cardContactless: true,
    cardOnlineShopping: true,
    cardAtmWithdrawals: true,
    cvv: newUserProfile.cvv,
    expiryDate: newUserProfile.expiryDate,
  };

  // Save user profile to Firestore
  await setDoc(doc(db, USERS_COL, newUserId), adminUserData);

  // Dual sync user profile & starting balance to Supabase
  try {
    await supabaseDb.registerUserInSupabase(newUserProfile, startingBalance, params.password);
  } catch (supaErr) {
    console.warn('Supabase registration sync warning:', supaErr);
  }

  // Official opening transaction
  const welcomeTx: Transaction = {
    id: `tx-welcome-${Date.now()}`,
    title: 'Apertura de Cuenta Digital',
    subtitle: `Activación Oficial • Código SAR: ${sarAuthCode}`,
    amount: startingBalance,
    usdAmount: usdBalance,
    sarAuthCode,
    type: 'deposit',
    status: 'completed',
    date: 'Hoy, ' + `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    timestamp: Date.now(),
    categoryIcon: 'account_balance_wallet',
    category: 'Apertura',
    userId: newUserId,
    userName: cleanName,
    concept: 'Apertura de Cuenta Digital - Saldo inicial L. 0.00',
  };
  await setDoc(doc(db, TRANSACTIONS_COL, welcomeTx.id), welcomeTx);

  return newUserProfile;
};

// LOGIN WITH EMAIL, USERNAME OR ACCOUNT & PASSWORD
export const loginUserInFirestore = async (
  emailOrUsernameOrAccount: string,
  password?: string
): Promise<{ userProfile: UserProfile; balance: number } | null> => {
  const rawInput = (emailOrUsernameOrAccount || '').trim();
  const cleanTarget = rawInput.toLowerCase();
  const noSpaceTarget = cleanTarget.replace(/\s+/g, '');
  const usernameTarget = cleanTarget.replace(/^@/, '');
  const normalizedTarget = cleanTarget
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const cleanPassword = (password || '').trim();

  const snap = await getDocs(collection(db, USERS_COL));
  let foundUser: AdminUser | null = null;
  const allLoadedUsers: AdminUser[] = [];

  snap.forEach((d) => {
    const u = { id: d.id, ...(d.data() as Omit<AdminUser, 'id'>) };
    allLoadedUsers.push(u);

    const uEmail = (u.email || '').trim().toLowerCase();
    const uAcc = (u.accountNumber || '').trim().toLowerCase();
    const uNoSpaceAcc = uAcc.replace(/\s+/g, '');
    const uName = (u.name || '').trim().toLowerCase();
    const uUsername = (u.username || '').trim().toLowerCase().replace(/^@/, '');
    const uNameNormalized = uName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const matchesIdentifier =
      (uUsername && (uUsername === usernameTarget || uUsername === normalizedTarget)) ||
      (uEmail && (uEmail === cleanTarget || uEmail.split('@')[0] === cleanTarget || uEmail.split('@')[0] === normalizedTarget)) ||
      (uName && (uName === cleanTarget || uNameNormalized === normalizedTarget || uName.replace(/\s+/g, '') === noSpaceTarget)) ||
      (uAcc && (uAcc === cleanTarget || uNoSpaceAcc === noSpaceTarget)) ||
      (uName && uName.split(' ')[0] === cleanTarget) ||
      (uNameNormalized && normalizedTarget.length >= 3 && uNameNormalized.includes(normalizedTarget));

    const userStoredPassword = (u.password || 'password123').trim();

    if (matchesIdentifier) {
      if (!cleanPassword || userStoredPassword === cleanPassword) {
        foundUser = u;
      }
    }
  });

  // If not found by strict identifier match, check if password matches a user whose name/email is related
  if (!foundUser && cleanPassword) {
    const candidate = allLoadedUsers.find((u) => {
      const storedPass = (u.password || 'password123').trim();
      if (storedPass !== cleanPassword) return false;
      const uName = (u.name || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uUsername = (u.username || '').trim().toLowerCase();
      return (
        !cleanTarget ||
        uName.includes(cleanTarget) ||
        cleanTarget.includes(uName.split(' ')[0]) ||
        uEmail.includes(cleanTarget) ||
        uUsername.includes(cleanTarget)
      );
    });
    if (candidate) {
      foundUser = candidate;
    }
  }

  // If password is correct for exactly one user in the database, let them in!
  if (!foundUser && cleanPassword) {
    const matchingPassUsers = allLoadedUsers.filter(
      (u) => (u.password || 'password123').trim() === cleanPassword
    );
    if (matchingPassUsers.length === 1) {
      foundUser = matchingPassUsers[0];
    }
  }

  if (!foundUser) {
    // Try authenticating against Supabase database
    try {
      const supaUser = await supabaseDb.loginUserInSupabase(rawInput, cleanPassword);
      if (supaUser) {
        return supaUser;
      }
    } catch (supaErr) {
      console.warn('Supabase login check note:', supaErr);
    }
    return null;
  }

  const targetUser = foundUser as AdminUser;

  const userProfile: UserProfile = {
    id: targetUser.id,
    name: targetUser.name,
    username: targetUser.username || targetUser.name.toLowerCase().replace(/\s+/g, ''),
    email: targetUser.email,
    password: targetUser.password,
    phone: targetUser.phone || '+504 9900-1122',
    address: targetUser.address || 'Tegucigalpa, Honduras',
    accountNumber: targetUser.accountNumber || generateHondurasAccountNumber(),
    cardLast4: targetUser.cardLast4 || '4092',
    accountType: `Banca Privada ${targetUser.role || 'Personal'}`,
    avatarUrl: targetUser.avatar || APP_IMAGES.userAvatar,
    pushNotifications: true,
    weeklySummary: true,
    plan: targetUser.role || 'Black',
    cardTheme: targetUser.cardTheme || 'obsidian',
    authorizedThemes: targetUser.authorizedThemes || ['obsidian', 'gold', 'sapphire'],
    canChangeCardThemeFreely: targetUser.canChangeCardThemeFreely || false,
    isCardFrozen: targetUser.isCardFrozen || false,
    cardDailyLimit: targetUser.cardDailyLimit || 50000,
    cardContactless: targetUser.cardContactless ?? true,
    cardOnlineShopping: targetUser.cardOnlineShopping ?? true,
    cardAtmWithdrawals: targetUser.cardAtmWithdrawals ?? true,
    cvv: targetUser.cvv || '842',
    expiryDate: targetUser.expiryDate || '10/29',
    activeCardId: `card-${targetUser.id}`,
    cards: [
      {
        id: `card-${targetUser.id}`,
        name: `Tarjeta ${targetUser.role || 'Black'} Metal`,
        cardHolderName: targetUser.name.toUpperCase(),
        cardNumber: `•••• •••• •••• ${targetUser.cardLast4 || '4092'}`,
        cardLast4: targetUser.cardLast4 || '4092',
        theme: targetUser.cardTheme || 'obsidian',
        type: 'Crédito Black',
        expiryDate: targetUser.expiryDate || '10/29',
        cvv: targetUser.cvv || '842',
        dailyLimit: targetUser.cardDailyLimit || 50000,
        isFrozen: targetUser.isCardFrozen || false,
        isDefault: true,
      },
    ],
  };

  return {
    userProfile,
    balance: targetUser.balance !== undefined ? targetUser.balance : 0.0,
  };
};

// CREATE GUEST / INSTANT DEMO ACCOUNT
export const createInstantGuestAccount = async (): Promise<{ userProfile: UserProfile; balance: number }> => {
  const guestNames = [
    'Alejandro Mejia',
    'Gabriela Flores',
    'Mauricio Zelaya',
    'Carmen Alvarado',
    'Hector Rivera',
    'Valeria Martinez',
  ];
  const randName = guestNames[Math.floor(Math.random() * guestNames.length)];
  const randId = `guest-${Date.now()}`;
  const randLast4 = Math.floor(1000 + Math.random() * 9000).toString();
  const accNum = generateHondurasAccountNumber();
  const startingBal = 0.0; // Saldo inicial L. 0.00

  const guestProfile: UserProfile = {
    id: randId,
    name: `${randName} (Demo)`,
    email: `demo.${randId.slice(-4)}@bancanova.hn`,
    password: 'demo',
    phone: '+504 9555-0101',
    address: 'Colonia Palmira, Tegucigalpa, Honduras',
    accountNumber: accNum,
    cardLast4: randLast4,
    accountType: 'Banca Privada Black (Invitado)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    pushNotifications: true,
    weeklySummary: true,
    plan: 'Black',
    cardTheme: 'obsidian',
    authorizedThemes: ['obsidian', 'gold', 'titanium', 'sapphire'],
    canChangeCardThemeFreely: true,
    isCardFrozen: false,
    cardDailyLimit: 100000,
    cardContactless: true,
    cardOnlineShopping: true,
    cardAtmWithdrawals: true,
    cvv: '772',
    expiryDate: '11/30',
    isGuest: true,
    activeCardId: `card-${randId}`,
    cards: [
      {
        id: `card-${randId}`,
        name: 'Tarjeta Black Obsidiana VIP',
        cardHolderName: randName.toUpperCase(),
        cardNumber: `•••• •••• •••• ${randLast4}`,
        cardLast4: randLast4,
        theme: 'obsidian',
        type: 'Crédito Black',
        expiryDate: '11/30',
        cvv: '772',
        dailyLimit: 100000,
        isFrozen: false,
        isDefault: true,
      },
    ],
  };

  const adminUserData: AdminUser = {
    id: randId,
    name: guestProfile.name,
    email: guestProfile.email,
    password: guestProfile.password,
    role: 'Black',
    status: 'Activo',
    avatar: guestProfile.avatarUrl,
    joinedDate: 'Hoy',
    balance: startingBal,
    phone: guestProfile.phone,
    address: guestProfile.address,
    accountNumber: guestProfile.accountNumber,
    cardLast4: guestProfile.cardLast4,
    cardTheme: guestProfile.cardTheme,
    authorizedThemes: guestProfile.authorizedThemes,
    canChangeCardThemeFreely: true,
    isCardFrozen: false,
    cardDailyLimit: guestProfile.cardDailyLimit,
    cardContactless: true,
    cardOnlineShopping: true,
    cardAtmWithdrawals: true,
    cvv: guestProfile.cvv,
    expiryDate: guestProfile.expiryDate,
  };

  await setDoc(doc(db, USERS_COL, randId), adminUserData);

  const welcomeTx: Transaction = {
    id: `tx-guest-${Date.now()}`,
    title: 'Fondos Iniciales de Demostración',
    subtitle: 'Hoy • Acreditación Instantánea',
    amount: startingBal,
    type: 'deposit',
    status: 'completed',
    date: 'Hoy, 10:00',
    timestamp: Date.now(),
    categoryIcon: 'card_giftcard',
    category: 'Demostración',
    userId: randId,
    userName: guestProfile.name,
    concept: 'Saldo demo en Lempiras para pruebas interbancarias',
  };
  await setDoc(doc(db, TRANSACTIONS_COL, welcomeTx.id), welcomeTx);

  return { userProfile: guestProfile, balance: startingBal };
};

// UPDATE USER IN FIRESTORE & SUPABASE
export const updateUserInFirestore = async (
  userId: string,
  updated: Partial<AdminUser | UserProfile>
) => {
  const userRef = doc(db, USERS_COL, userId);
  await updateDoc(userRef, updated);
  supabaseDb.updateUserAdmin(userId, updated).catch((err) => console.warn('Supabase update note:', err));
};

// PERMANENT SOFT DELETE USER IN FIRESTORE & SUPABASE (Requirement 4.2)
// Accounts are NEVER physically deleted; marked is_active = false / status = 'Bloqueado'
export const deleteUserInFirestore = async (userId: string) => {
  const userRef = doc(db, USERS_COL, userId);
  await updateDoc(userRef, {
    status: 'Bloqueado',
    isActive: false,
    isArchived: true,
  });
  supabaseDb.deleteProfile(userId).catch((err) => console.warn('Supabase soft-delete note:', err));
};

// REACTIVATE PRE-EXISTING USER ACCOUNT (Requirement 2.2)
export const reactivateUserInFirestore = async (userId: string) => {
  const userRef = doc(db, USERS_COL, userId);
  await updateDoc(userRef, {
    status: 'Activo',
    isActive: true,
    isArchived: false,
  });
  supabaseDb.updateUserAdmin(userId, { status: 'Activo' }).catch((err) => console.warn('Supabase reactivation note:', err));
};

// RECORD LOGIN AUDIT LOG (Requirement 4.3)
export const recordLoginAuditInFirestore = async (
  userIdOrLog:
    | string
    | {
        userId: string;
        username: string;
        method: 'PASSWORD' | 'BIOMETRIC_FINGERPRINT';
        status: 'SUCCESS' | 'FAILED';
        details?: string;
      },
  username?: string,
  method: 'PASSWORD' | 'BIOMETRIC_FINGERPRINT' = 'PASSWORD',
  status: 'SUCCESS' | 'FAILED' = 'SUCCESS',
  details?: string
) => {
  try {
    const isObj = typeof userIdOrLog === 'object';
    const logUserId = isObj ? userIdOrLog.userId : userIdOrLog;
    const logUsername = isObj ? userIdOrLog.username : (username || logUserId);
    const logMethod = isObj ? userIdOrLog.method : method;
    const logStatus = isObj ? userIdOrLog.status : status;
    const logDetails = isObj ? (userIdOrLog.details || 'Acceso a banca móvil/web') : (details || 'Acceso a banca móvil/web');

    const entry = {
      id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: logUserId,
      username: logUsername,
      method: logMethod,
      status: logStatus,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      details: logDetails,
    };
    await setDoc(doc(db, 'login_logs', entry.id), entry);
    await supabaseDb.recordLoginAuditLog({
      userId: logUserId,
      username: logUsername,
      method: logMethod,
      status: logStatus,
      details: logDetails,
    });
  } catch (err) {
    console.warn('Login audit log write notice:', err);
  }
};

// THEME REQUESTS
export const submitThemeRequestToFirestore = async (req: CardThemeRequest) => {
  await setDoc(doc(db, THEME_REQ_COL, req.id), req);
};

export const updateThemeRequestInFirestore = async (
  reqId: string,
  updated: Partial<CardThemeRequest>
) => {
  await updateDoc(doc(db, THEME_REQ_COL, reqId), updated);
};

// CREDIT LOGS IN FIRESTORE & SUPABASE
export const addCreditLogToFirestore = async (log: AdminCreditLog) => {
  await setDoc(doc(db, LOGS_COL, log.id), log);
  supabaseDb.insertCreditLog(log).catch((err) => console.warn('Supabase credit log note:', err));
};

// TRANSACTION MANAGEMENT IN FIRESTORE & SUPABASE
export const insertTransactionInFirestore = async (tx: Transaction) => {
  await setDoc(doc(db, TRANSACTIONS_COL, tx.id), tx);
  supabaseDb.insertTransaction(tx, tx.userId).catch((err) => console.warn('Supabase tx insert note:', err));
};

export const updateTransactionStatusInFirestore = async (
  txId: string,
  status: 'completed' | 'pending' | 'cancelled'
) => {
  await updateDoc(doc(db, TRANSACTIONS_COL, txId), { status });
};

export const deleteTransactionInFirestore = async (txId: string) => {
  await deleteDoc(doc(db, TRANSACTIONS_COL, txId));
};
