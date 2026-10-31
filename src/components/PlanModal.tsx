import React from 'react';
import { PlanTier, PlanConfig, CardTheme } from '../types';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  plans: Record<'Personal' | 'Business' | 'Black', PlanConfig>;
  onSelectPlan: (plan: PlanTier) => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  plans,
  onSelectPlan,
}) => {
  if (!isOpen) return null;

  const planOrder: Array<'Personal' | 'Business' | 'Black'> = ['Personal', 'Business', 'Black'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full border border-black/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.25)] text-[#1D1D1F] my-8">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-4 mb-6 border-b border-black/[0.06]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] block">
              Banca Nova • Membresías y Niveles
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] mt-1">
              Planes de Banca Privada
            </h2>
            <p className="text-xs text-[#86868B] mt-0.5">
              Al cambiar de plan, tu tarjeta física y digital se actualizará automáticamente a su acabado correspondiente.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 3 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {planOrder.map((planKey) => {
            const plan = plans[planKey];
            const isCurrent = currentPlan === planKey;
            const isBlack = planKey === 'Black';
            const isGold = planKey === 'Business';

            return (
              <div
                key={planKey}
                className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                  isBlack
                    ? 'bg-gradient-to-b from-[#111317] via-[#0B0C0E] to-[#040506] text-white border-2 border-amber-400/40 shadow-[0_12px_35px_rgba(0,0,0,0.3)] ring-1 ring-amber-400/20 md:-translate-y-2'
                    : isGold
                    ? 'bg-white border border-amber-200 shadow-sm'
                    : 'bg-[#F9F9FB] border border-black/[0.06]'
                }`}
              >
                {/* Top Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isBlack
                          ? 'bg-gradient-to-r from-amber-400/30 to-amber-200/20 text-amber-300 border border-amber-400/30'
                          : isGold
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {plan.badge}
                    </span>

                    {isCurrent && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isBlack ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Plan Actual
                      </span>
                    )}
                  </div>

                  {/* Plan Name */}
                  <h3 className={`text-lg font-bold tracking-tight ${isBlack ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    {plan.name}
                  </h3>
                  
                  {/* Card Finish Preview Pill */}
                  <div className="flex items-center gap-2 mt-2 mb-4">
                    <span className="text-[11px] font-medium text-inherit opacity-70">
                      Tarjeta:
                    </span>
                    <span className={`text-[11px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                      isBlack
                        ? 'bg-white/10 text-amber-300 border border-white/10'
                        : isGold
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-sky-50 text-sky-900 border border-sky-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isBlack ? 'bg-black border border-amber-400' : isGold ? 'bg-[#C5A059]' : 'bg-[#0071E3]'
                      }`}></span>
                      {isBlack ? 'Black Titanium VIP' : isGold ? 'Oro 24K Metálica' : 'Zafiro Digital'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 my-3 pb-3 border-b border-black/[0.06] border-white/10">
                    <span className={`text-3xl font-extrabold tracking-tight ${isBlack ? 'text-white' : 'text-[#1D1D1F]'}`}>
                      ${plan.monthlyFee}
                    </span>
                    <span className={`text-xs ${isBlack ? 'text-white/60' : 'text-[#86868B]'}`}>
                      / mes
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed mb-4 ${isBlack ? 'text-white/70' : 'text-[#86868B]'}`}>
                    {plan.description}
                  </p>

                  {/* Perks list */}
                  <ul className="space-y-2.5 mb-6 text-xs">
                    {plan.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${
                          isBlack ? 'text-amber-400' : isGold ? 'text-amber-600' : 'text-[#0071E3]'
                        }`}>
                          check_circle
                        </span>
                        <span className={isBlack ? 'text-white/90' : 'text-[#1D1D1F]'}>
                          {perk}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Select Button */}
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => {
                    onSelectPlan(planKey);
                    onClose();
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-black/10 text-[#86868B] cursor-default border border-transparent'
                      : isBlack
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-[0_4px_15px_rgba(245,158,11,0.3)] active:scale-98'
                      : isGold
                      ? 'bg-[#1D1D1F] hover:bg-black text-white active:scale-98'
                      : 'bg-white hover:bg-black/[0.04] text-[#1D1D1F] border border-black/[0.08] active:scale-98'
                  }`}
                >
                  {isCurrent ? 'Plan Activo' : isBlack ? 'Obtener Black Titanium VIP' : `Cambiar a ${planKey}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86868B]">
          <span>
            * Las cuotas mensuales se descuentan automáticamente de tu saldo. Sin permanencia.
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#1D1D1F] hover:underline cursor-pointer"
          >
            Cerrar ventana
          </button>
        </div>

      </div>
    </div>
  );
};
