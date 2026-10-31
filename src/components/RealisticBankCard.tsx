import React, { useState, useRef, useEffect } from 'react';
import { CardTheme } from '../types';
import { BancaNovaLogo } from './BancaNovaLogo';

export type { CardTheme };

interface RealisticBankCardProps {
  cardHolderName?: string;
  cardLast4?: string;
  expiryDate?: string;
  cvv?: string;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onOpenQrModal?: () => void;
  onOpenThemeRequest?: () => void;
  showControls?: boolean;
  showColorPicker?: boolean;
  interactiveTilt?: boolean;
  theme?: CardTheme;
  onChangeTheme?: (theme: CardTheme) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RealisticBankCard: React.FC<RealisticBankCardProps> = ({
  cardHolderName = 'ELENA MONTES',
  cardLast4 = '4092',
  expiryDate = '10/29',
  cvv = '842',
  isLocked = false,
  onToggleLock,
  onOpenQrModal,
  onOpenThemeRequest,
  showControls = true,
  showColorPicker = false,
  interactiveTilt = true,
  theme = 'obsidian',
  onChangeTheme,
  className = '',
  size = 'md',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTheme, setActiveTheme] = useState<CardTheme>(theme);
  const [showFullNumber, setShowFullNumber] = useState(false);

  // Sync internal state when prop changes (e.g. when changing plan or admin updates it)
  useEffect(() => {
    setActiveTheme(theme);
  }, [theme]);

  const handleSelectTheme = (t: CardTheme) => {
    setActiveTheme(t);
    onChangeTheme?.(t);
  };

  // Mouse tilt / glare state
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.4 });
  };

  const handleMouseLeave = () => {
    if (!interactiveTilt) return;
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullNum = `4582 8901 3421 ${cardLast4}`;
    navigator.clipboard.writeText(fullNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme Styles and Badges
  const getThemeStyles = () => {
    switch (activeTheme) {
      case 'obsidian':
        return {
          bgGradient: 'from-[#0A0A0D] via-[#141419] to-[#040406]',
          tierBadge: 'BLACK TITANIUM VIP',
          accentText: 'text-amber-300',
          accentBorder: 'border-amber-500/30',
          chipBorder: 'border-amber-400/50',
          rimColor: 'ring-amber-400/20',
          metalSheen: 'rgba(217, 119, 6, 0.2)',
          subtier: 'WORLD ELITE • PRIVATE WEALTH',
        };
      case 'gold':
        return {
          bgGradient: 'from-[#282112] via-[#3E331B] to-[#18140B]',
          tierBadge: 'BUSINESS GOLD 24K',
          accentText: 'text-amber-200',
          accentBorder: 'border-amber-300/40',
          chipBorder: 'border-amber-300/60',
          rimColor: 'ring-amber-300/25',
          metalSheen: 'rgba(251, 191, 36, 0.25)',
          subtier: 'CORPORATE PRESTIGE',
        };
      case 'emerald':
        return {
          bgGradient: 'from-[#052317] via-[#0B3B26] to-[#02120C]',
          tierBadge: 'EMERALD IMPERIAL',
          accentText: 'text-emerald-200',
          accentBorder: 'border-emerald-400/40',
          chipBorder: 'border-emerald-300/50',
          rimColor: 'ring-emerald-400/25',
          metalSheen: 'rgba(52, 211, 153, 0.25)',
          subtier: 'SPECIAL EDITION • WEALTH',
        };
      case 'rose_gold':
        return {
          bgGradient: 'from-[#2C181D] via-[#43232C] to-[#1C0E12]',
          tierBadge: 'ROSE GOLD 18K',
          accentText: 'text-rose-200',
          accentBorder: 'border-rose-300/40',
          chipBorder: 'border-rose-300/60',
          rimColor: 'ring-rose-300/25',
          metalSheen: 'rgba(251, 113, 133, 0.25)',
          subtier: 'SIGNATURE HERITAGE',
        };
      case 'sapphire':
        return {
          bgGradient: 'from-[#08182F] via-[#0E2748] to-[#040B16]',
          tierBadge: 'SAPPHIRE DIGITAL',
          accentText: 'text-sky-200',
          accentBorder: 'border-sky-400/30',
          chipBorder: 'border-sky-300/40',
          rimColor: 'ring-sky-400/20',
          metalSheen: 'rgba(56, 189, 248, 0.2)',
          subtier: 'PERSONAL STANDARD',
        };
      case 'titanium':
      default:
        return {
          bgGradient: 'from-[#1A1E26] via-[#121419] to-[#08090C]',
          tierBadge: 'TITANIUM BLACK',
          accentText: 'text-slate-200',
          accentBorder: 'border-white/20',
          chipBorder: 'border-amber-300/40',
          rimColor: 'ring-white/15',
          metalSheen: 'rgba(255, 255, 255, 0.15)',
          subtier: 'PRIVATE BANKING',
        };
    }
  };

  const themeConfig = getThemeStyles();

  // Size configurations maintaining exact ISO credit card ratio (1.586 : 1)
  const sizeClasses = {
    sm: 'w-[280px] h-[176px]',
    md: 'w-[330px] h-[208px] sm:w-[380px] sm:h-[240px]',
    lg: 'w-full max-w-[420px] h-[264px]',
  };

  const fullDisplayNumber = showFullNumber
    ? `4582 8901 3421 ${cardLast4}`
    : `•••• •••• •••• ${cardLast4}`;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Perspective Canvas */}
      <div
        className={`relative ${sizeClasses[size]} perspective-[1200px] cursor-pointer`}
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={cardRef}
          className="w-full h-full relative transition-transform duration-500 ease-out transform-style-3d shadow-[0_22px_55px_rgba(0,0,0,0.38)] rounded-[18px]"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* ============================================================ */}
          {/* FRONT OF THE CARD                                             */}
          {/* ============================================================ */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[18px] p-5 sm:p-6 bg-gradient-to-br ${themeConfig.bgGradient} text-white border border-white/15 shadow-2xl flex flex-col justify-between overflow-hidden ring-1 ${themeConfig.rimColor}`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Fine Brushed Metal Texture Overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-35 mix-blend-overlay"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  rgba(255, 255, 255, 0.03) 0px,
                  rgba(255, 255, 255, 0.03) 1px,
                  transparent 1px,
                  transparent 3px
                )`,
              }}
            ></div>

            {/* Micro-guilloche security curves */}
            <div className="absolute -right-16 -bottom-16 w-64 h-64 border border-white/[0.04] rounded-full pointer-events-none"></div>
            <div className="absolute -right-10 -bottom-10 w-52 h-52 border border-white/[0.04] rounded-full pointer-events-none"></div>
            <div className="absolute -right-4 -bottom-4 w-40 h-40 border border-white/[0.05] rounded-full pointer-events-none"></div>

            {/* Dynamic Specular Glare / Metallic Sheen */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200"
              style={{
                background: `radial-gradient(circle 320px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 70%)`,
              }}
            ></div>

            {/* FROZEN / LOCKED GLASS OVERLAY */}
            {isLocked && (
              <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-[3px] rounded-[18px] flex flex-col items-center justify-center p-4 text-center border-2 border-rose-500/40 animate-fadeIn">
                <div className="w-11 h-11 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-2 shadow-lg">
                  <span className="material-symbols-outlined text-[22px]">lock</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
                  Tarjeta Bloqueada
                </span>
                <span className="text-[10px] text-white/70 mt-0.5">
                  Protección de seguridad activada
                </span>
              </div>
            )}

            {/* TOP ROW: Bank Emblem & Contactless Wave */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {/* Metallic Emblem */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-white/30 via-white/50 to-white/10 p-[1px] shadow-sm">
                  <div className="w-full h-full bg-[#101114] rounded-md flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none">
                      <path d="M6 18V6L12 14.5L18 6V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="5" r="1.2" fill="#D4AF37" />
                    </svg>
                  </div>
                </div>

                <div>
                  <span className="text-[13px] sm:text-[14px] font-extrabold tracking-wider text-white block uppercase leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    BANCA NOVA
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.22em] text-white/65 uppercase block mt-0.5 font-mono">
                    {themeConfig.subtier}
                  </span>
                </div>
              </div>

              {/* Tier Badge & ISO Contactless Symbol */}
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xs shadow-xs">
                  <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-white">
                    {themeConfig.tierBadge}
                  </span>
                </div>

                {/* ISO NFC Contactless Symbol */}
                <svg
                  className="w-5 h-5 text-white/80 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                  <path d="M12 19a8.5 8.5 0 0 1 0-14" />
                  <path d="M15.5 21.5a12 12 0 0 1 0-19" />
                </svg>
              </div>
            </div>

            {/* MIDDLE ROW: Ultra-Realistic EMV Chip & Hologram */}
            <div className="relative z-10 flex items-center justify-between my-auto pt-1">
              {/* EMV Microchip SVG */}
              <div className={`relative w-12 h-9 sm:w-13 sm:h-10 rounded-md overflow-hidden bg-gradient-to-br from-[#E2B755] via-[#FCE38A] to-[#BF953F] p-[1.5px] shadow-[0_2px_6px_rgba(0,0,0,0.5)] ${themeConfig.chipBorder}`}>
                <div className="w-full h-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] rounded-[4px] relative p-1 flex flex-col justify-between">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-[2px] opacity-70 pointer-events-none">
                    <div className="border-r border-b border-amber-900/60"></div>
                    <div className="border-b border-amber-900/60"></div>
                    <div className="border-l border-b border-amber-900/60"></div>
                    <div className="border-r border-amber-900/60"></div>
                    <div className="rounded-xs bg-amber-200/50 border border-amber-800/40"></div>
                    <div className="border-l border-amber-900/60"></div>
                    <div className="border-r border-t border-amber-900/60"></div>
                    <div className="border-t border-amber-900/60"></div>
                    <div className="border-l border-t border-amber-900/60"></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Holographic Security Laser Badge */}
              <div className="w-9 h-7 rounded bg-gradient-to-tr from-purple-500/40 via-emerald-400/40 to-amber-300/40 border border-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="text-[7px] font-bold tracking-tighter text-white/95 uppercase text-center leading-tight drop-shadow-sm">
                  VALID<br />NOVA
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse pointer-events-none"></div>
              </div>
            </div>

            {/* CARD NUMBER: Embossed Letterpress Typography */}
            <div className="relative z-10 my-1">
              <p
                className="font-mono text-[16px] sm:text-[19px] tracking-[0.18em] text-white/95 font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 -1px 0 rgba(255,255,255,0.2)',
                }}
              >
                {fullDisplayNumber}
              </p>
            </div>

            {/* BOTTOM ROW: Cardholder, Valid Thru & Network Circles */}
            <div className="relative z-10 flex items-end justify-between pt-1">
              {/* Cardholder Name */}
              <div className="max-w-[60%]">
                <span className="text-[7.5px] sm:text-[8px] font-mono tracking-widest text-white/50 uppercase block">
                  TITULAR / CARDHOLDER
                </span>
                <span
                  className="text-[11px] sm:text-[12.5px] font-bold tracking-wider text-white uppercase block truncate"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 -0.5px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  {cardHolderName}
                </span>
              </div>

              {/* Expiry Date */}
              <div className="flex items-center gap-1.5">
                <div className="text-[6.5px] font-mono text-white/40 leading-none text-right">
                  MONTH/YEAR<br />VALID THRU
                </div>
                <span
                  className="text-[11px] sm:text-[12.5px] font-mono font-bold text-white tracking-wider"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {expiryDate}
                </span>
              </div>

              {/* Payment Network Emblem (Luxury Intersecting Disks) */}
              <div className="flex items-center -space-x-2.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#EB001B]/90 shadow-sm"></div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#F79E1B]/90 shadow-sm mix-blend-screen"></div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BACK OF THE CARD                                              */}
          {/* ============================================================ */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[18px] bg-gradient-to-br ${themeConfig.bgGradient} text-white border border-white/15 shadow-2xl flex flex-col justify-between overflow-hidden ring-1 ${themeConfig.rimColor}`}
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Top Security Magnetic Stripe */}
            <div className="w-full h-11 sm:h-12 bg-[#090A0D] mt-4 border-y border-black/80 relative shadow-inner flex items-center px-4">
              <div className="w-full h-[1px] bg-white/[0.03]"></div>
            </div>

            {/* Middle Section: Signature Strip & CVV */}
            <div className="px-5 sm:px-6 py-2 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                {/* White Signature Panel with Security Hatching */}
                <div className="flex-1 h-8 bg-[#F4F4F6] rounded-xs relative flex items-center justify-between px-3 overflow-hidden border border-black/20">
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 4px)',
                    }}
                  ></div>
                  <span className="font-serif italic text-xs text-[#2A2B30] relative z-10 select-none">
                    {cardHolderName}
                  </span>
                  <span className="text-[7px] font-mono text-black/40 uppercase">
                    Auth. Signature
                  </span>
                </div>

                {/* CVV Security Code Box */}
                <div className="bg-white/10 px-3 py-1.5 rounded border border-white/20 text-center">
                  <span className="text-[7px] font-mono text-white/50 uppercase block">
                    CVV
                  </span>
                  <span className="font-mono text-xs font-bold text-white tracking-widest">
                    {cvv}
                  </span>
                </div>
              </div>

              {/* Legal Micro-Text & Concierge Assistance with Interactive QR Code */}
              <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-white/10">
                <div className="text-[7px] text-white/50 leading-tight space-y-0.5 flex-1">
                  <p>
                    Tarjeta emitida por Banca Nova España S.A. Uso sujeto a contrato de banca privada.
                  </p>
                  <div className="flex justify-between items-center text-white/70 font-mono text-[6.5px]">
                    <span>Concierge: 900 800 240</span>
                    <span>Intl: +1 800 NOVA</span>
                  </div>
                </div>

                {/* Interactive Dynamic QR Pass on Card Back */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenQrModal) onOpenQrModal();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-300 text-black shadow-[0_4px_12px_rgba(212,175,55,0.4)] border border-amber-200/80 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 group"
                  title="Abrir Pase Digital QR Criptográfico y Token Contactless"
                >
                  {/* High Precision SVG QR code */}
                  <div className="w-6 h-6 bg-[#0D0D11] rounded-md p-0.5 flex items-center justify-center shrink-0 shadow-xs border border-black/20">
                    <svg className="w-full h-full text-white" viewBox="0 0 25 25" fill="currentColor">
                      <rect x="0" y="0" width="7" height="7" fill="white" />
                      <rect x="1" y="1" width="5" height="5" fill="black" />
                      <rect x="2" y="2" width="3" height="3" fill="#D4AF37" />

                      <rect x="18" y="0" width="7" height="7" fill="white" />
                      <rect x="19" y="1" width="5" height="5" fill="black" />
                      <rect x="20" y="2" width="3" height="3" fill="#D4AF37" />

                      <rect x="0" y="18" width="7" height="7" fill="white" />
                      <rect x="1" y="19" width="5" height="5" fill="black" />
                      <rect x="2" y="20" width="3" height="3" fill="#D4AF37" />

                      <rect x="9" y="1" width="2" height="2" fill="white" />
                      <rect x="13" y="2" width="2" height="2" fill="white" />
                      <rect x="9" y="5" width="2" height="2" fill="white" />

                      <rect x="2" y="9" width="2" height="2" fill="white" />
                      <rect x="5" y="11" width="2" height="2" fill="white" />
                      <rect x="10" y="10" width="5" height="5" fill="#D4AF37" rx="0.5" />

                      <rect x="18" y="9" width="2" height="2" fill="white" />
                      <rect x="22" y="12" width="2" height="2" fill="white" />

                      <rect x="9" y="18" width="2" height="2" fill="white" />
                      <rect x="13" y="20" width="2" height="2" fill="white" />
                      <rect x="18" y="18" width="2" height="2" fill="white" />
                      <rect x="22" y="22" width="2" height="2" fill="white" />
                    </svg>
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-[8px] font-black tracking-wider text-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse"></span>
                      PASE QR
                    </span>
                    <span className="text-[7px] font-bold text-slate-800 group-hover:text-black transition-colors flex items-center gap-0.5">
                      Abrir &rsaquo;
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Row: Cirrus/Plus & Micro Hologram */}
            <div className="px-5 sm:px-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-4 rounded-xs bg-white/10 border border-white/15 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-white/70">EMV</span>
                </div>
                <span className="text-[8px] font-mono text-white/50 tracking-wider">
                  CIRRUS • PLUS • SEPA
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <BancaNovaLogo size="sm" variant="gold" showText={false} />
                <span className="text-[8.5px] font-extrabold text-white/80 uppercase tracking-widest font-mono">
                  BANCA NOVA
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar Below Card */}
      {showControls && (
        <div className="w-full max-w-[420px] mt-3 flex flex-col gap-2">
          {/* Main Action Buttons Grid (2x3 perfectly aligned layout) */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#F5F5F7] rounded-2xl border border-black/[0.06] shadow-2xs text-xs">
            {/* Flip Card Button */}
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="py-2 px-1.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1D1D1F] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer border border-black/[0.04]"
              title="Girar tarjeta para ver reverso, QR y CVV"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0071E3]">
                3d_rotation
              </span>
              <span className="text-[11px] font-medium truncate">
                {isFlipped ? 'Ver Frente' : 'Girar CVV'}
              </span>
            </button>

            {/* Digital QR Pass Button */}
            {onOpenQrModal && (
              <button
                type="button"
                onClick={onOpenQrModal}
                className="py-2 px-1.5 rounded-xl bg-blue-50/90 hover:bg-blue-100 text-[#0071E3] font-bold border border-blue-200/70 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer group"
                title="Abrir Pase Digital QR Criptográfico y Token Contactless"
              >
                <span className="material-symbols-outlined text-[16px]">
                  qr_code_2
                </span>
                <span className="text-[11px] truncate">Pase QR</span>
              </button>
            )}

            {/* Request Theme / Color Change Button */}
            {onOpenThemeRequest && (
              <button
                type="button"
                onClick={onOpenThemeRequest}
                className="py-2 px-1.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1D1D1F] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer border border-black/[0.04]"
                title="Personalizar acabado, color o material de la tarjeta"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-600">
                  palette
                </span>
                <span className="text-[11px] font-medium truncate">Acabado</span>
              </button>
            )}

            {/* Toggle Show Number */}
            <button
              type="button"
              onClick={() => setShowFullNumber(!showFullNumber)}
              className="py-2 px-1.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1D1D1F] font-medium transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer border border-black/[0.04]"
              title="Mostrar u ocultar números completos"
            >
              <span className="material-symbols-outlined text-[16px] text-[#86868B]">
                {showFullNumber ? 'visibility_off' : 'visibility'}
              </span>
              <span className="text-[11px] truncate">
                {showFullNumber ? 'Ocultar' : 'Ver Datos'}
              </span>
            </button>

            {/* Copy Card Number */}
            <button
              type="button"
              onClick={handleCopyNumber}
              className="py-2 px-1.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1D1D1F] font-medium transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer border border-black/[0.04]"
              title="Copiar número de tarjeta"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0071E3]">
                {copied ? 'done' : 'content_copy'}
              </span>
              <span className="text-[11px] truncate">
                {copied ? '¡Copiado!' : 'Copiar'}
              </span>
            </button>

            {/* Freeze Toggle if onToggleLock provided */}
            {onToggleLock && (
              <button
                type="button"
                onClick={onToggleLock}
                className={`py-2 px-1.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer border ${
                  isLocked
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                }`}
                title={isLocked ? 'Desbloquear tarjeta' : 'Bloquear tarjeta temporalmente'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isLocked ? 'lock_open' : 'lock'}
                </span>
                <span className="text-[11px] truncate">
                  {isLocked ? 'Desbloquear' : 'Bloquear'}
                </span>
              </button>
            )}
          </div>

          {/* Luxury Metallic Finishes Picker - ONLY SHOWN IN ADMIN (showColorPicker === true) */}
          {showColorPicker && (
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-2xl border border-blue-500/20 shadow-xs text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#0071E3]">tune</span>
                <span className="text-[11px] font-semibold text-[#1D1D1F]">
                  Acabado Admin:
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'obsidian', label: 'Black VIP (Obsidiana)', bg: 'bg-[#101014]' },
                    { id: 'titanium', label: 'Titanio Gris Espacial', bg: 'bg-[#2B303A]' },
                    { id: 'gold', label: 'Oro 24K Noble', bg: 'bg-[#C5A059]' },
                    { id: 'sapphire', label: 'Zafiro Real', bg: 'bg-[#0F2744]' },
                    { id: 'emerald', label: 'Esmeralda Imperial', bg: 'bg-[#0B3B26]' },
                    { id: 'rose_gold', label: 'Oro Rosa 18K', bg: 'bg-[#43232C]' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id)}
                    className={`w-6 h-6 rounded-full ${t.bg} border-2 transition-all cursor-pointer ${
                      activeTheme === t.id
                        ? 'border-[#0071E3] scale-110 shadow-sm ring-2 ring-[#0071E3]/30'
                        : 'border-white/80 opacity-70 hover:opacity-100'
                    }`}
                    title={t.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
