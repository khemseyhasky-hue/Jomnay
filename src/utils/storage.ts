import { DEFAULT_ACCOUNTS, DEFAULT_USER_PROFILE } from '../data/accounts';
import { Account, AppSettings, Transaction } from '../types';
import { convertCurrency, getTodayDateString } from './formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'jomnay_transactions_v1',
  SETTINGS: 'jomnay_settings_v1',
  ACCOUNTS: 'jomnay_accounts_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  preferredCurrency: 'USD',
  exchangeRate: 4100,
  monthlyBudgetUSD: 350,
  budgetAlertThreshold: 80,
  defaultPaymentMethod: 'aba',
  defaultAccountId: 'acc_aba',
  userProfile: DEFAULT_USER_PROFILE,
  language: 'kh',
  theme: 'light',
  customCategories: [],
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading accounts from localStorage', e);
  }
  saveAccounts(DEFAULT_ACCOUNTS);
  return DEFAULT_ACCOUNTS;
}

export function saveAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving accounts to localStorage', e);
  }
}

export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[],
  exchangeRate: number
): { balance: number; balanceUSD: number; balanceKHR: number } {
  let balance = account.initialBalance;

  transactions.forEach((tx) => {
    // Normal transactions matching this account
    if (tx.accountId === account.id || (!tx.accountId && (
      (account.type === 'bank' && tx.paymentMethod === 'aba') ||
      (account.type === 'cash' && tx.paymentMethod === 'cash')
    ))) {
      // Inflow or outflow
      const txAmount = tx.currency === account.currency
        ? tx.amount
        : convertCurrency(tx.amount, tx.currency, account.currency, exchangeRate);

      if (tx.type === 'income') {
        balance += txAmount;
      } else if (tx.type === 'expense') {
        balance -= txAmount;
      } else if (tx.type === 'transfer') {
        balance -= txAmount;
      }
    }

    // Incoming transfer to this account
    if (tx.type === 'transfer' && tx.toAccountId === account.id) {
      const txAmount = tx.currency === account.currency
        ? tx.amount
        : convertCurrency(tx.amount, tx.currency, account.currency, exchangeRate);
      balance += txAmount;
    }
  });

  const balanceUSD = account.currency === 'USD'
    ? balance
    : convertCurrency(balance, 'KHR', 'USD', exchangeRate);
  const balanceKHR = account.currency === 'KHR'
    ? balance
    : convertCurrency(balance, 'USD', 'KHR', exchangeRate);

  return { balance, balanceUSD, balanceKHR };
}

