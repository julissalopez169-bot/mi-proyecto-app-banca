import React, { useState, useMemo } from 'react';
import { ScreenType, AdminUser } from '../types';
import { formatLempiras } from '../lib/currency';
import { authenticateBiometric, hasBiometricCredential } from '../lib/biometrics';

interface TransfersViewProps {
  balance: number;
  userId: string;
  allUsers?: AdminUser[];
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
  onExecuteTransfer: (destination: string, amount: number, concept: string) => void;
  onNavigate: (screen: ScreenType) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  balance,
  userId,
  allUsers = [],
  onExecuteTransfer,
  onNavigate,
  onShowToast,
}) => {
  const [destination, setDestination] = useState('');
  const [transferMode, setTransferMode] = useState<'username' | 'account'>('username');
  const [amount, setAmount] = useState<string>('');
  const [concept, setConcept] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const projectedBalance = balance - numAmount;

  // Other available registered users (excluding current user)
  const otherUsers = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.id !== userId &&
        (u.email || '').toLowerCase() !== userId.toLowerCase() &&
        (u.username || '').toLowerCase() !== userId.toLowerCase()
    );
  }, [allUsers, userId]);

  // Real-time matched recipient detection
  const matchedRecipient = useMemo(() => {
    const raw = destination.trim();
    if (!raw) return null;
    const clean = raw.toLowerCase().replace(/^@/, '');
    const cleanNoSpace = raw.toLowerCase().replace(/\s+/g, '');

    return otherUsers.find((u) => {
      const uUsername = (u.username || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uAcc = (u.accountNumber || '').toLowerCase().replace(/\s+/g, '');

      return (
        (uUsername && uUsername === clean) ||
        (uName && uName === clean) ||
        (uEmail && uEmail === clean) ||
        (uAcc && (uAcc === cleanNoSpace || cleanNoSpace.includes(uAcc) || uAcc.includes(cleanNoSpace)))
      );
    }) || null;
  }, [destination, otherUsers]);

  const handleSelectContact = (userItem: AdminUser) => {
    if (transferMode === 'username') {
      setDestination(`@${userItem.username || userItem.name.toLowerCase().replace(/\s+/g, '')}`);
    } else {
      setDestination((userItem.accountNumber || '').replace(/^HN\d*\s*/i, ''));
    }
    setErrorMsg(null);
  };

  const handleValidateAndReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (balance <= 0) {
      setErrorMsg('No puedes hacer transferencias porque no tienes saldo disponible.');
      return;
    }
    if (!destination.trim()) {
      setErrorMsg(
        transferMode === 'username'
          ? 'Por favor ingresa el nombre de usuario de destino (@usuario).'
          : 'Por favor ingresa el número de cuenta de destino.'
      );
      return;
    }
    if (numAmount <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a L. 0.00.');
      return;
    }
    if (numAmount > balance) {
      setErrorMsg('El monto excede el saldo disponible en tu cuenta.');
      return;
    }

    setErrorMsg(null);
    setShowConfirmation(true);
  };

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    if (hasBiometricCredential(userId)) {
      try {
        const verified = await authenticateBiometric(userId);
        if (!verified) throw new Error('No se pudo verificar tu identidad.');
      } catch (error: any) {
        setIsSubmitting(false);
        onShowToast('Pago no autorizado', error.message || 'Confirma con tu huella o Face ID para continuar.', 'error');
        return;
      }
    }
    setTimeout(() => {
      onExecuteTransfer(
        destination,
        numAmount,
        concept.trim() || 'Transferencia Digital Honduras'
      );
      setIsSubmitting(false);
      setShowConfirmation(false);
      setDestination('');
      setAmount('');
      setConcept('');
      onNavigate('dashboard');
    }, 500);
  };

  return (
    <div className="flex-1 md:ml-64 min-h-screen overflow-y-auto pt-20 md:pt-8 pb-24 md:pb-16 px-4 md:px-10 bg-[#F5F5F7] text-[#1D1D1F]">
      <div className="max-w-[1020px] mx-auto flex flex-col gap-6 md:gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#86868B] tracking-wide uppercase">
              Operaciones Interbancarias
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Transferencias en Lempiras
            </h1>
          </div>

          {/* Balance Preview Badge */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-black/[0.06] shadow-2xs">
            <span className="text-xs font-medium text-[#86868B]">Saldo disponible:</span>
            <span className="text-sm font-bold text-[#1D1D1F]">
              {formatLempiras(balance)}
            </span>
          </div>
        </div>

        {/* Form and Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Main Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            
            {/* Mode Switcher Tabs */}
            <div className="flex gap-1 p-1 mb-6 bg-[#F5F5F7] rounded-full border border-black/[0.03]">
              <button
                type="button"
                onClick={() => {
                  setTransferMode('username');
                  if (matchedRecipient) {
                    setDestination(`@${matchedRecipient.username || matchedRecipient.name.toLowerCase().replace(/\s+/g, '')}`);
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  transferMode === 'username'
                    ? 'bg-white text-[#0071E3] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                <span>Por Usuario</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransferMode('account');
                  if (matchedRecipient) {
                    setDestination(matchedRecipient.accountNumber);
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  transferMode === 'account'
                    ? 'bg-white text-[#0071E3] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">pin</span>
                <span>Por Número de Cuenta</span>
              </button>
            </div>

            {/* Quick Contacts Section from Real Users */}
            {otherUsers.length > 0 && (
              <div className="mb-6 pb-6 border-b border-black/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#86868B]">
                    Usuarios Registrados Disponibles:
                  </span>
                  <span className="text-[11px] text-[#0071E3] font-medium">
                    Clic para autocompletar
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {otherUsers.map((u) => {
                    const uname = u.username || u.name.toLowerCase().replace(/\s+/g, '');
                    const isSelected =
                      matchedRecipient?.id === u.id ||
                      destination.toLowerCase().includes(uname.toLowerCase()) ||
                      destination.includes(u.accountNumber);

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectContact(u)}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#0071E3] shadow-2xs'
                            : 'bg-[#F5F5F7] hover:bg-black/[0.04] border-black/[0.03]'
                        }`}
                      >
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1D1D1F] truncate leading-tight">
                            {u.name.split(' ')[0]}
                          </p>
                          <span className="text-[10px] font-medium text-[#0071E3] truncate block">
                            @{uname}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleValidateAndReview} className="space-y-4">
              {/* Destination Input */}
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  {transferMode === 'username'
                    ? 'Nombre de Usuario de Destino'
                    : 'Número de Cuenta Bancaria (Honduras)'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
                    {transferMode === 'username' ? 'alternate_email' : 'account_balance'}
                  </span>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder={
                      transferMode === 'username'
                        ? 'Ej. @carlos, @elena o nombre'
                        : 'Ej. 0182 9901 6086 9528'
                    }
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm text-[#1D1D1F] outline-none transition-all"
                  />
                </div>

                {/* Recipient Live Verification Preview Card */}
                {matchedRecipient && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={matchedRecipient.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                        alt={matchedRecipient.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-emerald-300"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-950 truncate">
                            {matchedRecipient.name}
                          </span>
                          <span className="material-symbols-outlined text-emerald-600 text-[14px]">
                            verified
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 truncate">
                          @{matchedRecipient.username || matchedRecipient.name.toLowerCase().replace(/\s+/g, '')} • Cuenta: {matchedRecipient.accountNumber}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 uppercase tracking-wide">
                      Verificado
                    </span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    Importe a Transferir (Lempiras)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(balance.toString())}
                    className="text-[11px] font-semibold text-[#0071E3] hover:underline cursor-pointer"
                  >
                    Usar saldo máximo
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#86868B]">
                    L.
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-12 pr-4 py-3.5 text-2xl font-bold text-[#1D1D1F] outline-none transition-all"
                  />
                </div>

                {/* Amount quick presets */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {['100', '500', '1000', '2500', '5000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        amount === preset
                          ? 'bg-[#0071E3] text-white shadow-xs'
                          : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-blue-50'
                      }`}
                    >
                      L. {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concept */}
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Concepto de la Transferencia
                </label>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej. Honorarios profesionales, Pago de servicios, etc."
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl px-4 py-3 text-sm text-[#1D1D1F] outline-none transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-semibold transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Continuar y Revisar
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary Card (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-6">
            <h3 className="text-base font-semibold text-[#1D1D1F]">
              Resumen de la Operación
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-2 border-b border-black/[0.04]">
                <span className="text-[#86868B]">Comisión ACH Honduras</span>
                <span className="font-semibold text-[#34C759]">Gratis (L. 0.00)</span>
              </div>

              <div className="flex justify-between py-2 border-b border-black/[0.04]">
                <span className="text-[#86868B]">Plazo de Acreditación</span>
                <span className="font-semibold text-[#1D1D1F]">Inmediata (ACH Pronto)</span>
              </div>

              <div className="flex justify-between py-2 border-b border-black/[0.04]">
                <span className="text-[#86868B]">Saldo Actual</span>
                <span className="font-semibold text-[#1D1D1F]">
                  {formatLempiras(balance)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-black/[0.04]">
                <span className="text-[#86868B]">Saldo Resultante</span>
                <span className={`font-bold ${projectedBalance < 0 ? 'text-[#FF3B30]' : 'text-[#1D1D1F]'}`}>
                  {formatLempiras(projectedBalance >= 0 ? projectedBalance : 0)}
                </span>
            </div>
          </div>

          </div>
        </div>

      </div>

      {/* Review & Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] mx-auto flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>

            <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F] text-center mb-1">
              Confirmar Transferencia
            </h3>
            <p className="text-xs text-[#86868B] text-center mb-6">
              Por favor revisa los detalles antes de autorizar la emisión de fondos
            </p>

            <div className="bg-[#F5F5F7] rounded-2xl p-4 space-y-2.5 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-[#86868B]">Destinatario:</span>
                <span className="font-semibold text-[#1D1D1F] truncate max-w-[200px]">
                  {matchedRecipient ? `${matchedRecipient.name} (@${matchedRecipient.username || matchedRecipient.name})` : destination}
                </span>
              </div>
              {matchedRecipient && (
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Cuenta Destino:</span>
                  <span className="font-medium text-[#1D1D1F]">{matchedRecipient.accountNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#86868B]">Importe:</span>
                <span className="font-bold text-base text-[#1D1D1F]">{formatLempiras(numAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Concepto:</span>
                <span className="font-medium text-[#1D1D1F]">{concept || 'Transferencia Digital Honduras'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Comisión ACH:</span>
                <span className="font-semibold text-[#34C759]">L. 0.00</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="w-1/2 py-3 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
              >
                Modificar
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isSubmitting}
                className="w-1/2 py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                {isSubmitting ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Autorizar Envío
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
