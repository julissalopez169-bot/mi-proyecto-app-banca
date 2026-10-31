import React, { useState, useEffect } from 'react';
import {
  AdminUser,
  ScreenType,
  AdminCreditLog,
  Transaction,
  PlanTier,
  CardTheme,
  SystemSettings,
  PlanConfig,
  CardThemeRequest,
} from '../types';
import { RealisticBankCard } from './RealisticBankCard';
import { BancaNovaLogo } from './BancaNovaLogo';
import { supabaseDb, SUPABASE_SQL_MIGRATION } from '../lib/supabase';

interface AdminViewProps {
  adminUsers: AdminUser[];
  transactions: Transaction[];
  systemSettings: SystemSettings;
  creditLogs: AdminCreditLog[];
  themeRequests?: CardThemeRequest[];
  onToggleUserStatus: (userId: string) => void;
  onToggleUserCardLock: (userId: string) => void;
  onUpdateUserTheme: (userId: string, theme: CardTheme) => void;
  onAddCredit: (userId: string, amount: number, concept: string, note?: string) => void;
  onCreateUser: (user: Omit<AdminUser, 'id'>) => void;
  onUpdateUserFull: (userId: string, updatedData: Partial<AdminUser>) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateTransactionStatus: (txId: string, newStatus: 'completed' | 'pending' | 'cancelled') => void;
  onCreateManualTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (txId: string) => void;
  onUpdateSystemSettings: (newSettings: Partial<SystemSettings>) => void;
  onUpdatePlanConfig: (planId: PlanTier, newConfig: Partial<PlanConfig>) => void;
  onApproveThemeRequest?: (requestId: string, adminNote?: string) => void;
  onRejectThemeRequest?: (requestId: string, adminNote?: string) => void;
  onAuthorizeUserTheme?: (userId: string, theme: CardTheme) => void;
  onAuthorizeAllThemes?: (userId: string) => void;
  onResetFactoryData: () => void;
  onNavigate: (screen: ScreenType) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  adminUsers,
  transactions,
  systemSettings,
  creditLogs,
  themeRequests = [],
  onToggleUserStatus,
  onToggleUserCardLock,
  onUpdateUserTheme,
  onAddCredit,
  onCreateUser,
  onUpdateUserFull,
  onDeleteUser,
  onUpdateTransactionStatus,
  onCreateManualTransaction,
  onDeleteTransaction,
  onUpdateSystemSettings,
  onUpdatePlanConfig,
  onApproveThemeRequest,
  onRejectThemeRequest,
  onAuthorizeUserTheme,
  onAuthorizeAllThemes,
  onResetFactoryData,
  onNavigate,
  onShowToast,
}) => {
  // Master password state
  const [adminPassword] = useState('admin123');
  const [inputPassword, setInputPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Tabs
  type AdminTab = 'users' | 'database' | 'branding' | 'cards' | 'theme_requests' | 'transactions' | 'plans' | 'system' | 'credits_log';
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Supabase Database Connection & Sync State
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);
  const [supabaseUserCount, setSupabaseUserCount] = useState<number>(0);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    supabaseDb.checkConnection().then((res) => {
      setSupabaseConnected(res.isConnected);
      setSupabaseUserCount(res.count);
    }).catch(() => {
      setSupabaseConnected(false);
    });
  }, [activeTab]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSql(true);
    onShowToast('Query SQL Copiado', 'Script SQL copiado al portapapeles. Pégalo en el SQL Editor de Supabase.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSyncAllToSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await supabaseDb.syncAllUsersToSupabase(adminUsers);
      const conn = await supabaseDb.checkConnection();
      setSupabaseUserCount(conn.count);
      onShowToast(
        'Sincronización Completa',
        `Se han sincronizado exitosamente ${res.success} usuario(s) en la base de datos de Supabase.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Error al Sincronizar', err.message || 'Error con la conexión a Supabase.', 'error');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Search & Filters for Users
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'All' | PlanTier>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Activo' | 'Bloqueado'>('All');

  // Theme Requests Filter & Search State
  const [themeRequestFilter, setThemeRequestFilter] = useState<'All' | 'pending' | 'approved' | 'rejected'>('All');
  const [themeRequestSearch, setThemeRequestSearch] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Selected User for Card Focus in Card Control Tab
  const [selectedCardUserId, setSelectedCardUserId] = useState<string>(adminUsers[0]?.id || '');

  // Modals state
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('500');
  const [creditType, setCreditType] = useState<'credit' | 'debit'>('credit');
  const [creditConcept, setCreditConcept] = useState<string>('Acreditación administrativa');
  const [creditNote, setCreditNote] = useState<string>('');

  // New User Modal
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+34 600 000 000');
  const [newUserRole, setNewUserRole] = useState<PlanTier>('Black');
  const [newUserBalance, setNewUserBalance] = useState('50000');
  const [newUserTheme, setNewUserTheme] = useState<CardTheme>('obsidian');

  // Edit User Full Modal
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Manual Transaction Modal
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txUserId, setTxUserId] = useState<string>('');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('100');
  const [txType, setTxType] = useState<'deposit' | 'withdrawal' | 'transfer'>('withdrawal');
  const [txCategory, setTxCategory] = useState('Servicios');
  const [txStatus, setTxStatus] = useState<'completed' | 'pending' | 'cancelled'>('completed');

  // Global Notice Edit State
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeActive, setNoticeActive] = useState(systemSettings.systemNotice.active);
  const [noticeType, setNoticeType] = useState<'info' | 'warning' | 'alert' | 'vip'>(systemSettings.systemNotice.type);
  const [noticeTitle, setNoticeTitle] = useState(systemSettings.systemNotice.title);
  const [noticeMessage, setNoticeMessage] = useState(systemSettings.systemNotice.message);

  // Treasury Vault State
  const [vaultReserveInput, setVaultReserveInput] = useState(systemSettings.bankVaultReserve.toString());
  const [mortgageTinInput, setMortgageTinInput] = useState(systemSettings.mortgageRateTin.toString());
  const [savingsApyInput, setSavingsApyInput] = useState(systemSettings.savingsApy.toString());

  // Dynamic Branding State (Company Name & Logo Sync Across All Android / iPhone Devices)
  const currentBranding = systemSettings.branding || {
    companyName: 'Banca Nova',
    subtitle: 'Honduras',
    logoUrl: '',
    logoType: 'default',
  };
  const [companyNameInput, setCompanyNameInput] = useState(currentBranding.companyName || 'Banca Nova');
  const [subtitleInput, setSubtitleInput] = useState(currentBranding.subtitle || 'Honduras');
  const [logoUrlInput, setLogoUrlInput] = useState(currentBranding.logoUrl || '');
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSavedSuccess, setBrandingSavedSuccess] = useState(false);
  const [logoMode, setLogoMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [previewPlatform, setPreviewPlatform] = useState<'both' | 'iphone' | 'android'>('both');

  useEffect(() => {
    if (systemSettings.branding) {
      setCompanyNameInput(systemSettings.branding.companyName || 'Banca Nova');
      setSubtitleInput(systemSettings.branding.subtitle || 'Honduras');
      setLogoUrlInput(systemSettings.branding.logoUrl || '');
    }
  }, [systemSettings.branding]);

  const handleSaveBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingBranding(true);
    setBrandingSavedSuccess(false);

    const cleanName = companyNameInput.trim() || 'Banca Nova';
    const cleanSub = subtitleInput.trim() || 'Honduras';
    const cleanLogo = logoUrlInput.trim();

    try {
      await onUpdateSystemSettings({
        branding: {
          companyName: cleanName,
          subtitle: cleanSub,
          logoUrl: cleanLogo,
          logoType: cleanLogo ? 'custom' : 'default',
          updatedAt: Date.now(),
        },
      });

      setBrandingSavedSuccess(true);
      onShowToast(
        'Identidad Actualizada en Todos los Celulares',
        `El logo y nombre "${cleanName}" se han sincronizado en vivo en todos los celulares Android y iPhone.`,
        'success'
      );
      setTimeout(() => setBrandingSavedSuccess(false), 5000);
    } catch (err: any) {
      onShowToast('Error al guardar', err?.message || 'No se pudo sincronizar la marca.', 'error');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleResetBrandingToDefault = async () => {
    if (confirm('¿Restablecer el nombre y logo a los oficiales de Banca Nova?')) {
      setCompanyNameInput('Banca Nova');
      setSubtitleInput('Honduras');
      setLogoUrlInput('');

      await onUpdateSystemSettings({
        branding: {
          companyName: 'Banca Nova',
          subtitle: 'Honduras',
          logoUrl: '',
          logoType: 'default',
          updatedAt: Date.now(),
        },
      });

      onShowToast('Marca Restablecida', 'Se restableció el logotipo y nombre oficial de Banca Nova.', 'info');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Archivo muy grande', 'Por favor selecciona una imagen menor a 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrlInput(reader.result);
        onShowToast('Imagen Cargada', 'Logo cargado localmente. Haz clic en "Guardar Cambios" para aplicar a todos los celulares.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  // Login handler
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      inputPassword === adminPassword ||
      inputPassword.toLowerCase() === 'admin' ||
      inputPassword === 'admin123'
    ) {
      setIsAuthenticated(true);
      onShowToast('Acceso Concedido', 'Has ingresado al panel de administración central de Banca Nova.', 'success');
    } else {
      onShowToast('Contraseña Incorrecta', `Usa la clave de prueba: ${adminPassword}`, 'error');
    }
  };

  const handleQuickTestLogin = () => {
    setInputPassword(adminPassword);
    setIsAuthenticated(true);
    onShowToast('Acceso Rápido', 'Autenticado en Banca Nova Admin con clave demo.', 'success');
  };

  // Open credit modal preselected
  const handleOpenCreditModal = (userId?: string) => {
    setSelectedUserForCredit(userId || (adminUsers[0]?.id || ''));
    setCreditAmount('1000');
    setCreditType('credit');
    setCreditConcept('Acreditación administrativa');
    setCreditNote('');
    setIsCreditModalOpen(true);
  };

  // Submit credit operation
  const handleSubmitCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(creditAmount);
    if (!selectedUserForCredit) {
      onShowToast('Error', 'Selecciona un usuario de destino.', 'error');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      onShowToast('Error', 'Ingresa un monto válido mayor a 0.', 'error');
      return;
    }

    const finalAmount = creditType === 'credit' ? amount : -amount;
    onAddCredit(selectedUserForCredit, finalAmount, creditConcept, creditNote);
    setIsCreditModalOpen(false);
  };

  // Submit new user creation
  const handleSubmitNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      onShowToast('Error', 'Por favor ingresa nombre y correo electrónico.', 'error');
      return;
    }

    const initialBal = parseFloat(newUserBalance) || 0;
    const initials = newUserName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const today = new Date();
    const joinedDate = `${today.getDate()} ${today.toLocaleString('es-ES', { month: 'short' })} ${today.getFullYear()}`;
    const randomLast4 = Math.floor(1000 + Math.random() * 9000).toString();
    const randomIban = `ES91 2100 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} 0005 ${randomLast4}`;

    onCreateUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      status: 'Activo',
      balance: initialBal,
      initials,
      joinedDate,
      cardLast4: randomLast4,
      accountNumber: randomIban,
      cardTheme: newUserTheme,
      isCardFrozen: false,
      cardDailyLimit: newUserRole === 'Black' ? 100000 : newUserRole === 'Business' ? 25000 : 3000,
      cardContactless: true,
      cardOnlineShopping: true,
      cardAtmWithdrawals: true,
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      expiryDate: '10/29',
    });

    onShowToast('Usuario Creado', `Se ha registrado a ${newUserName} con cuenta ${newUserRole}.`, 'success');
    setIsNewUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserBalance('50000');
  };

  // Submit full user edit
  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateUserFull(editingUser.id, editingUser);
    onShowToast('Expediente Actualizado', `Datos guardados correctamente para ${editingUser.name}.`, 'success');
    setEditingUser(null);
  };

  // Submit manual transaction
  const handleSubmitManualTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      onShowToast('Error', 'Monto inválido', 'error');
      return;
    }

    const targetUser = adminUsers.find((u) => u.id === txUserId) || adminUsers[0];
    const signedAmount = txType === 'deposit' ? amt : -amt;

    onCreateManualTransaction({
      title: txTitle || (txType === 'deposit' ? 'Depósito Administrativo' : 'Cargo Administrativo'),
      subtitle: `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Transacción Manual`,
      amount: signedAmount,
      type: txType,
      status: txStatus,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      categoryIcon: txType === 'deposit' ? 'payments' : txType === 'transfer' ? 'sync_alt' : 'shopping_bag',
      category: txCategory,
      userId: targetUser?.id,
      userName: targetUser?.name,
    });

    onShowToast('Transacción Creada', `Movimiento por $${amt.toFixed(2)} registrado en el sistema.`, 'success');
    setIsTxModalOpen(false);
    setTxTitle('');
    setTxAmount('100');
  };

  // Save Global Notice
  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemSettings({
      systemNotice: {
        active: noticeActive,
        type: noticeType,
        title: noticeTitle,
        message: noticeMessage,
      },
    });
    onShowToast('Aviso Global Actualizado', 'El banner de aviso ha sido difundido a todos los usuarios.', 'success');
    setIsNoticeModalOpen(false);
  };

  // Quick 1-click disable of notice / black banner
  const handleDisableNoticeQuickly = () => {
    setNoticeActive(false);
    onUpdateSystemSettings({
      systemNotice: {
        active: false,
        type: noticeType,
        title: noticeTitle,
        message: noticeMessage,
      },
    });
    onShowToast('Recuadro Desactivado', 'El recuadro / banner de aviso ha sido eliminado de la vista del usuario.', 'info');
    setIsNoticeModalOpen(false);
  };

  // Save Treasury Vault Settings
  const handleSaveTreasury = (e: React.FormEvent) => {
    e.preventDefault();
    const reserve = parseFloat(vaultReserveInput);
    const tin = parseFloat(mortgageTinInput);
    const apy = parseFloat(savingsApyInput);

    if (isNaN(reserve) || isNaN(tin) || isNaN(apy)) {
      onShowToast('Error', 'Por favor verifica los números ingresados.', 'error');
      return;
    }

    onUpdateSystemSettings({
      bankVaultReserve: reserve,
      mortgageRateTin: tin,
      savingsApy: apy,
    });
    onShowToast('Bóveda y Tasas Actualizadas', 'Parámetros macroeconómicos del banco actualizados.', 'success');
  };

  // Export JSON Backup
  const handleExportDatabase = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      bank: 'Banca Nova España S.A.',
      systemSettings,
      users: adminUsers,
      transactions,
      creditLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banca-nova-audit-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Exportación Exitosa', 'Copia completa del sistema descargada en JSON.', 'success');
  };

  // Filtered Users
  const filteredUsers = adminUsers.filter((u) => {
    if (selectedRoleFilter !== 'All' && u.role !== selectedRoleFilter) return false;
    if (selectedStatusFilter !== 'All' && u.status !== selectedStatusFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.accountNumber?.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate high-level metrics
  const totalUserBalances = adminUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
  const activeUsersCount = adminUsers.filter((u) => u.status === 'Activo').length;
  const blackTierCount = adminUsers.filter((u) => u.role === 'Black' || u.role === 'Premium').length;
  const totalVolume = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalCreditsGiven = creditLogs
    .filter((log) => log.type === 'credit')
    .reduce((sum, log) => sum + log.amount, 0);

  // Selected User for Cards Tab
  const selectedCardUser = adminUsers.find((u) => u.id === selectedCardUserId) || adminUsers[0];

  return (
    <div className="w-full min-h-screen overflow-y-auto pt-8 pb-24 px-4 md:px-10 bg-[#F5F5F7] text-[#1D1D1F] relative">
      
      {/* Test Password Login Overlay */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-md border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] mx-auto flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-mono font-semibold mb-3 border border-amber-200">
              <span>/admin/panel/nova • SuperUser</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] mb-1">
              Banca Nova • Control Maestro
            </h2>
            <p className="text-xs text-[#86868B] mb-6">
              Manipulación integral del sistema bancario, liquidez, planes, tarjetas y usuarios.
            </p>

            {/* Test Password Callout Badge */}
            <div className="bg-[#F5F5F7] border border-black/[0.06] rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#1D1D1F]">Contraseña de Acceso:</span>
                <span className="font-mono font-bold text-[#0071E3] bg-white px-2 py-0.5 rounded border border-black/[0.06]">
                  {adminPassword}
                </span>
              </div>
              <p className="text-[11px] text-[#86868B] mt-1">
                Panel seguro para administración, control de colores/acabados, precios y liquidaciones.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Clave de Administrador
                </label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-3 text-sm text-[#1D1D1F] outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-semibold transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] cursor-pointer active:scale-98"
                >
                  Desbloquear Panel Central
                </button>

                <button
                  type="button"
                  onClick={handleQuickTestLogin}
                  className="w-full py-2.5 bg-[#F5F5F7] hover:bg-black/[0.05] text-[#1D1D1F] rounded-xl text-xs font-semibold transition-all border border-black/[0.06] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0071E3]">bolt</span>
                  Entrar con Clave Demo
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="w-full py-2 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors text-center cursor-pointer"
                >
                  ← Volver a App de Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Admin Dashboard Container */}
      <div className={`max-w-[1240px] mx-auto flex flex-col gap-7 transition-opacity duration-300 ${isAuthenticated ? 'opacity-100' : 'opacity-10 pointer-events-none'}`}>
        
        {/* Top Header & System Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BancaNovaLogo size="lg" variant="dark" showText={false} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#0071E3] bg-[#0071E3]/10 px-2.5 py-0.5 rounded-full">
                  Banca Nova • Consola Maestra
                </span>
                <span className="text-xs font-mono text-[#86868B] bg-black/[0.04] px-2 py-0.5 rounded">
                  /admin/panel/nova
                </span>
                {systemSettings.maintenanceMode && (
                  <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    MODO MANTENIMIENTO ACTIVO
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Control Total del Sistema Bancario
              </h1>
            </div>
          </div>

          {/* Master Global Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-black/[0.04] text-[#1D1D1F] text-xs font-semibold border border-black/[0.06] shadow-xs transition-all cursor-pointer"
              title="Ir al Dashboard de usuario"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Ver App Usuario</span>
            </button>

            <button
              onClick={() => handleOpenCreditModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">paid</span>
              <span>Añadir Créditos</span>
            </button>

            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-black/[0.04] text-[#1D1D1F] text-xs font-semibold border border-black/[0.06] shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Nuevo Usuario</span>
            </button>

            <button
              onClick={() => {
                setTxUserId(adminUsers[0]?.id || '');
                setIsTxModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-black/[0.04] text-[#1D1D1F] text-xs font-semibold border border-black/[0.06] shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Crear Transacción</span>
            </button>

            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-black/[0.04] text-[#1D1D1F] text-xs font-semibold border border-black/[0.06] shadow-xs transition-all cursor-pointer"
              title="Emitir aviso global a usuarios"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-600">campaign</span>
              <span>Aviso Global</span>
            </button>

            <button
              onClick={handleExportDatabase}
              className="p-2 rounded-full bg-white hover:bg-black/[0.04] text-[#86868B] hover:text-[#0071E3] border border-black/[0.06] transition-colors cursor-pointer"
              title="Exportar base de datos en JSON"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setInputPassword('');
                onShowToast('Sesión Bloqueada', 'Has salido del panel de administración.', 'info');
              }}
              className="p-2 rounded-full bg-white hover:bg-black/[0.04] text-[#86868B] hover:text-[#FF3B30] border border-black/[0.06] transition-colors cursor-pointer"
              title="Cerrar sesión de administrador"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </button>
          </div>
        </div>

        {/* Global Financial Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-[#86868B] text-xs font-medium">
              <span>Bóveda Reserva Central</span>
              <span className="material-symbols-outlined text-[20px] text-[#0071E3]">account_balance</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1D1D1F]">
                ${systemSettings.bankVaultReserve.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#34C759] font-semibold block mt-0.5">
                Reserva de Garantía 100%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-[#86868B] text-xs font-medium">
              <span>Depósitos de Clientes</span>
              <span className="material-symbols-outlined text-[20px] text-[#34C759]">wallet</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1D1D1F]">
                ${totalUserBalances.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#86868B] font-medium block mt-0.5">
                En {adminUsers.length} expedientes ({activeUsersCount} activos)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-[#86868B] text-xs font-medium">
              <span>Clientes Black Titanium VIP</span>
              <span className="material-symbols-outlined text-[20px] text-amber-500">stars</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1D1D1F]">
                {blackTierCount} clientes
              </span>
              <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                Cuota ${systemSettings.plans.Black.monthlyFee}/mes (Plan Superior)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-[#86868B] text-xs font-medium">
              <span>Volumen de Operaciones</span>
              <span className="material-symbols-outlined text-[20px] text-[#AF52DE]">swap_vert</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1D1D1F]">
                ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#86868B] font-medium block mt-0.5">
                {transactions.length} movimientos auditados
              </span>
            </div>
          </div>
        </div>

        {/* Apple Segmented Navigation Bar for 7 Tabs */}
        {(() => {
          const pendingThemeCount = themeRequests.filter((r) => r.status === 'pending').length;
          return (
            <div className="flex items-center gap-1.5 p-1 bg-black/[0.05] rounded-2xl overflow-x-auto w-full max-w-full">
              {[
                { id: 'users', label: 'Usuarios y Cuentas', icon: 'group', count: adminUsers.length },
                { id: 'database', label: 'Base de Datos Supabase', icon: 'database', count: supabaseUserCount },
                { id: 'branding', label: 'Logo y Empresa', icon: 'branding_watermark' },
                {
                  id: 'theme_requests',
                  label: 'Solicitudes de Color',
                  icon: 'palette',
                  count: pendingThemeCount,
                  isAlert: pendingThemeCount > 0,
                },
                { id: 'cards', label: 'Control de Tarjetas & Colores', icon: 'credit_card' },
                { id: 'transactions', label: 'Transacciones Globales', icon: 'receipt_long', count: transactions.length },
                { id: 'plans', label: 'Planes & Precios (Black VIP)', icon: 'workspace_premium' },
                { id: 'system', label: 'Bóveda, Tasas y Avisos', icon: 'tune' },
                { id: 'credits_log', label: 'Auditoría de Fondos', icon: 'history_edu', count: creditLogs.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        tab.isAlert
                          ? 'bg-amber-500 text-white animate-pulse'
                          : activeTab === tab.id
                          ? 'bg-[#0071E3]/10 text-[#0071E3]'
                          : 'bg-black/5 text-[#86868B]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 1: USERS & ACCOUNTS MANAGER                                           */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-black/[0.06] shadow-xs flex flex-col gap-5">
            {/* Search & Role Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
                  search
                </span>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, correo o IBAN..."
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] focus:border-[#0071E3] focus:bg-white rounded-full pl-10 pr-4 py-2 text-xs text-[#1D1D1F] outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <span className="text-[11px] font-semibold text-[#86868B]">Plan:</span>
                {(['All', 'Black', 'Business', 'Personal'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRoleFilter(role)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedRoleFilter === role
                        ? 'bg-[#1D1D1F] text-white'
                        : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {role === 'All' ? 'Todos' : role === 'Black' ? 'Black VIP' : role}
                  </button>
                ))}

                <span className="text-[11px] font-semibold text-[#86868B] ml-2">Estado:</span>
                {(['All', 'Activo', 'Bloqueado'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedStatusFilter === st
                        ? 'bg-[#0071E3] text-white'
                        : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {st === 'All' ? 'Todos' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Master Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/[0.06] text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                    <th className="pb-3 px-3">Cliente / Expediente</th>
                    <th className="pb-3 px-3">Plan Asignado</th>
                    <th className="pb-3 px-3">Acabado Tarjeta</th>
                    <th className="pb-3 px-3">Saldo Actual</th>
                    <th className="pb-3 px-3">Estado Cuenta</th>
                    <th className="pb-3 px-3">Tarjeta</th>
                    <th className="pb-3 px-3 text-right">Acciones de Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#86868B]">
                        No se encontraron usuarios con ese criterio.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isBlack = user.role === 'Black' || user.role === 'Premium';
                      const isGold = user.role === 'Business';

                      return (
                        <tr key={user.id} className="hover:bg-[#F5F5F7]/80 transition-colors">
                          {/* User Identity */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-9 h-9 rounded-full object-cover shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-bold flex items-center justify-center shrink-0">
                                  {user.initials || user.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[#1D1D1F]">
                                    {user.name}
                                  </span>
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#3ECF8E]/15 text-[#15803d] text-[10px] font-medium"
                                    title="Sincronizado en Supabase PostgreSQL"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                                    Supabase
                                  </span>
                                </div>
                                <span className="text-[#86868B] text-[11px] font-mono block">
                                  {user.email} • {user.accountNumber?.slice(0, 14)}••
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role / Plan Selector */}
                          <td className="py-3.5 px-3">
                            <select
                              value={user.role === 'Premium' ? 'Black' : user.role}
                              onChange={(e) => {
                                const newRole = e.target.value as PlanTier;
                                const defaultTheme = newRole === 'Black' ? 'obsidian' : newRole === 'Business' ? 'gold' : 'sapphire';
                                onUpdateUserFull(user.id, { role: newRole, cardTheme: defaultTheme });
                                onShowToast('Plan Actualizado', `Plan de ${user.name} cambiado a ${newRole} (Tarjeta ${defaultTheme}).`, 'success');
                              }}
                              className={`font-semibold text-xs px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                                isBlack
                                  ? 'bg-[#1D1D1F] text-amber-300 border-amber-500/30'
                                  : isGold
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}
                            >
                              <option value="Black">Plan Black Titanium VIP ($199/m)</option>
                              <option value="Business">Plan Business Gold ($49/m)</option>
                              <option value="Personal">Plan Personal Sapphire ($0/m)</option>
                            </select>
                          </td>

                          {/* Card Finish Theme (Admin override) */}
                          <td className="py-3.5 px-3">
                            <select
                              value={user.cardTheme || 'obsidian'}
                              onChange={(e) => onUpdateUserTheme(user.id, e.target.value as CardTheme)}
                              className="bg-[#F5F5F7] text-[#1D1D1F] font-medium text-xs px-2 py-1 rounded-lg border border-black/[0.08] outline-none cursor-pointer"
                            >
                              <option value="obsidian">Obsidiana (Black VIP)</option>
                              <option value="titanium">Titanio Black</option>
                              <option value="gold">Oro 24K (Business)</option>
                              <option value="sapphire">Zafiro (Personal)</option>
                            </select>
                          </td>

                          {/* Balance */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-sm text-[#1D1D1F]">
                              ${(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Account Status Toggle */}
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => onToggleUserStatus(user.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                                user.status === 'Activo'
                                  ? 'bg-emerald-50 text-[#34C759] border border-emerald-200/50 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-[#FF3B30] border border-rose-200/50 hover:bg-rose-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Activo' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}></span>
                              {user.status}
                            </button>
                          </td>

                          {/* Card Frozen Toggle */}
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => onToggleUserCardLock(user.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                                user.isCardFrozen
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {user.isCardFrozen ? '❄️ Congelada' : '✓ Activa'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit full user */}
                              <button
                                onClick={() => setEditingUser(user)}
                                className="p-1.5 rounded-lg text-[#86868B] hover:text-[#0071E3] hover:bg-[#0071E3]/10 transition-colors cursor-pointer"
                                title="Editar expediente completo"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>

                              {/* Add Credit */}
                              <button
                                onClick={() => handleOpenCreditModal(user.id)}
                                className="px-2.5 py-1 bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0071E3] hover:text-white rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                                title="Añadir o deducir créditos"
                              >
                                <span className="material-symbols-outlined text-[14px]">add</span>
                                Fondos
                              </button>

                              {/* Focus card in 3D */}
                              <button
                                onClick={() => {
                                  setSelectedCardUserId(user.id);
                                  setActiveTab('cards');
                                }}
                                className="p-1.5 rounded-lg text-[#86868B] hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Ver y manipular tarjeta 3D"
                              >
                                <span className="material-symbols-outlined text-[17px]">credit_card</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar al cliente ${user.name}?`)) {
                                    onDeleteUser(user.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Eliminar expediente"
                              >
                                <span className="material-symbols-outlined text-[17px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: BRANDING & LOGO MANAGER (CROSS-DEVICE SYNC ANDROID & IPHONE)         */}
        {/* ========================================================================= */}
        {activeTab === 'branding' && (
          <div className="flex flex-col gap-6">
            {/* Header Banner */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-black/[0.06] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#0051B3] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                  <span className="material-symbols-outlined text-[24px]">branding_watermark</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-[#1D1D1F]">
                      Identidad Corporativa, Nombre y Logotipo
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Sincronización en Vivo en Todos los Celulares
                    </span>
                  </div>
                  <p className="text-xs text-[#86868B] mt-1 max-w-2xl leading-relaxed">
                    Personaliza el nombre de la empresa y el logo del banco. Cada cambio se guarda en la base de datos de <strong className="text-[#1D1D1F]">Cloud Firestore</strong> y se actualiza al instante en todos los celulares <strong className="text-[#1D1D1F]">Android</strong> y <strong className="text-[#1D1D1F]">iPhone</strong> conectados, así como en computadoras.
                  </p>
                </div>
              </div>

              {/* Quick Action Save */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleResetBrandingToDefault}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] hover:bg-black/[0.06] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Restablecer Original</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBranding()}
                  disabled={isSavingBranding}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] transition-all shadow-[0_2px_10px_rgba(0,113,227,0.3)] active:scale-97 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingBranding ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Sincronizando...</span>
                    </>
                  ) : brandingSavedSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] text-emerald-300">check_circle</span>
                      <span>¡Guardado y Sincronizado!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
                      <span>Guardar en Todos los Celulares</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Grid: Form on Left, Live Mobile Preview on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Configuration Form */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Section 1: Company Name & Subtitle */}
                <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-xs flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#0071E3]">badge</span>
                    <h4 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                      1. Nombre de la Empresa o Banco
                    </h4>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                        Nombre Principal de la Institución
                      </label>
                      <input
                        type="text"
                        value={companyNameInput}
                        onChange={(e) => setCompanyNameInput(e.target.value)}
                        placeholder="Ejemplo: Banca Nova, Nova Bank, Banco Continental..."
                        maxLength={40}
                        className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#1D1D1F] font-semibold outline-none transition-all"
                      />
                      <p className="text-[11px] text-[#86868B] mt-1">
                        Se refleja en la barra de navegación, tarjetas bancarias, títulos y pantallas de inicio de sesión.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                        Subtítulo o Región (Opcional)
                      </label>
                      <input
                        type="text"
                        value={subtitleInput}
                        onChange={(e) => setSubtitleInput(e.target.value)}
                        placeholder="Ejemplo: Honduras, Banca Digital, Centroamérica..."
                        maxLength={30}
                        className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-2xl px-4 py-2.5 text-xs text-[#1D1D1F] outline-none transition-all"
                      />
                    </div>

                    {/* Quick presets for Company Name */}
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-[#86868B] block mb-2">
                        Sugerencias rápidas:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Banca Nova', sub: 'Honduras' },
                          { name: 'Nova Bank', sub: 'Digital' },
                          { name: 'Banca Privada Nova', sub: 'Honduras' },
                          { name: 'Banco Nova', sub: 'Centroamérica' },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCompanyNameInput(preset.name);
                              setSubtitleInput(preset.sub);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F5F5F7] hover:bg-blue-50 hover:text-[#0071E3] text-[#1D1D1F] border border-black/[0.05] transition-all cursor-pointer"
                          >
                            {preset.name} • {preset.sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Logo Configuration */}
                <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-xs flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#0071E3]">image</span>
                      <h4 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                        2. Logotipo de la Empresa
                      </h4>
                    </div>

                    {/* Current Logo Badge */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F7] text-[11px] text-[#86868B] font-semibold border border-black/[0.05]">
                      <span>Logo actual:</span>
                      <strong className="text-[#1D1D1F]">
                        {logoUrlInput ? 'Imagen personalizada' : 'Emblema Oficial "N"'}
                      </strong>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center p-1 bg-[#F5F5F7] rounded-2xl w-full border border-black/[0.04]">
                    <button
                      type="button"
                      onClick={() => setLogoMode('upload')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        logoMode === 'upload'
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      <span>Subir Imagen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoMode('url')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        logoMode === 'url'
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      <span>Enlace (URL)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoMode('presets')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        logoMode === 'presets'
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      <span>Logos Predefinidos</span>
                    </button>
                  </div>

                  {/* Mode 1: File Upload */}
                  {logoMode === 'upload' && (
                    <div className="flex flex-col gap-3">
                      <div className="border-2 border-dashed border-black/[0.12] hover:border-[#0071E3] rounded-2xl p-6 text-center transition-all bg-[#FAFAFC] flex flex-col items-center justify-center gap-2 group">
                        <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1D1D1F]">
                            Selecciona una imagen desde tu celular o computadora
                          </p>
                          <p className="text-[11px] text-[#86868B] mt-0.5">
                            Formatos PNG, JPG, WebP o SVG recomendados (Fondo transparente o cuadrado)
                          </p>
                        </div>
                        <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] transition-all cursor-pointer shadow-xs active:scale-97">
                          <span className="material-symbols-outlined text-[16px]">folder_open</span>
                          <span>Examinar Archivos</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Direct URL */}
                  {logoMode === 'url' && (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                          Enlace / URL de la imagen del logotipo
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={logoUrlInput}
                            onChange={(e) => setLogoUrlInput(e.target.value)}
                            placeholder="https://ejemplo.com/logo.png"
                            className="flex-1 bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-2xl px-4 py-2.5 text-xs text-[#1D1D1F] outline-none transition-all font-mono"
                          />
                          {logoUrlInput && (
                            <button
                              type="button"
                              onClick={() => setLogoUrlInput('')}
                              className="w-9 h-9 rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                              title="Borrar enlace"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-[#86868B] mt-1.5">
                          Asegúrate de que la URL sea pública (HTTPS) y accesible para todos los dispositivos móviles.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Presets & Signature "N" Emblem */}
                  {logoMode === 'presets' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Original Signature N */}
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrlInput('');
                          onShowToast('Emblema Oficial Seleccionado', 'Se ha activado el logotipo original con la "N" dorada y zafiro.', 'info');
                        }}
                        className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          !logoUrlInput
                            ? 'border-[#0071E3] bg-blue-50/50 shadow-xs'
                            : 'border-black/[0.08] bg-[#FAFAFC] hover:bg-white hover:border-black/[0.15]'
                        }`}
                      >
                        <div className="w-11 h-11 shrink-0">
                          <BancaNovaLogo size="sm" showText={false} customLogoUrl="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1D1D1F] truncate">
                            Emblema Original con "N"
                          </p>
                          <p className="text-[10px] text-[#86868B] mt-0.5">
                            Escudo hexagonal con zafiro y monograma N
                          </p>
                        </div>
                        {!logoUrlInput && (
                          <span className="material-symbols-outlined text-[18px] text-[#0071E3]">check_circle</span>
                        )}
                      </button>

                      {/* Monograma Dorado */}
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrlInput('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><rect width="44" height="44" rx="12" fill="%230F172A"/><circle cx="22" cy="22" r="15" stroke="%23D4AF37" stroke-width="2.5" fill="none"/><text x="22" y="27" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23FDE68A" text-anchor="middle">N</text></svg>');
                          onShowToast('Monograma Seleccionado', 'Logotipo dorado ejecutivo asignado.', 'info');
                        }}
                        className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          logoUrlInput.includes('%230F172A')
                            ? 'border-[#0071E3] bg-blue-50/50 shadow-xs'
                            : 'border-black/[0.08] bg-[#FAFAFC] hover:bg-white hover:border-black/[0.15]'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-[#0F172A] flex items-center justify-center text-amber-300 font-bold text-lg border border-amber-400/40 shrink-0">
                          N
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1D1D1F] truncate">
                            Monograma Ejecutivo Black
                          </p>
                          <p className="text-[10px] text-[#86868B] mt-0.5">
                            Fondo obsidiana con tipografía oro
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Active Logo Visual Inspector */}
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-black/[0.08] shadow-xs flex items-center justify-center">
                        <BancaNovaLogo
                          size="md"
                          showText={false}
                          customLogoUrl={logoUrlInput || undefined}
                          companyName={companyNameInput}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1D1D1F]">
                          {logoUrlInput ? 'Logo Personalizado Activo' : 'Logotipo con la "N" Oficial'}
                        </p>
                        <p className="text-[11px] text-[#86868B] mt-0.5">
                          {logoUrlInput ? 'Imagen en Base64 / URL externa' : 'Vector SVG con gradiente zafiro'}
                        </p>
                      </div>
                    </div>

                    {logoUrlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrlInput('');
                          onShowToast('Logo Restablecido', 'Se volvió al logo oficial con la "N".', 'info');
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Quitar Imagen</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 3: Synchronization Details Card */}
                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-3xl p-6 border border-blue-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#0071E3]">
                    <span className="material-symbols-outlined text-[20px]">sync</span>
                    <h5 className="text-xs font-bold uppercase tracking-wider">
                      ¿Cómo funciona la sincronización en celulares Android y iPhone?
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white/80 rounded-2xl p-3.5 border border-blue-100/60 shadow-2xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">smartphone</span>
                        <h6 className="text-xs font-bold text-[#1D1D1F]">En Teléfonos Android</h6>
                      </div>
                      <p className="text-[11px] text-[#86868B] leading-relaxed">
                        Cualquier usuario con Chrome, Samsung Internet o PWA instalada recibe los cambios en tiempo real vía WebSocket de Cloud Firestore sin tener que reinstalar la aplicación.
                      </p>
                    </div>

                    <div className="bg-white/80 rounded-2xl p-3.5 border border-blue-100/60 shadow-2xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[18px] text-blue-600">phone_iphone</span>
                        <h6 className="text-xs font-bold text-[#1D1D1F]">En Teléfonos iPhone (iOS)</h6>
                      </div>
                      <p className="text-[11px] text-[#86868B] leading-relaxed">
                        En Safari Mobile y WebClip en pantalla de inicio de iOS, los encabezados, barras de estado y el título de la pestaña se actualizan inmediatamente al guardar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Live Mobile Previews (iPhone & Android) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-xs flex flex-col gap-5 sticky top-24">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1D1D1F]">
                        Vista Previa en Vivo en Celulares
                      </h4>
                      <p className="text-[11px] text-[#86868B] mt-0.5">
                        Así es exactamente como se ve en las pantallas de tus usuarios
                      </p>
                    </div>

                    {/* Platform Selector */}
                    <div className="flex items-center p-0.5 bg-[#F5F5F7] rounded-xl border border-black/[0.05]">
                      <button
                        type="button"
                        onClick={() => setPreviewPlatform('both')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          previewPlatform === 'both' ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#86868B]'
                        }`}
                      >
                        Ambos
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPlatform('iphone')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          previewPlatform === 'iphone' ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#86868B]'
                        }`}
                      >
                        iPhone
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPlatform('android')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          previewPlatform === 'android' ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#86868B]'
                        }`}
                      >
                        Android
                      </button>
                    </div>
                  </div>

                  {/* Device Simulation Area */}
                  <div className="flex flex-col gap-5">
                    {/* iPhone Mockup */}
                    {(previewPlatform === 'both' || previewPlatform === 'iphone') && (
                      <div className="rounded-[36px] bg-[#0A0D14] p-3 shadow-xl border border-black/[0.1] text-white">
                        {/* Dynamic Island & Status Bar */}
                        <div className="flex items-center justify-between px-4 pt-1 pb-2">
                          <span className="text-[11px] font-semibold text-white/90">9:41</span>
                          <div className="w-20 h-4 bg-black rounded-full mx-auto flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-blue-900/60 mr-2"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/90">
                            <span className="text-[10px] font-bold">5G</span>
                            <span className="material-symbols-outlined text-[13px]">wifi</span>
                            <span className="material-symbols-outlined text-[14px]">battery_full</span>
                          </div>
                        </div>

                        {/* iPhone Screen Content */}
                        <div className="bg-[#F5F5F7] rounded-[28px] overflow-hidden text-[#1D1D1F] p-4 flex flex-col gap-3 min-h-[190px]">
                          {/* Mobile Navigation Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                            <div className="flex items-center">
                              <BancaNovaLogo
                                size="sm"
                                variant="dark"
                                companyName={companyNameInput || 'Banca Nova'}
                                subtitle={subtitleInput || 'Honduras'}
                                customLogoUrl={logoUrlInput || undefined}
                              />
                            </div>
                            <div className="w-7 h-7 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                              CL
                            </div>
                          </div>

                          {/* App Card Sample */}
                          <div className="bg-white rounded-2xl p-3 border border-black/[0.05] shadow-2xs flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider">
                                Balance Total
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Activo
                              </span>
                            </div>
                            <span className="text-base font-extrabold text-[#1D1D1F]">
                              L. 1,450,230.50
                            </span>
                            <div className="text-[10px] text-[#86868B] flex items-center gap-1">
                              <span>Cuenta Oficial en {companyNameInput || 'Banca Nova'}</span>
                            </div>
                          </div>

                          {/* Mobile Tab Bar Preview */}
                          <div className="mt-auto pt-2 border-t border-black/[0.06] flex justify-around text-[#86868B] text-[9px] font-semibold">
                            <div className="flex flex-col items-center text-[#0071E3]">
                              <span className="material-symbols-outlined text-[16px]">grid_view</span>
                              <span>Inicio</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined text-[16px]">send</span>
                              <span>Transferir</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                              <span>Movimientos</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-[10px] font-semibold text-white/60">
                            Vista Previa en Apple iPhone (iOS)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Android Mockup */}
                    {(previewPlatform === 'both' || previewPlatform === 'android') && (
                      <div className="rounded-[28px] bg-[#1E293B] p-3 shadow-xl border border-black/[0.1] text-white">
                        {/* Android Status Bar */}
                        <div className="flex items-center justify-between px-3 pt-1 pb-2">
                          <span className="text-[11px] font-semibold text-white/90">10:30 AM</span>
                          <div className="flex items-center gap-2 text-white/90">
                            <span className="material-symbols-outlined text-[13px]">network_cell</span>
                            <span className="material-symbols-outlined text-[13px]">wifi</span>
                            <span className="text-[10px] font-bold">100%</span>
                          </div>
                        </div>

                        {/* Android App Surface */}
                        <div className="bg-white rounded-[22px] overflow-hidden text-[#1D1D1F] p-4 flex flex-col gap-3 min-h-[175px]">
                          {/* Android Top App Bar */}
                          <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06]">
                            <div className="flex items-center">
                              <BancaNovaLogo
                                size="sm"
                                variant="dark"
                                companyName={companyNameInput || 'Banca Nova'}
                                subtitle={subtitleInput || 'Honduras'}
                                customLogoUrl={logoUrlInput || undefined}
                              />
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-[#86868B]">notifications</span>
                          </div>

                          {/* Quick Mobile Action Banner */}
                          <div className="bg-gradient-to-r from-[#0071E3] to-[#0284C7] rounded-xl p-3 text-white flex justify-between items-center shadow-xs">
                            <div>
                              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
                                {companyNameInput || 'Banca Nova'} Móvil
                              </p>
                              <p className="text-xs font-bold">
                                Sistema Conectado
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-[20px] text-white/90">shield</span>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-[10px] font-semibold text-white/60">
                            Vista Previa en Dispositivo Android
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save Floating Button in Preview Column */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      disabled={isSavingBranding}
                      className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] transition-all shadow-[0_4px_16px_rgba(0,113,227,0.35)] active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingBranding ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          <span>Sincronizando con Celulares...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">publish</span>
                          <span>Aplicar Cambios a Todos los Celulares</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: THEME & COLOR CHANGE REQUESTS QUEUE                                  */}
        {/* ========================================================================= */}
        {activeTab === 'theme_requests' && (
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-black/[0.06] shadow-xs flex flex-col gap-6">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#1D1D1F]">
                    Solicitudes de Cambio de Color y Acabado
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                    Bandeja de Aprobaciones
                  </span>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Gestiona las peticiones de los usuarios para actualización de acabados físicos y digitales
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCardUserId(adminUsers[0]?.id || '');
                    setActiveTab('cards');
                  }}
                  className="px-3.5 py-2 bg-[#F5F5F7] hover:bg-black/[0.05] text-[#1D1D1F] rounded-xl text-xs font-semibold border border-black/[0.06] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0071E3]">tune</span>
                  <span>Asignar Acabado Directo</span>
                </button>
              </div>
            </div>

            {/* Metrics Overview Bar */}
            {(() => {
              const pendingCount = themeRequests.filter((r) => r.status === 'pending').length;
              const approvedCount = themeRequests.filter((r) => r.status === 'approved').length;
              const rejectedCount = themeRequests.filter((r) => r.status === 'rejected').length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.04]">
                    <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider block">
                      Total Peticiones
                    </span>
                    <span className="text-2xl font-bold text-[#1D1D1F] mt-1 block">
                      {themeRequests.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Pendientes
                    </span>
                    <span className="text-2xl font-bold text-amber-900 mt-1 block">
                      {pendingCount}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Aprobadas
                    </span>
                    <span className="text-2xl font-bold text-emerald-900 mt-1 block">
                      {approvedCount}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                      Rechazadas
                    </span>
                    <span className="text-2xl font-bold text-rose-900 mt-1 block">
                      {rejectedCount}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Filter and Search Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(
                  [
                    { id: 'All', label: 'Todas las Solicitudes' },
                    { id: 'pending', label: 'Pendientes' },
                    { id: 'approved', label: 'Aprobadas' },
                    { id: 'rejected', label: 'Rechazadas' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setThemeRequestFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      themeRequestFilter === f.id
                        ? 'bg-[#1D1D1F] text-white shadow-xs'
                        : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#86868B]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por usuario o email..."
                  value={themeRequestSearch}
                  onChange={(e) => setThemeRequestSearch(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] focus:border-[#0071E3] focus:bg-white rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1D1D1F] outline-none"
                />
              </div>
            </div>

            {/* Requests List */}
            {(() => {
              const filteredRequests = themeRequests.filter((r) => {
                const matchesFilter = themeRequestFilter === 'All' || r.status === themeRequestFilter;
                const matchesSearch =
                  !themeRequestSearch ||
                  r.userName.toLowerCase().includes(themeRequestSearch.toLowerCase()) ||
                  r.userEmail.toLowerCase().includes(themeRequestSearch.toLowerCase()) ||
                  r.requestedTheme.toLowerCase().includes(themeRequestSearch.toLowerCase());
                return matchesFilter && matchesSearch;
              });

              if (filteredRequests.length === 0) {
                return (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-black/[0.04] text-[#86868B] flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[24px]">palette</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1D1D1F]">No hay solicitudes registradas</h4>
                    <p className="text-xs text-[#86868B] mt-1 max-w-xs">
                      Cuando los usuarios soliciten un nuevo color o acabado de tarjeta, aparecerán aquí para revisión.
                    </p>
                  </div>
                );
              }

              const themeLabels: Record<CardTheme, { name: string; bg: string; dot: string }> = {
                obsidian: { name: 'Black VIP (Obsidiana)', bg: 'bg-[#101014] text-white', dot: 'bg-amber-400' },
                gold: { name: 'Oro 24K Noble', bg: 'bg-[#C5A059] text-black', dot: 'bg-amber-300' },
                titanium: { name: 'Titanio Gris Espacial', bg: 'bg-[#2B303A] text-white', dot: 'bg-slate-300' },
                emerald: { name: 'Esmeralda Imperial', bg: 'bg-[#0B3B26] text-emerald-200', dot: 'bg-emerald-400' },
                rose_gold: { name: 'Oro Rosa 18K', bg: 'bg-[#43232C] text-rose-200', dot: 'bg-rose-300' },
                sapphire: { name: 'Zafiro Real', bg: 'bg-[#0F2744] text-sky-200', dot: 'bg-sky-400' },
              };

              return (
                <div className="flex flex-col gap-3">
                  {filteredRequests.map((req) => {
                    const targetUser = adminUsers.find((u) => u.id === req.userId);
                    const curInfo = themeLabels[req.currentTheme] || { name: req.currentTheme, bg: 'bg-slate-700 text-white', dot: 'bg-slate-400' };
                    const reqInfo = themeLabels[req.requestedTheme] || { name: req.requestedTheme, bg: 'bg-slate-900 text-white', dot: 'bg-amber-400' };

                    return (
                      <div
                        key={req.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          req.status === 'pending'
                            ? 'bg-white border-amber-300/80 shadow-xs ring-1 ring-amber-400/20'
                            : 'bg-[#FDFDFE] border-black/[0.06]'
                        }`}
                      >
                        {/* User & Request Info */}
                        <div className="flex items-start gap-3.5 flex-1">
                          <div className="w-10 h-10 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-bold flex items-center justify-center text-sm shrink-0">
                            {req.userName.slice(0, 2).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-[#1D1D1F]">{req.userName}</span>
                              <span className="text-[11px] text-[#86868B]">• {req.userEmail}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-black/[0.06]">
                                Plan: {req.userPlan}
                              </span>
                              {targetUser && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  (Saldo: ${targetUser.balance.toLocaleString('en-US')})
                                </span>
                              )}
                            </div>

                            {/* Theme Transition Badge */}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F5F5F7] border border-black/[0.06]">
                                <span className={`w-3 h-3 rounded-full ${curInfo.bg} border border-white/60 shrink-0`}></span>
                                <span className="text-[11px] text-[#86868B]">Actual:</span>
                                <span className="text-[11px] font-semibold text-[#1D1D1F]">{curInfo.name}</span>
                              </div>

                              <span className="material-symbols-outlined text-[16px] text-[#0071E3]">
                                arrow_forward
                              </span>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200">
                                <span className={`w-3 h-3 rounded-full ${reqInfo.bg} border border-white/60 shrink-0`}></span>
                                <span className="text-[11px] text-[#0071E3] font-bold">Solicitado:</span>
                                <span className="text-[11px] font-bold text-[#1D1D1F]">{reqInfo.name}</span>
                              </div>
                            </div>

                            {/* User Reason / Justification */}
                            {req.reason && (
                              <div className="mt-2 text-xs text-[#1D1D1F] bg-[#F5F5F7] p-2.5 rounded-xl border border-black/[0.04]">
                                <span className="text-[10px] font-bold uppercase text-[#86868B] block mb-0.5">
                                  Motivo del Cliente:
                                </span>
                                <p className="italic text-[11px] text-[#2C2C2E]">&ldquo;{req.reason}&rdquo;</p>
                              </div>
                            )}

                            {/* Admin Note if reviewed */}
                            {req.adminResponseNote && (
                              <div className="mt-1.5 text-[11px] text-[#86868B]">
                                <strong className="font-semibold text-[#1D1D1F]">Nota de Administración:</strong>{' '}
                                {req.adminResponseNote} ({req.reviewedDate})
                              </div>
                            )}

                            <div className="mt-1.5 text-[10px] text-[#86868B]">
                              Solicitado el {req.requestDate}
                            </div>
                          </div>
                        </div>

                        {/* Status & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onApproveThemeRequest) {
                                    onApproveThemeRequest(req.id, 'Aprobado por el Administrador. Emisión prioritaria.');
                                  } else {
                                    onUpdateUserTheme(req.userId, req.requestedTheme);
                                  }
                                  onShowToast('Solicitud Aprobada', `Tarjeta de ${req.userName} cambiada a ${reqInfo.name}.`, 'success');
                                }}
                                className="px-3 py-1.5 bg-[#34C759] hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-98"
                              >
                                <span className="material-symbols-outlined text-[15px]">check</span>
                                <span>Aprobar &amp; Emitir</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingRequestId(req.id);
                                  setIsRejectModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <span className="material-symbols-outlined text-[15px]">close</span>
                                <span>Rechazar</span>
                              </button>
                            </>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                req.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {req.status === 'approved' ? 'check_circle' : 'cancel'}
                              </span>
                              <span>{req.status === 'approved' ? 'Aprobada' : 'Rechazada'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Modal for rejecting a theme request */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-[#1D1D1F]">
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500 text-[20px]">cancel</span>
                  <h4 className="text-base font-bold text-[#1D1D1F]">Rechazar Solicitud de Acabado</h4>
                </div>
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#86868B]">
                  Indica el motivo por el cual no se autoriza el cambio de acabado para el cliente.
                </p>

                <textarea
                  rows={3}
                  placeholder="Ej: Requiere saldo promedio de $50,000 para tarjeta Esmeralda Imperial..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl p-3 text-xs text-[#1D1D1F] outline-none resize-none transition-all"
                  autoFocus
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 py-2 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (rejectingRequestId && onRejectThemeRequest) {
                        onRejectThemeRequest(
                          rejectingRequestId,
                          rejectionReasonInput.trim() || 'Solicitud no aprobada por requisitos de plan.'
                        );
                      }
                      onShowToast('Solicitud Declinada', 'Se ha registrado el rechazo de la solicitud.', 'info');
                      setIsRejectModalOpen(false);
                      setRejectingRequestId(null);
                      setRejectionReasonInput('');
                    }}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CARD CONTROL CENTER & LIVE 3D THEME PICKER                         */}
        {/* ========================================================================= */}
        {activeTab === 'cards' && selectedCardUser && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Card 3D Live Viewer with Admin Color Finish Picker (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 border border-black/[0.06] shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071E3] block">
                    Centro de Tarjetas Físicas &amp; Digitales
                  </span>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Tarjeta de {selectedCardUser.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold bg-[#F5F5F7] px-2.5 py-1 rounded-full border border-black/[0.06]">
                    Plan: {selectedCardUser.role}
                  </span>
                </div>
              </div>

              {/* Realistic Bank Card with showColorPicker === true (Admin Exclusive) */}
              <RealisticBankCard
                cardHolderName={selectedCardUser.name}
                cardLast4={selectedCardUser.cardLast4 || '4092'}
                cvv={selectedCardUser.cvv || '842'}
                expiryDate={selectedCardUser.expiryDate || '10/29'}
                isLocked={selectedCardUser.isCardFrozen}
                onToggleLock={() => onToggleUserCardLock(selectedCardUser.id)}
                theme={selectedCardUser.cardTheme || 'obsidian'}
                onChangeTheme={(newTheme) => {
                  onUpdateUserTheme(selectedCardUser.id, newTheme);
                  onShowToast('Acabado Actualizado', `Tarjeta de ${selectedCardUser.name} cambiada a ${newTheme}.`, 'success');
                }}
                showControls={true}
                showColorPicker={true}
                size="lg"
              />

              <div className="w-full mt-6 pt-4 border-t border-black/[0.06] text-xs text-[#86868B] flex items-center justify-between">
                <span>* Los cambios de acabado se reflejan al instante en la app del cliente.</span>
                <span className="font-semibold text-[#1D1D1F]">Emisión Master World</span>
              </div>
            </div>

            {/* Right: Card Hardware & Security Switches Controls (6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              {/* Select Active User Dropdown */}
              <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-xs">
                <label className="block text-xs font-bold uppercase text-[#86868B] mb-2">
                  Seleccionar Tarjeta a Manipular:
                </label>
                <select
                  value={selectedCardUserId}
                  onChange={(e) => setSelectedCardUserId(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-3 text-sm font-semibold text-[#1D1D1F] outline-none transition-all cursor-pointer"
                >
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — Tarjeta **{u.cardLast4 || '4092'} ({u.role} - {u.cardTheme || 'obsidian'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Switches & Limits Controls */}
              <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-[#1D1D1F] mb-1">
                  Parámetros de Seguridad de Tarjeta
                </h4>

                {/* Daily Spending Limit */}
                <div className="p-3.5 bg-[#F5F5F7] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1D1D1F] block">Límite Diario de Compras</span>
                    <span className="text-[11px] text-[#86868B]">Tope máximo de gasto diario</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#86868B]">$</span>
                    <input
                      type="number"
                      value={selectedCardUser.cardDailyLimit || 100000}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateUserFull(selectedCardUser.id, { cardDailyLimit: val });
                      }}
                      className="w-28 bg-white border border-black/[0.08] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1D1D1F] outline-none"
                    />
                  </div>
                </div>

                {/* Contactless Toggle */}
                <div className="p-3.5 bg-[#F5F5F7] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1D1D1F] block">Pagos Contactless (NFC)</span>
                    <span className="text-[11px] text-[#86868B]">Habilitar pagos en terminales físicos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !selectedCardUser.cardContactless;
                      onUpdateUserFull(selectedCardUser.id, { cardContactless: next });
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      selectedCardUser.cardContactless !== false ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        selectedCardUser.cardContactless !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Online Shopping Toggle */}
                <div className="p-3.5 bg-[#F5F5F7] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1D1D1F] block">Compras en Línea e E-commerce</span>
                    <span className="text-[11px] text-[#86868B]">Operaciones web y servicios recurrentes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !selectedCardUser.cardOnlineShopping;
                      onUpdateUserFull(selectedCardUser.id, { cardOnlineShopping: next });
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      selectedCardUser.cardOnlineShopping !== false ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        selectedCardUser.cardOnlineShopping !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Regenerate CVV or Reissue Card */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newCvv = Math.floor(100 + Math.random() * 900).toString();
                      onUpdateUserFull(selectedCardUser.id, { cvv: newCvv });
                      onShowToast('CVV Regenerado', `Nuevo CVV de seguridad: ${newCvv}`, 'success');
                    }}
                    className="flex-1 py-2.5 bg-[#F5F5F7] hover:bg-black/[0.05] text-[#1D1D1F] rounded-xl text-xs font-bold border border-black/[0.06] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#0071E3]">refresh</span>
                    Regenerar CVV
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newLast4 = Math.floor(1000 + Math.random() * 9000).toString();
                      onUpdateUserFull(selectedCardUser.id, { cardLast4: newLast4 });
                      onShowToast('Tarjeta Reemitida', `Nueva terminación asignada: **${newLast4}`, 'success');
                    }}
                    className="flex-1 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">credit_card</span>
                    Reemitir Número
                  </button>
                </div>

              </div>

              {/* Card Color / Theme Authorization Controls */}
              <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#1D1D1F]">
                      Autorización de Acabados &amp; Cambio Libre
                    </h4>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Permite al cliente cambiar gratis y cuando quiera entre estos acabados
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onAuthorizeAllThemes) {
                        onAuthorizeAllThemes(selectedCardUser.id);
                      } else {
                        onUpdateUserFull(selectedCardUser.id, {
                          authorizedThemes: ['obsidian', 'gold', 'titanium', 'emerald', 'rose_gold', 'sapphire'],
                          canChangeCardThemeFreely: true,
                        });
                        onShowToast('Todos los Acabados Autorizados', 'El cliente puede cambiar gratis a cualquier tarjeta.', 'success');
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                    <span>Autorizar Todos (Gratis)</span>
                  </button>
                </div>

                {/* Individual Theme Authorization Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'obsidian' as CardTheme, name: 'Obsidiana VIP', bg: 'bg-[#101014]', text: 'text-white' },
                    { id: 'gold' as CardTheme, name: 'Oro 24K Noble', bg: 'bg-[#C5A059]', text: 'text-black' },
                    { id: 'titanium' as CardTheme, name: 'Titanio Espacial', bg: 'bg-[#2B303A]', text: 'text-white' },
                    { id: 'emerald' as CardTheme, name: 'Esmeralda', bg: 'bg-[#0B3B26]', text: 'text-emerald-100' },
                    { id: 'rose_gold' as CardTheme, name: 'Oro Rosa 18K', bg: 'bg-[#43232C]', text: 'text-rose-100' },
                    { id: 'sapphire' as CardTheme, name: 'Zafiro Real', bg: 'bg-[#0F2744]', text: 'text-sky-100' },
                  ].map((f) => {
                    const isAuth =
                      selectedCardUser.canChangeCardThemeFreely ||
                      (selectedCardUser.authorizedThemes && selectedCardUser.authorizedThemes.includes(f.id)) ||
                      f.id === 'obsidian' ||
                      f.id === 'gold';

                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          if (onAuthorizeUserTheme) {
                            onAuthorizeUserTheme(selectedCardUser.id, f.id);
                          } else {
                            const curAuth = selectedCardUser.authorizedThemes || ['obsidian', 'gold'];
                            const nextAuth = curAuth.includes(f.id)
                              ? curAuth.filter((t) => t !== f.id)
                              : [...curAuth, f.id];
                            onUpdateUserFull(selectedCardUser.id, { authorizedThemes: nextAuth });
                            onShowToast(
                              'Autorización Actualizada',
                              `Acabado ${f.name} ${nextAuth.includes(f.id) ? 'autorizado' : 'bloqueado'}.`,
                              'info'
                            );
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          isAuth
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-[#F9FAFB] border-black/[0.06] text-[#86868B] hover:bg-[#F0F2F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-3.5 h-3.5 rounded-full ${f.bg} border border-white/50 shrink-0 shadow-xs`}></span>
                          <span className="text-[11px] font-bold truncate">{f.name}</span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-[15px] shrink-0 ${
                            isAuth ? 'text-emerald-600' : 'text-[#86868B]'
                          }`}
                        >
                          {isAuth ? 'check_circle' : 'lock'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GLOBAL TRANSACTIONS MASTER                                         */}
        {/* ========================================================================= */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-black/[0.06] shadow-xs flex flex-col gap-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">
                  Auditoría y Gestión de Transacciones Globales
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Visualiza, crea, aprueba o cancela cualquier movimiento del banco
                </p>
              </div>

              <button
                onClick={() => {
                  setTxUserId(adminUsers[0]?.id || '');
                  setIsTxModalOpen(true);
                }}
                className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Nueva Transacción Manual
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/[0.06] text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                    <th className="pb-3 px-3">Fecha &amp; Hora</th>
                    <th className="pb-3 px-3">Usuario / Cuenta</th>
                    <th className="pb-3 px-3">Concepto</th>
                    <th className="pb-3 px-3">Categoría</th>
                    <th className="pb-3 px-3">Monto</th>
                    <th className="pb-3 px-3">Estado</th>
                    <th className="pb-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] text-xs">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-[#F5F5F7]/80 transition-colors">
                        <td className="py-3 px-3 font-mono text-[11px] text-[#86868B]">
                          {tx.date}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1D1D1F]">
                          {tx.userName || 'Elena Montes'}
                        </td>
                        <td className="py-3 px-3 text-[#1D1D1F]">
                          <span className="font-semibold block">{tx.title}</span>
                          <span className="text-[11px] text-[#86868B] block">{tx.subtitle}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-[#F5F5F7] px-2 py-0.5 rounded text-[11px] font-medium text-[#1D1D1F]">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${isPositive ? 'text-[#34C759]' : 'text-[#1D1D1F]'}`}>
                            {isPositive ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={tx.status}
                            onChange={(e) => onUpdateTransactionStatus(tx.id, e.target.value as any)}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border outline-none cursor-pointer ${
                              tx.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : tx.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="completed">Completada</option>
                            <option value="pending">Pendiente</option>
                            <option value="cancelled">Cancelada</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar la transacción "${tx.title}"?`)) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar transacción"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PLANS & PRICING CONFIGURATOR (BLACK VIP HIGHEST TIER)               */}
        {/* ========================================================================= */}
        {activeTab === 'plans' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-black/[0.06] shadow-xs flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Estructura Tarifaria y Niveles
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F]">
                Configurador de Planes y Precios de Tarjetas
              </h3>
              <p className="text-xs text-[#86868B] mt-0.5">
                El <strong>Plan Black Titanium VIP</strong> es la categoría más cara y exclusiva del banco. Modifica cuotas y límites aquí.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['Personal', 'Business', 'Black'] as const).map((planKey) => {
                const plan = systemSettings.plans[planKey];
                const isBlack = planKey === 'Black';
                const isGold = planKey === 'Business';

                return (
                  <div
                    key={planKey}
                    className={`rounded-3xl p-6 border flex flex-col justify-between ${
                      isBlack
                        ? 'bg-gradient-to-b from-[#111317] to-[#050608] text-white border-amber-400/40 shadow-lg'
                        : isGold
                        ? 'bg-white border-amber-200 shadow-sm'
                        : 'bg-[#F9F9FB] border-black/[0.06]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isBlack ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-black/5 text-[#1D1D1F]'
                        }`}>
                          {plan.badge}
                        </span>
                        {isBlack && (
                          <span className="text-[10px] font-extrabold text-amber-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">star</span>
                            MÁS CARA
                          </span>
                        )}
                      </div>

                      <h4 className={`text-base font-bold ${isBlack ? 'text-white' : 'text-[#1D1D1F]'}`}>
                        {plan.name}
                      </h4>

                      {/* Cuota Mensual Input */}
                      <div className="my-4 space-y-3">
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 ${isBlack ? 'text-white/80' : 'text-[#86868B]'}`}>
                            Cuota Mensual ($ USD):
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs opacity-60">$</span>
                            <input
                              type="number"
                              value={plan.monthlyFee}
                              onChange={(e) => {
                                const fee = parseFloat(e.target.value) || 0;
                                onUpdatePlanConfig(planKey, { monthlyFee: fee });
                              }}
                              className={`w-full rounded-xl pl-7 pr-3 py-2 text-sm font-bold outline-none border ${
                                isBlack
                                  ? 'bg-white/10 text-white border-white/20 focus:border-amber-400'
                                  : 'bg-white text-[#1D1D1F] border-black/[0.08] focus:border-[#0071E3]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Saldo Mínimo Requerido */}
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 ${isBlack ? 'text-white/80' : 'text-[#86868B]'}`}>
                            Saldo Mínimo Requerido ($):
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs opacity-60">$</span>
                            <input
                              type="number"
                              value={plan.minBalanceRequired}
                              onChange={(e) => {
                                const minBal = parseFloat(e.target.value) || 0;
                                onUpdatePlanConfig(planKey, { minBalanceRequired: minBal });
                              }}
                              className={`w-full rounded-xl pl-7 pr-3 py-2 text-sm font-bold outline-none border ${
                                isBlack
                                  ? 'bg-white/10 text-white border-white/20 focus:border-amber-400'
                                  : 'bg-white text-[#1D1D1F] border-black/[0.08] focus:border-[#0071E3]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Límite Diario de Tarjeta */}
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 ${isBlack ? 'text-white/80' : 'text-[#86868B]'}`}>
                            Límite Diario Tarjeta ($):
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs opacity-60">$</span>
                            <input
                              type="number"
                              value={plan.dailyCardLimit}
                              onChange={(e) => {
                                const limit = parseFloat(e.target.value) || 0;
                                onUpdatePlanConfig(planKey, { dailyCardLimit: limit });
                              }}
                              className={`w-full rounded-xl pl-7 pr-3 py-2 text-sm font-bold outline-none border ${
                                isBlack
                                  ? 'bg-white/10 text-white border-white/20 focus:border-amber-400'
                                  : 'bg-white text-[#1D1D1F] border-black/[0.08] focus:border-[#0071E3]'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Default Theme Pill */}
                      <div className="pt-2 border-t border-black/[0.06] border-white/10 text-xs">
                        <span className={isBlack ? 'text-white/70' : 'text-[#86868B]'}>Acabado vinculado: </span>
                        <span className="font-bold text-inherit">{plan.defaultTheme.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3">
                      <span className={`text-[11px] block ${isBlack ? 'text-amber-300/90' : 'text-[#34C759]'}`}>
                        ✓ Sincronizado en tiempo real
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TREASURY, RATES & GLOBAL NOTICE BANNER                             */}
        {/* ========================================================================= */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Treasury & Macro Parameters (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 border border-black/[0.06] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F] mb-1">
                  Bóveda Central y Tasas Financieras
                </h3>
                <p className="text-xs text-[#86868B] mb-5">
                  Ajusta la liquidez de reserva de Banca Nova y las tasas globales de interés
                </p>

                <form onSubmit={handleSaveTreasury} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Reserva Líquida en Bóveda Central (USD)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={vaultReserveInput}
                      onChange={(e) => setVaultReserveInput(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-[#1D1D1F] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Tasa Hipotecaria TIN (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={mortgageTinInput}
                        onChange={(e) => setMortgageTinInput(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1F] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Rendimiento Ahorro TAE (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={savingsApyInput}
                        onChange={(e) => setSavingsApyInput(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1F] outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#F5F5F7] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1D1D1F] block">Modo Mantenimiento del Sistema</span>
                      <span className="text-[11px] text-[#86868B]">Muestra aviso de ventana de servicio</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !systemSettings.maintenanceMode;
                        onUpdateSystemSettings({ maintenanceMode: next });
                        onShowToast('Mantenimiento', next ? 'Modo mantenimiento activado.' : 'Modo mantenimiento desactivado.', 'info');
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                        systemSettings.maintenanceMode ? 'bg-[#FF3B30]' : 'bg-[#E5E5EA]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          systemSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></div>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    Guardar Parámetros de Bóveda
                  </button>
                </form>
              </div>
            </div>

            {/* Global Notice Broadcast Center (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 border border-black/[0.06] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Emisor de Aviso Global (Banner en App)
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    systemSettings.systemNotice.active ? 'bg-emerald-100 text-emerald-800' : 'bg-black/5 text-[#86868B]'
                  }`}>
                    {systemSettings.systemNotice.active ? 'Activo en App' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-[#86868B] mb-5">
                  Publica notificaciones importantes en la parte superior del Dashboard de todos los usuarios
                </p>

                <form onSubmit={handleSaveNotice} className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Mostrar Banner en App</span>
                    <input
                      type="checkbox"
                      checked={noticeActive}
                      onChange={(e) => setNoticeActive(e.target.checked)}
                      className="w-4 h-4 accent-[#0071E3] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Tipo de Aviso
                    </label>
                    <select
                      value={noticeType}
                      onChange={(e) => setNoticeType(e.target.value as any)}
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                    >
                      <option value="vip">VIP Exclusive (Oro &amp; Titanio)</option>
                      <option value="info">Información General (Azul)</option>
                      <option value="warning">Alerta de Seguridad (Amarillo)</option>
                      <option value="alert">Crítico / Urgente (Rojo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Título del Banner
                    </label>
                    <input
                      type="text"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="Ej. Promoción Especial Plan Black"
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Mensaje del Banner
                    </label>
                    <textarea
                      value={noticeMessage}
                      onChange={(e) => setNoticeMessage(e.target.value)}
                      rows={2}
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl p-3 text-xs text-[#1D1D1F] outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#1D1D1F] hover:bg-black text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">campaign</span>
                      <span>Guardar / Actualizar Banner</span>
                    </button>
                    {systemSettings.systemNotice.active && (
                      <button
                        type="button"
                        onClick={handleDisableNoticeQuickly}
                        className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        title="Eliminar inmediatamente el recuadro negro / banner de la app de los usuarios"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility_off</span>
                        <span>Quitar Recuadro de App</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CREDIT & FUND AUDIT LOG                                            */}
        {/* ========================================================================= */}
        {activeTab === 'credits_log' && (
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-black/[0.06] shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">
                  Auditoría de Fondos y Créditos Otorgados
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Historial contable de todas las inyecciones y deducciones realizadas por el administrador
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCreditModal()}
                  className="px-3.5 py-1.5 bg-[#0071E3] text-white rounded-full text-xs font-semibold hover:bg-[#0077ED] transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  Inyectar Fondos
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/[0.06] text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                    <th className="pb-3 px-3">Fecha &amp; Hora</th>
                    <th className="pb-3 px-3">Cliente Beneficiario</th>
                    <th className="pb-3 px-3">Monto Operación</th>
                    <th className="pb-3 px-3">Concepto Contable</th>
                    <th className="pb-3 px-3">Nota Interna de Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] text-xs">
                  {creditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#86868B]">
                        No hay registros de inyección de créditos. Usa "Inyectar Fondos" para acreditar saldo a un usuario.
                      </td>
                    </tr>
                  ) : (
                    creditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F5F5F7]/80 transition-colors">
                        <td className="py-3 px-3 text-[#86868B] font-mono text-[11px]">
                          {log.date}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1D1D1F]">
                          {log.userName}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${log.type === 'credit' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                            {log.type === 'credit' ? '+' : '-'}${Math.abs(log.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#1D1D1F]">
                          {log.concept}
                        </td>
                        <td className="py-3 px-3 text-[#86868B]">
                          {log.adminNote || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Factory Reset Danger Zone */}
            <div className="mt-8 pt-6 border-t border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-700 block">Restablecimiento de Fábrica</span>
                <span className="text-[11px] text-[#86868B]">Restaurar todos los usuarios, saldos y transacciones demo originales</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Restablecer todo el sistema a la configuración inicial demo de fábrica?')) {
                    onResetFactoryData();
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                Restaurar Datos Demo
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: SUPABASE DATABASE MANAGEMENT & SQL QUERIES */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Header & Status Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-black/[0.06] shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">database</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-[#1D1D1F]">
                        Base de Datos Supabase (PostgreSQL Cloud)
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        supabaseConnected
                          ? 'bg-[#3ECF8E]/15 text-[#15803d]'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          supabaseConnected ? 'bg-[#3ECF8E] animate-pulse' : 'bg-amber-500'
                        }`} />
                        {supabaseConnected ? 'Conectado en Vivo' : 'Comprobando Conexión...'}
                      </span>
                    </div>
                    <p className="text-xs text-[#86868B] mt-0.5 font-mono">
                      https://nrgyuposoruudmqjmysv.supabase.co
                    </p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSyncAllToSupabase}
                    disabled={isSyncingSupabase}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#3ECF8E] hover:bg-[#34b77b] text-black font-semibold rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isSyncingSupabase ? 'animate-spin' : ''}`}>
                      {isSyncingSupabase ? 'refresh' : 'sync'}
                    </span>
                    <span>{isSyncingSupabase ? 'Sincronizando Usuarios...' : 'Sincronizar a Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedSql ? 'check_circle' : 'content_copy'}
                    </span>
                    <span>{copiedSql ? '¡Query Copiado!' : 'Copiar Query SQL'}</span>
                  </button>
                </div>
              </div>

              {/* Status Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/[0.04]">
                  <div className="flex items-center justify-between text-xs text-[#86868B] mb-1">
                    <span>Usuarios en Supabase</span>
                    <span className="material-symbols-outlined text-[18px] text-[#3ECF8E]">group</span>
                  </div>
                  <span className="text-2xl font-bold text-[#1D1D1F] block">
                    {supabaseUserCount}
                  </span>
                  <span className="text-[11px] text-[#86868B] block mt-0.5">
                    Expedientes registrados en la tabla `profiles`
                  </span>
                </div>

                <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/[0.04]">
                  <div className="flex items-center justify-between text-xs text-[#86868B] mb-1">
                    <span>Arquitectura de Enlace</span>
                    <span className="material-symbols-outlined text-[18px] text-[#0071E3]">hub</span>
                  </div>
                  <span className="text-base font-bold text-[#1D1D1F] block">
                    Dual-Write en Tiempo Real
                  </span>
                  <span className="text-[11px] text-[#86868B] block mt-0.5">
                    Guarda en Supabase + Firestore simultáneamente
                  </span>
                </div>

                <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/[0.04]">
                  <div className="flex items-center justify-between text-xs text-[#86868B] mb-1">
                    <span>Protocolo de Conexión</span>
                    <span className="material-symbols-outlined text-[18px] text-[#5856D6]">security</span>
                  </div>
                  <span className="text-base font-bold text-[#1D1D1F] block">
                    PostgREST API REST / TLS
                  </span>
                  <span className="text-[11px] text-[#86868B] block mt-0.5">
                    Anon Key activa con RLS configurado
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction Box: How to Run in Supabase */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-3xl p-6">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">terminal</span>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-bold text-emerald-950">
                    ¿Cómo aplicar o actualizar el esquema en tu panel de Supabase?
                  </h4>
                  <ol className="text-xs text-emerald-900/90 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>
                      Ingresa al dashboard de tu proyecto en{' '}
                      <a
                        href="https://supabase.com/dashboard/project/nrgyuposoruudmqjmysv"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-emerald-900 hover:text-emerald-700"
                      >
                        supabase.com/dashboard
                      </a>.
                    </li>
                    <li>
                      En la barra lateral izquierda, haz clic en el icono del <strong>SQL Editor</strong> (icono de consola <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">&gt;_</code>).
                    </li>
                    <li>
                      Haz clic en el botón <strong>"New Query"</strong>.
                    </li>
                    <li>
                      Haz clic en el botón azul de arriba <strong>"Copiar Query SQL"</strong> y pégalo en el editor de Supabase.
                    </li>
                    <li>
                      Presiona el botón verde <strong>"RUN"</strong> (o <kbd className="bg-emerald-100 px-1 rounded font-mono">Ctrl+Enter</kbd>).
                    </li>
                  </ol>
                  <p className="text-[11px] text-emerald-800 font-medium pt-1">
                    * El query incluye protección idempotente (<code className="font-mono">CREATE TABLE IF NOT EXISTS</code> y <code className="font-mono">ADD COLUMN IF NOT EXISTS</code>), por lo que puedes ejecutarlo tantas veces como quieras sin borrar datos existentes.
                  </p>
                </div>
              </div>
            </div>

            {/* SQL Script Viewer */}
            <div className="bg-[#1E1E24] rounded-3xl p-6 text-white border border-white/10 shadow-lg">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#3ECF8E] text-[20px]">code</span>
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    supabase_schema_migration.sql
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedSql ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedSql ? 'Copiado' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[380px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <pre className="text-[12px] font-mono leading-relaxed text-[#3ECF8E]/90 whitespace-pre">
                  {SUPABASE_SQL_MIGRATION}
                </pre>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / DEDUCT CREDITS                                             */}
      {/* ========================================================================= */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">paid</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1D1D1F]">
                    Inyectar o Deducir Fondos
                  </h3>
                  <p className="text-xs text-[#86868B]">
                    Ajuste administrativo de liquidez con impacto inmediato en el saldo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Usuario Destinatario
                </label>
                <select
                  value={selectedUserForCredit}
                  onChange={(e) => setSelectedUserForCredit(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1D1D1F] outline-none transition-all cursor-pointer"
                >
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — Saldo actual: ${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Tipo de Ajuste
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-black/[0.04] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCreditType('credit')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      creditType === 'credit' ? 'bg-white text-[#34C759] shadow-xs' : 'text-[#86868B]'
                    }`}
                  >
                    + Acreditar Fondos
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditType('debit')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      creditType === 'debit' ? 'bg-white text-[#FF3B30] shadow-xs' : 'text-[#86868B]'
                    }`}
                  >
                    - Deducir Fondos
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Monto a Transferir (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-[#86868B]">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-[#1D1D1F] outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {['500', '1000', '5000', '10000', '50000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCreditAmount(preset)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        creditAmount === preset
                          ? 'bg-[#0071E3] text-white font-bold'
                          : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      +${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Concepto / Motivo
                </label>
                <select
                  value={creditConcept}
                  onChange={(e) => setCreditConcept(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1D1D1F] outline-none cursor-pointer"
                >
                  <option value="Acreditación administrativa">Acreditación administrativa</option>
                  <option value="Bono de bienvenida Black Titanium VIP">Bono de bienvenida Black Titanium VIP</option>
                  <option value="Préstamo privado aprobado">Préstamo privado aprobado</option>
                  <option value="Rendimiento de fondos de inversión">Rendimiento de fondos de inversión</option>
                  <option value="Ajuste de saldo contable">Ajuste de saldo contable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Nota Interna de Auditoría
                </label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Ej. Aprobado por tesorería central Banca Nova"
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2 text-xs text-[#1D1D1F] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-98"
                >
                  Ejecutar Ajuste de Fondos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE NEW USER WITH PLAN & INITIAL CARD THEME                    */}
      {/* ========================================================================= */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1D1D1F]">
                    Registrar Nuevo Cliente
                  </h3>
                  <p className="text-xs text-[#86868B]">
                    Crear expediente bancario con emisión de tarjeta automática
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitNewUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Rodrigo Santana"
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1D1D1F] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="r.santana@cliente.com"
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Plan / Nivel
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      const role = e.target.value as PlanTier;
                      setNewUserRole(role);
                      setNewUserTheme(role === 'Black' ? 'obsidian' : role === 'Business' ? 'gold' : 'sapphire');
                    }}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                  >
                    <option value="Black">Black Titanium VIP ($199/m)</option>
                    <option value="Business">Business Gold ($49/m)</option>
                    <option value="Personal">Personal Sapphire ($0/m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Acabado de Tarjeta
                  </label>
                  <select
                    value={newUserTheme}
                    onChange={(e) => setNewUserTheme(e.target.value as CardTheme)}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                  >
                    <option value="obsidian">Obsidiana (Black VIP)</option>
                    <option value="titanium">Titanio Black</option>
                    <option value="gold">Oro 24K (Business)</option>
                    <option value="sapphire">Zafiro (Personal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Saldo Inicial ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newUserBalance}
                  onChange={(e) => setNewUserBalance(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1F] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-98"
                >
                  Crear Cliente y Emitir Tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT FULL USER RECORD                                            */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-xl border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F]">
                  Editar Expediente de {editingUser.name}
                </h3>
                <p className="text-xs text-[#86868B]">
                  Modificación de credenciales, balance, plan y especificaciones de tarjeta
                </p>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Saldo ($ USD)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingUser.balance}
                    onChange={(e) => setEditingUser({ ...editingUser, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Plan / Rol</label>
                  <select
                    value={editingUser.role === 'Premium' ? 'Black' : editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as PlanTier })}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none"
                  >
                    <option value="Black">Black Titanium VIP</option>
                    <option value="Business">Business Gold</option>
                    <option value="Personal">Personal Sapphire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Acabado de Tarjeta</label>
                  <select
                    value={editingUser.cardTheme || 'obsidian'}
                    onChange={(e) => setEditingUser({ ...editingUser, cardTheme: e.target.value as CardTheme })}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none"
                  >
                    <option value="obsidian">Obsidiana (Black VIP)</option>
                    <option value="titanium">Titanio Black</option>
                    <option value="gold">Oro 24K (Business)</option>
                    <option value="sapphire">Zafiro (Personal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Estado de Cuenta</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">IBAN / Cuenta</label>
                <input
                  type="text"
                  value={editingUser.accountNumber || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, accountNumber: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-[#1D1D1F] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE MANUAL TRANSACTION                                        */}
      {/* ========================================================================= */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F]">
                  Crear Transacción Manual
                </h3>
                <p className="text-xs text-[#86868B]">
                  Inyectar movimiento en el extracto bancario
                </p>
              </div>

              <button
                onClick={() => setIsTxModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitManualTx} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Usuario</label>
                <select
                  value={txUserId}
                  onChange={(e) => setTxUserId(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                >
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Concepto / Título</label>
                <input
                  type="text"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  placeholder="Ej. Compra Joyería Cartier"
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Monto ($ USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1F] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Tipo</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                  >
                    <option value="withdrawal">Retiro / Cargo (-)</option>
                    <option value="deposit">Depósito / Ingreso (+)</option>
                    <option value="transfer">Transferencia (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Categoría</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                  >
                    <option value="Compras">Compras</option>
                    <option value="Supermercado">Supermercado</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Nómina">Nómina</option>
                    <option value="Restaurante">Restaurante</option>
                    <option value="Ocio">Ocio</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Estado</label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                  >
                    <option value="completed">Completada</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Registrar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: GLOBAL NOTICE BANNER BROADCAST                                   */}
      {/* ========================================================================= */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F]">
                  Aviso Global del Sistema
                </h3>
                <p className="text-xs text-[#86868B]">
                  Difunde un banner en tiempo real en los paneles de clientes
                </p>
              </div>

              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3.5">
              <div className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl">
                <span className="text-xs font-semibold text-[#1D1D1F]">Activar Banner en Dashboards</span>
                <input
                  type="checkbox"
                  checked={noticeActive}
                  onChange={(e) => setNoticeActive(e.target.checked)}
                  className="w-4 h-4 accent-[#0071E3] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Estilo de Alerta</label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as any)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                >
                  <option value="vip">VIP Exclusive (Oro / Obsidiana)</option>
                  <option value="info">Información General (Azul)</option>
                  <option value="warning">Alerta Preventiva (Amarillo)</option>
                  <option value="alert">Crítico (Rojo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Título</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Mensaje</label>
                <textarea
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl p-3 text-xs text-[#1D1D1F] outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Guardar y Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
