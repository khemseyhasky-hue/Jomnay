import { Currency } from '../types';

export const DEFAULT_EXCHANGE_RATE = 4100; // 4,100 KHR = $1 USD

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'KHR') {
    return Math.round(amount * exchangeRate);
  }
  if (from === 'KHR' && to === 'USD') {
    return Number((amount / exchangeRate).toFixed(2));
  }
  return amount;
}

export function formatMoney(
  amount: number,
  currency: Currency,
  options?: { showSign?: boolean; isPositive?: boolean }
): string {
  const abs = Math.abs(amount);
  const sign = options?.showSign ? (options.isPositive ? '+' : '-') : '';

  if (currency === 'USD') {
    return `${sign}$${abs.toLocaleString('en-US', {
      minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Khmer Riel
  return `${sign}${Math.round(abs).toLocaleString('en-US')} ៛`;
}

export function formatDualMoney(
  amountUSD: number,
  amountKHR: number,
  preferred: Currency | 'dual'
): { primary: string; secondary: string } {
  if (preferred === 'KHR') {
    return {
      primary: formatMoney(amountKHR, 'KHR'),
      secondary: formatMoney(amountUSD, 'USD'),
    };
  }
  if (preferred === 'USD') {
    return {
      primary: formatMoney(amountUSD, 'USD'),
      secondary: formatMoney(amountKHR, 'KHR'),
    };
  }
  // Dual
  return {
    primary: formatMoney(amountUSD, 'USD'),
    secondary: formatMoney(amountKHR, 'KHR'),
  };
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
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const KHMER_DAYS = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
const ENGLISH_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDateRelative(dateStr: string, lang: 'kh' | 'en'): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yyyyy = yesterday.getFullYear();
  const ymm = String(yesterday.getMonth() + 1).padStart(2, '0');
  const ydd = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yyyyy}-${ymm}-${ydd}`;

  if (dateStr === todayStr) {
    return lang === 'kh' ? 'ថ្ងៃនេះ' : 'Today';
  }
  if (dateStr === yesterdayStr) {
    return lang === 'kh' ? 'ម្សិលមិញ' : 'Yesterday';
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const dayOfWeek = targetDate.getDay();

  if (lang === 'kh') {
    return `ថ្ងៃ${KHMER_DAYS[dayOfWeek]}, ${d} ${KHMER_MONTHS[m - 1]} ${y}`;
  }
  return `${ENGLISH_DAYS[dayOfWeek]}, ${ENGLISH_MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatDateShort(dateStr: string, lang: 'kh' | 'en'): string {
  const [, m, d] = dateStr.split('-').map(Number);
  if (lang === 'kh') {
    return `${d} ${KHMER_MONTHS[m - 1]}`;
  }
  return `${ENGLISH_MONTHS[m - 1]} ${d}`;
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function convertKhmerDigitsToLatin(str: string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(khmerDigits[i], String(i));
  }
  return result;
}
