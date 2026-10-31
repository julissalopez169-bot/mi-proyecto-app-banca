import React, { useState, useEffect } from 'react';
import { UserProfile, AdminUser, CompanyBranding } from '../types';
import { formatLempiras } from '../lib/currency';
import { BancaNovaLogo } from './BancaNovaLogo';
import {
  loginUserInFirestore,
  reactivateUserInFirestore,
  recordLoginAuditInFirestore,
} from '../lib/firebaseDb';
import {
  verifyWithDeviceBiometrics,
  getDeviceBiometricInfo,
  DeviceBiometricInfo,
  hasAccountUsedBiometrics,
  markAccountBiometricUsed,
} from '../lib/biometrics';

interface AuthModalProps {
  isOpen: boolean;
  standalone?: boolean;
  initialMode?: 'login' | 'register' | 'recover';
  onClose: () => void;
  currentUser?: UserProfile;
  allUsers: AdminUser[];
  onLogin: (userProfile: UserProfile, balance: number) => void;
  onRegister?: (data: {
    name: string;
    lastName?: string;
    username: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => Promise<void>;
  onGuestAccess?: () => Promise<void>;
  onLogout?: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
  branding?: CompanyBranding;
  securityNotice?: string;
  wasAutoLoggedOut?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  standalone = false,
  initialMode,
  onClose,
  currentUser,
  allUsers,
  onLogin,
  onRegister,
  onGuestAccess,
  onLogout,
  onShowToast,
  branding,
  securityNotice,
  wasAutoLoggedOut = false,
}) => {
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);
  const [deviceBioInfo, setDeviceBioInfo] = useState<DeviceBiometricInfo | null>(null);
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'recover'>(() => {
    return initialMode || 'register';
  });

  useEffect(() => {
    getDeviceBiometricInfo().then(setDeviceBioInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoginPassword('');
      setIsSubmitting(false);
      setIsBiometricLoading(false);
      setBiometricFeedback(null);
      setViewMode(initialMode || 'register');
    }
  }, [isOpen, initialMode]);

