import React from 'react';
import { ScreenType, UserProfile, CompanyBranding } from '../types';
import { BancaNovaLogo } from './BancaNovaLogo';

interface NavigationProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  user: UserProfile;
  activeTab?: 'personal' | 'business';
  onTabChange?: (tab: 'personal' | 'business') => void;
  onOpenAvatarModal?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  branding?: CompanyBranding;
}

export const TopNavBar: React.FC<{
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  activeTab?: 'personal' | 'business';
  onTabChange?: (tab: 'personal' | 'business') => void;
  onOpenAuthModal?: () => void;
  branding?: CompanyBranding;
}> = ({ currentScreen, onNavigate, activeTab = 'personal', onTabChange, onOpenAuthModal, branding }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#F5F5F7]/90 backdrop-blur-2xl border-b border-black/[0.06] transition-all duration-300">
      <div className="max-w-[1240px] mx-auto flex justify-between items-center px-6 md:px-10 h-16">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('landing')}
          className="cursor-pointer flex items-center group py-1"
        >
          <BancaNovaLogo
            size="md"
            variant="dark"
            companyName={branding?.companyName}
            subtitle={branding?.subtitle}
            customLogoUrl={branding?.logoUrl}
          />
        </div>

        {/* Center: Apple Segmented Pill Tabs */}
        <div className="hidden md:flex items-center p-1 bg-black/[0.04] rounded-full border border-black/[0.04]">
          <button
            onClick={() => onTabChange?.('personal')}
            className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-[#0071E3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)] font-semibold'
                : 'text-[#86868B] hover:text-[#0071E3]'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => onTabChange?.('business')}
            className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === 'business'
                ? 'bg-[#0071E3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)] font-semibold'
                : 'text-[#86868B] hover:text-[#0071E3]'
            }`}
          >
            Empresas
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="text-[13px] font-medium text-[#1D1D1F] hover:text-[#0071E3] bg-white/80 hover:bg-white px-3.5 py-2 rounded-full border border-black/[0.08] transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0071E3]">login</span>
              <span>Iniciar Sesión</span>
            </button>
          )}

          <button
            onClick={() => onNavigate(currentScreen === 'landing' ? 'dashboard' : 'landing')}
            className="text-[13px] font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white px-4.5 py-2 rounded-full transition-all duration-200 cursor-pointer shadow-[0_2px_10px_rgba(0,113,227,0.25)] active:scale-97 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {currentScreen === 'landing' ? 'arrow_forward' : 'home'}
            </span>
            {currentScreen === 'landing' ? 'Banca en Línea' : 'Ir a Portada'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export const SideNavBar: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  user,
  onOpenAvatarModal,
  onOpenAuthModal,
  onLogout,
  branding,
}) => {
  const userInitials = (user.name || 'BN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Main user navigation (Apple Business Style)
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'grid_view' },
    { id: 'transfers', label: 'Transferir', icon: 'send' },
    { id: 'history', label: 'Movimientos', icon: 'receipt_long' },
    { id: 'profile', label: 'Mi Perfil', icon: 'person' },
  ];

  return (
    <>
      {/* Desktop macOS-style Sleek Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col justify-between p-5 hidden md:flex z-40 shadow-[2px_0_16px_rgba(0,0,0,0.02)]">
        {/* Brand and User Header */}
        <div className="flex flex-col gap-5">
          {/* Logo */}
          <div 
            onClick={() => onNavigate('landing')}
            className="cursor-pointer flex items-center px-1 pt-1 group"
          >
            <BancaNovaLogo
              size="md"
              variant="dark"
              companyName={branding?.companyName}
              subtitle={branding?.subtitle}
              customLogoUrl={branding?.logoUrl}
            />
          </div>

          {/* User Profile Mini Card with Verified Banking Monogram Badge (No photo change option) */}
          <div 
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F5F5F7] hover:bg-black/[0.04] transition-all cursor-pointer border border-black/[0.04] shadow-2xs group"
            onClick={() => onNavigate('profile')}
            title="Ver información de cuenta"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#0047AB] flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm ring-2 ring-white">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white text-[9px]" title="Identidad protegida">
                <span className="material-symbols-outlined text-[10px]">verified</span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[13px] font-bold text-[#1D1D1F] truncate leading-tight group-hover:text-[#0071E3] transition-colors">
                {user.name}
              </h2>
              <span className="text-[11px] font-medium text-[#86868B] block truncate leading-tight mt-0.5">
                {branding?.companyName || 'Banca Nova'}
              </span>
            </div>
            <span 
              className="material-symbols-outlined text-[#86868B] group-hover:text-[#0071E3] text-[18px]"
            >
              chevron_right
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#86868B] px-3 pb-1 tracking-wider uppercase">
              Menú Principal
            </span>
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as ScreenType)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#0071E3] text-white shadow-[0_4px_14px_rgba(0,113,227,0.3)] font-semibold'
                      : 'text-[#1D1D1F]/80 hover:bg-blue-50/60 hover:text-[#0071E3] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-[#86868B]'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[13.5px]">
                      {item.label}
                    </span>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined text-white/80 text-[16px]">
                      chevron_right
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Action & Logout Button */}
        <div className="flex flex-col gap-2.5 pt-4 border-t border-black/[0.06]">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-3 bg-red-50/70 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-200/60 active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          )}

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] text-[#1D1D1F]/70 font-medium">Bóveda Cifrada HN</span>
            </div>
            <span className="text-[10px] text-[#86868B] font-bold">Lempiras (L.)</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]">
        <div 
          onClick={() => onNavigate('landing')} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <BancaNovaLogo
            size="sm"
            variant="dark"
            companyName={branding?.companyName}
            subtitle={branding?.subtitle}
            customLogoUrl={branding?.logoUrl}
          />
        </div>
        <div className="flex items-center gap-2">
          <div
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#0047AB] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs ring-1 ring-black/10 cursor-pointer"
            title="Mi Perfil"
          >
            {userInitials}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (iOS style frosted glass with native safe area) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-black/[0.08] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ScreenType)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] text-[10px] font-medium transition-all active:scale-95 cursor-pointer ${
                isActive ? 'text-[#0071E3] font-bold' : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-[#0071E3]/10' : ''}`}>
                <span className={`material-symbols-outlined text-[21px] block ${isActive ? 'filled text-[#0071E3]' : ''}`}>
                  {item.icon}
                </span>
              </div>
              <span className="mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
