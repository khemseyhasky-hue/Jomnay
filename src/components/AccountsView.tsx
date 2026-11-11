import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  Banknote,
  Smartphone,
  CreditCard,
  PiggyBank,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  Lock,
  User,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  CircleDot,
  Trash2,
  Edit2,
} from 'lucide-react';
import { ACCOUNT_TYPES } from '../data/accounts';
import { Account, AccountType, AppSettings, Currency, Transaction, UserProfile } from '../types';
import { convertCurrency, formatDualMoney, formatMoney, getCurrentTimeString, getTodayDateString } from '../utils/formatters';
import { calculateAccountBalance } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { CategoryIcon } from './CategoryIcon';

interface AccountsViewProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transactions: Transaction[];
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export function AccountsView({
  accounts,
  setAccounts,
  transactions,
  settings,
  updateSettings,
  onAddTransaction,
}: AccountsViewProps) {
  const t = TRANSLATIONS[settings.language];

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Account Form state
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('bank');
  const [newAccCurrency, setNewAccCurrency] = useState<Currency>('USD');
  const [newAccInitialBalance, setNewAccInitialBalance] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccColor, setNewAccColor] = useState('#0F4C81');
  const [newAccIcon, setNewAccIcon] = useState('Building2');

  // Transfer Form state
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // User profile state
  const [profileName, setProfileName] = useState(settings.userProfile?.name || 'Seyha Khem');
  const [profileEmail, setProfileEmail] = useState(settings.userProfile?.email || 'khemseyhasky@gmail.com');
  const [isPinActive, setIsPinActive] = useState(settings.userProfile?.isPinEnabled || false);
  const [pinCode, setPinCode] = useState(settings.userProfile?.pinCode || '');

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  // Calculate balances for each account and grand total Net Worth
  let totalNetWorthUSD = 0;
  let totalNetWorthKHR = 0;

  const accountsWithBalances = accounts.map((acc) => {
    const { balance, balanceUSD, balanceKHR } = calculateAccountBalance(
      acc,
      transactions,
      settings.exchangeRate
    );
    totalNetWorthUSD += balanceUSD;
    totalNetWorthKHR += balanceKHR;

    const txCount = transactions.filter(
      (tx) => tx.accountId === acc.id || tx.toAccountId === acc.id
    ).length;

    return {
      ...acc,
      currentBalance: balance,
      balanceUSD,
      balanceKHR,
      txCount,
    };
  });

  const netWorthDisplay = formatDualMoney(
    totalNetWorthUSD,
    totalNetWorthKHR,
    settings.preferredCurrency
  );

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const initial = parseFloat(newAccInitialBalance) || 0;
    const newAccount: Account = {
      id: `acc_${Date.now()}`,
      name: newAccName.trim(),
      type: newAccType,
      currency: newAccCurrency,
      initialBalance: initial,
      color: newAccColor,
      icon: newAccIcon,
      accountNumber: newAccNumber.trim() || undefined,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setIsAddAccountOpen(false);
    setNewAccName('');
    setNewAccInitialBalance('');
    setNewAccNumber('');
    notify(t.accounts.accountCreated);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (!amountNum || amountNum <= 0 || fromAccountId === toAccountId) return;

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    const amountUSD =
      fromAcc.currency === 'USD'
        ? amountNum
        : convertCurrency(amountNum, 'KHR', 'USD', settings.exchangeRate);
    const amountKHR =
      fromAcc.currency === 'KHR'
        ? amountNum
        : convertCurrency(amountNum, 'USD', 'KHR', settings.exchangeRate);

    const transferTx: Transaction = {
      id: `tx_transfer_${Date.now()}`,
      type: 'transfer',
      amount: amountNum,
      currency: fromAcc.currency,
      amountUSD,
      amountKHR,
      categoryId: 'other_expense',
      accountId: fromAccountId,
      toAccountId: toAccountId,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      paymentMethod: 'other',
      note: transferNote.trim() || `${settings.language === 'kh' ? 'ផ្ទេរពី' : 'Transfer from'} ${fromAcc.name} → ${toAcc.name}`,
      createdAt: Date.now(),
    };

    onAddTransaction(transferTx);
    setIsTransferOpen(false);
    setTransferAmount('');
    setTransferNote('');
    notify(t.accounts.transferSuccess);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: UserProfile = {
      name: profileName.trim(),
      email: profileEmail.trim(),
      avatar: '👤',
      isPinEnabled: isPinActive,
      pinCode: isPinActive ? pinCode.slice(0, 4) : '',
    };
    updateSettings({ userProfile: updatedProfile });
    notify(settings.language === 'kh' ? 'បានរក្សាទុកព័ត៌មានគណនី!' : 'Profile saved successfully!');
  };

  const handleDeleteAccount = (accId: string) => {
    if (confirm(settings.language === 'kh' ? 'តើអ្នកប្រាកដទេថាចង់លុបគណនីនេះ?' : 'Delete this account?')) {
      setAccounts((prev) => prev.filter((a) => a.id !== accId));
      notify(settings.language === 'kh' ? 'បានលុបគណនី' : 'Account deleted');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Banner & Net Worth Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.accounts.totalNetWorth}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
              {netWorthDisplay.primary}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              ≈ {netWorthDisplay.secondary} ({accounts.length} {settings.language === 'kh' ? 'គណនី' : 'accounts'})
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTransferOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t.accounts.transferBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddAccountOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.accounts.addAccount}</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="mt-3 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* 2. Accounts & Wallets Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>{t.accounts.title}</span>
          <span className="text-xs text-slate-400 font-normal tabular-nums">
            ({accounts.length})
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {accountsWithBalances.map((acc) => {
            const accTypeInfo = ACCOUNT_TYPES.find((at) => at.id === acc.type);
            const isNegative = acc.currentBalance < 0;

            return (
              <div
                key={acc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  {/* Account Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: acc.color }}
                      >
                        <CategoryIcon name={acc.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {acc.name}
                        </h4>
                        <div className="text-[11px] text-slate-400">
                          {settings.language === 'kh' ? accTypeInfo?.nameKh : accTypeInfo?.nameEn}
                          {acc.accountNumber ? ` · ${acc.accountNumber}` : ''}
                        </div>
                      </div>
                    </div>

                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Balance Display */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">
                      {settings.language === 'kh' ? 'សមតុល្យបច្ចុប្បន្ន' : 'Current Balance'}
                    </div>
                    <div
                      className={`text-lg sm:text-xl font-bold tabular-nums ${
                        isNegative
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-900 dark:text-slate-50'
                      }`}
                    >
                      {formatMoney(acc.currentBalance, acc.currency)}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      ≈ {formatMoney(acc.currency === 'USD' ? acc.balanceKHR : acc.balanceUSD, acc.currency === 'USD' ? 'KHR' : 'USD')}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{acc.txCount} {settings.language === 'kh' ? 'ប្រតិបត្តិការ' : 'transactions'}</span>
                  <span className="font-semibold text-slate-500 uppercase">{acc.currency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. User Profile & Security PIN Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t.accounts.userProfile}
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.accounts.userName}
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.accounts.userEmail}
              </label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Security PIN Option */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t.accounts.securityLock}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.accounts.pinDescription}
                  </div>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => setIsPinActive(!isPinActive)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isPinActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                    isPinActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isPinActive && (
              <div className="pt-2 flex items-center gap-2 animate-in fade-in">
                <span className="text-xs text-slate-500 font-medium">
                  {settings.language === 'kh' ? 'លេខសម្ងាត់ ៤ ខ្ទង់:' : '4-Digit PIN:'}
                </span>
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-center text-sm font-bold tracking-widest tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL 1: ADD ACCOUNT MODAL */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.accounts.addAccount}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.accounts.accountName}
                </label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="ឧ. ABA Bank, Wing, កាបូបលុយ..."
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.accounts.accountType}
                  </label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {ACCOUNT_TYPES.map((at) => (
                      <option key={at.id} value={at.id}>
                        {settings.language === 'kh' ? at.nameKh : at.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.accounts.currency}
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewAccCurrency('USD')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        newAccCurrency === 'USD'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      $ USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAccCurrency('KHR')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        newAccCurrency === 'KHR'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      ៛ KHR
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.accounts.initialBalance}
                </label>
                <input
                  type="number"
                  step="any"
                  value={newAccInitialBalance}
                  onChange={(e) => setNewAccInitialBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.accounts.accountNumber}
                </label>
                <input
                  type="text"
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  placeholder="ឧ. 001 234 567"
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {settings.language === 'kh' ? 'ពណ៌សម្គាល់' : 'Color Accent'}
                </label>
                <div className="flex items-center gap-2">
                  {['#0F4C81', '#10B981', '#3B82F6', '#84CC16', '#8B5CF6', '#F59E0B', '#EF4444'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewAccColor(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newAccColor === col ? 'scale-115 ring-2 ring-offset-1 ring-slate-400' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFER BETWEEN ACCOUNTS MODAL */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t.accounts.transferMoney}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3.5 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.accounts.fromAccount}
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.accounts.toAccount}
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.accounts.transferAmount}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-base font-bold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.note}
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="ឧ. ដកលុយដាក់កាបូប, ផ្ញើទៅគណនីសន្សំ..."
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {t.accounts.transferBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
