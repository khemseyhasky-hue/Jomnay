import React, { useState } from 'react';
import { Send, Sparkles, Check, CornerDownLeft } from 'lucide-react';
import { getCategoryById } from '../data/categories';
import { AppSettings, Transaction } from '../types';
import { formatMoney } from '../utils/formatters';
import { buildTransactionFromParsed, parseQuickEntry } from '../utils/nlpParser';
import { TRANSLATIONS } from '../utils/translations';
import { CategoryIcon } from './CategoryIcon';

interface QuickAddBarProps {
  settings: AppSettings;
  onAddTransaction: (tx: Transaction) => void;
  onOpenModalWithPreset?: (amount: number, currency: 'USD' | 'KHR') => void;
}

export function QuickAddBar({
  settings,
  onAddTransaction,
  onOpenModalWithPreset,
}: QuickAddBarProps) {
  const [inputVal, setInputVal] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const t = TRANSLATIONS[settings.language];

  const parsed = parseQuickEntry(inputVal, settings.exchangeRate);
  const matchedCategory = parsed ? getCategoryById(parsed.categoryId) : null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsed) return;

    const newTx = buildTransactionFromParsed(parsed, settings.exchangeRate);
    onAddTransaction(newTx);
    setInputVal('');

    const formattedAmount = formatMoney(newTx.amount, newTx.currency);
    const categoryName = settings.language === 'kh' ? matchedCategory?.nameKh : matchedCategory?.nameEn;
    setSuccessNotice(`✓ ${settings.language === 'kh' ? 'បានកត់ត្រា' : 'Recorded'}: ${formattedAmount} (${categoryName})`);

    setTimeout(() => {
      setSuccessNotice(null);
    }, 3500);
  };

  const handlePresetClick = (amount: number, currency: 'USD' | 'KHR') => {
    if (onOpenModalWithPreset) {
      onOpenModalWithPreset(amount, currency);
    } else {
      setInputVal(`${currency === 'USD' ? '$' + amount : amount + '៛'} `);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{settings.language === 'kh' ? 'កត់ត្រារហ័សឆ្លាតវៃ (Smart Quick Entry)' : 'Smart Quick Entry'}</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
          {settings.language === 'kh' ? 'វាយបញ្ចូល ហើយចុច Enter' : 'Type & press Enter'}
        </span>
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={t.quickAddPlaceholder}
          className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />

        <button
          type="submit"
          disabled={!parsed}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-semibold">{t.quickAddBtn}</span>
        </button>
      </form>

      {/* Live parsing detection preview */}
      {parsed && matchedCategory && (
        <div className="mt-2.5 px-3 py-2 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 rounded-lg text-xs flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
            <CategoryIcon name={matchedCategory.icon} className="w-3.5 h-3.5" />
            <span>{settings.language === 'kh' ? matchedCategory.nameKh : matchedCategory.nameEn}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {formatMoney(parsed.amount, parsed.currency)}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span
            className={`font-medium ${
              parsed.type === 'income' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {parsed.type === 'income' ? t.income : t.expense}
          </span>
          {parsed.note && (
            <>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                "{parsed.note}"
              </span>
            </>
          )}
        </div>
      )}

      {/* Success banner */}
      {successNotice && (
        <div className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
          <Check className="w-3.5 h-3.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Quick Amount presets */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 dark:text-slate-500 mr-1 text-[11px]">
          {settings.language === 'kh' ? 'ចំនួនប្រាក់រហ័ស:' : 'Quick Presets:'}
        </span>
        <button
          type="button"
          onClick={() => handlePresetClick(1, 'USD')}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md tabular-nums transition-colors font-medium"
        >
          +$1
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick(2, 'USD')}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md tabular-nums transition-colors font-medium"
        >
          +$2
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick(5, 'USD')}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md tabular-nums transition-colors font-medium"
        >
          +$5
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick(10, 'USD')}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md tabular-nums transition-colors font-medium"
        >
          +$10
        </button>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <button
          type="button"
          onClick={() => handlePresetClick(5000, 'KHR')}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md tabular-nums transition-colors font-medium"
        >
          +5,000៛
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick(10000, 'KHR')}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md tabular-nums transition-colors font-medium"
        >
          +10,000៛
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick(20000, 'KHR')}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md tabular-nums transition-colors font-medium"
        >
          +20,000៛
        </button>
      </div>
    </div>
  );
}
