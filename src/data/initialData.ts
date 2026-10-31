import { Transaction, UserProfile, AdminUser, SystemSettings, PlanConfig, CardThemeRequest } from '../types';

export const APP_IMAGES = {
  heroLifestyle: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT3MuYpJ-6706msyIXcHezYFMBz8WfusBPTyFfMjSF8wmmnyL9UGfoJG9SRVDBScJIK092mBw8q96qB4HUBOw5ou3cMf7jXjBxg6WjOJnLhW2CZTn1tCWgmiYCGsIewd-yNO9c9O5x_EYKde_RyC8cdJLFBV8j5vvr4OPHICPz4E3w1fbL-cjJCyopzBASKwWfTH6KNTbRACfo9Y34aZfpAy-2UplHUxzPsNsKXqy-2TM2ZRKWiPNm',
  modernHouse: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUAJIGw0TYdmP5-clgFPYa156cRtSFCVf8sxL2DuCZo4aw8J29Rf2vmPBohthhfnKSsmG9hNxYYsjBAjDqM0RXbb8PumisVXPIRVUvK57xFt7ZeHgvPfLmexcP8C40oQ7WW6ckMdPBNZKjKNsIcUHlDGKp_v23MNW1XBH7u1TNtZYDT6p0SrpOroxgnEKWcbbFmQC3-qOgF8JVNN3hIBWdc8J_5TDHqTehjz9bINSp5bPavcTUfDg8',
  userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9cYKk2CGRIdoxWBAqe7sPV6Wf1xoWiN9O3_Zqn215RaOsHJ5yht27Zkpz66XKSunTo9KsuUU7Hv4ONmicbecjxsZYB9dYPhOraXtzc4pBcAmGj731HPLberCst8g55vh1HkNvX28cXbX7Xoq5pMJjyJ0mhY0w_Oxcp_vzrHhkd53kuaGWXqa_L4iaTDGC4N6v3T95wKJbn_AUeIBTyhfMHCtbulp0SxhIivbG6F5DivAN2JgSUXZg',
  userAvatarAlt: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkjGGSY8_jh-dSiWOldh10YyOXoVk1I3cgBXgbHRDGv9IAN0S6tDsSy_mHTTE4GYcCqRw6eUQYF6LZAvJaur36H6bg2FDoPHFExpKYZbwf8tZGUjp1izHq4G8U9zO54BJCnFka48W7y46SZRGFkomq3NQlA8uCTGh4oK5NWqimsphLKmsl4ZSKdmL_1vqX3MH4ExbG5PFpmGYOmELEY9A7EcZsf0OP1B9quW7Sebbp6KuHmClI9aaF',
  wealthPromo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs4oPCB6s-H_jLVbSp23ktvQt3RuApZfi-9hubzYnVjatrNHaX_h8CeZvZv9I1TdYg-nNJyZUsfdwbScPhSHMnxZmfmHG8P8hOrTZtXcKPfFJ3v2-xdGSDj0WsixkGlCDehm5_YYoOsteNwHpOAov62cmiagD09PYc2Ci5prI3qdn4pf1BHxjQNjh7JIHrxOqF3yioHCKeqxS3MDzjvDfoqcXyEK4irJpe9kSWmuNb2-bsJvRNr3oS',
  adminElena: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr-R0qLs_jLXLMZo4dJ2zYLNqjxWvZt6I4cU3VSgOzt7Z6actYG-hrdrzbIIYFPgmq8AX0_JFUWOWX3ZH4Wex66eN8YPfYDH3hnokK8JkCgeW4xPLcAMXP9LUHen_q7ilTkqkjF7oWPqTiu9x-pPCeTH4QOSYq8V-ykDZsrg17REZhsnutHb32Dkj_lVNApehyhWuckNOURcWp6Y1eSrBsw-pK2DKtvhDZlrGMI-_myN8Jm0t5Z527',
  adminArthur: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkaF7M1zPhzeUWB5dyJdeTFxa46QA5iiotnrRnMb9pMeXWni7OAsJj1811FandGONHb9hr8g_whfxV4091ylhE4deNopOhr8IG4NkFBToIYRjIguj9hKOvfJYLuCNnYdA89rdJ5NjVPbDrdootuMmWIqqBH5U6TMEbCl54yRU-QeFJEdGfEwDbT2unMW1cv5PWxXco3o7tE-GCn6udURZH1TmG3AEzlo8aWygYuU1-vV8Sk1k8GsW4'
};

