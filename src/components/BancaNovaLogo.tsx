import React, { useState, useEffect } from 'react';

interface BancaNovaLogoProps {
  variant?: 'light' | 'dark' | 'gold' | 'minimal' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  companyName?: string;
  subtitle?: string;
  customLogoUrl?: string;
}

export const BancaNovaLogo: React.FC<BancaNovaLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showText = true,
  className = '',
  companyName,
  subtitle,
  customLogoUrl,
}) => {
  // Real-time branding state fallback
  const [cachedBranding, setCachedBranding] = useState<{
    companyName?: string;
    subtitle?: string;
    logoUrl?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('bancanova_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.branding) {
          return {
            companyName: parsed.branding.companyName,
            subtitle: parsed.branding.subtitle,
            logoUrl: parsed.branding.logoUrl,
          };
        }
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    const handleBrandingChange = (e: any) => {
      if (e?.detail) {
        setCachedBranding({
          companyName: e.detail.companyName,
          subtitle: e.detail.subtitle,
          logoUrl: e.detail.logoUrl,
        });
      } else {
        try {
          const saved = localStorage.getItem('bancanova_system_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.branding) {
              setCachedBranding({
                companyName: parsed.branding.companyName,
                subtitle: parsed.branding.subtitle,
                logoUrl: parsed.branding.logoUrl,
              });
            }
          }
        } catch {}
      }
    };

    window.addEventListener('bancanova_branding_changed', handleBrandingChange);
    window.addEventListener('storage', handleBrandingChange);
    return () => {
      window.removeEventListener('bancanova_branding_changed', handleBrandingChange);
      window.removeEventListener('storage', handleBrandingChange);
    };
  }, []);

  const activeCompanyName = (companyName || cachedBranding.companyName || 'Banca Nova').trim();
  const activeSubtitle = subtitle !== undefined ? subtitle : cachedBranding.subtitle !== undefined ? cachedBranding.subtitle : 'Honduras';
  const activeLogoUrl = customLogoUrl || cachedBranding.logoUrl || '';

  const nameParts = activeCompanyName.split(/\s+/);
  const firstWord = nameParts[0] || 'Banca';
  const restWords = nameParts.slice(1).join(' ');

  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }[size];

  const textSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  const isLight = variant === 'light';
  const isGold = variant === 'gold';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Custom Logo or Signature Nova "N" Emblem */}
      <div
        className={`${iconDimensions} relative flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
      >
        {activeLogoUrl ? (
          <div className="w-full h-full rounded-xl overflow-hidden bg-white/95 p-0.5 border border-black/[0.08] shadow-[0_2px_8px_rgba(0,113,227,0.18)] flex items-center justify-center">
            <img
              src={activeLogoUrl}
              alt={activeCompanyName}
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                // If custom image fails to load, gracefully hide img and show default
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <svg
            viewBox="0 0 44 44"
            className="w-full h-full drop-shadow-[0_3px_10px_rgba(0,113,227,0.22)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Apple High-Tech Sapphire Blue Gradient */}
              <linearGradient id="bn-nova-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0071E3" />
                <stop offset="60%" stopColor="#0051B3" />
                <stop offset="100%" stopColor="#002D62" />
              </linearGradient>

              {/* Deep Obsidian & Slate Gradient */}
              <linearGradient id="bn-nova-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              {/* Noble Gold Accent Gradient */}
              <linearGradient id="bn-nova-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>

              {/* Platinum Shimmer */}
              <linearGradient id="bn-nova-shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="50%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>

            {/* Hexagonal Shield Background */}
            <rect
              x="2"
              y="2"
              width="40"
              height="40"
              rx="12"
              fill={
                isGold
                  ? 'url(#bn-nova-gold)'
                  : isLight
                  ? '#FFFFFF'
                  : 'url(#bn-nova-dark)'
              }
              stroke={
                isLight
                  ? 'rgba(0,113,227,0.2)'
                  : isGold
                  ? 'rgba(255,255,255,0.4)'
                  : 'rgba(255,255,255,0.15)'
              }
              strokeWidth="1.2"
            />

            {/* Signature "N" Emblem (Banca Nova) */}
            <path
              d="M13.5 31.5V12.5L30.5 31.5V12.5"
              stroke={isLight ? '#0071E3' : isGold ? '#0F172A' : '#FFFFFF'}
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Golden Nova Apex Spark */}
            <circle
              cx="22"
              cy="7.5"
              r="2"
              fill="url(#bn-nova-gold)"
              stroke={isLight ? '#0071E3' : '#FFFFFF'}
              strokeWidth="0.6"
            />
          </svg>
        )}
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`${textSize} font-bold tracking-tight ${
                isLight ? 'text-white' : isGold ? 'text-amber-200' : 'text-[#1D1D1F]'
              }`}
            >
              {firstWord}
            </span>
            {restWords && (
              <span
                className={`${textSize} font-extrabold tracking-tight bg-gradient-to-r from-[#0071E3] to-[#0284C7] bg-clip-text text-transparent`}
              >
                {restWords}
              </span>
            )}
          </div>
          {activeSubtitle && (
            <span
              className={`text-[9px] uppercase tracking-widest font-semibold mt-0.5 ${
                isLight ? 'text-white/70' : 'text-[#86868B]'
              }`}
            >
              {activeSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
