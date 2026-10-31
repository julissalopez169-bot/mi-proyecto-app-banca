export type ScreenType = 'landing' | 'dashboard' | 'transfers' | 'history' | 'profile' | 'admin';

export type TransactionType = 'deposit' | 'transfer' | 'withdrawal';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export type CardTheme = 'titanium' | 'obsidian' | 'sapphire' | 'gold' | 'emerald' | 'rose_gold';
export type PlanTier = 'Personal' | 'Business' | 'Black' | 'Premium';

export interface CardThemeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPlan: PlanTier;
  requestedTheme: CardTheme;
  currentTheme: CardTheme;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  timestamp: number;
  adminResponseNote?: string;
  reviewedDate?: string;
}

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  timestamp: number;
  categoryIcon: string;
  category: string;
  destinationAccount?: string;
  concept?: string;
  userId?: string;
  userName?: string;
  sarAuthCode?: string;
  usdAmount?: number;
}

export interface LoginAuditLog {
  id: string;
  userId: string;
  username: string;
  timestamp: number;
  date: string;
  method: 'PASSWORD' | 'BIOMETRIC_FINGERPRINT';
  status: 'SUCCESS' | 'FAILED';
  details?: string;
  ipOrDevice?: string;
}

export interface UserCard {
  id: string;
  name: string;
  cardHolderName: string;
  cardNumber: string;
  cardLast4: string;
  theme: CardTheme;
  type: 'Débito VIP' | 'Crédito Black' | 'Banca Privada' | 'Virtual Express' | 'Empresarial';
  expiryDate: string;
  cvv: string;
  dailyLimit: number;
  isFrozen: boolean;
  isDefault?: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  accountNumber: string;
  iban?: string;
  rtnSar?: string;
  usdBalance?: number;
  isActive?: boolean;
  isArchived?: boolean;
  cardLast4: string;
  accountType: string;
  avatarUrl: string;
  pushNotifications: boolean;
  weeklySummary: boolean;
  plan: PlanTier;
  cardTheme: CardTheme;
  authorizedThemes?: CardTheme[];
  canChangeCardThemeFreely?: boolean;
  cards?: UserCard[];
  activeCardId?: string;
  isCardFrozen?: boolean;
  cardDailyLimit?: number;
  cardContactless?: boolean;
  cardOnlineShopping?: boolean;
  cardAtmWithdrawals?: boolean;
  cvv?: string;
  expiryDate?: string;
  isGuest?: boolean;
  enrolledFaceUrl?: string;
  faceEnrolledAt?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: PlanTier;
  status: 'Activo' | 'Bloqueado';
  isActive?: boolean;
  isArchived?: boolean;
  iban?: string;
  rtnSar?: string;
  usdBalance?: number;
  avatar?: string;
  initials?: string;
  joinedDate: string;
  balance: number;
  phone?: string;
  address?: string;
  accountNumber?: string;
  cardLast4?: string;
  cardTheme?: CardTheme;
  authorizedThemes?: CardTheme[];
  canChangeCardThemeFreely?: boolean;
  isCardFrozen?: boolean;
  cardDailyLimit?: number;
  cardContactless?: boolean;
  cardOnlineShopping?: boolean;
  cardAtmWithdrawals?: boolean;
  cvv?: string;
  expiryDate?: string;
  enrolledFaceUrl?: string;
  faceEnrolledAt?: string;
}

export interface AdminCreditLog {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'credit' | 'debit';
  concept: string;
  date: string;
  timestamp: number;
  adminNote?: string;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  badge: string;
  monthlyFee: number;
  minBalanceRequired: number;
  dailyCardLimit: number;
  defaultTheme: CardTheme;
  isExclusiveBlack?: boolean;
  description: string;
  perks: string[];
}

export interface CompanyBranding {
  companyName: string;
  subtitle?: string;
  logoUrl?: string;
  logoType?: 'default' | 'custom';
  updatedAt?: number;
}

export interface SystemSettings {
  bankVaultReserve: number;
  mortgageRateTin: number;
  mortgageRateTae: number;
  savingsApy: number;
  maintenanceMode: boolean;
  systemNotice: {
    active: boolean;
    type: 'info' | 'warning' | 'alert' | 'vip';
    title: string;
    message: string;
  };
  plans: Record<'Personal' | 'Business' | 'Black', PlanConfig>;
  branding?: CompanyBranding;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}
