import React, { useEffect, useState } from 'react';
import { X, Check, DollarSign, Calendar, Clock, CreditCard, Tag, Wallet } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS } from '../data/categories';
import { Account, AppSettings, Currency, PaymentMethod, Transaction, TransactionType } from '../types';
import { convertCurrency, getCurrentTimeString, getTodayDateString } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  initialTransaction?: Transaction | null;
  settings: AppSettings;
  presetAmount?: { amount: number; currency: Currency } | null;
  accounts?: Account[];
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  settings,
  presetAmount,
  accounts = [],
}: TransactionModalProps) {
  const t = TRANSLATIONS[settings.language];

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [categoryId, setCategoryId] = useState<string>('food');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('aba');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync state when opening modal
  useEffect(() => {
    if (isOpen) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmount(String(initialTransaction.amount));
        setCurrency(initialTransaction.currency);
        setCategoryId(initialTransaction.categoryId);
        setAccountId(initialTransaction.accountId || accounts[0]?.id || '');
        setDate(initialTransaction.date);
        setTime(initialTransaction.time || getCurrentTimeString());
        setPaymentMethod(initialTransaction.paymentMethod || 'aba');
        setNote(initialTransaction.note || '');
      } else {
        const defaultCurrency =
          settings.preferredCurrency === 'dual' ? 'USD' : settings.preferredCurrency;
        setType('expense');
        setCurrency(presetAmount ? presetAmount.currency : defaultCurrency);
        setAmount(presetAmount ? String(presetAmount.amount) : '');
        setCategoryId('food');
        setAccountId(settings.defaultAccountId || accounts[0]?.id || '');
        setDate(getTodayDateString());
        setTime(getCurrentTimeString());
        setPaymentMethod(settings.defaultPaymentMethod || 'aba');
        setNote('');
      }
      setError(null);
    }
  }, [isOpen, initialTransaction, presetAmount, settings.preferredCurrency, settings.defaultAccountId, settings.defaultPaymentMethod, accounts]);

  if (!isOpen) return null;

  // Filter categories by selected type
  const availableCategories = CATEGORIES.filter(
    (c) => c.type === type || c.type === 'both'
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const valid = CATEGORIES.filter((c) => c.type === newType || c.type === 'both');
    if (!valid.some((c) => c.id === categoryId)) {
      setCategoryId(valid[0]?.id || 'food');
    }
  };

  const handleAmountIncrement = (inc: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + inc));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(
        settings.language === 'kh'
          ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ'
          : 'Please enter a valid amount'
      );
      return;
    }

    const amountUSD =
      currency === 'USD'
        ? parsedAmount
        : convertCurrency(parsedAmount, 'KHR', 'USD', settings.exchangeRate);
    const amountKHR =
      currency === 'KHR'
        ? parsedAmount
        : convertCurrency(parsedAmount, 'USD', 'KHR', settings.exchangeRate);

    const transactionToSave: Transaction = {
      id: initialTransaction ? initialTransaction.id : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      amount: parsedAmount,
      currency,
      amountUSD,
      amountKHR,
      categoryId,
      accountId: accountId || undefined,
      date,
      time,
      paymentMethod,
      note: note.trim(),
      createdAt: initialTransaction ? initialTransaction.createdAt : Date.now(),
    };

    onSave(transactionToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {initialTransaction ? t.editTransaction : t.addTransaction}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          {/* 1. Transaction Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              - {t.expense}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              + {t.income}
            </button>
          </div>

          {/* 2. Amount & Currency Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.amount}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step={currency === 'USD' ? '0.01' : '100'}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="0.00"
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Currency Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    currency === 'USD'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('KHR')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    currency === 'KHR'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ៛ KHR
                </button>
              </div>
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currency === 'USD' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(1)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +$1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(5)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +$5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(10)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +$10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(50)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +$50
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(5000)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +5,000៛
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(10000)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +10,000៛
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(20000)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +20,000៛
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountIncrement(50000)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium tabular-nums"
                  >
                    +50,000៛
                  </button>
                </>
              )}
            </div>

            {error && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
          </div>

          {/* 3. Category Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t.category}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all text-xs font-medium ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="truncate">
                      {settings.language === 'kh' ? cat.nameKh : cat.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3b. Account / Wallet Selection */}
          {accounts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{settings.language === 'kh' ? 'គណនី / កាបូបលុយ' : 'Account / Wallet'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {settings.language === 'kh' ? 'កាត់ប្រាក់ពី' : 'Paid from'}
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {accounts.map((acc) => {
                  const isSelected = accountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setAccountId(acc.id);
                        // Auto-match payment method if matches name
                        const lower = acc.name.toLowerCase();
                        if (lower.includes('aba')) setPaymentMethod('aba');
                        else if (lower.includes('wing')) setPaymentMethod('wing');
                        else if (lower.includes('acleda')) setPaymentMethod('acleda');
                        else if (lower.includes('cash') || lower.includes('សាច់ប្រាក់')) setPaymentMethod('cash');
                      }}
                      className={`flex items-center gap-1.5 p-2 rounded-xl text-left border text-xs font-semibold transition-all truncate ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="truncate">{acc.name}</span>
                      <span className="text-[10px] text-slate-400 ml-auto font-normal">
                        ({acc.currency})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.paymentMethod}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-1.5 px-2 text-xs rounded-lg border text-center font-medium transition-colors truncate ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {settings.language === 'kh' ? pm.nameKh : pm.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.date}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.time}
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 6. Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.note}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl transition-colors font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
