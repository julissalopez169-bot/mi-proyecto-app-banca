import React, { useState } from 'react';
import { CardTheme, CardThemeRequest, UserProfile } from '../types';
import { RealisticBankCard } from './RealisticBankCard';

interface CardThemeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  existingRequests: CardThemeRequest[];
  onSubmitRequest?: (theme: CardTheme, reason: string) => void;
  onApplyInstantTheme?: (theme: CardTheme) => void;
}

export const CardThemeRequestModal: React.FC<CardThemeRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  existingRequests,
  onSubmitRequest,
  onApplyInstantTheme,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(currentUser.cardTheme || 'obsidian');
  const [reason, setReason] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const finishes: Array<{
    id: CardTheme;
    name: string;
    material: string;
    badge: string;
    bgClass: string;
    description: string;
  }> = [
    {
      id: 'obsidian',
      name: 'Black Obsidiana VIP',
      material: 'Carbono Forjado & Ópalo Negro',
      badge: 'Nivel Superior VIP',
      bgClass: 'bg-[#101014]',
      description: 'Acabado negro mate de máxima privacidad con grabado láser dorado y peso ultra premium.',
    },
    {
      id: 'gold',
      name: 'Oro 24K Noble',
      material: 'Aleación Dorada Cepillada',
      badge: 'Prestigio Ejecutivo',
      bgClass: 'bg-[#C5A059]',
      description: 'Brillo metálico dorado con reflejos cálidos y ribetes pulidos a mano.',
    },
    {
      id: 'titanium',
      name: 'Titanio Gris Espacial',
      material: 'Titanio Aeronáutico Grado 5',
      badge: 'Vanguardia Tecnológica',
      bgClass: 'bg-[#2B303A]',
      description: 'Resistencia extrema con textura cepillada espacial y estética minimalista moderna.',
    },
    {
      id: 'emerald',
      name: 'Esmeralda Imperial',
      material: 'Cristal Mineral Esmeralda',
      badge: 'Banca Privada',
      bgClass: 'bg-[#0B3B26]',
      description: 'Profundo verde joya con destellos esmeralda y acentos en oro noble.',
    },
    {
      id: 'rose_gold',
      name: 'Oro Rosa 18K',
      material: 'Aleación Cobre & Oro Rosa',
      badge: 'Heritage Exclusivo',
      bgClass: 'bg-[#43232C]',
      description: 'Tonalidad cobriza suave con lustre metálico y diseño contemporáneo elegante.',
    },
    {
      id: 'sapphire',
      name: 'Zafiro Real',
      material: 'Azul Marino Profundo',
      badge: 'Digital Sapphire',
      bgClass: 'bg-[#0F2744]',
      description: 'Diseño clásico azul oceánico con acentos celestes brillantes.',
    },
  ];

  const currentFinishInfo = finishes.find((f) => f.id === selectedTheme) || finishes[0];
  
  // Check if selected theme is already authorized by the admin
  const isAuthorized =
    currentUser.canChangeCardThemeFreely ||
    (currentUser.authorizedThemes && currentUser.authorizedThemes.includes(selectedTheme)) ||
    selectedTheme === 'obsidian' ||
    selectedTheme === 'gold'; // Default base authorized

  const hasPendingRequest = existingRequests.some(
    (r) => r.requestedTheme === selectedTheme && r.status === 'pending'
  );

  const handleSelectTheme = (themeId: CardTheme) => {
    setSelectedTheme(themeId);
  };

  const handleApplyOrRequest = () => {
    if (isAuthorized) {
      // User is authorized: apply immediately and freely!
      if (onApplyInstantTheme) {
        onApplyInstantTheme(selectedTheme);
      }
      setAppliedSuccess(`¡Acabado ${currentFinishInfo.name} aplicado automáticamente y gratis!`);
      setTimeout(() => {
        setAppliedSuccess(null);
        onClose();
      }, 1400);
    } else {
      // User requires admin authorization
      if (onSubmitRequest) {
        onSubmitRequest(
          selectedTheme,
          reason.trim() || `Solicitud de autorización para acabado ${currentFinishInfo.name} (Gratis permanente)`
        );
      }
      setAppliedSuccess('¡Solicitud enviada al Administrador! Una vez autorizada podrás cambiar gratis cuando quieras.');
      setTimeout(() => {
        setAppliedSuccess(null);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-[#1D1D1F] max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-3.5 mb-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">palette</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F]">
                Gestión &amp; Acabados de Tarjeta
              </h3>
              <p className="text-xs text-[#86868B]">
                Los acabados autorizados se cambian al instante gratis cuando quieras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Interactive Live Card Preview */}
        <div className="mb-4 flex flex-col items-center justify-center bg-gradient-to-b from-[#F9FAFB] to-[#F2F4F7] p-4 rounded-3xl border border-black/[0.06]">
          <div className="flex items-center justify-between w-full max-w-[340px] mb-2 px-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#86868B]">
              Vista Previa en Vivo
            </span>
            <div className="flex items-center gap-1.5">
              {isAuthorized ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Autorizado • Cambio Gratis
                </span>
              ) : hasPendingRequest ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Autorización Pendiente
                </span>
              ) : (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Requiere Autorización Admin
                </span>
              )}
            </div>
          </div>
          <RealisticBankCard
            cardHolderName={currentUser.name.toUpperCase()}
            cardLast4={currentUser.cardLast4}
            expiryDate={currentUser.expiryDate || '10/29'}
            cvv={currentUser.cvv || '842'}
            theme={selectedTheme}
            showControls={false}
            size="md"
          />
        </div>

        {/* Finish Selector Grid */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-[#1D1D1F] mb-2">
            Elige el Acabado de la Tarjeta:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {finishes.map((f) => {
              const isSelected = selectedTheme === f.id;
              const isCurrent = currentUser.cardTheme === f.id;
              const finishAuthorized =
                currentUser.canChangeCardThemeFreely ||
                (currentUser.authorizedThemes && currentUser.authorizedThemes.includes(f.id)) ||
                f.id === 'obsidian' ||
                f.id === 'gold';
              const isPending = existingRequests.some(
                (r) => r.requestedTheme === f.id && r.status === 'pending'
              );

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelectTheme(f.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[95px] ${
                    isSelected
                      ? 'border-[#0071E3] bg-blue-50/50 shadow-xs ring-2 ring-[#0071E3]/20'
                      : 'border-black/[0.08] bg-white hover:bg-[#F9FAFB]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-5 h-5 rounded-full ${f.bgClass} border border-white/60 shadow-xs`}></div>
                    {isCurrent ? (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                        En Uso
                      </span>
                    ) : finishAuthorized ? (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]">check</span>
                        Autorizado
                      </span>
                    ) : isPending ? (
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-[#F5F5F7] text-[#86868B] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]">lock</span>
                        Autorizar
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-[#1D1D1F] block leading-tight">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-[#86868B] block truncate mt-0.5">
                      {finishAuthorized ? 'Cambio gratis disponible' : 'Requiere autorización'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason field (only shown if not authorized) */}
        {!isAuthorized && (
          <div className="mb-4 p-3 bg-[#F9FAFB] rounded-2xl border border-black/[0.06]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-600">info</span>
              <span className="text-xs font-bold text-[#1D1D1F]">
                Autorización del Administrador
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] mb-2">
              Una vez que el Administrador autorice este acabado, podrás activarlo y cambiar a él <strong>gratis cuando quieras</strong> sin límites.
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nota opcional para el administrador..."
              className="w-full bg-white border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3]"
            />
          </div>
        )}

        {/* Apply / Request Button */}
        {appliedSuccess ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 animate-in fade-in">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <div className="text-xs">
              <span className="font-bold block">Operación Procesada</span>
              <span className="text-[11px] text-emerald-700">{appliedSuccess}</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5 pt-2 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleApplyOrRequest}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 text-white ${
                isAuthorized
                  ? 'bg-[#0071E3] hover:bg-[#0077ED]'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isAuthorized ? 'done_all' : 'send'}
              </span>
              <span>
                {isAuthorized
                  ? 'Aplicar Acabado Gratis al Instante'
                  : 'Solicitar Autorización al Administrador'}
              </span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
