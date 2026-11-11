import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Receipt } from 'lucide-react';
import { getCategoryById } from '../data/categories';
import { AppSettings, Transaction } from '../types';
import { formatMoney } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';
import { CategoryIcon } from './CategoryIcon';

interface CalendarViewProps {
  transactions: Transaction[];
  settings: AppSettings;
  onSelectDateToLog: (dateStr: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const KHMER_WEEKDAYS = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];
const ENGLISH_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarView({
  transactions,
  settings,
  onSelectDateToLog,
  onEditTransaction,
}: CalendarViewProps) {
  const t = TRANSLATIONS[settings.language];
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar cells calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(
      d
    ).padStart(2, '0')}`;
    cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Next month leading days to complete full grid (multiple of 7)
  const remainingCells = 42 - cells.length;
  for (let d = 1; d <= remainingCells && cells.length < 35; d++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(
      d
    ).padStart(2, '0')}`;
    cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Transactions on selected date
  const selectedDateTxs = transactions.filter((tx) => tx.date === selectedDate);
  const currency = settings.preferredCurrency === 'KHR' ? 'KHR' : 'USD';

  const monthLabel =
    settings.language === 'kh'
      ? `${KHMER_MONTHS[month]} ${year}`
      : `${ENGLISH_MONTHS[month]} ${year}`;

  const weekdays = settings.language === 'kh' ? KHMER_WEEKDAYS : ENGLISH_WEEKDAYS;

  return (
    <div className="space-y-4">
      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {monthLabel}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {t.today}
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
          {weekdays.map((wd, idx) => (
            <div key={idx} className="py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar days cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((cell) => {
            const dayTxs = transactions.filter((t) => t.date === cell.dateStr);
            const totalExpUSD = dayTxs
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amountUSD, 0);
            const totalExpKHR = dayTxs
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amountKHR, 0);

            const totalIncUSD = dayTxs
              .filter((t) => t.type === 'income')
              .reduce((s, t) => s + t.amountUSD, 0);

            const isSelected = selectedDate === cell.dateStr;

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[64px] sm:min-h-[76px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                    : cell.isCurrentMonth
                    ? 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : 'border-transparent opacity-30 hover:opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      isSelected
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {dayTxs.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>

                {/* Day totals */}
                <div className="text-[10px] space-y-0.5 mt-1 overflow-hidden">
                  {totalIncUSD > 0 && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums truncate">
                      +{formatMoney(currency === 'KHR' ? totalExpKHR : totalIncUSD, currency)}
                    </div>
                  )}
                  {totalExpUSD > 0 && (
                    <div className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums truncate">
                      -{formatMoney(currency === 'KHR' ? totalExpKHR : totalExpUSD, currency)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {settings.language === 'kh' ? 'ប្រតិបត្តិការថ្ងៃ' : 'Transactions for'} {selectedDate}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              ({selectedDateTxs.length})
            </span>
          </div>

          <button
            onClick={() => onSelectDateToLog(selectedDate)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{settings.language === 'kh' ? 'កត់ត្រាក្នុងថ្ងៃនេះ' : 'Log on this day'}</span>
          </button>
        </div>

        {selectedDateTxs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            {settings.language === 'kh'
              ? 'គ្មានប្រតិបត្តិការកត់ត្រាក្នុងថ្ងៃនេះទេ'
              : 'No transactions recorded on this day'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {selectedDateTxs.map((tx) => {
              const cat = getCategoryById(tx.categoryId);
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {tx.note || (settings.language === 'kh' ? cat.nameKh : cat.nameEn)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {settings.language === 'kh' ? cat.nameKh : cat.nameEn}
                        {tx.time ? ` · ${tx.time}` : ''}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold tabular-nums ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatMoney(tx.amount, tx.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