export const DEFAULT_PLANS: Record<'Personal' | 'Business' | 'Black', PlanConfig> = {
  Personal: {
    id: 'Personal',
    name: 'Plan Personal Sapphire',
    badge: 'Básico Digital',
    monthlyFee: 0,
    minBalanceRequired: 0,
    dailyCardLimit: 30000,
    defaultTheme: 'sapphire',
    isExclusiveBlack: false,
    description: 'Gestión bancaria en Honduras sin comisiones, transferencias ACH inmediatas y tarjeta Zafiro.',
    perks: [
      'Tarjeta física y Apple Pay en Acabado Zafiro',
      'Transferencias ACH inmediatas en Lempiras',
      'Retiros hasta L. 10,000 en cajeros Banred sin costo',
      'Soporte digital prioritario vía App',
    ],
  },
  Business: {
    id: 'Business',
    name: 'Plan Business Gold',
    badge: 'Empresas & Autónomos',
    monthlyFee: 1200,
    minBalanceRequired: 50000,
    dailyCardLimit: 250000,
    defaultTheme: 'gold',
    isExclusiveBlack: false,
    description: 'Potencia corporativa en Honduras con facturación SAR automatizada, multidivisa y tarjeta Oro 24K.',
    perks: [
      'Tarjeta física metálica Oro Champán 24K',
      'Cuentas en Lempiras (HNL) y Dólares (USD)',
      'Límite operativo diario ampliado a L. 250,000',
      'Gestor de cuenta corporativo asignado',
      'Módulo de exportación contable e impuestos SAR en 1 clic',
    ],
  },
  Black: {
    id: 'Black',
    name: 'Plan Black Titanium VIP',
    badge: 'Máximo Prestigio • Nivel Superior',
    monthlyFee: 4900,
    minBalanceRequired: 500000,
    dailyCardLimit: 1000000,
    defaultTheme: 'obsidian',
    isExclusiveBlack: true,
    description: 'El programa de banca privada más exclusivo de Honduras. Tarjeta de titanio puro y obsidiana con beneficios globales.',
    perks: [
      'Tarjeta de Titanio y Obsidiana con grabado láser personalizado',
      'Asesor de patrimonio privado y servicio de Concierge 24/7',
      'Acceso ilimitado a más de 1,400 salas VIP LoungeKey en aeropuertos',
      'Seguro de viaje mundial y asistencia médica hasta L. 50,000,000',
      '0% comisión en cambio de divisas interbancario en todo el mundo',
      'Líneas de crédito preferenciales y límite flexible sin bloqueo',
    ],
  },
};

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  bankVaultReserve: 250000000.0,
  mortgageRateTin: 7.25,
  mortgageRateTae: 7.89,
  savingsApy: 8.50,
  maintenanceMode: false,
  systemNotice: {
    active: false,
    type: 'vip',
    title: 'Banca Nova Honduras',
    message: 'Servicio de banca privada en Lempiras (L.) y atención patrimonial exclusiva disponible 24/7.',
  },
  plans: DEFAULT_PLANS,
  branding: {
    companyName: 'Banca Nova',
    subtitle: 'Honduras',
    logoUrl: '',
    logoType: 'default',
  },
};

export const INITIAL_USER: UserProfile = {
  id: 'usr-1790006438268',
  name: 'julissalopez169@gmail.com',
  username: 'julissalopez169gmailcom',
  email: 'julissalopez169gmailcom@bancanova.hn',
  phone: '+504 9988-7766',
  address: 'Tegucigalpa, Francisco Morazán, Honduras',
  accountNumber: '0182 9901 6086 9528',
  cardLast4: '5220',
  accountType: 'Banca Privada Personal',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  pushNotifications: true,
  weeklySummary: true,
  plan: 'Personal',
  cardTheme: 'sapphire',
  authorizedThemes: ['sapphire'],
  canChangeCardThemeFreely: true,
  isCardFrozen: false,
  cardDailyLimit: 25000,
  cardContactless: true,
  cardOnlineShopping: true,
  cardAtmWithdrawals: true,
  cvv: '983',
  expiryDate: '10/30',
  activeCardId: 'card-5220',
  cards: [
    {
      id: 'card-5220',
      name: 'Tarjeta Débito Zafiro',
      cardHolderName: 'JULISSA LOPEZ',
      cardNumber: '•••• •••• •••• 5220',
      cardLast4: '5220',
      theme: 'sapphire',
      type: 'Débito VIP',
      expiryDate: '10/30',
      cvv: '983',
      dailyLimit: 25000,
      isFrozen: false,
      isDefault: true,
    },
  ],
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_ADMIN_USERS: AdminUser[] = [];

export const INITIAL_THEME_REQUESTS: CardThemeRequest[] = [];

