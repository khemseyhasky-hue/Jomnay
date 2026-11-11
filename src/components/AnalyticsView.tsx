import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  TrendingUp,
  BarChart2,
  Table as TableIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { CATEGORIES, getCategoryById } from '../data/categories';
import { AppSettings, PeriodFilter, Transaction } from '../types';
import { formatDualMoney, formatMoney, getTodayDateString } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsViewProps {
  transactions: Transaction[];
  settings: AppSettings;
}

export function AnalyticsView({ transactions, settings }: AnalyticsViewProps) {
  const t = TRANSLATIONS[settings.language];
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [chartMode, setChartMode] = useState<'donut' | 'line' | 'bar'>('donut');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    usd: number;
    khr: number;
    x: number;
    y: number;
  } | null>(null);

  // Filter transactions based on period
  const filtered = transactions.filter((tx) => {
    if (period === 'all') return true;
    const now = new Date();
    const txDate = new Date(tx.date);

    if (period === 'today') {
      return tx.date === getTodayDateString();
    }
    if (period === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return txDate >= startOfWeek;
    }
    if (period === 'this_month') {
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return tx.date.startsWith(currentYearMonth);
    }
    if (period === 'last_month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      return tx.date.startsWith(lastYearMonth);
    }
    return true;
  });

  const totalIncomeUSD = filtered
    .filter((tx) => tx.type === 'income')
    .reduce((s, tx) => s + tx.amountUSD, 0);
  const totalIncomeKHR = filtered
    .filter((tx) => tx.type === 'income')
    .reduce((s, tx) => s + tx.amountKHR, 0);

  const totalExpenseUSD = filtered
    .filter((tx) => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amountUSD, 0);
  const totalExpenseKHR = filtered
    .filter((tx) => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amountKHR, 0);

  const netSavingsUSD = totalIncomeUSD - totalExpenseUSD;
  const netSavingsKHR = totalIncomeKHR - totalExpenseKHR;
  const savingsRate =
    totalIncomeUSD > 0 ? Math.round((netSavingsUSD / totalIncomeUSD) * 100) : 0;

  // Category breakdown for expenses
  const categoryTotals: Record<string, { usd: number; khr: number; count: number }> = {};
  filtered
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      if (!categoryTotals[tx.categoryId]) {
        categoryTotals[tx.categoryId] = { usd: 0, khr: 0, count: 0 };
      }
      categoryTotals[tx.categoryId].usd += tx.amountUSD;
      categoryTotals[tx.categoryId].khr += tx.amountKHR;
      categoryTotals[tx.categoryId].count += 1;
    });

  const categoryRanking = Object.entries(categoryTotals)
    .map(([catId, data]) => ({
      category: getCategoryById(catId),
      usd: data.usd,
      khr: data.khr,
      count: data.count,
      percent: totalExpenseUSD > 0 ? (data.usd / totalExpenseUSD) * 100 : 0,
      avgUSD: data.count > 0 ? data.usd / data.count : 0,
      avgKHR: data.count > 0 ? data.khr / data.count : 0,
    }))
    .sort((a, b) => b.usd - a.usd);

  // Daily Trend calculation (Last 14 days or chosen window)
  const daysCount = period === 'today' ? 1 : period === 'this_week' ? 7 : 14;
  const trendPoints: { date: string; label: string; usd: number; khr: number }[] = [];
  const today = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const dayExpenseUSD = filtered
      .filter((tx) => tx.type === 'expense' && tx.date === dateStr)
      .reduce((s, tx) => s + tx.amountUSD, 0);
    const dayExpenseKHR = filtered
      .filter((tx) => tx.type === 'expense' && tx.date === dateStr)
      .reduce((s, tx) => s + tx.amountKHR, 0);

    trendPoints.push({
      date: dateStr,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      usd: dayExpenseUSD,
      khr: dayExpenseKHR,
    });
  }

  const maxTrendUSD = Math.max(10, ...trendPoints.map((p) => p.usd));

  const currency = settings.preferredCurrency === 'KHR' ? 'KHR' : 'USD';

  // SVG Donut Chart Geometry Calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const donutSlices = categoryRanking.map((item) => {
    const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += item.percent;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // SVG Line Chart Coordinate Calculations
  const svgWidth = 560;
  const svgHeight = 200;
  const paddingX = 30;
  const paddingY = 25;

  const lineCoords = trendPoints.map((pt, idx) => {
    const x =
      trendPoints.length === 1
        ? svgWidth / 2
        : paddingX + (idx / (trendPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y =
      svgHeight - paddingY - (pt.usd / maxTrendUSD) * (svgHeight - paddingY * 2);
    return { ...pt, x, y };
  });

  const linePathD =
    lineCoords.length > 0
      ? `M ${lineCoords[0].x} ${lineCoords[0].y} ` +
        lineCoords.slice(1).map((c) => `L ${c.x} ${c.y}`).join(' ')
      : '';

  const areaPathD =
    lineCoords.length > 0
      ? `${linePathD} L ${lineCoords[lineCoords.length - 1].x} ${svgHeight - paddingY} L ${
          lineCoords[0].x
        } ${svgHeight - paddingY} Z`
      : '';

  const activeCategoryDetail = categoryRanking.find(
    (c) => c.category.id === hoveredCategory
  );

  return (
    <div className="space-y-6">
      {/* 1. Period Selector & Chart Mode Switcher Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {t.analytics.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period filter buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['today', 'this_week', 'this_month', 'all'] as PeriodFilter[]).map((p) => {
              const labels: Record<PeriodFilter, string> = {
                today: t.today,
                this_week: t.thisWeek,
                this_month: t.thisMonth,
                last_month: t.lastMonth,
                all: t.allTime,
              };
              const isActive = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setChartMode('donut')}
              title={t.analytics.donutChart}
              className={`p-1.5 rounded-md transition-colors ${
                chartMode === 'donut'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartMode('line')}
              title={t.analytics.lineChart}
              className={`p-1.5 rounded-md transition-colors ${
                chartMode === 'line'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartMode('bar')}
              title={t.analytics.barChart}
              className={`p-1.5 rounded-md transition-colors ${
                chartMode === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            {t.analytics.incomeVsExpense}
          </div>
          <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">
              +{formatMoney(currency === 'KHR' ? totalIncomeKHR : totalIncomeUSD, currency)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              -{formatMoney(currency === 'KHR' ? totalExpenseKHR : totalExpenseUSD, currency)}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${
                  totalIncomeUSD + totalExpenseUSD > 0
                    ? (totalIncomeUSD / (totalIncomeUSD + totalExpenseUSD)) * 100
                    : 50
                }%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{
                width: `${
                  totalIncomeUSD + totalExpenseUSD > 0
                    ? (totalExpenseUSD / (totalIncomeUSD + totalExpenseUSD)) * 100
                    : 50
                }%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            {t.analytics.netSavings}
          </div>
          <div
            className={`text-2xl font-bold tabular-nums ${
              netSavingsUSD >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatMoney(currency === 'KHR' ? netSavingsKHR : netSavingsUSD, currency, {
              showSign: true,
              isPositive: netSavingsUSD >= 0,
            })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {netSavingsUSD >= 0
              ? settings.language === 'kh'
                ? 'ចំណូលសល់លើសចំណាយ'
                : 'Net positive surplus'
              : settings.language === 'kh'
              ? 'ចំណាយលើសចំណូល'
              : 'Deficit spending'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            {t.analytics.savingsRate}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {savingsRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {settings.language === 'kh'
              ? 'អត្រាសន្សំធៀបនឹងចំណូលសរុប'
              : 'Of total revenue saved'}
          </div>
        </div>
      </div>

      {/* 3. Interactive Charts Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        {categoryRanking.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {t.analytics.noData}
          </div>
        ) : (
          <div>
            {/* Chart 1: Donut Chart View */}
            {chartMode === 'donut' && (
              <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                {/* SVG Donut */}
                <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="24"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    {donutSlices.map((slice) => {
                      const isHovered = hoveredCategory === slice.category.id;
                      return (
                        <circle
                          key={slice.category.id}
                          cx="100"
                          cy="100"
                          r={radius}
                          fill="transparent"
                          stroke={slice.category.color}
                          strokeWidth={isHovered ? 28 : 24}
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredCategory(slice.category.id)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
                    {activeCategoryDetail ? (
                      <>
                        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[110px]">
                          {settings.language === 'kh'
                            ? activeCategoryDetail.category.nameKh
                            : activeCategoryDetail.category.nameEn}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatMoney(
                            currency === 'KHR'
                              ? activeCategoryDetail.khr
                              : activeCategoryDetail.usd,
                            currency
                          )}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {activeCategoryDetail.percent.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-400">
                          {settings.language === 'kh' ? 'ចំណាយសរុប' : 'Total Expense'}
                        </span>
                        <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatMoney(
                            currency === 'KHR' ? totalExpenseKHR : totalExpenseUSD,
                            currency
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Legends Grid */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {categoryRanking.map((item) => {
                    const isHovered = hoveredCategory === item.category.id;
                    return (
                      <div
                        key={item.category.id}
                        onMouseEnter={() => setHoveredCategory(item.category.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer text-xs ${
                          isHovered
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                            : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.category.color }}
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {settings.language === 'kh'
                              ? item.category.nameKh
                              : item.category.nameEn}
                          </span>
                        </div>
                        <div className="text-right tabular-nums shrink-0 ml-2">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatMoney(currency === 'KHR' ? item.khr : item.usd, currency)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.percent.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chart 2: Smooth Line & Area Chart View */}
            {chartMode === 'line' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>{t.analytics.dailySpendingTrend}</span>
                  <span className="tabular-nums">
                    {settings.language === 'kh' ? 'អតិបរមា' : 'Peak'}:{' '}
                    {formatMoney(
                      currency === 'KHR'
                        ? maxTrendUSD * settings.exchangeRate
                        : maxTrendUSD,
                      currency
                    )}
                  </span>
                </div>

                <div className="relative w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-48 sm:h-56 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                      const y = paddingY + pct * (svgHeight - paddingY * 2);
                      return (
                        <line
                          key={pct}
                          x1={paddingX}
                          y1={y}
                          x2={svgWidth - paddingX}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray="3 3"
                          className="text-slate-100 dark:text-slate-800"
                        />
                      );
                    })}

                    {/* Area fill */}
                    {areaPathD && (
                      <path d={areaPathD} fill="url(#areaGradient)" />
                    )}

                    {/* Line stroke */}
                    {linePathD && (
                      <path
                        d={linePathD}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Points */}
                    {lineCoords.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint?.date === pt.date ? 6 : 4}
                          fill="#10B981"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              date: pt.date,
                              usd: pt.usd,
                              khr: pt.khr,
                              x: pt.x,
                              y: pt.y,
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <text
                          x={pt.x}
                          y={svgHeight - 6}
                          textAnchor="middle"
                          className="text-[9px] fill-slate-400 font-sans tabular-nums"
                        >
                          {pt.label}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Tooltip on line hover */}
                  {hoveredPoint && (
                    <div
                      className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-md tabular-nums whitespace-nowrap"
                      style={{
                        left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                        top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                      }}
                    >
                      <div className="font-semibold text-emerald-300">
                        {formatMoney(
                          currency === 'KHR' ? hoveredPoint.khr : hoveredPoint.usd,
                          currency
                        )}
                      </div>
                      <div className="text-[9px] text-slate-300">{hoveredPoint.date}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chart 3: Vertical Bar Chart View */}
            {chartMode === 'bar' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t.analytics.dailySpendingTrend}
                </div>
                <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-4 px-1 border-b border-slate-100 dark:border-slate-800">
                  {trendPoints.map((d) => {
                    const heightPct = Math.max(6, (d.usd / maxTrendUSD) * 100);
                    const displayVal = formatMoney(
                      currency === 'KHR' ? d.khr : d.usd,
                      currency
                    );
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded tabular-nums whitespace-nowrap pointer-events-none z-10">
                          {displayVal}
                        </div>
                        <div
                          className="w-full max-w-[20px] bg-emerald-500/80 group-hover:bg-emerald-600 rounded-t-sm transition-all"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] text-slate-400 tabular-nums">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Detailed Category Breakdown Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.analytics.dataTable}
            </h4>
          </div>
          <span className="text-xs text-slate-400 tabular-nums">
            {categoryRanking.length} {settings.language === 'kh' ? 'ប្រភេទ' : 'categories'}
          </span>
        </div>

        {categoryRanking.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">{t.analytics.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="pb-2.5 pl-2">{t.analytics.categoryCol}</th>
                  <th className="pb-2.5 text-right tabular-nums">{t.analytics.amountUSDCol}</th>
                  <th className="pb-2.5 text-right tabular-nums">{t.analytics.amountKHRCol}</th>
                  <th className="pb-2.5 text-right tabular-nums">{t.analytics.percentCol}</th>
                  <th className="pb-2.5 text-right tabular-nums">{t.analytics.txCountCol}</th>
                  <th className="pb-2.5 text-right pr-2 tabular-nums">{t.analytics.avgCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {categoryRanking.map((row) => (
                  <tr
                    key={row.category.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: row.category.color }}
                        >
                          <CategoryIcon name={row.category.icon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {settings.language === 'kh'
                            ? row.category.nameKh
                            : row.category.nameEn}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      ${row.usd.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-medium tabular-nums text-slate-600 dark:text-slate-400">
                      {row.khr.toLocaleString()} ៛
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-14 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${row.percent}%`,
                              backgroundColor: row.category.color,
                            }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {row.percent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      {row.count}
                    </td>
                    <td className="py-2.5 text-right pr-2 tabular-nums font-medium text-slate-700 dark:text-slate-300">
                      ${row.avgUSD.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
