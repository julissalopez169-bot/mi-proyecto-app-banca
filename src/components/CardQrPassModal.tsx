import React, { useState, useEffect } from 'react';
import { UserProfile, CardTheme, UserCard } from '../types';
import { BancaNovaLogo } from './BancaNovaLogo';
import { authenticateBiometric, hasBiometricCredential } from '../lib/biometrics';

interface CardQrPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  activeCard?: UserCard;
  balance?: number;
  userId?: string;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
  onSimulatePayment?: (amount: number, merchant: string) => void;
}

export const CardQrPassModal: React.FC<CardQrPassModalProps> = ({
  isOpen,
  onClose,
  user,
  activeCard,
  balance = 124590.0,
  userId,
  onShowToast,
  onSimulatePayment,
}) => {
  // Mode: 'pass' (Default Contactless Pay QR), 'atm' (Option 1: Retiro en Cajero ATM), 'receive' (Option 2: Cobrar/Recibir QR)
  const [activeQrMode, setActiveQrMode] = useState<'pass' | 'atm' | 'receive'>('pass');
  
  // Dynamic banking token states
  const [tokenTimer, setTokenTimer] = useState(60);
  const [securityToken, setSecurityToken] = useState('BN-9428-7104');
  const [copiedToken, setCopiedToken] = useState(false);
  const [maxBrightness, setMaxBrightness] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // ATM Withdrawal States (Option 1)
  const [atmAmount, setAtmAmount] = useState<number>(200);
  const [atmPinCode, setAtmPinCode] = useState<string>('842 190');
  const [atmSuccess, setAtmSuccess] = useState(false);

  // Receive Transfer States (Option 2)
  const [receiveAmount, setReceiveAmount] = useState<string>('150.00');
  const [receiveConcept, setReceiveConcept] = useState<string>('Pago con QR Nova');
  const [receiveSuccess, setReceiveSuccess] = useState(false);

  // Generate dynamic OTP token
  const generateNewToken = () => {
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    setSecurityToken(`BN-${p1}-${p2}`);
    const pin1 = Math.floor(100 + Math.random() * 900);
    const pin2 = Math.floor(100 + Math.random() * 900);
    setAtmPinCode(`${pin1} ${pin2}`);
    setTokenTimer(60);
  };

  useEffect(() => {
    if (!isOpen) {
      setPaymentSuccess(null);
      setSimulating(false);
      setAtmSuccess(false);
      setReceiveSuccess(false);
      setActiveQrMode('pass');
      return;
    }

    generateNewToken();
    const interval = setInterval(() => {
      setTokenTimer((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const cardHolderName = activeCard?.cardHolderName || user?.name || 'ELENA MONTES';
  const cardLast4 = activeCard?.cardLast4 || user?.cardLast4 || '4092';
  const cardThemeName = activeCard?.name || (user?.cardTheme ? user.cardTheme.toUpperCase() : 'OBSIDIANA VIP');
  const userIban = user?.accountNumber || 'ES91 2100 0418 4502 0005 4092';

  const handleCopyToken = () => {
    const payload = `bancanova://pass/v3?token=${securityToken}&card=${cardLast4}&emv=contactless`;
    navigator.clipboard.writeText(payload);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2200);
  };

  const authorizeBiometricPayment = async () => {
    if (!userId || !hasBiometricCredential(userId)) return true;
    try {
      return await authenticateBiometric(userId);
    } catch {
      return false;
    }
  };

  const handleSimulatePayment = async () => {
    if (balance <= 0 || 45 > balance) {
      onShowToast?.('Saldo Insuficiente', 'No puedes hacer este pago porque no tienes saldo disponible.', 'error');
      return;
    }
    setSimulating(true);
    if (!(await authorizeBiometricPayment())) {
      setSimulating(false);
      onShowToast?.('Pago no autorizado', 'Confirma con tu huella o Face ID para continuar.', 'error');
      return;
    }
    setTimeout(() => {
      setSimulating(false);
      setPaymentSuccess('¡Pago Contactless de $45.00 procesado con éxito!');
      if (onSimulatePayment) {
        onSimulatePayment(45.0, 'Terminal TPV Contactless (Pase QR)');
      }
      setTimeout(() => {
        setPaymentSuccess(null);
      }, 3500);
    }, 1000);
  };

  const handleSimulateAtmWithdrawal = async () => {
    if (balance <= 0 || atmAmount > balance) {
      onShowToast?.('Saldo Insuficiente', 'No puedes retirar este monto porque no tienes saldo disponible.', 'error');
      return;
    }
    setSimulating(true);
    if (!(await authorizeBiometricPayment())) {
      setSimulating(false);
      onShowToast?.('Retiro no autorizado', 'Confirma con tu huella o Face ID para continuar.', 'error');
      return;
    }
    setTimeout(() => {
      setSimulating(false);
      setAtmSuccess(true);
      if (onSimulatePayment) {
        onSimulatePayment(atmAmount, `Retiro Cajero ATM QR (Clave ${atmPinCode})`);
      }
      setTimeout(() => {
        setAtmSuccess(false);
      }, 4000);
    }, 1200);
  };

  const handleSimulateReceivePayment = () => {
    setSimulating(true);
    const amountNum = parseFloat(receiveAmount) || 150;
    setTimeout(() => {
      setSimulating(false);
      setReceiveSuccess(true);
      if (onSimulatePayment) {
        onSimulatePayment(-amountNum, `Transferencia QR Recibida: ${receiveConcept}`);
      }
      setTimeout(() => {
        setReceiveSuccess(false);
      }, 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-[#1D1D1F] max-h-[94vh] overflow-y-auto relative transition-all duration-300 ${
          maxBrightness ? 'filter brightness-110 shadow-[0_0_60px_rgba(0,113,227,0.3)]' : ''
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-3.5 mb-3.5 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <BancaNovaLogo size="sm" variant="dark" showText={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F]">
                  Pase Digital QR &amp; Servicios Móviles
                </h3>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  verified
                </span>
              </div>
              <p className="text-xs text-[#86868B]">
                Tokenización Bancaria EMVCo • Alta Precisión
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 3 Main Modes Selector Tabs (Main Pass + 2 Requested Additional Specific Options) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F5F5F7] rounded-2xl mb-4 border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setActiveQrMode('pass')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeQrMode === 'pass'
                ? 'bg-white text-[#0071E3] shadow-xs ring-1 ring-black/[0.04]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
            <span className="text-[11px] truncate">Pase Contactless</span>
          </button>

          {/* SPECIFIC OPTION 1: Retiro ATM */}
          <button
            type="button"
            onClick={() => setActiveQrMode('atm')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeQrMode === 'atm'
                ? 'bg-white text-[#0071E3] shadow-xs ring-1 ring-black/[0.04]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">local_atm</span>
            <span className="text-[11px] truncate">Retiro en ATM</span>
          </button>

          {/* SPECIFIC OPTION 2: Cobrar / Recibir con QR */}
          <button
            type="button"
            onClick={() => setActiveQrMode('receive')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeQrMode === 'receive'
                ? 'bg-white text-[#0071E3] shadow-xs ring-1 ring-black/[0.04]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span className="text-[11px] truncate">Cobrar / Recibir</span>
          </button>
        </div>

        {/* Active Card / Account Info Banner */}
        <div className="mb-4 p-3 bg-[#F5F5F7] rounded-2xl flex items-center justify-between border border-black/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.06] flex items-center justify-center text-[#0071E3] shadow-2xs">
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D1D1F] block leading-tight">
                {cardThemeName}
              </span>
              <span className="text-[11px] text-[#86868B] font-mono">
                •••• •••• •••• {cardLast4}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>EMV Autorizado</span>
          </div>
        </div>

        {/* MODE 1: MAIN REALISTIC QR PASS */}
        {activeQrMode === 'pass' && (
          <div className="flex flex-col items-center">
            {/* Ultra-Realistic QR Code Container */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-[#FAFAFC] to-[#F5F5F7] border border-black/[0.06] flex flex-col items-center relative w-full">
              
              <div
                onClick={() => {
                  setScanFeedback(true);
                  setTimeout(() => setScanFeedback(false), 1800);
                }}
                className="relative w-56 h-56 bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm flex items-center justify-center cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group select-none"
                title="Toca para simular escaneo en terminal"
              >
                {/* Authentic Scanner Corner Brackets */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-2 border-l-2 border-[#0071E3] rounded-tl-lg"></div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-2 border-r-2 border-[#0071E3] rounded-tr-lg"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-2 border-l-2 border-[#0071E3] rounded-bl-lg"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-2 border-r-2 border-[#0071E3] rounded-br-lg"></div>

                {/* Ultra-Realistic Bank-Grade 33x33 Vector QR Code Matrix */}
                <svg className="w-full h-full text-[#111114]" viewBox="0 0 132 132" fill="currentColor">
                  <defs>
                    <linearGradient id="gold-emv-badge" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#AA771C" />
                    </linearGradient>
                  </defs>

                  {/* 1. TOP-LEFT FINDER PATTERN (7x7 with 3x3 center) */}
                  <rect x="4" y="4" width="28" height="28" rx="4" fill="#111114" />
                  <rect x="8" y="8" width="20" height="20" rx="2" fill="white" />
                  <rect x="12" y="12" width="12" height="12" rx="2" fill="#111114" />

                  {/* 2. TOP-RIGHT FINDER PATTERN */}
                  <rect x="100" y="4" width="28" height="28" rx="4" fill="#111114" />
                  <rect x="104" y="8" width="20" height="20" rx="2" fill="white" />
                  <rect x="108" y="12" width="12" height="12" rx="2" fill="#111114" />

                  {/* 3. BOTTOM-LEFT FINDER PATTERN */}
                  <rect x="4" y="100" width="28" height="28" rx="4" fill="#111114" />
                  <rect x="8" y="104" width="20" height="20" rx="2" fill="white" />
                  <rect x="12" y="108" width="12" height="12" rx="2" fill="#111114" />

                  {/* 4. ALIGNMENT PATTERN (Bottom-Right, 5x5) */}
                  <rect x="96" y="96" width="20" height="20" rx="3" fill="#111114" />
                  <rect x="100" y="100" width="12" height="12" rx="1.5" fill="white" />
                  <rect x="104" y="104" width="4" height="4" rx="0.8" fill="#111114" />

                  {/* 5. TIMING PATTERNS (Alternating horizontal & vertical tracks) */}
                  {[36, 44, 52, 60, 68, 76, 84, 92].map((x) => (
                    <rect key={`th-${x}`} x={x} y="16" width="4" height="4" rx="0.8" fill="#111114" />
                  ))}
                  {[36, 44, 52, 60, 68, 76, 84, 92].map((y) => (
                    <rect key={`tv-${y}`} x="16" y={y} width="4" height="4" rx="0.8" fill="#111114" />
                  ))}

                  {/* 6. FORMAT & DATA MODULES (Dense Realistic EMV Matrix) */}
                  {/* Top quadrant data */}
                  <rect x="36" y="6" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="44" y="8" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="48" y="4" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="56" y="8" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="64" y="4" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="72" y="8" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="80" y="4" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="88" y="8" width="4" height="4" rx="0.8" fill="#111114" />

                  <rect x="36" y="24" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="40" y="28" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="48" y="24" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="56" y="28" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="68" y="24" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="76" y="28" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="84" y="24" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="92" y="28" width="4" height="4" rx="0.8" fill="#111114" />

                  {/* Left quadrant data */}
                  <rect x="6" y="36" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="8" y="44" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="4" y="52" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="8" y="60" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="4" y="68" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="8" y="76" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="4" y="84" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="8" y="92" width="4" height="4" rx="0.8" fill="#111114" />

                  <rect x="24" y="36" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="28" y="44" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="24" y="52" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="28" y="64" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="24" y="72" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="28" y="80" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="24" y="88" width="4" height="4" rx="0.8" fill="#111114" />

                  {/* Right quadrant data */}
                  <rect x="100" y="36" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="108" y="40" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="116" y="36" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="124" y="44" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="104" y="52" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="112" y="56" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="120" y="52" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="100" y="68" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="116" y="72" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="124" y="80" width="4" height="4" rx="0.8" fill="#111114" />

                  {/* Bottom quadrant data */}
                  <rect x="36" y="100" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="44" y="108" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="52" y="100" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="60" y="112" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="68" y="104" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="76" y="116" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="84" y="104" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="36" y="120" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="48" y="124" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="64" y="124" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="76" y="120" width="4" height="4" rx="0.8" fill="#111114" />
                  <rect x="88" y="124" width="4" height="4" rx="0.8" fill="#111114" />

                  {/* Center Bank Logo Medallion */}
                  <rect x="44" y="44" width="44" height="44" rx="10" fill="#111114" />
                  <rect x="46" y="46" width="40" height="40" rx="8" fill="#1D1D22" />
                  <circle cx="66" cy="66" r="14" fill="url(#gold-emv-badge)" />
                  <path d="M60 72V60L72 72V60" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>

                {/* Scan Feedback Overlay */}
                {scanFeedback && (
                  <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white animate-in zoom-in-95 duration-150 z-20">
                    <span className="material-symbols-outlined text-[36px]">verified</span>
                    <span className="text-xs font-bold mt-1">¡Token EMV Válido!</span>
                    <span className="text-[10px] text-emerald-100">Lectura exitosa</span>
                  </div>
                )}
              </div>

              {/* Dynamic Token with Light Countdown Bar */}
              <div className="w-full mt-4 flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-between w-full px-1 text-xs">
                  <span className="text-[#86868B] font-medium">Token Criptográfico EMV:</span>
                  <span className="font-mono font-bold text-[#1D1D1F] tracking-wider text-sm bg-black/[0.04] px-2 py-0.5 rounded-md">
                    {securityToken}
                  </span>
                </div>

                {/* Countdown Progress Bar */}
                <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0071E3] transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(tokenTimer / 60) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between w-full px-1 text-[11px] text-[#86868B]">
                  <span>Renovación en {tokenTimer}s</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Contactless Activo
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Main Pass */}
            <div className="grid grid-cols-2 gap-2 mt-3.5 w-full">
              <button
                type="button"
                onClick={handleCopyToken}
                className="py-2.5 px-3 rounded-xl bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-black/[0.04]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#0071E3]">
                  {copiedToken ? 'check' : 'content_copy'}
                </span>
                <span>{copiedToken ? '¡Copiado!' : 'Copiar Token'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMaxBrightness(!maxBrightness)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                  maxBrightness
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border-black/[0.04]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-600">
                  {maxBrightness ? 'light_mode' : 'brightness_medium'}
                </span>
                <span>{maxBrightness ? 'Brillo Alto ON' : 'Subir Brillo'}</span>
              </button>
            </div>

            {/* Test Simulation Button */}
            <div className="mt-3 pt-3 border-t border-black/[0.06] w-full">
              {paymentSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  <span className="font-semibold">{paymentSuccess}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
                >
                  <span className="material-symbols-outlined text-[16px]">contactless</span>
                  <span>{simulating ? 'Procesando lectura...' : 'Probar Pago Contactless ($45.00)'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: SPECIFIC OPTION 1 - RETIRO SIN TARJETA EN CAJERO ATM */}
        {activeQrMode === 'atm' && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-100 mb-3.5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#0071E3] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">local_atm</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1D1D1F]">Retiro sin Tarjeta en Red ATM Nova</h4>
                  <p className="text-[11px] text-[#86868B]">Escanear este QR en el cajero o ingresar la clave de retiro</p>
                </div>
              </div>

              {/* ATM PIN Code Highlight */}
              <div className="bg-white p-3 rounded-2xl border border-blue-200/80 flex items-center justify-between shadow-2xs mt-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#86868B] font-bold block">
                    Clave PIN de Retiro Temporal:
                  </span>
                  <span className="text-lg font-mono font-bold text-[#0071E3] tracking-widest">
                    {atmPinCode}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 block font-semibold">
                    Válido 15 min
                  </span>
                  <span className="text-[10px] text-[#86868B] mt-0.5 block">Sin comisiones</span>
                </div>
              </div>
            </div>

            {/* Quick Amount Selector for ATM */}
            <div className="mb-3.5">
              <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                Monto a Retirar en Cajero:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAtmAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      atmAmount === amt
                        ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-xs'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.04] hover:bg-[#E8E8ED]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Mini ATM Instruction List */}
            <div className="p-3 bg-[#F9FAFB] rounded-2xl border border-black/[0.06] text-xs space-y-1.5 text-[#555] mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold flex items-center justify-center">1</span>
                <span>Acércate a cualquier cajero de la red Nova o red asociada.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold flex items-center justify-center">2</span>
                <span>Selecciona en la pantalla <strong>"Retiro con QR / Sin Tarjeta"</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold flex items-center justify-center">3</span>
                <span>Presenta este código o escribe la clave <strong>{atmPinCode}</strong>.</span>
              </div>
            </div>

            {/* Simulation for ATM Withdrawal */}
            {atmSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span className="font-semibold">¡Retiro en cajero ATM por ${atmAmount}.00 completado con éxito!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSimulateAtmWithdrawal}
                disabled={simulating}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">local_atm</span>
                <span>{simulating ? 'Procesando en Cajero ATM...' : `Simular Retiro ATM ($${atmAmount}.00)`}</span>
              </button>
            )}
          </div>
        )}

        {/* MODE 3: SPECIFIC OPTION 2 - COBRAR / RECIBIR TRANSFERENCIA QR */}
        {activeQrMode === 'receive' && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 mb-3.5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1D1D1F]">Cobrar y Recibir Transferencia Instantánea</h4>
                  <p className="text-[11px] text-[#86868B]">Muestra este QR para recibir fondos directamente en tu cuenta</p>
                </div>
              </div>

              {/* Destination IBAN Preview */}
              <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                <span className="text-[#86868B]">Cuenta Receptora:</span>
                <span className="font-mono font-bold text-[#1D1D1F]">{userIban}</span>
              </div>
            </div>

            {/* Configure Request Amount & Concept */}
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">Monto a Cobrar ($):</label>
                <input
                  type="number"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] font-bold outline-none focus:border-[#0071E3] focus:bg-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">Concepto:</label>
                <input
                  type="text"
                  value={receiveConcept}
                  onChange={(e) => setReceiveConcept(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white"
                  placeholder="Ej: Almuerzo, Servicio..."
                />
              </div>
            </div>

            {/* Simulation for Inbound Transfer */}
            {receiveSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span className="font-semibold">¡Transferencia de ${receiveAmount} recibida y abonada a tu saldo!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSimulateReceivePayment}
                disabled={simulating}
                className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>{simulating ? 'Acreditando transferencia...' : `Simular Cobro Recibido ($${receiveAmount})`}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
