import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Receipt,
} from 'lucide-react';
import { CATEGORIES, getCategoryById, PAYMENT_METHODS } from '../data/categories';
import { AppSettings, PeriodFilter, Transaction, TransactionType } from '../types';
import {
  formatDateRelative,
  formatDualMoney,
  formatMoney,
  getTodayDateString,
} from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  settings: AppSettings;
  periodFilter: PeriodFilter;
  setPeriodFilter: (p: PeriodFilter) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenNewTransaction: () => void;
}

export function TransactionList({
  transactions,
  settings,
  periodFilter,
  setPeriodFilter,
  onEditTransaction,
  onDeleteTransaction,
  onOpenNewTransaction,
}: TransactionListProps) {
  const t = TRANSLATIONS[settings.language];

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    // 1. Period filter
    if (periodFilter !== 'all') {
      const txDate = new Date(tx.date);
      const now = new Date();

      if (periodFilter === 'today') {
        if (tx.date !== getTodayDateString()) return false;
      } else if (periodFilter === 'this_week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        if (txDate < startOfWeek) return false;
      } else if (periodFilter === 'this_month') {
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!tx.date.startsWith(currentYearMonth)) return false;
      } else if (periodFilter === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        if (!tx.date.startsWith(lastYearMonth)) return false;
      }
    }

    // 2. Type filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) {
      return false;
    }

    // 3. Category filter
    if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
      return false;
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cat = getCategoryById(tx.categoryId);
      const matchNote = tx.note && tx.note.toLowerCase().includes(q);
      const matchCatKh = cat.nameKh.toLowerCase().includes(q);
      const matchCatEn = cat.nameEn.toLowerCase().includes(q);
      const matchAmount = String(tx.amount).includes(q);
      if (!matchNote && !matchCatKh && !matchCatEn && !matchAmount) {
        return false;
      }
    }

    return true;
  });

  // Group by date in descending order
  const groupedByDate: Record<string, Transaction[]> = {};
  filtered.forEach((tx) => {
    if (!groupedByDate[tx.date]) {
      groupedByDate[tx.date] = [];
    }
    groupedByDate[tx.date].push(tx);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors space-y-4">
      {/* 1. Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Period segmented control (Click options without scrolling) */}
        <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(['today', 'this_week', 'this_month', 'all'] as PeriodFilter[]).map((p) => {
            const labels: Record<PeriodFilter, string> = {
              today: t.today,
              this_week: t.thisWeek,
              this_month: t.thisMonth,
              last_month: t.lastMonth,
              all: t.allTime,
            };
            const isActive = periodFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Right side filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">{t.filterAll}</option>
            <option value="expense">{t.expense}</option>
            <option value="income">{t.income}</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none max-w-[140px] truncate"
          >
            <option value="all">{t.filterCategory} ({t.filterAll})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {settings.language === 'kh' ? cat.nameKh : cat.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Grouped Transactions List */}
      {sortedDates.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {searchQuery ? t.emptyState.noSearchResults : t.emptyState.noTransactions}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery ? '' : t.emptyState.noTransactionsDesc}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenNewTransaction}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addTransaction}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((dateStr) => {
            const dayTxs = groupedByDate[dateStr];

            // Daily totals
            const dayExpenseUSD = dayTxs
              .filter((x) => x.type === 'expense')
              .reduce((s, x) => s + x.amountUSD, 0);
            const dayIncomeUSD = dayTxs
              .filter((x) => x.type === 'income')
              .reduce((s, x) => s + x.amountUSD, 0);
            const dayExpenseKHR = dayTxs
              .filter((x) => x.type === 'expense')
              .reduce((s, x) => s + x.amountKHR, 0);
            const dayIncomeKHR = dayTxs
              .filter((x) => x.type === 'income')
              .reduce((s, x) => s + x.amountKHR, 0);

            const isKHR = settings.preferredCurrency === 'KHR';
            const dayNetDisplay = isKHR
              ? `${dayIncomeKHR - dayExpenseKHR >= 0 ? '+' : ''}${Math.round(
                  dayIncomeKHR - dayExpenseKHR
                ).toLocaleString()} ៛`
              : `${dayIncomeUSD - dayExpenseUSD >= 0 ? '+' : ''}$${(
                  dayIncomeUSD - dayExpenseUSD
                ).toFixed(2)}`;

            return (
              <div key={dateStr} className="space-y-2">
                {/* Daily Header */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatDateRelative(dateStr, settings.language)}
                  </div>
                  <div className="tabular-nums text-[11px]">
                    <span className="text-slate-400 mr-1.5">
                      {settings.language === 'kh' ? 'សរុបថ្ងៃនេះ:' : 'Net:'}
                    </span>
                    <span
                      className={
                        dayIncomeUSD >= dayExpenseUSD
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-300 font-semibold'
                      }
                    >
                      {dayNetDisplay}
                    </span>
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {dayTxs.map((tx) => {
                    const cat = getCategoryById(tx.categoryId);
                    const pm = PAYMENT_METHODS.find((p) => p.id === tx.paymentMethod);
                    const isIncome = tx.type === 'income';

                    const primaryFormatted = formatMoney(tx.amount, tx.currency);
                    const secondaryCurrency = tx.currency === 'USD' ? 'KHR' : 'USD';
                    const secondaryAmount =
                      tx.currency === 'USD' ? tx.amountKHR : tx.amountUSD;
                    const secondaryFormatted = formatMoney(secondaryAmount, secondaryCurrency);

                    return (
                      <div
                        key={tx.id}
                        className="py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg flex items-center justify-between gap-3 transition-colors group"
                      >
                        {/* Left: Icon & Title */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {tx.note || (settings.language === 'kh' ? cat.nameKh : cat.nameEn)}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>
                                {settings.language === 'kh' ? cat.nameKh : cat.nameEn}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{pm ? (settings.language === 'kh' ? pm.nameKh : pm.nameEn) : tx.paymentMethod}</span>
                              {tx.time && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="tabular-nums">{tx.time}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div
                              className={`text-xs sm:text-sm font-bold tabular-nums ${
                                isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {isIncome ? `+${primaryFormatted}` : `-${primaryFormatted}`}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                              ≈ {secondaryFormatted}
                            </div>
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              title={t.editTransaction}
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(tx.id)}
                              title={t.delete}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-lg">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t.delete}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {t.confirmDelete}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
