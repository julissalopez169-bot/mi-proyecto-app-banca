import React, { useState, useEffect } from 'react';
import { UserProfile, ScreenType } from '../types';
import { RealisticBankCard } from './RealisticBankCard';
import {
  hasBiometricCredential,
  registerBiometric,
  removeBiometric,
  supportsBiometrics,
  supportsPlatformBiometrics,
  getDeviceBiometricInfo,
  DeviceBiometricInfo,
} from '../lib/biometrics';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ScreenType) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenFaceEnrollment?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateProfile,
  onNavigate,
  onShowToast,
  onOpenAuthModal,
  onLogout,
  onOpenFaceEnrollment,
}) => {
  const [username, setUsername] = useState(user.username || user.name.toLowerCase().replace(/\s+/g, ''));
  const [email, setEmail] = useState(user.email);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pushNotifs, setPushNotifs] = useState(user.pushNotifications);
  const [biometricEnabled, setBiometricEnabled] = useState(() => hasBiometricCredential(user.id || user.email));
  const [deviceBioInfo, setDeviceBioInfo] = useState<DeviceBiometricInfo | null>(null);

  useEffect(() => {
    getDeviceBiometricInfo(user.id || user.email).then(setDeviceBioInfo);
  }, [user.id, user.email]);

  const handleSavePersonalData = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      username: username.replace(/^@/, '').trim(),
      email: email.trim(),
    });
    onShowToast('Credenciales Actualizadas', 'Tu usuario y correo de inicio de sesión han sido guardados.', 'success');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      onShowToast('Error', 'Por favor ingresa tu contraseña actual.', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      onShowToast('Error', 'La nueva contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('Error', 'Las contraseñas nuevas no coinciden.', 'error');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onShowToast('Seguridad', 'Tu contraseña ha sido actualizada con éxito.', 'success');
  };

  const handleTogglePush = () => {
    const newVal = !pushNotifs;
    setPushNotifs(newVal);
    onUpdateProfile({ pushNotifications: newVal });
    onShowToast('Notificaciones', newVal ? 'Notificaciones push activadas.' : 'Notificaciones push desactivadas.', 'info');
  };



  const handleToggleBiometrics = async () => {
    const newVal = !biometricEnabled;
    const credentialUserId = user.id || user.email;
    if (newVal) {
      if (!supportsBiometrics() || !(await supportsPlatformBiometrics())) {
        onShowToast('Biometría no disponible', 'Usa HTTPS o localhost y un dispositivo con huella digital o Face ID.', 'error');
        return;
      }
      try {
        await registerBiometric(credentialUserId, user.name);
        setBiometricEnabled(true);
        onShowToast('Biometría activada', 'Ahora podrás autorizar pagos con huella digital o Face ID.', 'success');
      } catch (error: any) {
        onShowToast('No se activó la biometría', error.message || 'La operación fue cancelada.', 'error');
      }
      return;
    }
    removeBiometric(credentialUserId);
    setBiometricEnabled(false);
    onShowToast('Biometría desactivada', 'Los pagos volverán a requerir autorización normal.', 'info');
  };

  const userInitials = (user.name || 'BN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="flex-1 md:ml-64 min-h-screen overflow-y-auto pt-20 md:pt-8 pb-24 md:pb-16 px-4 md:px-10 bg-[#F5F5F7] text-[#1D1D1F]">
      <div className="max-w-[1020px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#86868B] tracking-wide uppercase">
              Ajustes de Cuenta &amp; Identidad
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Perfil &amp; Seguridad
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F] bg-white border border-black/[0.08] px-3.5 py-1.5 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Verificación KYC Nivel 3 VIP
            </span>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white border border-black/[0.08] text-[#86868B] hover:text-[#0071E3] hover:border-[#0071E3]/30 transition-colors shadow-2xs cursor-pointer"
              title="Abrir consola administrativa"
              aria-label="Abrir consola administrativa"
            >
              <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
            </button>
          </div>
        </div>

        {/* User Identity Banner (Official Banking Identity without photo edit) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-black/[0.06] shadow-xs flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#0071E3] to-[#0284C7] shadow-md flex items-center justify-center text-white font-bold text-2xl tracking-wider ring-4 ring-white">
              {userInitials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[12px] shadow-xs" title="Identidad Verificada CNBS">
              <span className="material-symbols-outlined text-[14px]">verified</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-[#1D1D1F]">
                {user.name}
              </h2>
              <span className="text-xs font-bold bg-black/[0.06] text-[#1D1D1F] border border-black/[0.06] px-2.5 py-0.5 rounded-full">
                {user.accountType} VIP
              </span>
            </div>
            <p className="text-xs text-[#86868B]">
              {user.email} • Titular Principal Banca Nova Honduras
            </p>
            <p className="text-[11px] font-mono text-[#86868B] mt-1 font-medium">
              Cuenta: {(user.accountNumber || '').replace(/^HN\d*\s*/i, '')}
            </p>

            <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Cuenta Verificada CNBS
              </span>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Personal Data & Security (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Personal Data Form - Únicamente datos para iniciar sesión (correo o nombre de usuario) */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Información Personal de Acceso
                </h3>
                <span className="text-[11px] font-semibold text-[#0071E3] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Credenciales de Inicio de Sesión
                </span>
              </div>
              <p className="text-xs text-[#86868B] mb-5">
                Datos principales que utilizas para acceder de forma segura a tu banca digital.
              </p>

              <form onSubmit={handleSavePersonalData} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                    Nombre de Usuario (@)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
                      alternate_email
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="usuario"
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-[#1D1D1F] outline-none transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-[#86868B] mt-1 block">
                    Utiliza este identificador único para iniciar sesión en tu cuenta.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
                      mail
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@bancanova.hn"
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1D1D1F] outline-none transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-[#86868B] mt-1 block">
                    Correo registrado para confirmaciones y acceso a la banca.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-98"
                  >
                    Guardar Datos de Acceso
                  </button>
                </div>
              </form>
            </div>

            {/* Password Update Form */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="text-base font-semibold text-[#1D1D1F] mb-4">
                Seguridad &amp; Credenciales
              </h3>

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1D1D1F] hover:bg-black text-white rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-98"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column: iOS-style Toggles & App Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Linked Titanium Card Preview */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
                    Instrumento Activo
                  </span>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Tarjeta Digital Vinculada
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full">
                  Verificada
                </span>
              </div>

              <RealisticBankCard
                cardHolderName={user.name}
                cardLast4={user.cardLast4}
                expiryDate="10/29"
                showControls={true}
                size="md"
              />
            </div>

            {/* Preferences & Toggles Card */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="text-base font-semibold text-[#1D1D1F] mb-4">
                Preferencias de la Bóveda
              </h3>

              <div className="space-y-4">
                {/* Push Notifications Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-black/[0.04]">
                  <div>
                    <span className="text-xs font-semibold text-[#1D1D1F] block">
                      Notificaciones Push
                    </span>
                    <span className="text-[11px] text-[#86868B] block mt-0.5">
                      Alertas de transferencias e ingresos en tiempo real
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePush}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      pushNotifs ? 'bg-[#0071E3]' : 'bg-[#E8E8ED]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        pushNotifs ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Biometrics Toggle - Linked with Phone Biometrics */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-xs font-semibold text-[#1D1D1F] block">
                      {deviceBioInfo?.sensorName || 'Sensor Biométrico de tu Celular'}
                    </span>
                    <span className="text-[11px] text-[#86868B] block mt-0.5">
                      Autenticación de dispositivo de alta seguridad (WebAuthn / Passkeys)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleBiometrics}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      biometricEnabled ? 'bg-[#0071E3]' : 'bg-[#E8E8ED]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Account & Session Management Box */}
            <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-3">
              <div>
                <span className="text-xs font-semibold text-[#1D1D1F] block uppercase tracking-wider">
                  Gestión de Sesión
                </span>
                <p className="text-[11px] text-[#86868B] mt-0.5">
                  Cambia de usuario o cierra tu sesión de forma segura.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0071E3] border border-blue-200/80 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">login</span>
                    <span>Cambiar Cuenta</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">logout</span>
                    <span>Cerrar Sesión</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
