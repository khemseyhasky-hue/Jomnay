export type TransactionType = 'expense' | 'income' | 'transfer';

export type Currency = 'USD' | 'KHR';

export type PaymentMethod = 'cash' | 'aba' | 'wing' | 'acleda' | 'card' | 'other';

export type AccountType = 'bank' | 'cash' | 'ewallet' | 'savings' | 'card' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: number;
  color: string;
  icon: string;
  accountNumber?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  isPinEnabled: boolean;
  pinCode?: string;
}

export interface Category {
  id: string;
  nameKh: string;
  nameEn: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // In the original currency
  currency: Currency;
  amountUSD: number; // Normalized USD
  amountKHR: number; // Normalized KHR
  categoryId: string;
  accountId?: string; // Connected wallet/account
  toAccountId?: string; // If transfer
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  paymentMethod: PaymentMethod;
  note: string;
  createdAt: number;
}

export interface AppSettings {
  appName?: string;
  appSubtitle?: string;
  preferredCurrency: Currency | 'dual';
  exchangeRate: number; // e.g. 4100 KHR per 1 USD
  monthlyBudgetUSD: number;
  budgetAlertThreshold: number; // e.g. 80 (%)
  defaultPaymentMethod: PaymentMethod;
  defaultAccountId?: string;
  userProfile?: UserProfile;
  language: 'kh' | 'en';
  theme: 'light' | 'dark';
  customCategories?: Category[];
}

export type ActiveTab = 'transactions' | 'analytics' | 'accounts' | 'calendar' | 'settings';

export type PeriodFilter = 'today' | 'this_week' | 'this_month' | 'last_month' | 'all';
