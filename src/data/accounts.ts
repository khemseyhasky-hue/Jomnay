import { Account, AccountType, UserProfile } from '../types';

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_aba',
    name: 'ABA Bank (KHQR)',
    type: 'bank',
    currency: 'USD',
    initialBalance: 650.0,
    color: '#0F4C81',
    icon: 'Building2',
    accountNumber: '001 234 567',
    isDefault: true,
  },
  {
    id: 'acc_cash',
    name: 'កាបូបសាច់ប្រាក់ (Cash)',
    type: 'cash',
    currency: 'KHR',
    initialBalance: 240000,
    color: '#10B981',
    icon: 'Banknote',
  },
  {
    id: 'acc_acleda',
    name: 'ACLEDA Mobile',
    type: 'bank',
    currency: 'KHR',
    initialBalance: 500000,
    color: '#3B82F6',
    icon: 'QrCode',
    accountNumber: '12-345678-9',
  },
  {
    id: 'acc_wing',
    name: 'Wing Bank',
    type: 'ewallet',
    currency: 'USD',
    initialBalance: 85.0,
    color: '#84CC16',
    icon: 'Smartphone',
  },
  {
    id: 'acc_savings',
    name: 'គណនីសន្សំ (Savings)',
    type: 'savings',
    currency: 'USD',
    initialBalance: 1200.0,
    color: '#8B5CF6',
    icon: 'PiggyBank',
  },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Seyha Khem',
  email: 'khemseyhasky@gmail.com',
  avatar: '👤',
  isPinEnabled: false,
  pinCode: '',
};

export const ACCOUNT_TYPES: { id: AccountType; nameKh: string; nameEn: string; icon: string }[] = [
  { id: 'bank', nameKh: 'គណនីធនាគារ', nameEn: 'Bank Account', icon: 'Building2' },
  { id: 'cash', nameKh: 'កាបូបសាច់ប្រាក់', nameEn: 'Cash Wallet', icon: 'Banknote' },
  { id: 'ewallet', nameKh: 'កាបូបអេឡិចត្រូនិក', nameEn: 'E-Wallet', icon: 'Smartphone' },
  { id: 'savings', nameKh: 'គណនីសន្សំប្រាក់', nameEn: 'Savings Account', icon: 'PiggyBank' },
  { id: 'card', nameKh: 'កាតឥណទាន/ឥណពន្ធ', nameEn: 'Card', icon: 'CreditCard' },
  { id: 'other', nameKh: 'ផ្សេងៗ', nameEn: 'Other', icon: 'Wallet' },
];
