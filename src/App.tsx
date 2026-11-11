import React, { useEffect, useState } from 'react';
import { Plus, ListOrdered, BarChart3, Calendar, Settings as SettingsIcon, Wallet } from 'lucide-react';
import { AccountsView } from './components/AccountsView';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetSection } from './components/BudgetSection';
import { CalendarView } from './components/CalendarView';
import { Header } from './components/Header';
import { QuickAddBar } from './components/QuickAddBar';
import { SettingsModal } from './components/SettingsModal';
import { SettingsView } from './components/SettingsView';
import { StatCards } from './components/StatCards';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { Account, ActiveTab, AppSettings, Currency, PeriodFilter, Transaction } from './types';
import { convertCurrency, getTodayDateString } from './utils/formatters';
import {
  DEFAULT_SETTINGS,
  generateSampleTransactions,
  loadAccounts,
  loadSettings,
  loadTransactions,
  saveAccounts,
  saveSettings,
  saveTransactions,
} from './utils/storage';
import { TRANSLATIONS } from './utils/translations';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions(settings.exchangeRate)
  );
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());

  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [presetModalAmount, setPresetModalAmount] = useState<{
    amount: number;
    currency: Currency;
  } | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sync settings theme to document
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persist settings changes
  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);

      // If exchange rate changed, recalculate converted normalized amounts
      if (partial.exchangeRate && partial.exchangeRate !== prev.exchangeRate) {
        setTransactions((prevTxs) => {
          const updated = prevTxs.map((tx) => ({
            ...tx,
            amountUSD:
              tx.currency === 'USD'
                ? tx.amount
                : convertCurrency(tx.amount, 'KHR', 'USD', next.exchangeRate),
            amountKHR:
              tx.currency === 'KHR'
                ? tx.amount
                : convertCurrency(tx.amount, 'USD', 'KHR', next.exchangeRate),
          }));
          saveTransactions(updated);
          return updated;
        });
      }

      return next;
    });
  };

  // Add or update transaction
  const handleSaveTransaction = (tx: Transaction) => {
    setTransactions((prev) => {
      const existingIdx = prev.findIndex((t) => t.id === tx.id);
      let updated: Transaction[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = tx;
      } else {
        updated = [tx, ...prev];
      }
      saveTransactions(updated);
      return updated;
    });
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTransactions(updated);
      return updated;
    });
  };

  // Reset to initial sample data
  const handleResetData = () => {
    const samples = generateSampleTransactions(settings.exchangeRate);
    setTransactions(samples);
    saveTransactions(samples);
  };

  // Clear all transactions completely
  const handleClearAllTransactions = () => {
    setTransactions([]);
    saveTransactions([]);
  };

  // Import transactions from JSON
  const handleImportTransactions = (imported: Transaction[]) => {
    setTransactions(imported);
    saveTransactions(imported);
  };

  // Filtered transactions for the current period
  const filteredTransactions = transactions.filter((tx) => {
    if (periodFilter === 'all') return true;
    const now = new Date();
    const txDate = new Date(tx.date);

    if (periodFilter === 'today') {
      return tx.date === getTodayDateString();
    }
    if (periodFilter === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return txDate >= startOfWeek;
    }
    if (periodFilter === 'this_month') {
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return tx.date.startsWith(currentYearMonth);
    }
    if (periodFilter === 'last_month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      return tx.date.startsWith(lastYearMonth);
    }
    return true;
  });

  const t = TRANSLATIONS[settings.language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-24">
      {/* 1. Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        updateSettings={updateSettings}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setPresetModalAmount(null);
          setIsTransactionModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-6 flex-1">
        {/* KPI Summary Cards (Shown on main views) */}
        {activeTab !== 'settings' && (
          <StatCards
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            settings={settings}
          />
        )}

        {/* Tab 1: Transactions View */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Monthly Budget Tracker Bar */}
            <BudgetSection
              transactions={transactions}
              settings={settings}
              onOpenSettings={() => setActiveTab('settings')}
            />

            {/* Smart Quick Entry Bar */}
            <QuickAddBar
              settings={settings}
              onAddTransaction={handleSaveTransaction}
              onOpenModalWithPreset={(amt, curr) => {
                setEditingTransaction(null);
                setPresetModalAmount({ amount: amt, currency: curr });
                setIsTransactionModalOpen(true);
              }}
            />

            {/* Grouped Transaction List with Filters */}
            <TransactionList
              transactions={transactions}
              settings={settings}
              periodFilter={periodFilter}
              setPeriodFilter={setPeriodFilter}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setPresetModalAmount(null);
                setIsTransactionModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setPresetModalAmount(null);
                setIsTransactionModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Analytics & Reports View */}
        {activeTab === 'analytics' && (
          <AnalyticsView transactions={transactions} settings={settings} />
        )}

        {/* Tab 3: Accounts & Wallets View */}
        {activeTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            setAccounts={(updater) => {
              setAccounts((prev) => {
                const next = typeof updater === 'function' ? updater(prev) : updater;
                saveAccounts(next);
                return next;
              });
            }}
            transactions={transactions}
            settings={settings}
            updateSettings={updateSettings}
            onAddTransaction={handleSaveTransaction}
          />
        )}

        {/* Tab 4: Calendar View */}
        {activeTab === 'calendar' && (
          <CalendarView
            transactions={transactions}
            settings={settings}
            onSelectDateToLog={(dateStr) => {
              setEditingTransaction(null);
              setPresetModalAmount(null);
              setIsTransactionModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setPresetModalAmount(null);
              setIsTransactionModalOpen(true);
            }}
          />
        )}

        {/* Tab 5: Settings & Options View */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            updateSettings={updateSettings}
            transactions={transactions}
            onImportTransactions={handleImportTransactions}
            onResetData={handleResetData}
            onClearAllTransactions={handleClearAllTransactions}
          />
        )}
      </main>

      {/* 3. PINNED BOTTOM NAVIGATION BAR ("Under" - Direct click options, zero scrolling, 5 clean tabs) */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg py-2 px-2 transition-colors"
      >
        <div className="grid grid-cols-5 gap-1 w-full max-w-lg mx-auto">
          {/* Tab 1: Transactions */}
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                  : ''
              }`}
            >
              <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] truncate mt-0.5">
              {t.tabs.transactions}
            </span>
          </button>

          {/* Tab 2: Analytics */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                  : ''
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] truncate mt-0.5">
              {t.tabs.analytics}
            </span>
          </button>

          {/* Tab 3: Accounts (NEW) */}
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'accounts'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'accounts'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                  : ''
              }`}
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] truncate mt-0.5">
              {t.tabs.accounts}
            </span>
          </button>

          {/* Tab 4: Calendar */}
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                  : ''
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] truncate mt-0.5">
              {t.tabs.calendar}
            </span>
          </button>

          {/* Tab 5: Settings */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                  : ''
              }`}
            >
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] truncate mt-0.5">
              {t.tabs.settings}
            </span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
          setPresetModalAmount(null);
        }}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
        settings={settings}
        presetAmount={presetModalAmount}
        accounts={accounts}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
        transactions={transactions}
        onImportTransactions={handleImportTransactions}
        onResetData={handleResetData}
      />
    </div>
  );
}
