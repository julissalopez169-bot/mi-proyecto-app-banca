import React, { useState } from 'react';
import { ScreenType, Transaction, UserProfile, SystemSettings, CardTheme, UserCard } from '../types';
import { RealisticBankCard } from './RealisticBankCard';
import { formatLempiras } from '../lib/currency';

interface DashboardViewProps {
  user: UserProfile;
  balance: number;
  transactions: Transaction[];
  systemSettings?: SystemSettings;
  onNavigate: (screen: ScreenType) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenWealthAdvisor: () => void;
  onOpenPlanModal?: () => void;
  onOpenQrModal?: () => void;
  onOpenThemeRequest?: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onSwitchCard?: (cardId: string) => void;
  onChangeCardTheme?: (theme: CardTheme) => void;
  onAddNewCard?: (data: Partial<UserCard>) => void;
  onOpenAuthModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  balance,
  transactions,
  systemSettings,
  onNavigate,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenWealthAdvisor,
  onOpenPlanModal,
  onOpenQrModal,
  onOpenThemeRequest,
  onSelectTransaction,
  onSwitchCard,
  onChangeCardTheme,
  onAddNewCard,
  onOpenAuthModal,
}) => {
  // Privacy toggle for hiding/revealing balance
  const [hideBalance, setHideBalance] = useState(false);
  // Card freeze toggle state
  const [isCardLocked, setIsCardLocked] = useState(user.isCardFrozen || false);
  // Copied IBAN feedback state
  const [copiedIban, setCopiedIban] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardTheme, setNewCardTheme] = useState<CardTheme>('gold');
  const [newCardType, setNewCardType] = useState<UserCard['type']>('Virtual Express');

  const cleanAccountNumber = (user.accountNumber || '').replace(/^HN\d*\s*/i, '');

  const handleCopyIban = () => {
    navigator.clipboard.writeText(cleanAccountNumber);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2500);
  };

  // Recent transactions (first 5)
  const recentMovements = transactions.slice(0, 5);

  // Quick contacts for effortless 1-click transfers in Honduras
  const quickContacts = [
    { name: 'Carlos Morales', initials: 'CM', bg: 'bg-blue-100 text-[#0071E3]', iban: '0182 9901 9901 9921' },
    { name: 'Sofía Larrea', initials: 'SL', bg: 'bg-emerald-100 text-emerald-700', iban: '0182 9901 3321 3144' },
    { name: 'David Santos', initials: 'DS', bg: 'bg-amber-100 text-amber-700', iban: '0182 9901 4419 8810' },
    { name: 'Banca Corporativa', initials: 'BC', bg: 'bg-purple-100 text-purple-700', iban: '0182 9901 4092 1100' },
  ];

  const currentPlan = user.plan || 'Black';
  const isBlackPlan = currentPlan === 'Black';

  return (
    <div className="flex-1 md:ml-64 min-h-screen overflow-y-auto pt-16 md:pt-8 pb-36 md:pb-16 px-3.5 sm:px-6 md:px-10 bg-[#F5F5F7] text-[#1D1D1F] max-w-full">
      <div className="max-w-[1120px] mx-auto flex flex-col gap-6 sm:gap-7">
        
        {/* Global Broadcast Notice Banner from Admin if active and not dismissed */}
        {systemSettings?.systemNotice?.active && !noticeDismissed && (
          <div className={`p-4 rounded-2xl flex items-start justify-between gap-3 shadow-xs border transition-all ${
            systemSettings.systemNotice.type === 'vip'
              ? 'bg-gradient-to-r from-[#141419] to-[#0A0A0D] text-white border-amber-500/30'
              : systemSettings.systemNotice.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : systemSettings.systemNotice.type === 'alert'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}>
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className={`material-symbols-outlined text-[22px] shrink-0 mt-0.5 ${
                systemSettings.systemNotice.type === 'vip' ? 'text-amber-400' : 'text-current'
              }`}>
                {systemSettings.systemNotice.type === 'vip' ? 'stars' : systemSettings.systemNotice.type === 'warning' ? 'warning' : 'campaign'}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {systemSettings.systemNotice.title}
                </h4>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                  {systemSettings.systemNotice.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNoticeDismissed(true)}
              className="p-1 rounded-lg hover:bg-black/10 text-current opacity-70 hover:opacity-100 transition-all cursor-pointer shrink-0"
              title="Cerrar aviso"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Top Welcome Bar (Apple Business Minimalist) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#86868B] tracking-wider uppercase">
                Banca Nova
              </span>
              <span className="w-1 h-1 rounded-full bg-[#86868B]/40"></span>
              <span className="text-[11px] font-medium text-[#0071E3]">
                Plan {currentPlan}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Hola, {user.name.split(' ')[0]}
            </h1>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyIban}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] text-[12px] font-medium text-[#1D1D1F] border border-black/[0.06] shadow-2xs transition-all cursor-pointer"
              title="Copiar número de cuenta"
            >
              <span className="material-symbols-outlined text-[15px] text-[#0071E3]">
                {copiedIban ? 'done' : 'content_copy'}
              </span>
              <span>{copiedIban ? 'Copiada' : 'Copiar cuenta'}</span>
            </button>

            <button
              onClick={() => onNavigate('transfers')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[12px] font-semibold shadow-xs transition-all cursor-pointer active:scale-97"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
              <span>Transferir</span>
            </button>
          </div>
        </div>

        {/* Hero Section: Balance Card & Apple Bank Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          
          {/* Main Balance Canvas (7 cols) - Apple Wallet inspired */}
          <div className="lg:col-span-7 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between relative">
            <div>
              {/* Header inside card */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#86868B] tracking-wide">
                  Saldo disponible (HNL)
                </span>
                
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-1 rounded-full text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
                  title={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {hideBalance ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>

              {/* Amount Display */}
              <div className="my-1">
                {hideBalance ? (
                  <span className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] tabular-nums">
                    L. ••••••••
                  </span>
                ) : (
                  <span className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] tabular-nums">
                    {formatLempiras(balance)}
                  </span>
                )}
              </div>

              {/* Account subtitle */}
              <p className="text-xs text-[#86868B] mt-1.5 font-mono">
                {user.accountType} • {cleanAccountNumber}
              </p>
            </div>

            {/* Quick Action Buttons (Apple iOS Control Style) */}
            <div className="grid grid-cols-4 gap-2 mt-6 pt-5 border-t border-black/[0.04]">
              {/* Transfer */}
              <button
                onClick={() => onNavigate('transfers')}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-[#F5F5F7] active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full bg-[#0071E3] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.25)] group-hover:bg-[#0077ED] transition-colors">
                  <span className="material-symbols-outlined text-[19px]">send</span>
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Transferir
                </span>
              </button>

              {/* Deposit */}
              <button
                onClick={onOpenDeposit}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-[#F5F5F7] active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full bg-[#F5F5F7] text-[#0071E3] flex items-center justify-center group-hover:bg-[#E8E8ED] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Ingresar
                </span>
              </button>

              {/* Withdraw */}
              <button
                onClick={onOpenWithdraw}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-[#F5F5F7] active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center group-hover:bg-[#E8E8ED] transition-colors">
                  <span className="material-symbols-outlined text-[19px]">arrow_upward</span>
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Retirar
                </span>
              </button>

              {/* History */}
              <button
                onClick={() => onNavigate('history')}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-[#F5F5F7] active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full bg-[#F5F5F7] text-[#86868B] flex items-center justify-center group-hover:bg-[#E8E8ED] transition-colors">
                  <span className="material-symbols-outlined text-[19px]">receipt_long</span>
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Movimientos
                </span>
              </button>
            </div>
          </div>

          {/* Bank Card Section (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-[28px] p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3] block">
                  Emisión {currentPlan}
                </span>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Tarjeta Banca Nova
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#34C759] font-medium bg-[#34C759]/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
                <span>{isCardLocked ? 'Bloqueada' : 'Operativa'}</span>
              </div>
            </div>

            {/* Multi-Card Selector Tabs if multiple cards */}
            {user.cards && user.cards.length > 1 && (
              <div className="w-full mb-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
                  {user.cards.map((c) => {
                    const isActive = c.id === (user.activeCardId || user.cards?.[0]?.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSwitchCard?.(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-[#0071E3] text-white shadow-2xs'
                            : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#86868B]'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="font-mono text-[10px] opacity-80">•••• {c.cardLast4}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bank Card */}
            <RealisticBankCard
              cardHolderName={user.name}
              cardLast4={user.cardLast4}
              expiryDate={user.expiryDate || '10/29'}
              cvv={user.cvv || '842'}
              isLocked={isCardLocked}
              onToggleLock={() => setIsCardLocked(!isCardLocked)}
              theme={user.cardTheme || 'obsidian'}
              showControls={true}
              showColorPicker={false}
              onOpenQrModal={onOpenQrModal}
              onOpenThemeRequest={onOpenThemeRequest}
              size="md"
            />

            {/* Clean subtle footer */}
            <div className="w-full mt-3 pt-2.5 border-t border-black/[0.04] flex items-center justify-between text-xs text-[#86868B]">
              <span className="font-mono text-[11px]">Contactless • EMV</span>
              <button
                type="button"
                onClick={() => setShowAddCardModal(true)}
                className="text-[#0071E3] hover:underline font-medium text-[11px] cursor-pointer"
              >
                + Nueva tarjeta
              </button>
            </div>
          </div>
        </div>

        {/* Quick Send to Frequent Contacts Section */}
        <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1D1D1F]">
                Envío Rápido
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Cuentas frecuentes para transferencias instantáneas
              </p>
            </div>
            
            <button
              onClick={() => onNavigate('transfers')}
              className="text-xs font-semibold text-[#0071E3] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Transferir a otra cuenta</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickContacts.map((contact) => (
              <button
                key={contact.name}
                onClick={() => onNavigate('transfers')}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F7] hover:bg-[#E8E8ED] transition-all text-left cursor-pointer border border-black/[0.02] group"
              >
                <div className={`w-10 h-10 rounded-full ${contact.bg} flex items-center justify-center font-semibold text-xs shrink-0 group-hover:scale-105 transition-transform`}>
                  {contact.initials}
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] font-semibold text-[#1D1D1F] block truncate">
                    {contact.name}
                  </span>
                  <span className="text-[11px] text-[#86868B] truncate block font-mono">
                    {contact.iban.slice(0, 9)}...
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lower Grid: Recent Movements & Financial Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Recent Movements (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-[28px] p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  Movimientos Recientes
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Tus transacciones más recientes en Lempiras
                </p>
              </div>

              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            {/* Transactions List */}
            <div className="flex flex-col divide-y divide-black/[0.04]">
              {recentMovements.length === 0 ? (
                <div className="py-8 text-center text-[#86868B] text-sm">
                  No hay movimientos recientes
                </div>
              ) : (
                recentMovements.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction?.(tx)}
                      className="py-3 sm:py-3.5 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-[#F5F5F7] px-2 rounded-xl transition-colors cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isPositive
                            ? 'bg-emerald-50 text-[#34C759]'
                            : 'bg-black/[0.04] text-[#1D1D1F]'
                        }`}>
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                            {tx.type === 'deposit' ? 'payments' : tx.type === 'transfer' ? 'send' : 'shopping_bag'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[13px] sm:text-[13.5px] font-medium text-[#1D1D1F] block leading-tight truncate">
                            {tx.title}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-[#86868B] block mt-0.5 truncate">
                            {tx.date} • {tx.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-[13px] sm:text-[14px] font-semibold block whitespace-nowrap tabular-nums tracking-tight ${
                          isPositive ? 'text-[#34C759]' : 'text-[#1D1D1F]'
                        }`}>
                          {isPositive ? '+' : '-'}{formatLempiras(Math.abs(tx.amount))}
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] text-[#86868B] uppercase font-medium whitespace-nowrap block">
                          {tx.status === 'completed' ? 'Completado' : 'En proceso'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Spending Insights & Advisory (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
            
            {/* Spending Categories Card */}
            <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Distribución de Gastos
                </h3>
                <span className="text-xs font-medium text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full">
                  Lempiras
                </span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#1D1D1F]">Alimentos &amp; Supermercado</span>
                    <span className="text-[#86868B]">45%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0071E3] rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#1D1D1F]">Servicios &amp; Suscripciones</span>
                    <span className="text-[#86868B]">25%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#34C759] rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#1D1D1F]">Transporte</span>
                    <span className="text-[#86868B]">15%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF9500] rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#1D1D1F]">Otros Gastos</span>
                    <span className="text-[#86868B]">15%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#AF52DE] rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wealth Advisor Mini Card */}
            <div 
              onClick={onOpenWealthAdvisor}
              className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] cursor-pointer hover:border-[#0071E3]/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0071E3]"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
                  Asesoría Financiera
                </span>
              </div>
              <h4 className="text-base font-semibold text-[#1D1D1F] mb-1">
                Planificación en Lempiras
              </h4>
              <p className="text-xs text-[#86868B] leading-relaxed mb-4">
                Consulta con un asesor patrimonial para tus metas de ahorro e inversión.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] group-hover:underline">
                <span>Agendar Consulta</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Add New Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-[#1D1D1F]">
            <div className="flex justify-between items-start pb-3 mb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_card</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">Emitir Nueva Tarjeta</h3>
                  <p className="text-xs text-[#86868B]">Crea una tarjeta adicional con tu color preferido</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddNewCard?.({
                  name: newCardName.trim() || 'Tarjeta Adicional Nova',
                  theme: newCardTheme,
                  type: newCardType,
                });
                setShowAddCardModal(false);
                setNewCardName('');
              }}
              className="flex flex-col gap-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">Nombre o Etiqueta de la Tarjeta:</label>
                <input
                  type="text"
                  placeholder="Ej: Tarjeta Gastos Viajes, Oro Negocios..."
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">Tipo de Tarjeta:</label>
                <select
                  value={newCardType}
                  onChange={(e) => setNewCardType(e.target.value as any)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white transition-all"
                >
                  <option value="Virtual Express">Virtual Express Instantánea</option>
                  <option value="Débito VIP">Débito VIP Platinum</option>
                  <option value="Crédito Black">Crédito Black Revolving</option>
                  <option value="Empresarial">Empresarial Corporativa</option>
                  <option value="Banca Privada">Banca Privada Patrimonio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">Selecciona el Color / Acabado:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'obsidian', name: 'Obsidiana VIP', bg: 'bg-[#101014]' },
                    { id: 'gold', name: 'Oro 24K', bg: 'bg-[#C5A059]' },
                    { id: 'titanium', name: 'Titanio', bg: 'bg-[#2B303A]' },
                    { id: 'emerald', name: 'Esmeralda', bg: 'bg-[#0B3B26]' },
                    { id: 'rose_gold', name: 'Oro Rosa', bg: 'bg-[#43232C]' },
                    { id: 'sapphire', name: 'Zafiro', bg: 'bg-[#0F2744]' },
                  ].map((fin) => {
                    const isSelected = newCardTheme === fin.id;
                    return (
                      <button
                        key={fin.id}
                        type="button"
                        onClick={() => setNewCardTheme(fin.id as CardTheme)}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0071E3] bg-blue-50/60 ring-2 ring-[#0071E3]/20'
                            : 'border-black/[0.08] bg-[#FAFAFC] hover:bg-[#F5F5F7]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${fin.bg} border border-white/60 shadow-xs`}></div>
                        <span className="text-[10px] font-bold text-[#1D1D1F] leading-tight">{fin.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-black/[0.06] mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#86868B] hover:bg-black/[0.04]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Emitir Tarjeta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
