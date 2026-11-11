import React from 'react';
import { Target, AlertTriangle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { AppSettings, Transaction } from '../types';
import { convertCurrency, formatMoney } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';

interface BudgetSectionProps {
  transactions: Transaction[];
  settings: AppSettings;
  onOpenSettings: () => void;
}

export function BudgetSection({ transactions, settings, onOpenSettings }: BudgetSectionProps) {
  const t = TRANSLATIONS[settings.language];

  // Calculate expenses for current month
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthExpensesUSD = transactions
    .filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentYearMonth))
    .reduce((sum, tx) => sum + tx.amountUSD, 0);

  const budgetUSD = settings.monthlyBudgetUSD;
  const budgetKHR = convertCurrency(budgetUSD, 'USD', 'KHR', settings.exchangeRate);
  const thisMonthExpensesKHR = convertCurrency(thisMonthExpensesUSD, 'USD', 'KHR', settings.exchangeRate);

  const percentUsed = budgetUSD > 0 ? Math.min(100, Math.round((thisMonthExpensesUSD / budgetUSD) * 100)) : 0;
  const isOverBudget = thisMonthExpensesUSD > budgetUSD && budgetUSD > 0;
  const remainingUSD = Math.max(0, budgetUSD - thisMonthExpensesUSD);
  const remainingKHR = Math.max(0, budgetKHR - thisMonthExpensesKHR);

  // Days left in current month
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - currentDay + 1);
  const dailyAllowanceUSD = remainingUSD / daysRemaining;

  const isWarning = percentUsed >= 80 && !isOverBudget;

  const currency = settings.preferredCurrency === 'KHR' ? 'KHR' : 'USD';
  const spentFormatted = formatMoney(
    currency === 'KHR' ? thisMonthExpensesKHR : thisMonthExpensesUSD,
    currency
  );
  const budgetFormatted = formatMoney(
    currency === 'KHR' ? budgetKHR : budgetUSD,
    currency
  );
  const remainingFormatted = formatMoney(
    currency === 'KHR' ? remainingKHR : remainingUSD,
    currency
  );
  const dailyAllowanceFormatted = formatMoney(
    currency === 'KHR' ? convertCurrency(dailyAllowanceUSD, 'USD', 'KHR', settings.exchangeRate) : dailyAllowanceUSD,
    currency
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.monthlyBudget}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 tabular-nums">
              {spentFormatted} / {budgetFormatted} ({percentUsed}%)
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium flex items-center gap-1 self-start sm:self-center"
        >
          <span>{settings.language === 'kh' ? 'កែប្រែថវិកា' : 'Adjust Budget'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOverBudget
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(100, (thisMonthExpensesUSD / Math.max(1, budgetUSD)) * 100)}%` }}
        />
      </div>

      {/* Sub-metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {isOverBudget ? (
            <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.overBudget}
            </span>
          ) : (
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.budgetRemaining}: <strong className="text-slate-900 dark:text-slate-100 tabular-nums">{remainingFormatted}</strong></span>
            </span>
          )}
        </div>

        <div className="tabular-nums">
          <span>{settings.language === 'kh' ? 'អាចចំណាយជាមធ្យម' : 'Safe spend'}: </span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{dailyAllowanceFormatted}</strong>
          <span> / {settings.language === 'kh' ? 'ថ្ងៃ' : 'day'} ({daysRemaining} {settings.language === 'kh' ? 'ថ្ងៃទៀត' : 'days left'})</span>
        </div>
      </div>
    </div>
  );
}