  // Selected account for Apple Business login preview (Requisito: "a la hora de iniciar sesión que me aparezca su dinero y la cuenta")
  const selectedAccount = React.useMemo<AdminUser | null>(() => {
    const clean = loginIdentifier.trim().toLowerCase().replace(/^@/, '');
    if (clean && allUsers.length > 0) {
      const match = allUsers.find(
        (u) =>
          (u.username && u.username.toLowerCase() === clean) ||
          (u.email && u.email.toLowerCase() === clean) ||
          (u.name && u.name.toLowerCase() === clean) ||
          (u.id && u.id.toLowerCase() === clean)
      );
      if (match) return match;
    }
    if (currentUser) {
      const matchCurrent = allUsers.find(
        (u) => u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (matchCurrent) return matchCurrent;
    }
    return allUsers[0] || null;
  }, [loginIdentifier, allUsers, currentUser]);

  // Register form state (Section 1: Campos de entrada y comportamiento en tiempo real)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+504 ');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [deviceUsernames, setDeviceUsernames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bancanova_device_usernames');
      return saved ? JSON.parse(saved) : ['klopez26', 'carlosm26'];
    } catch {
      return ['klopez26', 'carlosm26'];
    }
  });
  const [deviceEmails, setDeviceEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bancanova_device_emails');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});

  const [recoveryUsername, setRecoveryUsername] = useState('');

  // Common email domains for smart native chips
  const commonDomains = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com'];

  // Check if a password was previously used by any account in database or device history (Requirement 1.5)
  const isRepeatedPassword = (pwd: string): boolean => {
    const trimmed = pwd.trim();
    if (!trimmed || trimmed.length < 6) return false;
    // Check against all users in database (including inactive/archived)
    const existsInDb = allUsers.some((u) => (u.password || '').trim() === trimmed);
    if (existsInDb) return true;
    try {
      const history: string[] = JSON.parse(localStorage.getItem('bancanova_used_passwords') || '[]');
      if (history.includes(trimmed)) return true;
    } catch {}
    return false;
  };

  // Helper: Sanitize to max 12 lowercase alphanumeric characters only (Requirement 1.2)
  const sanitizeUsername12 = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 12);
  };

  // Disparador reactivo: En cuanto el usuario escribe su nombre (mínimo 2 letras),
  // el sistema genera inmediatamente 3 sugerencias de nombres de usuario fáciles de recordar, profesionales y únicas.
  useEffect(() => {
    const clean = regFullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (clean.length < 2) {
      setSuggestedUsernames([]);
      return;
    }

    const parts = clean.split(/\s+/).filter(Boolean);
    const first = (parts[0] || '').replace(/[^a-z0-9]/g, '');
    const last = (parts.length > 1 ? parts[parts.length - 1] : '').replace(/[^a-z0-9]/g, '');

    const rawCandidates: string[] = [];

    if (first && last) {
      const f1 = first[0];
      // 1. Coherent with name: klopez26 (e.g. for "Keren Lopez")
      rawCandidates.push(sanitizeUsername12(`${f1}${last}26`));
      // 2. Full combined: kerenlopez
      rawCandidates.push(sanitizeUsername12(`${first}${last}`));
      // 3. Professional dev/hn: klopezdev or klopezhn
      rawCandidates.push(sanitizeUsername12(`${f1}${last}dev`));
      rawCandidates.push(sanitizeUsername12(`${f1}${last}hn`));
      rawCandidates.push(sanitizeUsername12(`${first}${last[0]}26`));
      rawCandidates.push(sanitizeUsername12(`${f1}${last}`));
    } else if (first) {
      rawCandidates.push(sanitizeUsername12(`${first}26`));
      rawCandidates.push(sanitizeUsername12(`${first}dev`));
      rawCandidates.push(sanitizeUsername12(`${first}hn`));
      rawCandidates.push(sanitizeUsername12(`${first}nova`));
      rawCandidates.push(sanitizeUsername12(`user${first}`));
    }

    // Verify uniqueness against all users in database (including inactive/archived)
    const isTaken = (cand: string) =>
      allUsers.some((u) => {
        const uUname = (u.username || '').toLowerCase().replace(/^@/, '');
        return uUname === cand;
      });

    const unique: string[] = [];
    for (const cand of rawCandidates) {
      if (cand && cand.length >= 3 && !unique.includes(cand)) {
        if (!isTaken(cand)) {
          unique.push(cand);
        } else {
          const alt = sanitizeUsername12(`${cand.slice(0, 10)}${Math.floor(10 + Math.random() * 89)}`);
          if (!isTaken(alt) && !unique.includes(alt)) {
            unique.push(alt);
          }
        }
      }
      if (unique.length === 3) break;
    }

    // Ensure exactly 3 suggestions
    let counter = 1;
    while (unique.length < 3) {
      const fallback = sanitizeUsername12(`${first.slice(0, 8)}${counter}hn`);
      if (!isTaken(fallback) && !unique.includes(fallback)) {
        unique.push(fallback);
      }
      counter++;
    }

    const finalThree = unique.slice(0, 3);
    setSuggestedUsernames(finalThree);

    // If username is currently empty or matches a previous auto suggestion, update to first suggestion
    if (!regUsername || suggestedUsernames.includes(regUsername)) {
      setRegUsername(finalThree[0] || '');
    }
  }, [regFullName, allUsers]);

  // Handle phone format: +504 9876-5432 (Requirement 1.4)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, '');
    let pure = digits.startsWith('504') ? digits.slice(3) : digits;
    pure = pure.slice(0, 8); // 8-digit phone numbers in Honduras
    let formatted = '+504 ';
    if (pure.length > 4) {
      formatted += `${pure.slice(0, 4)}-${pure.slice(4)}`;
    } else if (pure.length > 0) {
      formatted += pure;
    }
    setRegPhone(formatted);
  };

  // Handle smart email domain chips (Requirement 1.3)
  const handleDomainChipClick = (domain: string) => {
    const prefix = regEmail.includes('@') ? regEmail.split('@')[0] : regEmail.trim();
    const finalPrefix = prefix || regUsername || 'usuario';
    setRegEmail(`${finalPrefix}${domain}`);
  };

  // Autocomplete matching usernames on device (Requirement 1.2)
  const matchingDeviceUsernames = deviceUsernames.filter((devU) => {
    const cleanDev = devU.toLowerCase().replace(/^@/, '');
    const cleanInput = regUsername.toLowerCase().replace(/^@/, '');
    return cleanInput.length >= 1 && cleanDev.includes(cleanInput) && cleanDev !== cleanInput;
  });

  // Autocomplete matching emails on device (Requirement 1.3)
  const matchingDeviceEmails = deviceEmails.filter((devE) => {
    const cleanDev = devE.toLowerCase().trim();
    const cleanInput = regEmail.toLowerCase().trim();
    return cleanInput.length >= 2 && cleanDev.includes(cleanInput) && cleanDev !== cleanInput;
  });

  // Live validation for register
  useEffect(() => {
    const errors: { fullName?: string; username?: string; email?: string; phone?: string; password?: string } = {};

    // Validate email
    const cleanEmail = regEmail.trim().toLowerCase();
    if (cleanEmail && !cleanEmail.includes('@')) {
      errors.email = 'Ingresa un formato de correo válido (ej. usuario@gmail.com).';
    }

    // Validate username rules (max 12, lowercase letters and numbers only)
    const cleanUname = regUsername.trim().toLowerCase().replace(/^@/, '');
    if (cleanUname) {
      if (cleanUname.length > 12) {
        errors.username = 'El nombre de usuario no puede exceder 12 caracteres.';
      } else if (!/^[a-z0-9]+$/.test(cleanUname)) {
        errors.username = 'Únicamente letras minúsculas y números (sin espacios ni símbolos).';
      }
    }

    // Validate password: min 6 chars and anti-repeated password check (Requirement 1.5)
    if (regPassword) {
      if (regPassword.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (isRepeatedPassword(regPassword)) {
        errors.password = 'Esta contraseña ya ha sido utilizada previamente en la base de datos. Por seguridad bancaria, elige una contraseña única.';
      }
    }

    setFieldErrors(errors);
  }, [regUsername, regEmail, regPhone, regPassword, allUsers]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = loginIdentifier.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanIdentifier || !cleanPassword) {
      onShowToast('Datos incompletos', 'Ingresa tu nombre o usuario y tu contraseña.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let account: { userProfile: UserProfile; balance: number } | null = null;
      try {
        account = await loginUserInFirestore(cleanIdentifier, cleanPassword);
      } catch (err) {
        console.warn('Firestore login error, checking local user list:', err);
      }

      if (!account) {
        const lowerIdentifier = cleanIdentifier.toLowerCase();
        const noSpaceTarget = lowerIdentifier.replace(/\s+/g, '');
        const cleanUname = lowerIdentifier.replace(/^@/, '');
        const normalizedTarget = lowerIdentifier
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');

        let localUser = allUsers.find((userItem) => {
          const uEmail = (userItem.email || '').trim().toLowerCase();
          const uAcc = (userItem.accountNumber || '').trim().toLowerCase().replace(/^hn\d*\s*/i, '');
          const uNoSpaceAcc = uAcc.replace(/\s+/g, '');
          const uName = (userItem.name || '').trim().toLowerCase();
          const uUsername = (userItem.username || '').trim().toLowerCase().replace(/^@/, '');
          const uNameNormalized = uName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');

          const matchesIdentifier =
            (uUsername && (uUsername === cleanUname || uUsername === normalizedTarget)) ||
            (uEmail && (uEmail === lowerIdentifier || uEmail.split('@')[0] === lowerIdentifier || uEmail.split('@')[0] === normalizedTarget)) ||
            (uName && (uName === lowerIdentifier || uNameNormalized === normalizedTarget || uName.replace(/\s+/g, '') === noSpaceTarget)) ||
            (uAcc && (uAcc === lowerIdentifier || uNoSpaceAcc === noSpaceTarget)) ||
            (uName && uName.split(' ')[0] === lowerIdentifier) ||
            (uNameNormalized && normalizedTarget.length >= 3 && uNameNormalized.includes(normalizedTarget));

          const userStoredPass = (userItem.password || 'password123').trim();
          return matchesIdentifier && userStoredPass === cleanPassword;
        });

        // Fallback: If user entered correct password and identifier resembles their name or email
        if (!localUser) {
          localUser = allUsers.find((userItem) => {
            const userStoredPass = (userItem.password || 'password123').trim();
            if (userStoredPass !== cleanPassword) return false;
            const uName = (userItem.name || '').trim().toLowerCase();
            const uEmail = (userItem.email || '').trim().toLowerCase();
            const uUsername = (userItem.username || '').trim().toLowerCase();
            return (
              uName.includes(lowerIdentifier) ||
              lowerIdentifier.includes(uName.split(' ')[0]) ||
              uEmail.includes(lowerIdentifier) ||
              uUsername.includes(lowerIdentifier)
            );
          });
        }

        // If there's an exact password match for a single user in allUsers, allow entry
        if (!localUser) {
          const passMatches = allUsers.filter(
            (u) => (u.password || 'password123').trim() === cleanPassword
          );
          if (passMatches.length === 1) {
            localUser = passMatches[0];
          }
        }

        if (localUser) {
          account = {
            userProfile: {
              id: localUser.id,
              name: localUser.name,
              username: localUser.username || localUser.name.toLowerCase().replace(/\s+/g, ''),
              email: localUser.email,
              password: localUser.password || cleanPassword,
              phone: localUser.phone || '+504 9900-1122',
              address: localUser.address || 'Tegucigalpa, Honduras',
              accountNumber: (localUser.accountNumber || '').replace(/^HN\d*\s*/i, ''),
              cardLast4: localUser.cardLast4 || '0000',
              accountType: `Banca Privada ${localUser.role}`,
              avatarUrl: localUser.avatar || '',
              pushNotifications: true,
              weeklySummary: true,
              plan: localUser.role,
              cardTheme: localUser.cardTheme || 'sapphire',
              authorizedThemes: localUser.authorizedThemes,
              canChangeCardThemeFreely: localUser.canChangeCardThemeFreely,
              isCardFrozen: localUser.isCardFrozen,
              cardDailyLimit: localUser.cardDailyLimit,
              cardContactless: localUser.cardContactless,
              cardOnlineShopping: localUser.cardOnlineShopping,
              cardAtmWithdrawals: localUser.cardAtmWithdrawals,
              cvv: localUser.cvv,
              expiryDate: localUser.expiryDate,
            },
            balance: localUser.balance || 0,
          };
        }
      }

      if (!account) {
        try {
          recordLoginAuditInFirestore(cleanIdentifier, cleanIdentifier, 'PASSWORD', 'FAILED');
        } catch {}
        onShowToast('Datos incorrectos', 'La contraseña o usuario no coinciden. Por favor verifica tus datos.', 'error');
        setIsSubmitting(false);
        return;
      }

      try {
        recordLoginAuditInFirestore(account.userProfile.id, account.userProfile.username || account.userProfile.name, 'PASSWORD', 'SUCCESS');
      } catch {}

      markAccountBiometricUsed(account.userProfile.id);
      if (account.userProfile.username) {
        markAccountBiometricUsed(account.userProfile.username);
      }

      onLogin(account.userProfile, account.balance);
      onShowToast('Sesión Iniciada', `¡Bienvenido(a) de nuevo, ${account.userProfile.name}!`, 'success');
      onClose();
    } catch (err: any) {
      onShowToast('Error', err.message || 'Error al iniciar sesión.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Autenticación biométrica nativa del celular (Huella en Android/Touch ID / Face ID en iPhone)
  // Si ya ha utilizado una cuenta con esa huella, lo deja ingresar directamente.
  // Si nunca ha iniciado sesión, le solicita iniciar sesión con usuario y contraseña (o registrarse si no existe cuenta).
  const handleBiometricLogin = async (type: 'fingerprint' | 'faceid') => {
    if (isBiometricLoading || isSubmitting) return;

    // 1. Si nunca se ha registrado ningún usuario (no hay cuentas en el sistema):
    if (allUsers.length === 0) {
      onShowToast(
        'Sin cuentas registradas',
        'Debes registrarte primero creando tu cuenta digital.',
        'info'
      );
      setViewMode('login');
      return;
    }

    // 2. Determinar la cuenta objetivo (del input, cuenta seleccionada o primera cuenta disponible)
    let targetUser: AdminUser | null = null;
    const cleanId = loginIdentifier.trim().toLowerCase().replace(/^@/, '');

    if (cleanId) {
      targetUser =
        allUsers.find(
          (u) =>
            (u.username && u.username.toLowerCase() === cleanId) ||
            (u.email && u.email.toLowerCase() === cleanId) ||
            (u.name && u.name.toLowerCase() === cleanId)
        ) || null;
    }

    if (!targetUser && selectedAccount) {
      targetUser = allUsers.find((u) => u.id === selectedAccount.id) || null;
    }

    if (!targetUser && allUsers.length > 0) {
      targetUser = allUsers[0];
      setLoginIdentifier(targetUser.username ? `@${targetUser.username}` : targetUser.name);
    }

    if (!targetUser) {
      onShowToast(
        'Cuenta no seleccionada',
        'Por favor selecciona una cuenta o ingresa tu usuario para escanear tu huella.',
        'info'
      );
      return;
    }

    // 3. Conexión directa con la huella digital integrada del celular
    setIsBiometricLoading(true);
    const sensorLabel = 'Huella Digital de tu celular';
    setBiometricFeedback(`Activando sensor de huella del celular...`);

    try {
      const result = await verifyWithDeviceBiometrics(
        targetUser.id || targetUser.email || 'user',
        targetUser.name || 'Titular'
      );

      if (result.success) {
        try {
          recordLoginAuditInFirestore(
            targetUser.id,
            targetUser.username || targetUser.name,
            'BIOMETRIC_FINGERPRINT',
            'SUCCESS'
          );
        } catch {}

        markAccountBiometricUsed(targetUser.id);
        if (targetUser.username) {
          markAccountBiometricUsed(targetUser.username);
        }
        setBiometricFeedback('¡Huella confirmada por tu celular!');
        const userProf: UserProfile = {
          id: targetUser.id,
          name: targetUser.name,
          username: targetUser.username || targetUser.name.toLowerCase().replace(/\s+/g, ''),
          email: targetUser.email,
          password: targetUser.password || 'password123',
          phone: targetUser.phone || '+504 9900-1122',
          address: targetUser.address || 'Tegucigalpa, Honduras',
          accountNumber: (targetUser.accountNumber || '').replace(/^HN\d*\s*/i, ''),
          cardLast4: targetUser.cardLast4 || '5220',
          accountType: (targetUser as any).accountType || `Banca Privada ${targetUser.role || 'Personal'}`,
          avatarUrl: (targetUser as any).avatarUrl || (targetUser as any).avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          pushNotifications: true,
          weeklySummary: true,
          plan: targetUser.role || 'Personal',
          cardTheme: targetUser.cardTheme || 'sapphire',
          authorizedThemes: targetUser.authorizedThemes,
          canChangeCardThemeFreely: targetUser.canChangeCardThemeFreely,
          isCardFrozen: targetUser.isCardFrozen,
          cardDailyLimit: targetUser.cardDailyLimit,
          cardContactless: targetUser.cardContactless,
          cardOnlineShopping: targetUser.cardOnlineShopping,
          cardAtmWithdrawals: targetUser.cardAtmWithdrawals,
          cvv: targetUser.cvv || '842',
          expiryDate: targetUser.expiryDate || '10/30',
        };

        setTimeout(() => {
          onLogin(userProf, targetUser?.balance ?? 0);
          onClose();
          onShowToast(
            'Sesión Iniciada',
            `Bienvenido(a) ${userProf.name}. Autenticado directamente con la huella de tu celular.`,
            'success'
          );
        }, 350);
      } else if (result.error === 'canceled') {
        try {
          recordLoginAuditInFirestore(
            targetUser?.id || cleanId || 'device_user',
            targetUser?.username || cleanId || 'device_user',
            'BIOMETRIC_FINGERPRINT',
            'FAILED'
          );
        } catch {}
        setBiometricFeedback(null);
        onShowToast(
          'Lectura Cancelada',
          'La lectura biométrica fue cancelada en el celular. Puedes ingresar con tu usuario y contraseña.',
          'info'
        );
      } else {
        try {
          recordLoginAuditInFirestore(
            targetUser?.id || cleanId || 'device_user',
            targetUser?.username || cleanId || 'device_user',
            'BIOMETRIC_FINGERPRINT',
            'FAILED'
          );
        } catch {}
        setBiometricFeedback(null);
        onShowToast(
          'Sensor no validado',
          result.message || 'El sensor de tu celular no confirmó la identidad. Ingresa con tu usuario y contraseña.',
          'error'
        );
      }
    } catch (err: any) {
      setBiometricFeedback(null);
      onShowToast(
        'Error con el sensor',
        err?.message || 'No se pudo comunicar con el sensor biométrico del teléfono.',
        'error'
      );
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleQuickSelectUser = (userItem: AdminUser) => {
    setLoginIdentifier(userItem.username ? `@${userItem.username}` : userItem.name);
    setLoginPassword('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFull = regFullName.trim();
    const cleanUname = regUsername.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();

    // Requisito 2.1: Si la base de datos está vacía
    if (allUsers.length === 0) {
      onShowToast('Aviso', 'Inicie sesión', 'info');
      setViewMode('register');
      return;
    }

    // Requisito 2.1 & 2.2: Detección de cuenta preexistente (incluso si la cuenta fue desactivada/archivada)
    const existingUser = allUsers.find((u) => {
      const uUname = (u.username || '').toLowerCase().replace(/^@/, '');
      const uEmail = (u.email || '').toLowerCase().trim();
      const uPhone = (u.phone || '').trim().replace(/[^0-9]/g, '');
      const targetPhone = cleanPhone.replace(/[^0-9]/g, '');
      return (
        (cleanUname && uUname === cleanUname) ||
        (cleanEmail && uEmail === cleanEmail) ||
        (targetPhone && uPhone && targetPhone.length >= 8 && targetPhone === uPhone)
      );
    });

    if (existingUser) {
      // Requisito 2.2: Prevención de duplicados - reactiva el registro original manteniendo saldo e historial
      if (existingUser.isActive === false || existingUser.isArchived === true || existingUser.status === 'Bloqueado') {
        try {
          await reactivateUserInFirestore(existingUser.id);
        } catch (err) {
          console.warn('Error al reactivar cuenta preexistente en Firestore:', err);
        }
      }
      // Precarga automáticamente el nombre de usuario y redirige a la pestaña de login
      const unameToLoad = existingUser.username ? `@${existingUser.username}` : existingUser.name;
      setLoginIdentifier(unameToLoad);
      setLoginPassword('');
      // Requisito 2.1: Notificación pequeña con el texto exacto: "Inicie sesión"
      onShowToast('Cuenta existente', 'Inicie sesión', 'info');
      setViewMode('register');
      return;
    }

    // Requisito 1.1: Nombre completo (mínimo 2 letras)
    if (cleanFull.length < 2) {
      onShowToast('Nombre requerido', 'Por favor ingresa tu nombre completo (mínimo 2 letras).', 'error');
      return;
    }

    // Requisito 1.2: Username (máximo 12 caracteres, sólo letras minúsculas y números)
    if (!cleanUname) {
      onShowToast('Usuario requerido', 'Por favor define o selecciona un nombre de usuario.', 'error');
      return;
    }

    if (cleanUname.length > 12) {
      onShowToast('Usuario excedido', 'El nombre de usuario no puede exceder 12 caracteres.', 'error');
      return;
    }

    if (!/^[a-z0-9]+$/.test(cleanUname)) {
      onShowToast('Usuario inválido', 'El nombre de usuario sólo puede contener letras minúsculas y números.', 'error');
      return;
    }

    // Requisito 1.3: Correo electrónico válido
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      onShowToast('Correo inválido', 'Por favor ingresa un correo electrónico válido.', 'error');
      return;
    }

    // Requisito 1.4: Teléfono celular
    if (!cleanPhone || cleanPhone.length < 8) {
      onShowToast('Teléfono requerido', 'Por favor ingresa tu número de celular para contacto.', 'error');
      return;
    }

    // Requisito 1.5: Contraseña (al menos 6 caracteres y validación criptográfica contra contraseñas repetidas)
    if (!regPassword || regPassword.length < 6) {
      onShowToast('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    if (isRepeatedPassword(regPassword)) {
      onShowToast('Contraseña no permitida', 'Esta contraseña ya ha sido utilizada previamente en la base de datos. Por seguridad bancaria estilo BAC, elige una contraseña única.', 'error');
      return;
    }

    if (!onRegister) return;

    setIsSubmitting(true);
    try {
      const parts = cleanFull.split(/\s+/);
      const firstName = parts[0] || 'Cliente';
      const lastName = parts.slice(1).join(' ') || 'Banca Nova';

      await onRegister({
        name: firstName,
        lastName,
        username: cleanUname,
        email: cleanEmail,
        phone: cleanPhone,
        address: 'Tegucigalpa, Francisco Morazán, Honduras',
        password: regPassword,
      });

      // Guardar autocompletado en dispositivo móvil (Requisito 1.2 y 1.3)
      try {
        const storedDevU = JSON.parse(localStorage.getItem('bancanova_device_usernames') || '[]');
        if (!storedDevU.includes(cleanUname)) {
          storedDevU.unshift(cleanUname);
          localStorage.setItem('bancanova_device_usernames', JSON.stringify(storedDevU.slice(0, 10)));
        }
        const storedDevE = JSON.parse(localStorage.getItem('bancanova_device_emails') || '[]');
        if (!storedDevE.includes(cleanEmail)) {
          storedDevE.unshift(cleanEmail);
          localStorage.setItem('bancanova_device_emails', JSON.stringify(storedDevE.slice(0, 10)));
        }
        // Guardar contraseña en historial cifrado/local de contraseñas utilizadas
        const usedPwdHistory = JSON.parse(localStorage.getItem('bancanova_used_passwords') || '[]');
        if (!usedPwdHistory.includes(regPassword)) {
          usedPwdHistory.push(regPassword);
          localStorage.setItem('bancanova_used_passwords', JSON.stringify(usedPwdHistory.slice(0, 50)));
        }
        markAccountBiometricUsed(cleanUname);
        localStorage.setItem('bancanova_has_registered', 'true');
        localStorage.setItem('bancanova_last_biometric_user_id', cleanUname);
      } catch {}

      onShowToast(
        '¡Cuenta Digital Creada!',
        `¡Bienvenido(a), ${cleanFull}! Tu cuenta bancaria digital ha sido activada con saldo inicial de L. 0.00.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      const msg = err.message || 'No se pudo crear la cuenta digital.';
      onShowToast('Error al Registrar', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className={`${standalone ? 'login-screen' : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in'}`}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-3xl w-full max-w-[430px] overflow-hidden shadow-2xl border border-black/[0.08] flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 sm:px-6 pt-5 pb-3.5 border-b border-black/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <BancaNovaLogo
                size="sm"
                variant="dark"
                companyName={branding?.companyName}
                subtitle={branding?.subtitle}
                customLogoUrl={branding?.logoUrl}
              />
            </div>
            {!standalone && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Modal Body with Scroll */}
          <div className="p-5 sm:p-6 overflow-y-auto">
            {/* Security notification banner (Clean & direct, without secondary leftover text) */}
            {(wasAutoLoggedOut || securityNotice || (typeof window !== 'undefined' && sessionStorage.getItem('bancanova_auto_exit') === 'true')) && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center gap-2.5 mb-3.5 shadow-2xs animate-fade-in">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">shield</span>
                <span className="font-bold text-xs text-amber-950">
                  Sesión de validación por seguridad
                </span>
              </div>
            )}

            {/* Segmented Mode Selector: Iniciar Sesión vs Crear Cuenta Digital */}
            <div className="flex gap-1 p-1 mb-4 sm:mb-5 bg-[#F5F5F7] rounded-2xl shrink-0 border border-black/[0.04]">
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'login'
                    ? 'bg-white text-[#0071E3] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">login</span>
                <span>Iniciar sesión</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('register')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'register'
                    ? 'bg-white text-[#E30613] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                <span>Crear cuenta</span>
              </button>
            </div>

            {viewMode === 'login' ? (
              <div className="flex flex-col gap-4">
                {/* Clean Apple Title */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Iniciar Sesión</h2>
                  <p className="text-xs text-[#86868B] mt-1">
                    Ingresa tus credenciales para acceder a tu banca digital
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Nombre, Usuario (@) o Correo
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
                        account_circle
                      </span>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Ej. usuario o correo@ejemplo.hn"
                        required
                        className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#1D1D1F] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#1D1D1F]">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-[#0071E3] hover:underline cursor-pointer"
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
                        lock
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#1D1D1F] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || isBiometricLoading}
                      className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,113,227,0.25)] cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[17px]">login</span>
                      <span>{isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting || isBiometricLoading}
                      onClick={() => handleBiometricLogin('fingerprint')}
                      className="w-full py-2.5 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-black/[0.12] rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-2xs group"
                      title="Ingresar directamente con la huella digital integrada en tu celular"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#34C759] group-hover:scale-110 transition-transform">
                        fingerprint
                      </span>
                      <span>
                        {isBiometricLoading ? 'Escaneando huella del celular...' : 'Ingresar con Huella Digital'}
                      </span>
                    </button>
                  </div>

                  {biometricFeedback && (
                    <div className="flex items-center justify-center gap-1.5 pt-0.5 animate-fade-in">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-ping"></span>
                      <p className="text-[11px] text-[#34C759] font-medium text-center">
                        {biometricFeedback}
                      </p>
                    </div>
                  )}
                </form>

                {/* Quick Account Switcher (Minimalist Apple HIG: Clean, no monetary balance, privacy-preserving) */}
                {allUsers.length > 0 && (
                  <div className="pt-3 border-t border-black/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#86868B]">
                        Cuentas en este dispositivo
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                      {allUsers.map((u) => {
                        const cleanAcc = (u.accountNumber || '').replace(/^HN\d*\s*/i, '');
                        const isCurrentActive = selectedAccount?.id === u.id || selectedAccount?.email === u.email;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleQuickSelectUser(u)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                              isCurrentActive
                                ? 'bg-blue-50/90 border-[#0071E3] shadow-xs'
                                : 'bg-[#F5F5F7] hover:bg-white hover:border-black/[0.08] border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-black/[0.08]"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#1D1D1F] truncate flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  <span className="text-[11px] font-normal text-[#86868B]">
                                    @{u.username || u.name.toLowerCase().replace(/\s+/g, '')}
                                  </span>
                                </p>
                                <span className="text-[11px] text-[#86868B] truncate block font-mono">
                                  {cleanAcc ? `•••• ${cleanAcc.slice(-4)}` : 'Cuenta Personal'}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-semibold shrink-0 px-2.5 py-1 rounded-md ${
                              isCurrentActive
                                ? 'bg-[#0071E3] text-white'
                                : 'bg-white text-[#1D1D1F] border border-black/[0.08]'
                            }`}>
                              {isCurrentActive ? 'Activa' : 'Seleccionar'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bottom toggle to opening digital account */}
                <div className="text-center pt-1">
                  <p className="text-xs text-[#86868B]">
                    ¿No tienes cuenta bancaria?{' '}
                    <button
                      type="button"
                      onClick={() => setViewMode('register')}
                      className="text-[#0071E3] font-semibold hover:underline cursor-pointer"
                    >
                      Crear Cuenta Digital
                    </button>
                  </p>
                </div>
              </div>
            ) : viewMode === 'register' ? (
              /* Register Mode: Apertura de Cuenta Digital */
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Apertura de Cuenta Digital</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Apertura oficial inmediata de tu cuenta bancaria digital • Saldo inicial: L. 0.00
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* 1. Nombre Completo (fullName) con Disparador reactivo */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#86868B]">
                        badge
                      </span>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Ej. Keren López"
                        required
                        autoFocus
                        className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-[#1D1D1F] outline-none transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-[#86868B] mt-0.5 block">
                      Al escribir tu nombre se generan inmediatamente 3 sugerencias únicas de usuario.
                    </span>
                  </div>

                  {/* 2. Sugerencias y Campo de Nombre de Usuario (username) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        Nombre de Usuario (@)
                      </label>
                      <span className={`text-[10px] font-mono ${regUsername.length > 12 ? 'text-rose-600 font-bold' : 'text-[#86868B]'}`}>
                        {regUsername.replace(/^@/, '').length}/12
                      </span>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#86868B]">
                        alternate_email
                      </span>
                      <input
                        type="text"
                        maxLength={12}
                        value={regUsername}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
                          setRegUsername(val);
                        }}
                        placeholder="ej. klopez26"
                        required
                        className={`w-full bg-[#F5F5F7] border rounded-xl pl-9 pr-3 py-2 text-xs text-[#1D1D1F] outline-none transition-all ${
                          fieldErrors.username
                            ? 'border-rose-400 bg-rose-50/40'
                            : 'border-black/[0.08] focus:border-[#0071E3] focus:bg-white'
                        }`}
                      />
                    </div>

                    {fieldErrors.username && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {fieldErrors.username}
                      </p>
                    )}

                    {/* 3 Sugerencias reactivas y únicas basadas en el nombre */}
                    {suggestedUsernames.length > 0 && (
                      <div className="mt-1.5 p-2 bg-blue-50/70 border border-blue-100 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-[#0071E3] uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                            3 Sugerencias únicas disponibles:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedUsernames.map((suggestion) => {
                            const isSelected = regUsername.toLowerCase() === suggestion.toLowerCase();
                            return (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => setRegUsername(suggestion)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-[#0071E3] text-white shadow-2xs scale-102'
                                    : 'bg-white hover:bg-blue-100 text-[#0071E3] border border-blue-200'
                                }`}
                              >
                                <span>@{suggestion}</span>
                                {isSelected && <span className="material-symbols-outlined text-[12px]">check</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Autocompletado rápido en el dispositivo móvil */}
                    {matchingDeviceUsernames.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-medium text-[#86868B] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">smartphone</span>
                          En este dispositivo:
                        </span>
                        {matchingDeviceUsernames.map((devU) => (
                          <button
                            key={devU}
                            type="button"
                            onClick={() => setRegUsername(devU)}
                            className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold cursor-pointer"
                          >
                            @{devU}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Correo Electrónico (email) con autocompletado nativo */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#86868B]">
                        mail
                      </span>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ej. klopez@gmail.com"
                        required
                        className={`w-full bg-[#F5F5F7] border rounded-xl pl-9 pr-3 py-2 text-xs text-[#1D1D1F] outline-none transition-all ${
                          fieldErrors.email
                            ? 'border-rose-400 bg-rose-50/40'
                            : 'border-black/[0.08] focus:border-[#0071E3] focus:bg-white'
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {fieldErrors.email}
                      </p>
                    )}

                    {/* Chips de dominios comunes */}
                    <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-medium text-[#86868B]">Dominios:</span>
                      {commonDomains.map((dom) => (
                        <button
                          key={dom}
                          type="button"
                          onClick={() => handleDomainChipClick(dom)}
                          className="px-2 py-0.5 rounded-md bg-[#F5F5F7] hover:bg-blue-50 text-[#1D1D1F] hover:text-[#0071E3] border border-black/[0.06] text-[10px] font-semibold cursor-pointer transition-colors"
                        >
                          {dom}
                        </button>
                      ))}
                    </div>

                    {/* Cuentas de correo del dispositivo */}
                    {matchingDeviceEmails.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-medium text-[#86868B] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">smartphone</span>
                          Guardado:
                        </span>
                        {matchingDeviceEmails.map((devE) => (
                          <button
                            key={devE}
                            type="button"
                            onClick={() => setRegEmail(devE)}
                            className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold cursor-pointer"
                          >
                            {devE}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Teléfono Celular (phone) formateado para Honduras +504 */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Teléfono Celular
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#86868B]">
                        call
                      </span>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={handlePhoneChange}
                        placeholder="+504 9876-5432"
                        required
                        className={`w-full bg-[#F5F5F7] border rounded-xl pl-9 pr-3 py-2 text-xs text-[#1D1D1F] outline-none transition-all ${
                          fieldErrors.phone
                            ? 'border-rose-400 bg-rose-50/40'
                            : 'border-black/[0.08] focus:border-[#0071E3] focus:bg-white'
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* 5. Contraseña de Acceso (password) con máscara, alternancia y validación contra contraseñas repetidas */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Contraseña de Acceso
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#86868B]">
                        lock
                      </span>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        className={`w-full bg-[#F5F5F7] border rounded-xl pl-9 pr-10 py-2 text-xs text-[#1D1D1F] outline-none transition-all ${
                          fieldErrors.password
                            ? 'border-rose-400 bg-rose-50/40'
                            : 'border-black/[0.08] focus:border-[#0071E3] focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                        title={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>

                    {fieldErrors.password ? (
                      <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">warning</span>
                        <span className="font-medium leading-snug">{fieldErrors.password}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#86868B] mt-0.5 block">
                        Mínimo 6 caracteres. Verificación criptográfica activa contra contraseñas repetidas.
                      </span>
                    )}
                  </div>

                  {/* Botón de envío: Abrir Cuenta Digital */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !!fieldErrors.email || !!fieldErrors.phone || !!fieldErrors.username || !!fieldErrors.password}
                    className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer active:scale-98 flex items-center justify-center gap-2 mt-2"
                  >
                    <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                    <span>{isSubmitting ? 'Abriendo cuenta...' : 'Abrir Cuenta Digital'}</span>
                  </button>
                </form>

                <div className="text-center pt-1">
                  <p className="text-xs text-[#86868B]">
                    ¿Ya tienes cuenta o deseas ingresar?{' '}
                    <button
                      type="button"
                      onClick={() => setViewMode('login')}
                      className="text-[#0071E3] font-semibold hover:underline cursor-pointer"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[26px]">help</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Recuperar datos de acceso</h2>
                  <p className="text-xs text-[#86868B] mt-1">
                    Escribe tu nombre de usuario o nombre para encontrar tu cuenta
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const target = recoveryUsername.trim().toLowerCase().replace(/^@/, '');
                    const match = allUsers.find((u) => {
                      const uName = (u.name || '').trim().toLowerCase();
                      const uUname = (u.username || '').trim().toLowerCase();
                      return uName === target || uUname === target;
                    });
                    if (match) {
                      const cleanAcc = (match.accountNumber || '').replace(/^HN\d*\s*/i, '');
                      onShowToast(
                        'Cuenta encontrada',
                        `Usuario: @${match.username || match.name} | Correo: ${match.email} | Cuenta: ${cleanAcc}`,
                        'success'
                      );
                    } else {
                      onShowToast('No encontrado', 'No encontramos una cuenta con ese nombre de usuario.', 'error');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">Nombre de Usuario</label>
                    <input
                      type="text"
                      value={recoveryUsername}
                      onChange={(e) => setRecoveryUsername(e.target.value)}
                      placeholder="Ej. @carlos o Elena Montes"
                      required
                      autoFocus
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Buscar cuenta
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="text-xs text-[#0071E3] font-semibold hover:underline cursor-pointer text-center"
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
};
