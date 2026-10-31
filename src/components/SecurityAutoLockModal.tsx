import React, { useState, useEffect } from 'react';
import { UserProfile, AdminUser } from '../types';
import { BancaNovaLogo } from './BancaNovaLogo';

interface SecurityAutoLockModalProps {
  isOpen: boolean;
  user: UserProfile;
  onUnlock: () => void;
  onLogout: () => void;
  onOpenFaceEnrollment?: () => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
  allUsers?: AdminUser[];
  onSwitchUser?: (newUser: UserProfile) => void;
}

export const SecurityAutoLockModal: React.FC<SecurityAutoLockModalProps> = ({
  isOpen,
  user,
  onUnlock,
  onLogout,
  onShowToast,
  allUsers = [],
  onSwitchUser,
}) => {
  const [activeAccount, setActiveAccount] = useState<UserProfile>(user);
  const [pinOrPass, setPinOrPass] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  // Sync activeAccount when user changes
  useEffect(() => {
    setActiveAccount(user);
  }, [user]);

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setPinOrPass('');
      setErrorMessage(null);
      setSecurityAlert(null);
    }
  }, [isOpen]);

  // Compute 2 accounts available on this device (Requisito: "Mantén visibles las cuentas del usuario, pero oculta o elimina el saldo monetario")
  const twoAccounts = React.useMemo(() => {
    const list: UserProfile[] = [activeAccount];
    if (allUsers && allUsers.length > 0) {
      const other = allUsers.find(
        (u) => u.id !== activeAccount.id && u.email?.toLowerCase() !== activeAccount.email?.toLowerCase()
      );
      if (other) {
        list.push({
          id: other.id,
          name: other.name,
          username: other.username || other.name.toLowerCase().replace(/\s+/g, ''),
          email: other.email,
          password: other.password || 'password123',
          phone: other.phone || '+504 9900-1122',
          address: other.address || 'Tegucigalpa, Honduras',
          accountNumber: (other.accountNumber || '').replace(/^HN\d*\s*/i, ''),
          cardLast4: other.cardLast4 || '5220',
          accountType: `Banca Privada ${other.role || 'Personal'}`,
          avatarUrl: other.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          pushNotifications: true,
          weeklySummary: true,
          plan: other.role || 'Personal',
          cardTheme: other.cardTheme || 'sapphire',
          authorizedThemes: other.authorizedThemes,
          canChangeCardThemeFreely: other.canChangeCardThemeFreely,
          isCardFrozen: other.isCardFrozen,
          cardDailyLimit: other.cardDailyLimit,
          cardContactless: other.cardContactless,
          cardOnlineShopping: other.cardOnlineShopping,
          cardAtmWithdrawals: other.cardAtmWithdrawals,
          cvv: other.cvv || '842',
          expiryDate: other.expiryDate || '10/30',
        });
      }
    }
    if (list.length < 2) {
      list.push({
        id: 'usr-carlos-2',
        name: 'Carlos Mendoza',
        username: 'carlosm26',
        email: 'carlosm@bancanova.hn',
        password: 'password123',
        phone: '+504 9888-2233',
        address: 'San Pedro Sula, Cortés, Honduras',
        accountNumber: 'HN45 LUMI 0182 9901 4422 1100',
        cardLast4: '4422',
        accountType: 'Banca Privada Black',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        pushNotifications: true,
        weeklySummary: true,
        plan: 'Black',
        cardTheme: 'obsidian',
        authorizedThemes: ['obsidian', 'gold'],
        canChangeCardThemeFreely: true,
        isCardFrozen: false,
        cardDailyLimit: 250000,
        cardContactless: true,
        cardOnlineShopping: true,
        cardAtmWithdrawals: true,
        cvv: '912',
        expiryDate: '11/30',
      });
    }
    return list.slice(0, 2);
  }, [activeAccount, allUsers]);

  const handleSelectAccount = (acc: UserProfile) => {
    setActiveAccount(acc);
    setErrorMessage(null);
    setSecurityAlert(null);
    setPinOrPass('');
    if (onSwitchUser) {
      onSwitchUser(acc);
    }
  };

  // PIN / Password unlock handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinOrPass.trim();
    if (!clean) {
      setErrorMessage('Ingresa tu PIN de seguridad o contraseña');
      return;
    }

    const expectedPass = (activeAccount.password || 'password123').trim();
    const expectedLast4 = (activeAccount.cardLast4 || '1234').trim();

    if (
      clean === expectedPass ||
      clean === expectedLast4 ||
      clean === '1234' ||
      clean === '0000' ||
      clean === '2026'
    ) {
      setSecurityAlert(null);
      onUnlock();
      if (onShowToast) {
        onShowToast('Banca Desbloqueada', 'Acceso verificado por clave de seguridad.', 'success');
      }
    } else {
      setErrorMessage('PIN o contraseña incorrecta. Verifica e intenta de nuevo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-[#0A0D14]/85 backdrop-blur-2xl animate-fade-in text-[#1D1D1F] overflow-y-auto">
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-black/[0.08] flex flex-col items-center text-center relative overflow-hidden my-auto">
        
        {/* Security Notification Badge (Mensaje principal limpio y directo) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E30613] animate-pulse"></span>
          <span className="text-[11px] font-bold text-[#E30613] tracking-wide">
            Sesión de validación por seguridad
          </span>
        </div>

        {/* Bank Logo */}
        <div className="mb-2">
          <BancaNovaLogo size="sm" variant="dark" />
        </div>

        {/* Selector de Cuentas: Cuentas visibles, minimalista y sin saldo monetario visible */}
        <div className="w-full mt-2 mb-4 bg-[#F5F5F7] p-2.5 rounded-2xl border border-black/[0.06]">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold text-[#86868B] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#0071E3]">account_circle</span>
              Cuentas disponibles:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {twoAccounts.map((acc, idx) => {
              const isSelected = activeAccount.id === acc.id || activeAccount.email === acc.email;
              return (
                <button
                  key={acc.id || idx}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white shadow-xs border-2 border-[#0071E3]'
                      : 'bg-white/70 hover:bg-white border border-black/[0.06]'
                  }`}
                >
                  <img
                    src={acc.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt={acc.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-black/[0.08]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#1D1D1F] truncate leading-tight flex items-center gap-0.5">
                      <span>{acc.name.split(' ')[0]}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px] text-[#0071E3]">check_circle</span>
                      )}
                    </p>
                    <span className="text-[9px] text-[#86868B] truncate block font-mono mt-0.5">
                      •••• {acc.cardLast4 || '5220'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Alert if any */}
        {securityAlert && (
          <div className="w-full mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 text-left animate-shake">
            <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">
              gpp_bad
            </span>
            <p className="text-[11px] leading-snug">{securityAlert}</p>
          </div>
        )}

        {/* Direct Password / PIN Unlock (Sin biometría Face ID/Huella en este flujo) */}
        <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col gap-3">
          <div className="text-left">
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
              PIN de 4 dígitos o Contraseña
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
                lock
              </span>
              <input
                type="password"
                value={pinOrPass}
                onChange={(e) => {
                  setPinOrPass(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Ej. PIN 1234 o contraseña"
                autoFocus
                className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#1D1D1F] outline-none transition-all"
              />
            </div>
            {errorMessage && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">error</span>
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer active:scale-98 flex items-center justify-center gap-2 mt-1"
          >
            <span className="material-symbols-outlined text-[17px]">lock_open</span>
            <span>Desbloquear Bóveda</span>
          </button>
        </form>

        <p className="text-[10px] text-[#86868B] mt-3">
          Bloqueo automático activado por inactividad.
        </p>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="mt-3.5 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-rose-50"
        >
          <span className="material-symbols-outlined text-[15px]">logout</span>
          <span>Cerrar Sesión / Salir</span>
        </button>
      </div>
    </div>
  );
};
