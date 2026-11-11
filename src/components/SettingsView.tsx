import React, { useRef, useState } from 'react';
import {
  Coins,
  DollarSign,
  Languages,
  Moon,
  Sun,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Plus,
  Tag,
  CreditCard,
  Target,
  Sliders,
  AlertTriangle,
  FolderPlus,
  User,
  Wallet,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS } from '../data/categories';
import { AppSettings, Category, Currency, PaymentMethod, Transaction, UserProfile } from '../types';
import { convertCurrency, formatMoney } from '../utils/formatters';
import { exportToCSV, exportToJSON } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { CategoryIcon } from './CategoryIcon';

interface SettingsViewProps {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  transactions: Transaction[];
  onImportTransactions: (imported: Transaction[]) => void;
  onResetData: () => void;
  onClearAllTransactions: () => void;
}

type SettingsTab = 'currency' | 'budget' | 'categories' | 'appearance' | 'account' | 'data';

export function SettingsView({
  settings,
  updateSettings,
  transactions,
  onImportTransactions,
  onResetData,
  onClearAllTransactions,
}: SettingsViewProps) {
  const t = TRANSLATIONS[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated single-card view based on click option - NO scrolling needed!
  const [activeTab, setActiveTab] = useState<SettingsTab>('currency');

  // Form states
  const [exchangeRate, setExchangeRate] = useState(String(settings.exchangeRate));
  const [budgetUSD, setBudgetUSD] = useState(String(settings.monthlyBudgetUSD));
  const [alertThreshold, setAlertThreshold] = useState(String(settings.budgetAlertThreshold || 80));
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Custom category form state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatNameKh, setNewCatNameKh] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Confirmation modals
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const notifySaved = (msg?: string) => {
    setSavedNotice(msg || t.settings.savedSuccess);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleRatePreset = (preset: number) => {
    setExchangeRate(String(preset));
    updateSettings({ exchangeRate: preset });
    notifySaved();
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameKh.trim()) return;

    const newCat: Category = {
      id: `custom_${Date.now()}`,
      nameKh: newCatNameKh.trim(),
      nameEn: newCatNameEn.trim() || newCatNameKh.trim(),
      icon: newCatIcon,
      color: newCatColor,
      type: newCatType,
    };

    const currentCustom = settings.customCategories || [];
    updateSettings({
      customCategories: [...currentCustom, newCat],
    });

    setNewCatNameKh('');
    setNewCatNameEn('');
    setShowAddCategory(false);
    notifySaved(settings.language === 'kh' ? 'បានបន្ថែមប្រភេទថ្មី!' : 'Custom category added!');
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
          notifySaved(
            settings.language === 'kh'
              ? `បានបញ្ចូលឡើងវិញ ${parsed.length} ប្រតិបត្តិការ!`
              : `Imported ${parsed.length} transactions!`
          );
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

  // Account profile state
  const [profileName, setProfileName] = useState(settings.userProfile?.name || 'Seyha Khem');
  const [profileEmail, setProfileEmail] = useState(settings.userProfile?.email || 'khemseyhasky@gmail.com');
  const [isPinActive, setIsPinActive] = useState(settings.userProfile?.isPinEnabled || false);
  const [pinCode, setPinCode] = useState(settings.userProfile?.pinCode || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userProfile: {
        name: profileName.trim(),
        email: profileEmail.trim(),
        avatar: '👤',
        isPinEnabled: isPinActive,
        pinCode: isPinActive ? pinCode.slice(0, 4) : '',
      },
    });
    notifySaved(settings.language === 'kh' ? 'បានរក្សាទុកព័ត៌មានគណនី!' : 'Account profile saved!');
  };

  const currentRateNum = parseInt(exchangeRate, 10) || 4100;
  const currentBudgetNum = parseFloat(budgetUSD) || 350;
  const allCategories = [...CATEGORIES, ...(settings.customCategories || [])];

  const settingTabs: Array<{ id: SettingsTab; labelKh: string; labelEn: string; icon: any }> = [
    { id: 'currency', labelKh: 'រូបិយប័ណ្ណ', labelEn: 'Currency', icon: Coins },
    { id: 'budget', labelKh: 'ថវិកា', labelEn: 'Budget', icon: Target },
    { id: 'categories', labelKh: 'ប្រភេទ', labelEn: 'Categories', icon: Tag },
    { id: 'appearance', labelKh: 'រចនាប័ទ្ម', labelEn: 'Theme', icon: Languages },
    { id: 'account', labelKh: 'គណនី', labelEn: 'Account', icon: User },
    { id: 'data', labelKh: 'ទិន្នន័យ', labelEn: 'Backup', icon: Download },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. Header with Title & Notification */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 shadow-xs transition-colors flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t.settings.title}
          </h2>
        </div>

        {savedNotice && (
          <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* 2. CLICK-BASED 6-OPTION GRID (No Scrolling, direct click buttons) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        {settingTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[11px] sm:text-xs truncate font-medium">
                {settings.language === 'kh' ? tab.labelKh : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. SINGLE FOCUSED SETTING CARD (Fits comfortably on screen with ZERO scrolling) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        {/* TAB 1: CURRENCY & EXCHANGE RATE */}
        {activeTab === 'currency' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {settings.language === 'kh' ? 'រូបិយប័ណ្ណ & អត្រាប្តូរប្រាក់' : 'Currency & Exchange Rate'}
              </h3>
            </div>

            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.currency}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'USD', label: '$ USD' },
                  { id: 'KHR', label: '៛ KHR' },
                  { id: 'dual', label: '$ & ៛ (Dual)' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      updateSettings({ preferredCurrency: c.id as Currency | 'dual' });
                      notifySaved();
                    }}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      settings.preferredCurrency === c.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {t.settings.currencyDesc}
              </p>
            </div>

            {/* Exchange Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.exchangeRate}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">1 USD =</span>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  onBlur={() => {
                    const r = parseInt(exchangeRate, 10);
                    if (r > 0) {
                      updateSettings({ exchangeRate: r });
                      notifySaved();
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">KHR (៛)</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-[11px] text-slate-400 mr-1">
                  {settings.language === 'kh' ? 'អត្រារហ័ស:' : 'Presets:'}
                </span>
                {[4050, 4100, 4120, 4150].map((ratePreset) => (
                  <button
                    key={ratePreset}
                    type="button"
                    onClick={() => handleRatePreset(ratePreset)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border tabular-nums transition-colors cursor-pointer ${
                      currentRateNum === ratePreset
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {ratePreset.toLocaleString()}៛
                  </button>
                ))}
              </div>

              {/* Sample conversion preview */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-400 tabular-nums flex items-center justify-between">
                <span>$10 = {(10 * currentRateNum).toLocaleString()} ៛</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span>20,000 ៛ = ${(20000 / currentRateNum).toFixed(2)}</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span>$100 = {(100 * currentRateNum).toLocaleString()} ៛</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUDGET & TARGET ALERTS */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {settings.language === 'kh' ? 'ថវិកាប្រចាំខែ & ការជូនដំណឹង' : 'Budget & Target Alerts'}
              </h3>
            </div>

            {/* Monthly Budget */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.budgetLimit}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={budgetUSD}
                  onChange={(e) => setBudgetUSD(e.target.value)}
                  onBlur={() => {
                    const b = parseFloat(budgetUSD);
                    if (b >= 0) {
                      updateSettings({ monthlyBudgetUSD: b });
                      notifySaved();
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                ≈ {(currentBudgetNum * currentRateNum).toLocaleString()} ៛
              </div>
            </div>

            {/* Alert Threshold Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>{t.settings.budgetAlertThreshold}</span>
                <span className="tabular-nums font-bold text-amber-600 dark:text-amber-400">
                  {alertThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={alertThreshold}
                onChange={(e) => {
                  setAlertThreshold(e.target.value);
                  updateSettings({ budgetAlertThreshold: parseInt(e.target.value, 10) });
                  notifySaved();
                }}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {t.settings.budgetAlertThresholdDesc}
              </p>
            </div>

            {/* Default Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.defaultPayment}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      updateSettings({ defaultPaymentMethod: pm.id });
                      notifySaved();
                    }}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-colors truncate cursor-pointer ${
                      settings.defaultPaymentMethod === pm.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {settings.language === 'kh' ? pm.nameKh : pm.nameEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.settings.categoriesManagement}
                </h3>
                <span className="text-xs text-slate-400 tabular-nums">
                  ({allCategories.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.settings.addCustomCategory}</span>
              </button>
            </div>

            {/* Inline Add Category Form */}
            {showAddCategory && (
              <form
                onSubmit={handleAddCustomCategory}
                className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-3 animate-in fade-in"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.settings.categoryNameKh}
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatNameKh}
                      onChange={(e) => setNewCatNameKh(e.target.value)}
                      placeholder="ឧ. បង់ធានារ៉ាប់រង..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.settings.categoryNameEn}
                    </label>
                    <input
                      type="text"
                      value={newCatNameEn}
                      onChange={(e) => setNewCatNameEn(e.target.value)}
                      placeholder="e.g. Insurance..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.settings.categoryType}
                    </label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="expense">{t.expense}</option>
                      <option value="income">{t.income}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.settings.categoryColor}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCatColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                            newCatColor === c ? 'scale-115 ring-2 ring-offset-1 ring-slate-400' : 'opacity-80'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer"
                    >
                      {t.save}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Category Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-xs"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                    {settings.language === 'kh' ? cat.nameKh : cat.nameEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: THEME & LANGUAGE */}
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {settings.language === 'kh' ? 'ភាសា & រចនាប័ទ្ម' : 'Language & Appearance'}
              </h3>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.language}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ language: 'kh' });
                    notifySaved('បានប្តូរភាសាជាភាសាខ្មែរ');
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    settings.language === 'kh'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  🇰🇭 ភាសាខ្មែរ (Khmer)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ language: 'en' });
                    notifySaved('Language set to English');
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    settings.language === 'en'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.settings.theme}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ theme: 'light' });
                    document.documentElement.classList.remove('dark');
                    notifySaved();
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settings.theme === 'light'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ theme: 'dark' });
                    document.documentElement.classList.add('dark');
                    notifySaved();
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settings.theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold shadow-2xs'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: USER ACCOUNT & SECURITY PIN */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {settings.language === 'kh' ? 'ព័ត៌មានគណនី & សុវត្ថិភាព' : 'Account Profile & Security'}
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {settings.language === 'kh' ? 'ឈ្មោះម្ចាស់គណនី' : 'Account User Name'}
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
                    {settings.language === 'kh' ? 'អ៊ីមែល' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Default Payment Method Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {settings.language === 'kh' ? 'វិធីទូទាត់លំនាំដើម' : 'Default Payment Method'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ defaultPaymentMethod: pm.id });
                        notifySaved();
                      }}
                      className={`py-1.5 px-2 text-xs rounded-lg border text-center font-semibold transition-colors truncate cursor-pointer ${
                        settings.defaultPaymentMethod === pm.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {settings.language === 'kh' ? pm.nameKh : pm.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-Digit Security PIN Option */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {settings.language === 'kh' ? 'សោរសុវត្ថិភាព PIN' : 'App Security Lock (PIN)'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {settings.language === 'kh' ? 'ការពារទិន្នន័យដោយលេខកូដសម្ងាត់ ៤ ខ្ទង់' : 'Protect your transactions with a 4-digit code'}
                      </div>
                    </div>
                  </div>

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

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: DATA MANAGEMENT & BACKUPS */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.settings.dataManagement}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* CSV Export */}
                <button
                  type="button"
                  onClick={() => exportToCSV(transactions, settings.language)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.settings.exportCSV}</span>
                </button>

                {/* JSON Backup Export */}
                <button
                  type="button"
                  onClick={() => exportToJSON(transactions)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.settings.exportJSON}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* JSON Import / Restore */}
                <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
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

                {/* Reset to Sample Data */}
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.settings.resetData}</span>
                </button>
              </div>

              {/* Clear All Transactions */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.settings.clearAllData}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-lg">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t.settings.resetData}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {t.settings.resetConfirm}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                  notifySaved(t.settings.sampleLoaded);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                {t.settings.resetData}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-lg">
            <div className="flex items-center gap-2 text-rose-600 mb-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{t.settings.clearAllData}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {t.settings.clearConfirm}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllTransactions();
                  setShowClearConfirm(false);
                  notifySaved(t.settings.clearedSuccess);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
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
