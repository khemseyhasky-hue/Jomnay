import React, { useRef, useState } from 'react';
import {
  X,
  Check,
  Download,
  Upload,
  RefreshCw,
  Coins,
  DollarSign,
  Languages,
  Moon,
  Sun,
  ShieldAlert,
} from 'lucide-react';
import { AppSettings, Currency, Transaction } from '../types';
import { exportToCSV, exportToJSON, generateSampleTransactions } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  transactions: Transaction[];
  onImportTransactions: (imported: Transaction[]) => void;
  onResetData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  updateSettings,
  transactions,
  onImportTransactions,
  onResetData,
}: SettingsModalProps) {
  const t = TRANSLATIONS[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(settings.appName || 'LuyTracker');
  const [subtitle, setSubtitle] = useState(settings.appSubtitle || 'សៀវភៅចំណូលចំណាយប្រចាំថ្ងៃ');
  const [rate, setRate] = useState(String(settings.exchangeRate));
  const [budget, setBudget] = useState(String(settings.monthlyBudgetUSD));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseInt(rate, 10);
    const parsedBudget = parseFloat(budget);

    updateSettings({
      appName: name.trim() || 'LuyTracker',
      appSubtitle: subtitle.trim(),
      exchangeRate: parsedRate > 0 ? parsedRate : 4100,
      monthlyBudgetUSD: parsedBudget >= 0 ? parsedBudget : 350,
    });

    setSuccessMsg(settings.language === 'kh' ? 'បានរក្សាទុកការកំណត់!' : 'Settings saved!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          onImportTransactions(parsed);
          setSuccessMsg(
            settings.language === 'kh'
              ? `បានបញ្ចូល ${parsed.length} ប្រតិបត្តិការ!`
              : `Imported ${parsed.length} transactions!`
          );
          setTimeout(() => setSuccessMsg(null), 2500);
        }
      } catch (err) {
        alert(
          settings.language === 'kh'
            ? 'ឯកសារ JSON មិនត្រឹមត្រូវទេ'
            : 'Invalid JSON file format'
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.settings.title}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSettings} className="p-5 overflow-y-auto space-y-4">
          {/* App Name & Subtitle */}
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {settings.language === 'kh' ? 'ឈ្មោះកម្មវិធី (App Name)' : 'App Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. LuyTracker, កាបូបលុយខ្ញុំ..."
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {settings.language === 'kh' ? 'ចំណងជើងរង (Subtitle)' : 'Subtitle'}
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. សៀវភៅចំណូលចំណាយប្រចាំថ្ងៃ..."
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 1. Preferred Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.settings.currency}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'USD', label: '$ USD' },
                { id: 'KHR', label: '៛ KHR' },
                { id: 'dual', label: '$ & ៛ (Dual)' },
              ].map((curr) => (
                <button
                  key={curr.id}
                  type="button"
                  onClick={() =>
                    updateSettings({ preferredCurrency: curr.id as Currency | 'dual' })
                  }
                  className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    settings.preferredCurrency === curr.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {curr.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Exchange Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.settings.exchangeRate}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">1 USD =</span>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 font-medium">KHR (៛)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {settings.language === 'kh'
                ? 'អត្រាស្តង់ដារបច្ចុប្បន្ននៅកម្ពុជាគឺប្រហែល 4,100 ៛ ក្នុង ១ ដុល្លារ'
                : 'Standard Cambodian market rate is approx 4,100 KHR per 1 USD'}
            </p>
          </div>

          {/* 3. Monthly Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.settings.budgetLimit}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">
                $
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {settings.language === 'kh'
                ? `ស្មើនឹងប្រហែល ${(
                    parseFloat(budget || '0') * (parseInt(rate, 10) || 4100)
                  ).toLocaleString()} ៛`
                : `Equivalent to approx ${(
                    parseFloat(budget || '0') * (parseInt(rate, 10) || 4100)
                  ).toLocaleString()} KHR`}
            </p>
          </div>

          {/* 4. Language & Theme Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.language}
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => updateSettings({ language: 'kh' })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    settings.language === 'kh'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ខ្មែរ (Khmer)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ language: 'en' })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    settings.language === 'en'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.theme}
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ theme: 'light' });
                    document.documentElement.classList.remove('dark');
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    settings.theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ theme: 'dark' });
                    document.documentElement.classList.add('dark');
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    settings.theme === 'dark'
                      ? 'bg-slate-900 text-slate-100 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Data Management (Export / Import / Reset) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t.settings.dataManagement}
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportToCSV(transactions, settings.language)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.settings.exportCSV}</span>
              </button>

              <button
                type="button"
                onClick={() => exportToJSON(transactions)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.settings.exportJSON}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.settings.importJSON}</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm(t.settings.resetConfirm)) {
                    onResetData();
                    setSuccessMsg(t.settings.sampleLoaded);
                    setTimeout(() => setSuccessMsg(null), 2500);
                  }
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.settings.resetData}</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Bottom Actions */}
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
