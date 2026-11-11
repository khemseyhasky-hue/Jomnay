import React from 'react';
import {
  Plus,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Languages,
  Calendar,
  BarChart3,
  ListOrdered,
} from 'lucide-react';
import { ActiveTab, AppSettings, Currency } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  onOpenNewTransaction: () => void;
  onOpenSettingsModal?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  settings,
  updateSettings,
  onOpenNewTransaction,
}: HeaderProps) {
  const t = TRANSLATIONS[settings.language];

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'kh' ? 'en' : 'kh' });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const cycleCurrency = () => {
    const order: Array<Currency | 'dual'> = ['USD', 'KHR', 'dual'];
    const nextIndex = (order.indexOf(settings.preferredCurrency) + 1) % order.length;
    updateSettings({ preferredCurrency: order[nextIndex] });
  };

  const currencyLabel =
    settings.preferredCurrency === 'USD'
      ? '$ USD'
      : settings.preferredCurrency === 'KHR'
      ? '៛ KHR'
      : '$ & ៛';

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand title */}
        <div
          onClick={() => setActiveTab('transactions')}
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-2xs">
            ៛
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-50 leading-tight whitespace-nowrap">
              {settings.appName || t.appName}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-none hidden sm:inline">
              {settings.appSubtitle || t.appSubtitle}
            </span>
          </div>
        </div>



        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Currency Toggle */}
          <button
            onClick={cycleCurrency}
            title={t.settings.currency}
            className="px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors tabular-nums whitespace-nowrap"
          >
            {currencyLabel}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title={t.settings.language}
            className="p-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
          >
            <Languages className="w-4 h-4" />
            <span className="hidden lg:inline">{settings.language === 'kh' ? 'ខ្មែរ' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={t.settings.theme}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* User / Account Quick Button */}
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            title={settings.userProfile?.name || t.tabs.accounts}
            className={`flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {settings.userProfile?.name ? settings.userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden lg:inline text-xs font-semibold truncate max-w-[80px]">
              {settings.userProfile?.name ? settings.userProfile.name.split(' ')[0] : (settings.language === 'kh' ? 'គណនី' : 'Account')}
            </span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.addTransaction}</span>
            <span className="sm:hidden">{settings.language === 'kh' ? 'កត់ត្រា' : 'Add'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
