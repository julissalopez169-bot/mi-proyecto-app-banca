import React from 'react';
import { ScreenType } from '../types';
import { RealisticBankCard } from './RealisticBankCard';

interface LandingViewProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenMortgageCalculator?: () => void;
  onOpenCardDetails?: () => void;
  onOpenCheckingDetails?: () => void;
  onOpenAuthModal?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenMortgageCalculator,
  onOpenCardDetails,
  onOpenAuthModal,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      
      {/* Main Content */}
      <main className="pt-24 md:pt-32 pb-16 px-6 md:px-12 max-w-[1100px] mx-auto w-full flex flex-col gap-12">
        
        {/* Simple & Clean Hero Section */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.06] shadow-2xs text-xs font-semibold text-[#1D1D1F] mb-5">
            <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse"></span>
            <span>Banca Nova Honduras</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1D1D1F] leading-tight mb-4">
            Tu dinero, simple y seguro.
          </h1>

          <p className="text-base sm:text-lg text-[#86868B] leading-relaxed max-w-xl mb-7">
            Gestiona tus cuentas, realiza transferencias bancarias y consulta tus movimientos en tiempo real desde cualquier dispositivo.
          </p>

          {/* Direct Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-semibold shadow-[0_4px_16px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-97 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>Entrar a mi Cuenta</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-black/[0.03] text-[#0071E3] text-sm font-semibold border border-[#0071E3]/30 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-[#0071E3]">login</span>
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>

        {/* 3 Simple Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Mi Cuenta */}
          <div className="bg-white rounded-2xl p-6 border border-black/[0.06] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F] mb-1.5">
                Mi Cuenta &amp; Saldo
              </h3>
              <p className="text-xs text-[#86868B] leading-relaxed mb-5">
                Accede a tu panel principal para consultar tu balance disponible, tarjetas y opciones de depósito o retiro.
              </p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full py-2.5 px-4 bg-[#F5F5F7] hover:bg-blue-50 hover:text-[#0071E3] text-[#1D1D1F] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Ver mi Cuenta</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          {/* Card 2: Transferencias */}
          <div className="bg-white rounded-2xl p-6 border border-black/[0.06] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]">send</span>
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F] mb-1.5">
                Transferencias
              </h3>
              <p className="text-xs text-[#86868B] leading-relaxed mb-5">
                Envía dinero al instante entre cuentas con acreditación en tiempo real y comprobante digital inmediato.
              </p>
            </div>
            <button
              onClick={() => onNavigate('transfers')}
              className="w-full py-2.5 px-4 bg-[#F5F5F7] hover:bg-emerald-50 hover:text-emerald-700 text-[#1D1D1F] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Hacer Transferencia</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          {/* Card 3: Movimientos */}
          <div className="bg-white rounded-2xl p-6 border border-black/[0.06] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F] mb-1.5">
                Historial de Movimientos
              </h3>
              <p className="text-xs text-[#86868B] leading-relaxed mb-5">
                Revisa el historial de tus transacciones, ingresos y compras recientes con detalle y recibo descargable.
              </p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="w-full py-2.5 px-4 bg-[#F5F5F7] hover:bg-indigo-50 hover:text-indigo-700 text-[#1D1D1F] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Ver Historial</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Clean Digital Card Preview Box */}
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-black/[0.06] shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="text-xs font-semibold text-[#0071E3] uppercase tracking-wider block mb-1.5">
              Tarjeta Digital
            </span>
            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">
              Banca Nova Titanium
            </h2>
            <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed max-w-md mb-5">
              Tarjeta segura con números ocultos, congelamiento instantáneo con un toque y control de límites desde tu cuenta.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={onOpenCardDetails}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#0071E3] rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Ajustes de Tarjeta</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
              {onOpenMortgageCalculator && (
                <button
                  onClick={onOpenMortgageCalculator}
                  className="px-4 py-2 bg-[#F5F5F7] hover:bg-black/[0.05] text-[#1D1D1F] rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#0071E3]">calculate</span>
                  <span>Calculadora Hipotecaria</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center items-center shrink-0">
            <RealisticBankCard
              cardHolderName="ELENA MONTES"
              cardLast4="4092"
              expiryDate="10/29"
              showControls={false}
              interactiveTilt={false}
              size="md"
            />
          </div>
        </div>

      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-black/[0.06] py-6 px-6 text-center text-xs text-[#86868B] mt-auto bg-white/50">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#0071E3] flex items-center justify-center text-white text-xs">
              <span className="material-symbols-outlined text-[12px]">account_balance</span>
            </div>
            <span className="font-semibold text-[#1D1D1F]">Banca Nova Honduras</span>
          </div>
          <span>Banca digital segura • Cifrado TLS 1.3 • Sincronización en tiempo real</span>
        </div>
      </footer>

    </div>
  );
};

