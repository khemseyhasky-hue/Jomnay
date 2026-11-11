import React from 'react';
import { ArrowDownRight, ArrowUpRight, Wallet, Clock, CalendarDays } from 'lucide-react';
import { AppSettings, Transaction } from '../types';
import { formatDualMoney, formatMoney, getTodayDateString } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';

interface StatCardsProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  settings: AppSettings;
}

export function StatCards({ transactions, filteredTransactions, settings }: StatCardsProps) {
  const t = TRANSLATIONS[settings.language];
  const todayStr = getTodayDateString();

  // Filtered period calculations
  const totalIncomeUSD = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amountUSD, 0);

  const totalIncomeKHR = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amountKHR, 0);

  const totalExpenseUSD = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amountUSD, 0);

  const totalExpenseKHR = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amountKHR, 0);

  const netBalanceUSD = totalIncomeUSD - totalExpenseUSD;
  const netBalanceKHR = totalIncomeKHR - totalExpenseKHR;

  // Today's spending
  const todayExpenseUSD = transactions
    .filter((tx) => tx.type === 'expense' && tx.date === todayStr)
    .reduce((sum, tx) => sum + tx.amountUSD, 0);
  const todayExpenseKHR = transactions
    .filter((tx) => tx.type === 'expense' && tx.date === todayStr)
    .reduce((sum, tx) => sum + tx.amountKHR, 0);

  // Distinct days with expenses for daily average
  const expenseDays = new Set(
    filteredTransactions.filter((tx) => tx.type === 'expense').map((tx) => tx.date)
  );
  const distinctDaysCount = Math.max(1, expenseDays.size);
  const dailyAverageUSD = totalExpenseUSD / distinctDaysCount;
  const dailyAverageKHR = totalExpenseKHR / distinctDaysCount;

  const balanceDisplay = formatDualMoney(
    netBalanceUSD,
    netBalanceKHR,
    settings.preferredCurrency
  );
  const incomeDisplay = formatDualMoney(
    totalIncomeUSD,
    totalIncomeKHR,
    settings.preferredCurrency
  );
  const expenseDisplay = formatDualMoney(
    totalExpenseUSD,
    totalExpenseKHR,
    settings.preferredCurrency
  );
  const todayDisplay = formatDualMoney(
    todayExpenseUSD,
    todayExpenseKHR,
    settings.preferredCurrency
  );
  const dailyAvgDisplay = formatDualMoney(
    dailyAverageUSD,
    dailyAverageKHR,
    settings.preferredCurrency
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Balance Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
          <span>{t.totalBalance}</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
          {balanceDisplay.primary}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums flex items-center gap-1.5">
          <span>≈ {balanceDisplay.secondary}</span>
          <span aria-hidden="true">·</span>
          <span className={netBalanceUSD >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {netBalanceUSD >= 0 ? '+ សុទ្ធ' : '- ឱនភាព'}
          </span>
        </div>
      </div>

      {/* 2. Total Income Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
          <span>{t.totalIncome}</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
          +{incomeDisplay.primary}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
          ≈ +{incomeDisplay.secondary}
        </div>
      </div>

      {/* 3. Total Expense Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
          <span>{t.totalExpense}</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
          -{expenseDisplay.primary}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
          ≈ -{expenseDisplay.secondary}
        </div>
      </div>

      {/* 4. Today's Spend & Daily Avg */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
          <span>{t.todaySpending}</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
          {todayDisplay.primary}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums flex items-center gap-1.5">
          <span>{t.dailyAverage}: {dailyAvgDisplay.primary}</span>
        </div>
      </div>
    </div>
  );
}
