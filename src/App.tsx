import React, { useState, useEffect, useCallback } from 'react';
import {
  ScreenType,
  Transaction,
  UserProfile,
  AdminUser,
  ToastMessage,
  AdminCreditLog,
  PlanTier,
  CardTheme,
  SystemSettings,
  PlanConfig,
  CardThemeRequest,
  UserCard,
} from './types';
import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_ADMIN_USERS,
  INITIAL_SYSTEM_SETTINGS,
  DEFAULT_PLANS,
  INITIAL_THEME_REQUESTS,
} from './data/initialData';
import { TopNavBar, SideNavBar } from './components/Navigation';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { TransfersView } from './components/TransfersView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';
import { PlanModal } from './components/PlanModal';
import { CardQrPassModal } from './components/CardQrPassModal';
import { CardThemeRequestModal } from './components/CardThemeRequestModal';
import { AuthModal } from './components/AuthModal';
import { SecurityAutoLockModal } from './components/SecurityAutoLockModal';
import { FaceEnrollmentModal } from './components/FaceEnrollmentModal';
import { getEnrolledFace } from './lib/faceBiometrics';
import { formatLempiras } from './lib/currency';
import {
  subscribeToUsers,
  subscribeToTransactions,
  subscribeToSystemSettings,
  updateSystemSettingsInFirestore,
  registerAccountInFirestore,
  executeRealtimeTransfer,
  seedInitialFirestoreDataIfEmpty,
  executeDeposit,
  executeWithdraw,
} from './lib/firebaseDb';
import { supabaseDb } from './lib/supabase';
import {
  DepositModal,
  WithdrawModal,
  MortgageCalculatorModal,
  CardDetailsModal,
  WealthAdvisorModal,
  TransactionDetailModal,
  ToastContainer,
} from './components/Modals';

// Helper to determine initial screen from browser URL
const getScreenFromPath = (): ScreenType => {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/admin/panel/nova') || path.includes('/admin')) {
    return 'admin';
  }
  if (path.includes('/dashboard')) return 'dashboard';
  if (path.includes('/transfers')) return 'transfers';
  if (path.includes('/history')) return 'history';
  if (path.includes('/profile')) return 'profile';
  
  // If at root or landing, check if user is already logged in
  try {
    const isAuth = localStorage.getItem('bancanova_authenticated');
    const savedUser = localStorage.getItem('bancanova_user');
    if (isAuth === 'true' || (isAuth !== 'false' && savedUser && JSON.parse(savedUser).name !== 'Invitado')) {
      return 'dashboard';
    }
  } catch {
    // fallback
  }
  return 'landing';
};

