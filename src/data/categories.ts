import { Category, PaymentMethod } from '../types';

export const CATEGORIES: Category[] = [
  // Expenses
  {
    id: 'food',
    nameKh: 'ម្ហូបអាហារ & ភេសជ្ជៈ',
    nameEn: 'Food & Dining',
    icon: 'Utensils',
    color: '#F97316', // Orange
    type: 'expense',
  },
  {
    id: 'coffee',
    nameKh: 'កាហ្វេ & តែ',
    nameEn: 'Coffee & Drinks',
    icon: 'Coffee',
    color: '#8B5CF6', // Violet
    type: 'expense',
  },
  {
    id: 'groceries',
    nameKh: 'ផ្សារ & ទំនិញប្រើប្រាស់',
    nameEn: 'Groceries & Market',
    icon: 'ShoppingBag',
    color: '#06B6D4', // Cyan
    type: 'expense',
  },
  {
    id: 'transport',
    nameKh: 'ធ្វើដំណើរ & សាំង',
    nameEn: 'Transport & Fuel',
    icon: 'Fuel',
    color: '#3B82F6', // Blue
    type: 'expense',
  },
  {
    id: 'utilities',
    nameKh: 'វិក្កយបត្រ ទឹក ភ្លើង Wi-Fi',
    nameEn: 'Bills & Utilities',
    icon: 'Zap',
    color: '#EAB308', // Amber
    type: 'expense',
  },
  {
    id: 'housing',
    nameKh: 'ថ្លៃជួល & ផ្ទះសម្បែង',
    nameEn: 'Housing & Rent',
    icon: 'Home',
    color: '#64748B', // Slate
    type: 'expense',
  },
  {
    id: 'health',
    nameKh: 'សុខភាព & ថ្នាំសង្កូវ',
    nameEn: 'Health & Medical',
    icon: 'HeartPulse',
    color: '#EF4444', // Red
    type: 'expense',
  },
  {
    id: 'education',
    nameKh: 'ការអប់រំ & សៀវភៅ',
    nameEn: 'Education & Study',
    icon: 'GraduationCap',
    color: '#10B981', // Emerald
    type: 'expense',
  },
  {
    id: 'entertainment',
    nameKh: 'កម្សាន្ត & ដើរលេង',
    nameEn: 'Entertainment & Fun',
    icon: 'Film',
    color: '#EC4899', // Pink
    type: 'expense',
  },
  {
    id: 'personal',
    nameKh: 'ថែទាំខ្លួន & សម្លៀកបំពាក់',
    nameEn: 'Personal & Clothing',
    icon: 'Sparkles',
    color: '#A855F7', // Purple
    type: 'expense',
  },
  {
    id: 'family',
    nameKh: 'គ្រួសារ & បុណ្យទាន',
    nameEn: 'Family & Donations',
    icon: 'Users',
    color: '#14B8A6', // Teal
    type: 'expense',
  },
  {
    id: 'other_expense',
    nameKh: 'ចំណាយផ្សេងៗ',
    nameEn: 'Other Expense',
    icon: 'MoreHorizontal',
    color: '#94A3B8', // Neutral Slate
    type: 'expense',
  },

  // Income
  {
    id: 'salary',
    nameKh: 'ប្រាក់ខែ',
    nameEn: 'Salary & Wage',
    icon: 'Briefcase',
    color: '#10B981', // Emerald
    type: 'income',
  },
  {
    id: 'business',
    nameKh: 'អាជីវកម្ម & លក់ដូរ',
    nameEn: 'Business & Sales',
    icon: 'Store',
    color: '#059669', // Dark Emerald
    type: 'income',
  },
  {
    id: 'freelance',
    nameKh: 'ការងារក្រៅម៉ោង / គម្រោង',
    nameEn: 'Freelance & Side-gig',
    icon: 'Laptop',
    color: '#0D9488', // Teal
    type: 'income',
  },
  {
    id: 'bonus',
    nameKh: 'ប្រាក់រង្វាន់ & ឧបត្ថម្ភ',
    nameEn: 'Bonus & Gifts',
    icon: 'Gift',
    color: '#F59E0B', // Amber
    type: 'income',
  },
  {
    id: 'investment',
    nameKh: 'ការវិនិយោគ & ការប្រាក់',
    nameEn: 'Investments & Returns',
    icon: 'TrendingUp',
    color: '#3B82F6', // Blue
    type: 'income',
  },
  {
    id: 'other_income',
    nameKh: 'ចំណូលផ្សេងៗ',
    nameEn: 'Other Income',
    icon: 'PlusCircle',
    color: '#6B7280', // Gray
    type: 'income',
  },
];

export const PAYMENT_METHODS: { id: PaymentMethod; nameKh: string; nameEn: string; icon: string }[] = [
  { id: 'aba', nameKh: 'ABA / KHQR', nameEn: 'ABA / KHQR', icon: 'QrCode' },
  { id: 'cash', nameKh: 'សាច់ប្រាក់', nameEn: 'Cash', icon: 'Banknote' },
  { id: 'acleda', nameKh: 'អេស៊ីលីដា (ACLEDA)', nameEn: 'ACLEDA Mobile', icon: 'Building2' },
  { id: 'wing', nameKh: 'វីង (Wing)', nameEn: 'Wing Bank', icon: 'Smartphone' },
  { id: 'card', nameKh: 'កាតធនាគារ (Visa/Master)', nameEn: 'Card', icon: 'CreditCard' },
  { id: 'other', nameKh: 'ផ្សេងៗ', nameEn: 'Other', icon: 'CircleDot' },
];

export function getCategoryById(id: string): Category {
  return (
    CATEGORIES.find((c) => c.id === id) || {
      id: 'other',
      nameKh: 'ផ្សេងៗ',
      nameEn: 'Other',
      icon: 'MoreHorizontal',
      color: '#94A3B8',
      type: 'expense',
    }
  );
}
