import React, { useState } from 'react';
import { Transaction, ToastMessage } from '../types';
import { RealisticBankCard } from './RealisticBankCard';
import { formatLempiras } from '../lib/currency';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<
  ModalProps & {
    onDeposit: (amount: number, origin: string) => void;
  }
> = ({ isOpen, onClose, onDeposit }) => {
  const [amount, setAmount] = useState('500');
  const [origin, setOrigin] = useState('Nómina Local Honduras');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onDeposit(val, origin);
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-[#1D1D1F]">
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1D1D1F]">Depositar Fondos en Lempiras</h3>
              <p className="text-xs text-[#86868B]">Añade capital a tu cuenta de Banca Nova Honduras</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
              Canal de Origen
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-[#F5F5F7] rounded-xl px-4 py-2.5 text-xs text-[#1D1D1F] outline-none font-medium border border-black/[0.08] focus:border-[#0071E3] focus:bg-white cursor-pointer transition-all"
            >
              <option value="Nómina Local Honduras">Nómina Empresarial Honduras</option>
              <option value="Transferencia ACH Honduras">Transferencia Interbancaria ACH</option>
              <option value="Tarjeta de Débito Vinculada">Tarjeta de Débito Vinculada</option>
              <option value="Depósito en Agencias / Cajero">Depósito en Agencia / Cajero Central</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
              Monto a Depositar (Lempiras)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#86868B]">
                L.
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-12 pr-4 py-3 text-2xl font-bold text-[#1D1D1F] outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
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
                +L. {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-98"
            >
              Confirmar Depósito L.
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const WithdrawModal: React.FC<
  ModalProps & {
    balance: number;
    onWithdraw: (amount: number, reason: string) => void;
  }
> = ({ isOpen, onClose, balance, onWithdraw }) => {
  const [amount, setAmount] = useState('500');
  const [reason, setReason] = useState('Retiro en Cajero Automático Honduras');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Por favor ingresa un monto mayor a L. 0.00');
      return;
    }
    if (val > balance) {
      setError('El monto excede el saldo disponible en tu cuenta');
      return;
    }
    onWithdraw(val, reason);
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-[#1D1D1F]">
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">atm</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1D1D1F]">Retirar Fondos en Lempiras</h3>
              <p className="text-xs text-[#86868B]">Extracción de efectivo o retiro en cajero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
              Modalidad de Retiro
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#F5F5F7] rounded-xl px-4 py-2.5 text-xs text-[#1D1D1F] outline-none font-medium border border-black/[0.08] focus:border-[#0071E3] focus:bg-white cursor-pointer transition-all"
            >
              <option value="Retiro en Cajero Automático Honduras">Retiro sin tarjeta en Cajero con código QR</option>
              <option value="Retiro por Ventanilla Tegucigalpa/SPS">Retiro presencial en Agencia Principal</option>
              <option value="Transferencia a Billetera Local">Transferencia a Billetera Local</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F]">
                Importe a Retirar (Lempiras)
              </label>
              <span className="text-xs text-[#86868B]">
                Disponible: {formatLempiras(balance)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#86868B]">
                L.
              </span>
              <input
                type="number"
                step="any"
                min="1"
                max={balance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                autoFocus
                className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] focus:bg-white rounded-xl pl-12 pr-4 py-3 text-2xl font-bold text-[#1D1D1F] outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {['100', '200', '500', '1000', '2000'].map((preset) => (
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

          <div className="flex gap-3 mt-4 pt-4 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-98"
            >
              Confirmar Retiro L.
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MortgageCalculatorModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [downPayment, setDownPayment] = useState(500000);
  const [termYears, setTermYears] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);

  if (!isOpen) return null;

  const loanAmount = Math.max(0, propertyPrice - downPayment);
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;

  const monthlyPayment =
    monthlyRate > 0 && numPayments > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-[#1D1D1F] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">real_estate_agent</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1D1D1F]">Calculadora Hipotecaria Honduras</h3>
              <p className="text-xs text-[#86868B]">Estimación de cuota mensual y amortización en Lempiras</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Monthly Payment Hero result */}
          <div className="bg-[#F5F5F7] rounded-2xl p-6 text-center border border-black/[0.04]">
            <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider block">
              Cuota Mensual Estimada
            </span>
            <div className="text-4xl font-bold tracking-tight text-[#0071E3] mt-2">
              {formatLempiras(monthlyPayment)}
              <span className="text-sm font-medium text-[#86868B]"> /mes</span>
            </div>
            <span className="text-xs text-[#86868B] block mt-2">
              Capital a financiar: {formatLempiras(loanAmount)}
            </span>
          </div>

          {/* Sliders */}
          <div className="flex flex-col gap-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-[#1D1D1F] mb-1.5">
                <span>Valor del Inmueble</span>
                <span className="text-sm font-bold text-[#0071E3]">{formatLempiras(propertyPrice)}</span>
              </div>
              <input
                type="range"
                min="500000"
                max="15000000"
                step="50000"
                value={propertyPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPropertyPrice(val);
                  if (downPayment > val * 0.9) setDownPayment(val * 0.2);
                }}
                className="w-full accent-[#0071E3] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#1D1D1F] mb-1.5">
                <span>Prima Inicial ({Math.round((downPayment / propertyPrice) * 100)}%)</span>
                <span className="text-sm font-bold text-[#0071E3]">{formatLempiras(downPayment)}</span>
              </div>
              <input
                type="range"
                min="50000"
                max={propertyPrice * 0.8}
                step="25000"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full accent-[#0071E3] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">
                  Plazo de Amortización
                </label>
                <select
                  value={termYears}
                  onChange={(e) => setTermYears(Number(e.target.value))}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                >
                  <option value={10}>10 Años</option>
                  <option value={15}>15 Años</option>
                  <option value={20}>20 Años</option>
                  <option value={25}>25 Años</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">
                  Tasa de Interés Anual (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0071E3] rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1F] outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-98"
          >
            Solicitar Estudio Hipotecario
          </button>
        </div>
      </div>
    </div>
  );
};

export const CardDetailsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [isFrozen, setIsFrozen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-[#1D1D1F]">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-black/[0.06]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071E3] block">
              Banca Nova Honduras
            </span>
            <h3 className="text-lg font-bold text-[#1D1D1F]">Tarjeta Titanium World Elite</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Realistic Card Graphic with 3D Flip */}
        <div className="py-2 flex justify-center">
          <RealisticBankCard
            cardHolderName="ELENA MONTES"
            cardLast4="4092"
            expiryDate="10/29"
            cvv="842"
            isLocked={isFrozen}
            onToggleLock={() => setIsFrozen(!isFrozen)}
            showControls={true}
            size="md"
          />
        </div>

        {/* Security Specs Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/[0.06]">
          <div className="bg-[#F5F5F7] p-3 rounded-2xl">
            <span className="text-[10px] text-[#86868B] uppercase font-bold block">Límite Diario</span>
            <span className="text-xs font-bold text-[#1D1D1F]">L. 50,000.00 / día</span>
          </div>
          <div className="bg-[#F5F5F7] p-3 rounded-2xl">
            <span className="text-[10px] text-[#86868B] uppercase font-bold block">Protección Anti-Fraude</span>
            <span className="text-xs font-bold text-[#34C759] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
              Activa 24/7
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          Finalizar y Volver
        </button>
      </div>
    </div>
  );
};

export const WealthAdvisorModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [scheduled, setScheduled] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-[#1D1D1F]">
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-black/[0.06]">
          <div>
            <h3 className="text-lg font-semibold text-[#1D1D1F]">Asesor Patrimonial Honduras</h3>
            <p className="text-xs text-[#86868B]">Banca privada y estructuración de activos en Lempiras</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {scheduled ? (
          <div className="flex flex-col items-center text-center p-4 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#34C759] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">check_circle</span>
            </div>
            <h4 className="text-base font-bold text-[#1D1D1F]">Cita Reservada con Éxito</h4>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Tu asesor asignado en Honduras, Rodrigo Del Valle, se comunicará contigo telefónicamente para coordinar la sesión.
            </p>
            <button
              onClick={onClose}
              className="mt-3 w-full py-2.5 bg-[#0071E3] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[#86868B] leading-relaxed">
              Estructura tu patrimonio corporativo y familiar en Honduras con carteras de inversión diversificadas y asesoría fiscal personalizada.
            </p>
            <div className="p-4 bg-[#F5F5F7] rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-bold flex items-center justify-center text-sm">
                RV
              </div>
              <div>
                <span className="text-xs font-bold text-[#1D1D1F] block">Rodrigo Del Valle</span>
                <span className="text-[11px] text-[#86868B]">Director de Asuntos Patrimoniales • Banca Nova Honduras</span>
              </div>
            </div>
            <button
              onClick={() => setScheduled(true)}
              className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,113,227,0.25)]"
            >
              Agendar Llamada con Asesor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const TransactionDetailModal: React.FC<
  ModalProps & {
    transaction: Transaction | null;
  }
> = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const isDeposit = transaction.type === 'deposit' || transaction.amount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-[#1D1D1F]">
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-black/[0.06]">
          <div>
            <h3 className="text-lg font-semibold text-[#1D1D1F]">Detalle de Operación</h3>
            <p className="text-xs text-[#86868B]">Recibo digital certificado Honduras</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center p-5 bg-[#F5F5F7] rounded-2xl mb-6">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[22px] text-[#0071E3]">
              {transaction.categoryIcon || (isDeposit ? 'payments' : 'send')}
            </span>
          </div>
          <h4 className="text-base font-bold text-[#1D1D1F]">{transaction.title}</h4>
          <div
            className={`text-3xl font-bold mt-1 tracking-tight ${
              isDeposit ? 'text-[#34C759]' : 'text-[#1D1D1F]'
            }`}
          >
            {isDeposit ? '+' : '-'}{formatLempiras(Math.abs(transaction.amount))}
          </div>
          <span className="mt-2 inline-block px-3 py-0.5 bg-white text-[11px] font-semibold text-[#34C759] rounded-full border border-black/[0.04]">
            {transaction.status === 'completed' ? 'Liquidado con Certificación ACH' : 'En Trámite'}
          </span>
        </div>

        <div className="flex flex-col gap-2 text-xs divide-y divide-black/[0.04] mb-6">
          <div className="flex justify-between py-2">
            <span className="text-[#86868B]">Fecha:</span>
            <span className="font-semibold text-[#1D1D1F]">{transaction.date}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#86868B]">Categoría:</span>
            <span className="font-semibold text-[#1D1D1F]">{transaction.category || 'General'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#86868B]">Identificador Único:</span>
            <span className="font-mono text-[11px] text-[#86868B]">{transaction.id}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
        >
          Cerrar Recibo
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              t.type === 'error'
                ? 'bg-rose-50 text-[#FF3B30]'
                : t.type === 'success'
                ? 'bg-emerald-50 text-[#34C759]'
                : 'bg-blue-50 text-[#0071E3]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {t.type === 'error' ? 'error' : t.type === 'success' ? 'check' : 'info'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-[#1D1D1F] leading-tight">{t.title}</h5>
            <p className="text-xs text-[#86868B] mt-0.5 leading-snug">{t.message}</p>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-[#86868B] hover:text-[#1D1D1F] p-0.5 cursor-pointer rounded-full"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};