export default function App() {
  // Screen state synchronized with URL path
  const [currentScreen, setCurrentScreenState] = useState<ScreenType>(getScreenFromPath);
  const [activeLandingTab, setActiveLandingTab] = useState<'personal' | 'business'>('personal');

  // Application data states with local persistence
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bancanova_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  // Real banking session security (Estilo BAC Credomatic):
  // Active session exists ONLY while the user is actively inside the session (sessionStorage).
  // When closing tab, exiting, or upon fresh entrance, user must register/authenticate.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const activeSession = sessionStorage.getItem('bancanova_active_session');
      return activeSession === 'true';
    } catch {
      return false;
    }
  });

  const [wasAutoLoggedOut, setWasAutoLoggedOut] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bancanova_auto_exit') === 'true';
    } catch {
      return false;
    }
  });

  const [isPrivacyShieldActive, setIsPrivacyShieldActive] = useState<boolean>(false);

  const [balance, setBalance] = useState<number>(() => {
    // Ensure initial balance starts at 0 unless updated by Firestore/transfers
    const zeroMigrated = localStorage.getItem('bancanova_balance_reset_zero_v4');
    if (!zeroMigrated) {
      localStorage.setItem('bancanova_balance_reset_zero_v4', 'true');
      localStorage.setItem('bancanova_balance', '0');
      return 0.0;
    }
    const saved = localStorage.getItem('bancanova_balance');
    return saved !== null ? parseFloat(saved) : 0.0;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bancanova_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('bancanova_admin_users');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('bancanova_system_settings');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
  });

  const [creditLogs, setCreditLogs] = useState<AdminCreditLog[]>(() => {
    const saved = localStorage.getItem('bancanova_credit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Card theme requests queue (User request -> Admin approval)
  const [themeRequests, setThemeRequests] = useState<CardThemeRequest[]>(() => {
    const saved = localStorage.getItem('bancanova_theme_requests');
    return saved ? JSON.parse(saved) : INITIAL_THEME_REQUESTS;
  });

  // Modal states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMortgageOpen, setIsMortgageOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isWealthAdvisorOpen, setIsWealthAdvisorOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isThemeRequestModalOpen, setIsThemeRequestModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFaceEnrollmentOpen, setIsFaceEnrollmentOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register' | 'directory'>('login');
  const [isSecurityLocked, setIsSecurityLocked] = useState(false);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(() => Date.now());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Navigation wrapper that keeps browser URL path synchronized
  const setCurrentScreen = useCallback((screen: ScreenType) => {
    setCurrentScreenState(screen);
    const targetPath = screen === 'admin' 
      ? '/admin/panel/nova' 
      : screen === 'landing' 
        ? '/' 
        : `/${screen}`;
    
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ screen }, '', targetPath);
    }
  }, []);

  // Open Auth Modal handler
  const handleOpenAuthModal = (tab: 'login' | 'register' = 'register') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  // Listen to browser popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentScreenState(getScreenFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bancanova_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bancanova_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('bancanova_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bancanova_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem('bancanova_system_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    localStorage.setItem('bancanova_credit_logs', JSON.stringify(creditLogs));
  }, [creditLogs]);

  useEffect(() => {
    localStorage.setItem('bancanova_theme_requests', JSON.stringify(themeRequests));
  }, [themeRequests]);

  // 1-minute auto-lock tracker (Seguridad Bancaria CNBS Honduras)
  useEffect(() => {
    if (!isAuthenticated || isSecurityLocked || currentScreen === 'landing') {
      return;
    }

    const handleUserActivity = () => {
      setLastActiveTimestamp(Date.now());
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'click',
      'wheel',
    ];

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const throttledHandler = () => {
      if (!throttleTimer) {
        handleUserActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 1000);
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, throttledHandler, { passive: true }));

    const checkInterval = setInterval(() => {
      const elapsedMs = Date.now() - lastActiveTimestamp;
      if (elapsedMs >= 60000) { // Exactly 1 minute (60 seconds) without using account
        setIsSecurityLocked(true);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, throttledHandler));
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, isSecurityLocked, lastActiveTimestamp, currentScreen]);

  // BAC Credomatic Style Security: Auto-logout immediately upon exiting the app, closing the tab, or switching apps
  useEffect(() => {
    const handleExitApp = () => {
      setIsPrivacyShieldActive(true);
      if (isAuthenticated) {
        sessionStorage.removeItem('bancanova_active_session');
        sessionStorage.setItem('bancanova_auto_exit', 'true');
        setIsAuthenticated(false);
        setWasAutoLoggedOut(true);
        setAuthModalInitialTab('login');
        setIsSecurityLocked(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched to another app on mobile (Android/iPhone) or minimized browser
        handleExitApp();
      } else if (document.visibilityState === 'visible') {
        // Returned to app
        setIsPrivacyShieldActive(false);
        const wasAutoExit = sessionStorage.getItem('bancanova_auto_exit');
        if (wasAutoExit === 'true') {
          setWasAutoLoggedOut(true);
          showToast(
            'Sesión de validación por seguridad',
            '',
            'info'
          );
        }
      }
    };

    const handleWindowBlur = () => {
      // Show privacy shield when app loses focus (e.g. app switcher preview on mobile)
      setIsPrivacyShieldActive(true);
    };

    const handleWindowFocus = () => {
      setIsPrivacyShieldActive(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleExitApp);
    window.addEventListener('beforeunload', handleExitApp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleExitApp);
      window.removeEventListener('beforeunload', handleExitApp);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated]);

  // Realtime Cloud Firestore Database Sync across all connected devices & computers
  useEffect(() => {
    // Seed initial data if Firestore is fresh
    seedInitialFirestoreDataIfEmpty().catch((err) => console.warn('Firestore seed note:', err));

    // Subscribe to all bank accounts in Firestore
    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setAdminUsers(cloudUsers);
        // Find current active user
        const currentInCloud = cloudUsers.find(
          (u) =>
            (user.email && u.email?.toLowerCase() === user.email?.toLowerCase()) ||
            u.accountNumber === user.accountNumber ||
            u.id === user.id
        );
        if (currentInCloud) {
          if (currentInCloud.balance !== undefined) {
            setBalance(currentInCloud.balance);
          }
          if (currentInCloud.role) {
            setUser((prev) => ({
              ...prev,
              plan: currentInCloud.role as PlanTier,
              cardTheme: currentInCloud.cardTheme || prev.cardTheme,
            }));
          }
        }
      }
    });

    // Subscribe to all transactions in Firestore
    const unsubTx = subscribeToTransactions((cloudTx) => {
      if (cloudTx && cloudTx.length > 0) {
        setTransactions(cloudTx);
      }
    });

    // Subscribe to system settings in Firestore
    const unsubSettings = subscribeToSystemSettings((cloudSettings) => {
      if (cloudSettings) {
        setSystemSettings(cloudSettings);
        if (cloudSettings.branding) {
          try {
            window.dispatchEvent(
              new CustomEvent('bancanova_branding_changed', { detail: cloudSettings.branding })
            );
            if (cloudSettings.branding.companyName) {
              document.title = `${cloudSettings.branding.companyName} | Banca Privada Digital`;
            }
          } catch {}
        }
      }
    });

    // Query Supabase for profiles so they are the primary source of truth in admin panel and user directories
    supabaseDb
      .getProfiles()
      .then((supaUsers) => {
        if (supaUsers && supaUsers.length > 0) {
          setAdminUsers(supaUsers);
        }
      })
      .catch((err) => console.warn('Supabase initial users load note:', err));

    // Query Supabase for transactions
    supabaseDb
      .getTransactions()
      .then((supaTx) => {
        if (supaTx && supaTx.length > 0) {
          setTransactions(supaTx);
        }
      })
      .catch((err) => console.warn('Supabase initial transactions load note:', err));

    return () => {
      unsubUsers();
      unsubTx();
      unsubSettings();
    };
  }, [user.email, user.accountNumber, user.id]);

  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // User selects a Plan: automatically updates the card theme and settings
  const handleSelectPlan = (newPlan: PlanTier) => {
    const targetTheme: CardTheme =
      newPlan === 'Black' ? 'obsidian' : newPlan === 'Business' ? 'gold' : 'sapphire';

    const planData = systemSettings.plans[newPlan] || DEFAULT_PLANS[newPlan];

    setUser((prev) => ({
      ...prev,
      plan: newPlan,
      cardTheme: targetTheme,
      accountType: `${newPlan} Private Wealth`,
    }));

    // Update in admin list as well
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (
          u.email.toLowerCase() === user.email.toLowerCase() ||
          u.name.toLowerCase() === user.name.toLowerCase()
        ) {
          return {
            ...u,
            role: newPlan,
            cardTheme: targetTheme,
          };
        }
        return u;
      })
    );

    // Sync to Supabase
    supabaseDb
      .updateUserAdmin(user.id, { role: newPlan, cardTheme: targetTheme })
      .catch((err) => console.warn(err));

    showToast(
      'Plan Actualizado',
      `Has cambiado al ${planData.name}. Tu tarjeta física y digital ha sido actualizada al acabado ${targetTheme.toUpperCase()}.`,
      'success'
    );
  };

  // Auth and Session Handlers
  const handleLogin = (userProfile: UserProfile, newBalance: number) => {
    const existingFace =
      userProfile.enrolledFaceUrl || getEnrolledFace(userProfile.id || userProfile.email);
    const updatedProfile: UserProfile = {
      ...userProfile,
      enrolledFaceUrl: existingFace || undefined,
    };

    setUser(updatedProfile);
    setBalance(newBalance);
    setIsAuthenticated(true);
    setIsSecurityLocked(false);
    setLastActiveTimestamp(Date.now());
    setWasAutoLoggedOut(false);
    sessionStorage.setItem('bancanova_active_session', 'true');
    sessionStorage.removeItem('bancanova_auto_exit');
    localStorage.setItem('bancanova_user', JSON.stringify(updatedProfile));
    localStorage.setItem('bancanova_balance', newBalance.toString());
    localStorage.setItem('bancanova_authenticated', 'true');
    setIsAuthModalOpen(false);
    setCurrentScreen('dashboard');

    showToast('Bienvenido a Banca Nova', `Has iniciado sesión como ${userProfile.name}.`, 'success');
  };

  const handleRegister = async (data: {
    name: string;
    lastName?: string;
    username: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    plan?: PlanTier;
  }) => {
    try {
      const startingBal = 0.0;
      const newProfile = await registerAccountInFirestore(data);

      // Direct, explicit, awaited call to guarantee persistence in Supabase
      try {
        await supabaseDb.registerUserInSupabase(newProfile, startingBal, data.password);
      } catch (supaErr) {
        console.warn('Direct Supabase registration call:', supaErr);
      }

      setUser(newProfile);
      setBalance(startingBal);
      setIsAuthenticated(true);
      setWasAutoLoggedOut(false);
      sessionStorage.setItem('bancanova_active_session', 'true');
      sessionStorage.removeItem('bancanova_auto_exit');
      setLastActiveTimestamp(Date.now());
      localStorage.setItem('bancanova_user', JSON.stringify(newProfile));
      localStorage.setItem('bancanova_balance', startingBal.toString());
      localStorage.setItem('bancanova_authenticated', 'true');
      setIsAuthModalOpen(false);
      setCurrentScreen('dashboard');

      showToast(
        'Cuenta Creada con Éxito',
        `¡Bienvenido a Banca Nova Honduras, ${newProfile.name}! Tu cuenta digital está activa con saldo inicial de L. 0.00.`,
        'success'
      );
    } catch (err: any) {
      console.warn('Register error:', err);
      showToast('Error al Registrar', err.message || 'No se pudo crear la cuenta.', 'error');
      throw err;
    }
  };

  const handleGuestAccess = async () => {
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const guestProfile: UserProfile = {
      id: `guest-${Date.now()}`,
      name: `Usuario Express ${guestNumber}`,
      email: `express${guestNumber}@bancanova.hn`,
      phone: '+504 9900-1122',
      address: 'San Pedro Sula, Honduras',
      accountNumber: `0182 9901 ${guestNumber} 0000`,
      cardLast4: guestNumber.toString(),
      accountType: 'Cuenta Express Honduras',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
      pushNotifications: true,
      weeklySummary: true,
      plan: 'Personal',
      cardTheme: 'sapphire',
      authorizedThemes: ['sapphire', 'obsidian', 'gold'],
      canChangeCardThemeFreely: true,
      isCardFrozen: false,
      cardDailyLimit: 50000,
      cardContactless: true,
      cardOnlineShopping: true,
      cardAtmWithdrawals: true,
      cvv: '888',
      expiryDate: '09/29',
      activeCardId: 'card-express',
      cards: [
        {
          id: 'card-express',
          name: 'Tarjeta Débito Express',
          cardHolderName: `USUARIO EXPRESS ${guestNumber}`,
          cardNumber: `•••• •••• •••• ${guestNumber}`,
          cardLast4: guestNumber.toString(),
          theme: 'sapphire',
          type: 'Virtual Express',
          expiryDate: '09/29',
          cvv: '888',
          dailyLimit: 50000,
          isFrozen: false,
          isDefault: true,
        },
      ],
    };

    setUser(guestProfile);
    setBalance(0);
    setIsAuthenticated(true);
    localStorage.setItem('bancanova_user', JSON.stringify(guestProfile));
    localStorage.setItem('bancanova_balance', '0');
    localStorage.setItem('bancanova_authenticated', 'true');
    setIsAuthModalOpen(false);
    setCurrentScreen('dashboard');
    showToast('Acceso Rápido', `Has ingresado con la Cuenta Express ${guestNumber} (Saldo inicial: L. 0.00).`, 'info');
  };

  const handleLogout = () => {
    const blankUser: UserProfile = {
      id: `guest-${Date.now()}`,
      name: 'Invitado',
      email: 'invitado@bancanova.hn',
      phone: '+504 9900-0000',
      address: 'Tegucigalpa, Honduras',
      accountNumber: 'HN00 0000 0000 0000 0000',
      cardLast4: '0000',
      accountType: 'Sin Sesión Activa',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
      pushNotifications: false,
      weeklySummary: false,
      plan: 'Personal',
      cardTheme: 'sapphire',
      authorizedThemes: ['sapphire', 'obsidian'],
      canChangeCardThemeFreely: false,
      isCardFrozen: false,
      cardDailyLimit: 0,
      cardContactless: false,
      cardOnlineShopping: false,
      cardAtmWithdrawals: false,
      cvv: '000',
      expiryDate: '01/30',
      activeCardId: 'card-none',
      cards: [],
    };

    setUser(blankUser);
    setBalance(0);
    setIsAuthenticated(false);
    setWasAutoLoggedOut(false);
    sessionStorage.removeItem('bancanova_active_session');
    sessionStorage.removeItem('bancanova_auto_exit');
    localStorage.removeItem('bancanova_user');
    localStorage.removeItem('bancanova_balance');
    localStorage.setItem('bancanova_authenticated', 'false');
    showToast('Sesión Cerrada', 'Has cerrado tu sesión de forma segura. Puedes registrarte o ingresar cuando desees.', 'info');
    setCurrentScreen('landing');
    setAuthModalInitialTab('register');
    setIsAuthModalOpen(true);
  };

  const handleFaceEnrollmentComplete = (faceDataUrl: string) => {
    const updatedUser: UserProfile = {
      ...user,
      enrolledFaceUrl: faceDataUrl,
      faceEnrolledAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    localStorage.setItem('bancanova_user', JSON.stringify(updatedUser));
    setIsFaceEnrollmentOpen(false);
  };

  // Business logic actions with Cloud Firestore Realtime Execution
  const handleExecuteTransfer = async (destination: string, amount: number, concept: string) => {
    if (balance <= 0 || amount > balance) {
      showToast('Saldo Insuficiente', 'No puedes hacer transferencias porque no tienes saldo disponible.', 'error');
      return;
    }
    try {
      const result = await executeRealtimeTransfer({
        senderId: user.id,
        senderName: user.name,
        senderAccountNumber: user.accountNumber,
        destinationAccount: destination,
        amount,
        concept,
      });

      if (result.success) {
        setBalance((prev) => Math.max(0, prev - amount));
        showToast(
          'Transferencia Exitosa',
          `Has transferido ${formatLempiras(amount)} a ${result.receiverName || destination}. Fondos acreditados en tiempo real.`
        );
      } else {
        // Local Fallback
        const newBalance = balance - amount;
        setBalance(newBalance);

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;
        const dateStr = `Hoy, ${timeStr}`;

        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          title: `Transferencia a ${destination.split(' ')[0]}`,
          subtitle: `${dateStr} • Transferencia Directa`,
          amount: -amount,
          type: 'transfer',
          status: 'completed',
          date: dateStr,
          timestamp: Date.now(),
          categoryIcon: 'send',
          category: 'Transferencia',
          destinationAccount: destination,
          concept,
        };

        setTransactions((prev) => [newTx, ...prev]);
        showToast(
          'Transferencia Exitosa',
          `Has transferido ${formatLempiras(amount)} a ${destination}. Nuevo saldo: ${formatLempiras(newBalance)}`
        );
      }
    } catch (err: any) {
      console.warn('Transfer error:', err);
      showToast('Error en Transferencia', err.message || 'No se pudo procesar la transferencia.', 'error');
    }
  };

  const handleDeposit = async (amount: number, origin: string) => {
    const newBalance = balance + amount;
    setBalance(newBalance);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const dateStr = `Hoy, ${timeStr}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: origin,
      subtitle: `${dateStr} • Depósito en Lempiras`,
      amount: amount,
      type: 'deposit',
      status: 'completed',
      date: dateStr,
      timestamp: Date.now(),
      categoryIcon: 'payments',
      category: 'Depósito',
    };

    setTransactions((prev) => [newTx, ...prev]);
    executeDeposit(user.id, amount, origin).catch((err) => console.warn('Deposit cloud note:', err));

    showToast(
      'Depósito Confirmado',
      `Se han acreditado ${formatLempiras(amount)} a tu cuenta con éxito.`
    );
  };

  const handleWithdraw = async (amount: number, reason: string) => {
    if (balance <= 0 || amount > balance) {
      showToast('Saldo Insuficiente', 'No puedes retirar fondos porque no tienes saldo disponible.', 'error');
      return;
    }
    const newBalance = balance - amount;
    setBalance(newBalance);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const dateStr = `Hoy, ${timeStr}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: reason,
      subtitle: `${dateStr} • Retiro en Efectivo`,
      amount: -amount,
      type: 'withdrawal',
      status: 'completed',
      date: dateStr,
      timestamp: Date.now(),
      categoryIcon: 'atm',
      category: 'Retiro',
    };

    setTransactions((prev) => [newTx, ...prev]);
    executeWithdraw(user.id, amount, reason).catch((err) => console.warn('Withdraw cloud note:', err));

    showToast(
      'Retiro Procesado',
      `Se han debitado ${formatLempiras(amount)} de tu cuenta disponible.`
    );
  };

  const handleSimulateQrPayment = (amount: number, merchant: string) => {
    if (amount <= 0 || amount > balance || balance <= 0) {
      showToast('Saldo Insuficiente', 'No puedes hacer pagos porque no tienes saldo disponible.', 'error');
      return;
    }
    const newBalance = balance - amount;
    setBalance(newBalance);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const dateStr = `Hoy, ${timeStr}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: merchant || 'Operación Pase QR Contactless',
      subtitle: `${dateStr} • Token Criptográfico **${user.cardLast4} `,
      amount: -amount,
      type: 'withdrawal',
      status: 'completed',
      date: dateStr,
      timestamp: Date.now(),
      categoryIcon: 'qr_code_2',
      category: 'Pago QR',
      userId: user.id,
      userName: user.name,
    };

    setTransactions((prev) => [newTx, ...prev]);
    supabaseDb.insertTransaction(newTx).catch((err) => console.warn('Supabase tx sync note:', err));

    showToast(
      'Operación QR Exitosa',
      `Se procesó la transacción de $${amount.toFixed(2)} en ${merchant}.`,
      'success'
    );
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const merged = { ...prev, ...updated };
      return merged;
    });

    setAdminUsers((prev) =>
      prev.map((u) => {
        if (
          u.id === user.id ||
          u.email.toLowerCase() === user.email.toLowerCase() ||
          u.name.toLowerCase() === user.name.toLowerCase()
        ) {
          return {
            ...u,
            name: updated.name || u.name,
            avatar: updated.avatarUrl || u.avatar,
          };
        }
        return u;
      })
    );
  };

  // ADMIN: Toggle User Status
  const handleToggleUserStatus = (userId: string) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Activo' ? 'Bloqueado' : 'Activo';
          showToast(
            'Estado de Usuario',
            `${u.name} ha sido ${nextStatus === 'Activo' ? 'activado' : 'bloqueado'}.`,
            nextStatus === 'Activo' ? 'success' : 'info'
          );
          supabaseDb.updateUserAdmin(userId, { status: nextStatus }).catch((err) => console.warn(err));
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // ADMIN: Toggle User Card Frozen State
  const handleToggleUserCardLock = (userId: string) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextFrozen = !u.isCardFrozen;
          showToast(
            'Seguridad de Tarjeta',
            `Tarjeta de ${u.name} ${nextFrozen ? 'congelada temporalmente' : 'desbloqueada'}.`,
            nextFrozen ? 'info' : 'success'
          );
          if (
            u.email.toLowerCase() === user.email.toLowerCase() ||
            u.name.toLowerCase() === user.name.toLowerCase()
          ) {
            setUser((curr) => ({ ...curr, isCardFrozen: nextFrozen }));
          }
          supabaseDb.updateUserAdmin(userId, { isCardFrozen: nextFrozen }).catch((err) => console.warn(err));
          return { ...u, isCardFrozen: nextFrozen };
        }
        return u;
      })
    );
  };

  // ADMIN: Update Card Theme for a User (Admin color control)
  const handleUpdateUserTheme = (userId: string, theme: CardTheme) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          if (
            u.email.toLowerCase() === user.email.toLowerCase() ||
            u.name.toLowerCase() === user.name.toLowerCase()
          ) {
            setUser((curr) => ({ ...curr, cardTheme: theme }));
          }
          supabaseDb.updateUserAdmin(userId, { cardTheme: theme }).catch((err) => console.warn(err));
          return { ...u, cardTheme: theme };
        }
        return u;
      })
    );
  };

  // ADMIN: Update User Full Details
  const handleUpdateUserFull = (userId: string, updatedData: Partial<AdminUser>) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const merged = { ...u, ...updatedData };
          if (
            u.email.toLowerCase() === user.email.toLowerCase() ||
            u.name.toLowerCase() === user.name.toLowerCase()
          ) {
            if (updatedData.balance !== undefined) setBalance(updatedData.balance);
            if (updatedData.name) setUser((curr) => ({ ...curr, name: updatedData.name! }));
            if (updatedData.role) setUser((curr) => ({ ...curr, plan: updatedData.role! }));
            if (updatedData.cardTheme) setUser((curr) => ({ ...curr, cardTheme: updatedData.cardTheme! }));
            if (updatedData.isCardFrozen !== undefined)
              setUser((curr) => ({ ...curr, isCardFrozen: updatedData.isCardFrozen! }));
          }
          supabaseDb.updateUserAdmin(userId, updatedData).catch((err) => console.warn(err));
          return merged;
        }
        return u;
      })
    );
  };

  // ADMIN: Add credit to any user
  const handleAddCredit = (
    userId: string,
    amount: number,
    concept: string,
    note?: string
  ) => {
    const targetUser = adminUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const updatedBalance = Math.max(0, (targetUser.balance || 0) + amount);

    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, balance: updatedBalance };
        }
        return u;
      })
    );

    supabaseDb.updateUserAdmin(userId, { balance: updatedBalance }).catch((err) => console.warn(err));

    if (
      targetUser.email.toLowerCase() === user.email.toLowerCase() ||
      targetUser.name.toLowerCase() === user.name.toLowerCase()
    ) {
      setBalance((prev) => Math.max(0, prev + amount));

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      const dateStr = `Hoy, ${timeStr}`;

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        title: concept || (amount >= 0 ? 'Crédito Administrativo' : 'Ajuste Contable'),
        subtitle: `${dateStr} • Operación Admin`,
        amount: amount,
        type: amount >= 0 ? 'deposit' : 'withdrawal',
        status: 'completed',
        date: dateStr,
        timestamp: Date.now(),
        categoryIcon: 'admin_panel_settings',
        category: 'Crédito Admin',
      };
      setTransactions((prev) => [newTx, ...prev]);
      supabaseDb.insertTransaction(newTx).catch((err) => console.warn(err));
    }

    const now = new Date();
    const dateFormatted = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newLog: AdminCreditLog = {
      id: `log-${Date.now()}`,
      userId,
      userName: targetUser.name,
      amount,
      concept: concept || 'Acreditación administrativa',
      date: dateFormatted,
      timestamp: Date.now(),
      type: amount >= 0 ? 'credit' : 'debit',
      adminNote: note,
    };

    setCreditLogs((prev) => [newLog, ...prev]);
    supabaseDb.insertCreditLog(newLog).catch((err) => console.warn(err));

    showToast(
      amount >= 0 ? 'Créditos Concedidos' : 'Ajuste Realizado',
      `${amount >= 0 ? 'Se asignaron' : 'Se dedujeron'} $${Math.abs(amount).toFixed(2)} para ${targetUser.name}.`,
      amount >= 0 ? 'success' : 'info'
    );
  };

  // ADMIN: Create new user
  const handleCreateUser = (newUser: Omit<AdminUser, 'id'>) => {
    const id = `usr-${Date.now()}`;
    const userWithId: AdminUser = { id, ...newUser };
    setAdminUsers((prev) => [userWithId, ...prev]);
    supabaseDb
      .registerUserInSupabase(userWithId, userWithId.balance, userWithId.password)
      .then(() => showToast('Usuario en Supabase', `${newUser.name} registrado en la base de datos Supabase.`, 'success'))
      .catch((err) => console.warn(err));
  };

  // ADMIN: Delete user
  const handleDeleteUser = (userId: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== userId));
    supabaseDb.deleteProfile(userId).catch((err) => console.warn(err));
    showToast('Usuario Eliminado', 'El expediente de usuario ha sido removido.', 'info');
  };

  // ADMIN: Update Transaction Status
  const handleUpdateTransactionStatus = (
    txId: string,
    newStatus: 'completed' | 'pending' | 'cancelled'
  ) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === txId ? { ...tx, status: newStatus } : tx))
    );
    supabaseDb.updateTransactionStatus(txId, newStatus).catch((err) => console.warn(err));
    showToast('Transacción Modificada', `El estado de la transacción cambió a ${newStatus}.`, 'info');
  };

  // ADMIN: Create Manual Transaction
  const handleCreateManualTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const id = `tx-${Date.now()}`;
    const fullTx: Transaction = { id, ...newTxData };
    setTransactions((prev) => [fullTx, ...prev]);
    supabaseDb.insertTransaction(fullTx).catch((err) => console.warn(err));
  };

  // ADMIN: Delete Transaction
  const handleDeleteTransaction = (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    supabaseDb.deleteTransaction(txId).catch((err) => console.warn(err));
    showToast('Transacción Eliminada', 'Movimiento eliminado del registro contable.', 'info');
  };

  // ADMIN: Update System Settings (Vault, Rates, Notices, Branding)
  const handleUpdateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('bancanova_system_settings', JSON.stringify(merged));
        if (merged.branding) {
          window.dispatchEvent(
            new CustomEvent('bancanova_branding_changed', { detail: merged.branding })
          );
          if (merged.branding.companyName) {
            document.title = `${merged.branding.companyName} | Banca Privada Digital`;
          }
        }
      } catch {}
      return merged;
    });

    try {
      await updateSystemSettingsInFirestore(newSettings);
      showToast('Configuración Actualizada', 'Los cambios se han sincronizado en tiempo real con todos los dispositivos.', 'success');
    } catch (err: any) {
      console.warn('Sync settings error:', err);
      showToast('Error al Sincronizar', 'No se pudo guardar en la nube de Firestore.', 'error');
    }
  };

  // ADMIN: Update Plan Configuration (Black VIP, Business, Personal)
  const handleUpdatePlanConfig = (planId: PlanTier, newConfig: Partial<PlanConfig>) => {
    setSystemSettings((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planId]: {
          ...prev.plans[planId],
          ...newConfig,
        },
      },
    }));
    showToast('Tarifa Actualizada', `Configuración del plan ${planId} guardada.`, 'success');
  };

  // THEME REQUESTS: User submits a request for changing card color/material
  const handleSubmitThemeRequest = (theme: CardTheme, reason: string) => {
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}`;
    const newReq: CardThemeRequest = {
      id: `tr-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPlan: user.plan || 'Black',
      currentTheme: user.cardTheme || 'obsidian',
      requestedTheme: theme,
      status: 'pending',
      requestDate: dateFormatted,
      timestamp: Date.now(),
      reason: reason || `Solicitud de acabado ${theme.toUpperCase()}`,
    };

    setThemeRequests((prev) => [newReq, ...prev]);
    showToast(
      'Solicitud Enviada',
      'Tu petición de cambio de acabado ha sido enviada al Administrador para revisión.',
      'success'
    );
  };

  // ADMIN: Approve Theme Request
  const handleApproveThemeRequest = (requestId: string, adminNote?: string) => {
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}`;
    let targetUserId = '';
    let targetTheme: CardTheme = 'obsidian';
    let targetUserName = '';

    setThemeRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          targetUserId = r.userId;
          targetTheme = r.requestedTheme;
          targetUserName = r.userName;
          return {
            ...r,
            status: 'approved' as const,
            adminResponseNote: adminNote || 'Aprobado y autorizado por el Administrador. Cambio gratis ilimitado concedido.',
            reviewedDate: dateFormatted,
          };
        }
        return r;
      })
    );

    if (targetUserId && targetTheme) {
      // Add to authorized themes and apply theme
      setAdminUsers((prev) =>
        prev.map((u) => {
          if (u.id === targetUserId) {
            const prevAuth = u.authorizedThemes || ['obsidian', 'gold'];
            const updatedAuth = prevAuth.includes(targetTheme) ? prevAuth : [...prevAuth, targetTheme];
            return { ...u, cardTheme: targetTheme, authorizedThemes: updatedAuth };
          }
          return u;
        })
      );

      const targetUser = adminUsers.find((u) => u.id === targetUserId);
      if (
        targetUserId === user.id ||
        (targetUser && targetUser.email.toLowerCase() === user.email.toLowerCase())
      ) {
        setUser((prev) => {
          const prevAuth = prev.authorizedThemes || ['obsidian', 'gold'];
          const updatedAuth = prevAuth.includes(targetTheme) ? prevAuth : [...prevAuth, targetTheme];
          return { ...prev, cardTheme: targetTheme, authorizedThemes: updatedAuth };
        });
      }

      showToast(
        'Solicitud Autorizada',
        `Se autorizó el acabado ${targetTheme.toUpperCase()} para ${targetUserName}. Ahora puede cambiar a él gratis cuando quiera.`,
        'success'
      );
    }
  };

  // ADMIN: Authorize single theme for user
  const handleAuthorizeUserTheme = (userId: string, theme: CardTheme) => {
    const targetUser = adminUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    const currentAuth = targetUser.authorizedThemes || ['obsidian', 'gold'];
    const newAuth = currentAuth.includes(theme)
      ? currentAuth.filter((t) => t !== theme)
      : [...currentAuth, theme];

    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, authorizedThemes: newAuth } : u))
    );

    if (targetUser.id === user.id || targetUser.email.toLowerCase() === user.email.toLowerCase()) {
      setUser((prev) => ({ ...prev, authorizedThemes: newAuth }));
    }

    showToast(
      'Permiso de Acabado Actualizado',
      `Acabado ${theme.toUpperCase()} ${newAuth.includes(theme) ? 'autorizado para cambio gratis' : 'bloqueado'}.`,
      'info'
    );
  };

  // ADMIN: Authorize ALL finishes for free switching
  const handleAuthorizeAllThemes = (userId: string) => {
    const allThemes: CardTheme[] = ['obsidian', 'gold', 'titanium', 'emerald', 'rose_gold', 'sapphire'];
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, authorizedThemes: allThemes, canChangeCardThemeFreely: true } : u))
    );

    const targetUser = adminUsers.find((u) => u.id === userId);
    if (targetUser && (targetUser.id === user.id || targetUser.email.toLowerCase() === user.email.toLowerCase())) {
      setUser((prev) => ({ ...prev, authorizedThemes: allThemes, canChangeCardThemeFreely: true }));
    }

    showToast(
      '¡Todos los Acabados Autorizados!',
      `El usuario ahora puede cambiar a cualquier tarjeta cuando quiera, 100% gratis.`,
      'success'
    );
  };

  // ADMIN: Reject Theme Request
  const handleRejectThemeRequest = (requestId: string, adminNote?: string) => {
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}`;

    setThemeRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected' as const,
              adminResponseNote: adminNote || 'Solicitud no autorizada por requisitos de plan.',
              reviewedDate: dateFormatted,
            }
          : r
      )
    );
  };

  // MULTI-CARD & AUTOMATIC THEME HANDLERS
  const handleSwitchCard = (cardId: string) => {
    const targetCard = user.cards?.find((c) => c.id === cardId);
    if (targetCard) {
      setUser((prev) => ({
        ...prev,
        activeCardId: targetCard.id,
        cardTheme: targetCard.theme,
        cardLast4: targetCard.cardLast4,
        cvv: targetCard.cvv,
        expiryDate: targetCard.expiryDate,
        cardDailyLimit: targetCard.dailyLimit,
        isCardFrozen: targetCard.isFrozen,
      }));
      showToast(
        'Tarjeta Activa Cambiada',
        `Ahora estás operando con: ${targetCard.name} (•••• ${targetCard.cardLast4}).`,
        'success'
      );
    }
  };

  const handleSelectCardTheme = (theme: CardTheme) => {
    const isAuthorized =
      user.canChangeCardThemeFreely ||
      (user.authorizedThemes && user.authorizedThemes.includes(theme)) ||
      theme === 'obsidian' ||
      theme === 'gold';

    if (!isAuthorized) {
      // Auto-submit authorization request or notify
      handleSubmitThemeRequest(
        theme,
        `Solicitud de autorización para acabado ${theme.toUpperCase()} (Cambio gratis permanente)`
      );
      showToast(
        'Autorización Requerida',
        `El acabado ${theme.toUpperCase()} requiere autorización del Administrador. Solicitud enviada.`,
        'info'
      );
      return;
    }

    setUser((prev) => {
      const activeId = prev.activeCardId || prev.cards?.[0]?.id;
      const updatedCards = (prev.cards || []).map((c) => {
        if (c.id === activeId) {
          return { ...c, theme };
        }
        return c;
      });
      return {
        ...prev,
        cardTheme: theme,
        cards: updatedCards.length > 0 ? updatedCards : prev.cards,
      };
    });

    // Synchronize user in admin directory
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id || u.email === user.email) {
          return { ...u, cardTheme: theme };
        }
        return u;
      })
    );

    showToast(
      'Acabado Actualizado al Instante',
      `Tu tarjeta cambió automáticamente a ${theme.toUpperCase()} (Cambio Gratis).`,
      'success'
    );
  };

  const handleAddNewCard = (newCardData: Partial<UserCard>) => {
    const randomLast4 = Math.floor(1000 + Math.random() * 9000).toString();
    const randomCvv = Math.floor(100 + Math.random() * 900).toString();
    const newCard: UserCard = {
      id: `card-${Date.now()}`,
      name: newCardData.name || 'Tarjeta Virtual Express',
      cardHolderName: user.name.toUpperCase(),
      cardNumber: `•••• •••• •••• ${randomLast4}`,
      cardLast4: randomLast4,
      theme: newCardData.theme || 'gold',
      type: newCardData.type || 'Virtual Express',
      expiryDate: '12/30',
      cvv: randomCvv,
      dailyLimit: 25000,
      isFrozen: false,
      isDefault: false,
    };

    setUser((prev) => ({
      ...prev,
      cards: [...(prev.cards || []), newCard],
      activeCardId: newCard.id,
      cardTheme: newCard.theme,
      cardLast4: newCard.cardLast4,
      cvv: newCard.cvv,
      expiryDate: newCard.expiryDate,
    }));

    showToast(
      'Nueva Tarjeta Emitida',
      `Se emitió tu tarjeta ${newCard.name} con acabado ${newCard.theme.toUpperCase()}.`,
      'success'
    );
  };

  // ADMIN: Reset Factory Data
  const handleResetFactoryData = () => {
    setUser(INITIAL_USER);
    setBalance(124590.0);
    setTransactions(INITIAL_TRANSACTIONS);
    setAdminUsers(INITIAL_ADMIN_USERS);
    setSystemSettings(INITIAL_SYSTEM_SETTINGS);
    setThemeRequests(INITIAL_THEME_REQUESTS);
    localStorage.clear();
    showToast('Restablecimiento Completo', 'Se han restaurado los datos y configuraciones iniciales de fábrica.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#0071E3] selection:text-white antialiased">
      {!isAuthenticated && currentScreen !== 'admin' && (
        <AuthModal
          isOpen
          standalone
          initialMode={authModalInitialTab}
          onClose={() => undefined}
          currentUser={user}
          allUsers={adminUsers}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGuestAccess={handleGuestAccess}
          onLogout={handleLogout}
          onShowToast={showToast}
          branding={systemSettings.branding}
          wasAutoLoggedOut={wasAutoLoggedOut}
        />
      )}

      {(isAuthenticated || currentScreen === 'admin') && (
        <>
      {/* Dynamic Navigation: Admin mode is completely isolated without public sidebars/topbars */}
      {currentScreen === 'landing' ? (
        <TopNavBar
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          activeTab={activeLandingTab}
          onTabChange={setActiveLandingTab}
          onOpenAuthModal={handleOpenAuthModal}
          branding={systemSettings.branding}
        />
      ) : currentScreen === 'admin' ? null : (
        <SideNavBar
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          user={user}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
          branding={systemSettings.branding}
        />
      )}

      {/* Screen Views */}
      <div className="flex-1 flex flex-col">
        {currentScreen === 'landing' && (
          <LandingView
            onNavigate={setCurrentScreen}
            onOpenMortgageCalculator={() => setIsMortgageOpen(true)}
            onOpenCardDetails={() => setIsCardModalOpen(true)}
            onOpenCheckingDetails={() => setCurrentScreen('dashboard')}
            onOpenAuthModal={handleOpenAuthModal}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardView
            user={user}
            balance={balance}
            transactions={transactions}
            systemSettings={systemSettings}
            onNavigate={setCurrentScreen}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenWealthAdvisor={() => setIsWealthAdvisorOpen(true)}
            onOpenPlanModal={() => setIsPlanModalOpen(true)}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onOpenThemeRequest={() => setIsThemeRequestModalOpen(true)}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            onSwitchCard={handleSwitchCard}
            onChangeCardTheme={handleSelectCardTheme}
            onAddNewCard={handleAddNewCard}
          />
        )}

        {currentScreen === 'transfers' && (
          <TransfersView
            balance={balance}
            userId={user.id || user.email}
            allUsers={adminUsers}
            onExecuteTransfer={handleExecuteTransfer}
            onNavigate={setCurrentScreen}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryView
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileView
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onNavigate={setCurrentScreen}
            onShowToast={showToast}
            onOpenAuthModal={handleOpenAuthModal}
            onLogout={handleLogout}
            onOpenFaceEnrollment={() => setIsFaceEnrollmentOpen(true)}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminView
            adminUsers={adminUsers}
            transactions={transactions}
            systemSettings={systemSettings}
            creditLogs={creditLogs}
            themeRequests={themeRequests}
            onToggleUserStatus={handleToggleUserStatus}
            onToggleUserCardLock={handleToggleUserCardLock}
            onUpdateUserTheme={handleUpdateUserTheme}
            onAddCredit={handleAddCredit}
            onCreateUser={handleCreateUser}
            onUpdateUserFull={handleUpdateUserFull}
            onDeleteUser={handleDeleteUser}
            onUpdateTransactionStatus={handleUpdateTransactionStatus}
            onCreateManualTransaction={handleCreateManualTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateSystemSettings={handleUpdateSystemSettings}
            onUpdatePlanConfig={handleUpdatePlanConfig}
            onApproveThemeRequest={handleApproveThemeRequest}
            onRejectThemeRequest={handleRejectThemeRequest}
            onAuthorizeUserTheme={handleAuthorizeUserTheme}
            onAuthorizeAllThemes={handleAuthorizeAllThemes}
            onResetFactoryData={handleResetFactoryData}
            onNavigate={setCurrentScreen}
            onShowToast={showToast}
          />
        )}
      </div>

        </>
      )}

      {/* Realtime Auth / User Login Modal */}
      <AuthModal
        isOpen={isAuthenticated && isAuthModalOpen}
        initialMode={authModalInitialTab === 'directory' ? 'login' : authModalInitialTab}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        allUsers={adminUsers}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGuestAccess={handleGuestAccess}
        onLogout={handleLogout}
        onShowToast={showToast}
        branding={systemSettings.branding}
        wasAutoLoggedOut={wasAutoLoggedOut}
      />

      {/* 1-Minute Inactivity Security Lock Modal (Apple Face ID / Touch ID / PIN) */}
      <SecurityAutoLockModal
        isOpen={isAuthenticated && isSecurityLocked}
        user={user}
        allUsers={adminUsers}
        onSwitchUser={(newUser) => {
          setUser(newUser);
          localStorage.setItem('bancanova_user', JSON.stringify(newUser));
        }}
        onUnlock={() => {
          setIsSecurityLocked(false);
          setLastActiveTimestamp(Date.now());
        }}
        onLogout={() => {
          setIsSecurityLocked(false);
          handleLogout();
        }}
        onOpenFaceEnrollment={() => setIsFaceEnrollmentOpen(true)}
        onShowToast={showToast}
      />

      {/* First-Time Facial Enrollment Modal (Apple Face ID Biometric Registration) */}
      <FaceEnrollmentModal
        isOpen={isAuthenticated && isFaceEnrollmentOpen}
        user={user}
        onComplete={handleFaceEnrollmentComplete}
        onSkip={() => setIsFaceEnrollmentOpen(false)}
        onShowToast={showToast}
      />

      {/* Plan Switch Modal */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        currentPlan={user.plan || 'Black'}
        plans={systemSettings.plans}
        onSelectPlan={handleSelectPlan}
      />

      {/* Digital QR Pass Modal for in-store & ATM verification */}
      <CardQrPassModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        user={user}
        activeCard={user.cards?.find((c) => c.id === user.activeCardId) || user.cards?.[0]}
        balance={balance}
        userId={user.id || user.email}
        onShowToast={showToast}
        onSimulatePayment={handleSimulateQrPayment}
      />

      {/* Card Color & Material Request Modal */}
      <CardThemeRequestModal
        isOpen={isThemeRequestModalOpen}
        onClose={() => setIsThemeRequestModalOpen(false)}
        currentUser={user}
        existingRequests={themeRequests}
        onSubmitRequest={handleSubmitThemeRequest}
        onApplyInstantTheme={handleSelectCardTheme}
      />

      {/* Modals & Dialogs */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDeposit={handleDeposit}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={balance}
        onWithdraw={handleWithdraw}
      />

      <MortgageCalculatorModal
        isOpen={isMortgageOpen}
        onClose={() => setIsMortgageOpen(false)}
      />

      <CardDetailsModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      <WealthAdvisorModal
        isOpen={isWealthAdvisorOpen}
        onClose={() => setIsWealthAdvisorOpen(false)}
      />

      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />

      {/* Minimalist Privacy Shield: Obscures content when window loses focus or app is minimized */}
      {isPrivacyShieldActive && isAuthenticated && (
        <div className="fixed inset-0 z-[9999] bg-[#0A0D14]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in select-none">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0071E3] to-[#005bb5] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 mb-4 animate-pulse">
            <span className="material-symbols-outlined text-[32px]">shield</span>
          </div>
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 mb-2">
            Seguridad Bancaria
          </span>
          <h3 className="text-xl font-bold text-white">
            Pantalla Protegida por Privacidad
          </h3>
          <p className="text-xs text-white/70 max-w-sm mt-1.5 leading-relaxed">
            Tu información financiera está protegida mientras la aplicación está en segundo plano.
          </p>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