export function generateSampleTransactions(rate: number = 4100): Transaction[] {
  const today = new Date();

  const getDateOffset = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const samples: Array<Omit<Transaction, 'id' | 'createdAt' | 'amountUSD' | 'amountKHR'>> = [
    // Today
    {
      type: 'expense',
      amount: 3.5,
      currency: 'USD',
      categoryId: 'food',
      date: getDateOffset(0),
      time: '12:15',
      paymentMethod: 'aba',
      note: 'អាហារថ្ងៃត្រង់បាយឆា និងទឹកផ្លែឈើ',
    },
    {
      type: 'expense',
      amount: 7000,
      currency: 'KHR',
      categoryId: 'coffee',
      date: getDateOffset(0),
      time: '08:45',
      paymentMethod: 'cash',
      note: 'កាហ្វេទឹកដោះគោទឹកកក Brown',
    },
    {
      type: 'expense',
      amount: 15000,
      currency: 'KHR',
      categoryId: 'transport',
      date: getDateOffset(0),
      time: '14:20',
      paymentMethod: 'aba',
      note: 'ចាក់សាំងម៉ូតូពេញធុង (Caltex)',
    },

    // Yesterday
    {
      type: 'expense',
      amount: 16.5,
      currency: 'USD',
      categoryId: 'groceries',
      date: getDateOffset(1),
      time: '17:30',
      paymentMethod: 'aba',
      note: 'ទិញបន្លែ សាច់ ផ្លែឈើ នៅផ្សារទំនើប',
    },
    {
      type: 'expense',
      amount: 2.5,
      currency: 'USD',
      categoryId: 'utilities',
      date: getDateOffset(1),
      time: '10:00',
      paymentMethod: 'aba',
      note: 'បញ្ចូលកាតទូរស័ព្ទ Smart',
    },
    {
      type: 'income',
      amount: 45,
      currency: 'USD',
      categoryId: 'business',
      date: getDateOffset(1),
      time: '19:10',
      paymentMethod: 'aba',
      note: 'ប្រាក់ចំណេញលក់ទំនិញអនឡាញ',
    },

    // 2 days ago
    {
      type: 'expense',
      amount: 55000,
      currency: 'KHR',
      categoryId: 'food',
      date: getDateOffset(2),
      time: '18:40',
      paymentMethod: 'cash',
      note: 'បាយល្ងាចស៊ុបជាមួយមិត្តភក្តិ',
    },
    {
      type: 'expense',
      amount: 8000,
      currency: 'KHR',
      categoryId: 'transport',
      date: getDateOffset(2),
      time: '09:15',
      paymentMethod: 'aba',
      note: 'ជិះ PassApp ទៅធ្វើការ',
    },

    // 4 days ago
    {
      type: 'expense',
      amount: 25,
      currency: 'USD',
      categoryId: 'utilities',
      date: getDateOffset(4),
      time: '11:00',
      paymentMethod: 'aba',
      note: 'បង់ថ្លៃអ៊ីនធឺណិត Wi-Fi ប្រចាំខែ',
    },
    {
      type: 'expense',
      amount: 12000,
      currency: 'KHR',
      categoryId: 'personal',
      date: getDateOffset(4),
      time: '16:00',
      paymentMethod: 'cash',
      note: 'កាត់សក់',
    },

    // 7 days ago
    {
      type: 'income',
      amount: 850,
      currency: 'USD',
      categoryId: 'salary',
      date: getDateOffset(7),
      time: '09:00',
      paymentMethod: 'aba',
      note: 'ប្រាក់ខែប្រចាំខែពេញសិទ្ធិ',
    },
    {
      type: 'expense',
      amount: 150,
      currency: 'USD',
      categoryId: 'housing',
      date: getDateOffset(7),
      time: '15:30',
      paymentMethod: 'aba',
      note: 'បង់ថ្លៃបន្ទប់ស្នាក់នៅប្រចាំខែ',
    },
  ];

  return samples.map((s, index) => {
    const amountUSD =
      s.currency === 'USD' ? s.amount : convertCurrency(s.amount, 'KHR', 'USD', rate);
    const amountKHR =
      s.currency === 'KHR' ? s.amount : convertCurrency(s.amount, 'USD', 'KHR', rate);

    return {
      ...s,
      id: `sample_${Date.now()}_${index}`,
      amountUSD,
      amountKHR,
      createdAt: Date.now() - (7 - index) * 86400000,
    };
  });
}

export function loadTransactions(rate: number = 4100): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed: Transaction[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading transactions from localStorage', e);
  }

  // Pre-seed sample transactions so first run is immediately interactive
  const initial = generateSampleTransactions(rate);
  saveTransactions(initial);
  return initial;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions to localStorage', e);
  }
}

export function exportToCSV(transactions: Transaction[], lang: 'kh' | 'en'): void {
  const headers =
    lang === 'kh'
      ? ['កាលបរិច្ឆេទ', 'ម៉ោង', 'ប្រភេទ', 'ចំនួនទឹកប្រាក់', 'រូបិយប័ណ្ណ', 'ប្រាក់ដុល្លារ ($)', 'ប្រាក់រៀល (៛)', 'ចំណាត់ថ្នាក់', 'វិធីទូទាត់', 'កំណត់សម្គាល់']
      : ['Date', 'Time', 'Type', 'Original Amount', 'Currency', 'Amount (USD)', 'Amount (KHR)', 'Category', 'Payment Method', 'Note'];

  const rows = transactions.map((t) => [
    t.date,
    t.time || '',
    t.type,
    t.amount,
    t.currency,
    t.amountUSD.toFixed(2),
    t.amountKHR,
    t.categoryId,
    t.paymentMethod,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `JOMNAY_Export_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(transactions: Transaction[]): void {
  const data = JSON.stringify(transactions, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `JOMNAY_Backup_${getTodayDateString()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
