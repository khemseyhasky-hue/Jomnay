import { CATEGORIES } from '../data/categories';
import { Currency, PaymentMethod, TransactionType } from '../types';
import { convertCurrency, convertKhmerDigitsToLatin, getCurrentTimeString, getTodayDateString } from './formatters';

interface ParsedResult {
  type: TransactionType;
  amount: number;
  currency: Currency;
  categoryId: string;
  paymentMethod: PaymentMethod;
  note: string;
}

export function parseQuickEntry(input: string, defaultRate: number = 4100): ParsedResult | null {
  if (!input || !input.trim()) return null;

  const rawClean = convertKhmerDigitsToLatin(input.trim());

  // Detect currency and amount
  // Matches: 3.5$, $3.5, 7000r, 7000៛, 7000 riel, 50$, etc.
  let currency: Currency = 'USD';
  let amount = 0;

  // Pattern 1: $12.5 or $12
  const usdPrefixMatch = rawClean.match(/\$([0-9]+(?:\.[0-9]+)?)/i);
  // Pattern 2: 12.5$ or 12$
  const usdSuffixMatch = rawClean.match(/([0-9]+(?:\.[0-9]+)?)\s*\$/i);
  // Pattern 3: 7000៛, 7000r, 7000 khr, 7000riel
  const khrMatch = rawClean.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:៛|r|riel|khr)/i);
  // Pattern 4: Bare number e.g. 50 or 5000
  const bareNumberMatch = rawClean.match(/\b([0-9]+(?:\.[0-9]+)?)\b/);

  if (usdPrefixMatch) {
    amount = parseFloat(usdPrefixMatch[1]);
    currency = 'USD';
  } else if (usdSuffixMatch) {
    amount = parseFloat(usdSuffixMatch[1]);
    currency = 'USD';
  } else if (khrMatch) {
    amount = parseFloat(khrMatch[1]);
    currency = 'KHR';
  } else if (bareNumberMatch) {
    const val = parseFloat(bareNumberMatch[1]);
    if (val >= 500) {
      // Typically in Cambodia numbers >= 500 without symbol are Riel (e.g. 5000, 10000, 20000)
      amount = val;
      currency = 'KHR';
    } else {
      amount = val;
      currency = 'USD';
    }
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // Detect payment method
  let paymentMethod: PaymentMethod = 'aba';
  const lower = rawClean.toLowerCase();
  if (lower.includes('aba') || lower.includes('khqr')) {
    paymentMethod = 'aba';
  } else if (lower.includes('cash') || lower.includes('សាច់ប្រាក់') || lower.includes('លុយសុទ្ធ')) {
    paymentMethod = 'cash';
  } else if (lower.includes('acleda') || lower.includes('អេស៊ីលីដា')) {
    paymentMethod = 'acleda';
  } else if (lower.includes('wing') || lower.includes('វីង')) {
    paymentMethod = 'wing';
  } else if (lower.includes('card') || lower.includes('visa') || lower.includes('master')) {
    paymentMethod = 'card';
  }

  // Detect type (income vs expense)
  let type: TransactionType = 'expense';
  const incomeKeywords = [
    'ប្រាក់ខែ',
    'ចំណូល',
    'លក់',
    'salary',
    'income',
    'bonus',
    'រង្វាន់',
    'ការប្រាក់',
    'commission',
    'freelance',
    'កម្រៃ',
    'ជំនួយ',
  ];

  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) {
      type = 'income';
      break;
    }
  }

  // Detect category
  let categoryId = type === 'income' ? 'salary' : 'food';

  const categoryMap: Record<string, string[]> = {
    coffee: ['កាហ្វេ', 'coffee', 'cafe', 'តែ', 'tea', 'starbucks', 'amazon', 'brown', 'កាកាវ'],
    food: [
      'បាយ',
      'ម្ហូប',
      'អាហារ',
      'ញ៉ាំ',
      'គុយទាវ',
      'ភេសជ្ជៈ',
      'lunch',
      'dinner',
      'breakfast',
      'food',
      'pizza',
      'burger',
      'kfc',
      'hotpot',
    ],
    transport: ['សាំង', 'ម៉ូតូ', 'ឡាន', 'កង់បី', 'passapp', 'grab', 'តាក់ស៊ី', 'gas', 'fuel', 'taxi', 'parking', 'ផ្ញើម៉ូតូ'],
    groceries: ['ផ្សារ', 'ទំនិញ', 'supermarket', 'mart', 'chip mong', 'aeon', 'lucky', 'groceries', 'បន្លែ', 'ផ្លែឈើ', 'សាច់'],
    utilities: ['ភ្លើង', 'ទឹក', 'wifi', 'internet', 'smart', 'cellcard', 'metfone', 'កាតទូរស័ព្ទ', 'bill', 'electricity'],
    housing: ['ថ្លៃជួល', 'ផ្ទះ', 'បន្ទប់', 'rent', 'house', 'apartment', 'condo'],
    health: ['ថ្នាំ', 'ពេទ្យ', 'គ្លីនិក', 'doctor', 'hospital', 'medicine', 'pharmacy', 'សុខភាព'],
    education: ['រៀន', 'សាលា', 'សៀវភៅ', 'school', 'course', 'book', 'tuition'],
    entertainment: ['កុន', 'មើលកុន', 'ដើរលេង', 'ដំណើរកម្សាន្ត', 'game', 'movie', 'cinema', 'resort'],
    personal: ['កាត់សក់', 'ខោអាវ', 'សម្លៀកបំពាក់', 'ស្បែកជើង', 'clothes', 'salon', 'makeup'],
    family: ['ម៉ាក់', 'ប៉ា', 'កូន', 'បុណ្យ', 'អាពាហ៍ពិពាហ៍', 'ការ', 'family', 'gift', 'wedding'],
    salary: ['ប្រាក់ខែ', 'salary', 'wage', 'paycheck'],
    business: ['លក់ដូរ', 'លក់ឥវ៉ាន់', 'business', 'shop', 'order'],
    freelance: ['ក្រៅម៉ោង', 'freelance', 'project', 'design', 'coding'],
    investment: ['ការប្រាក់', 'ភាគហ៊ុន', 'interest', 'dividend', 'crypto'],
  };

  for (const [catId, keywords] of Object.entries(categoryMap)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        categoryId = catId;
        const matchedCat = CATEGORIES.find((c) => c.id === catId);
        if (matchedCat) {
          type = matchedCat.type === 'both' ? type : matchedCat.type;
        }
        break;
      }
    }
  }

  // Clean note
  let cleanNote = rawClean
    .replace(/\$([0-9]+(?:\.[0-9]+)?)/gi, '')
    .replace(/([0-9]+(?:\.[0-9]+)?)\s*\$/gi, '')
    .replace(/([0-9]+(?:\.[0-9]+)?)\s*(?:៛|r|riel|khr)/gi, '')
    .replace(/\b([0-9]+(?:\.[0-9]+)?)\b/g, '')
    .replace(/\b(aba|khqr|wing|acleda|cash|card|visa|master)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanNote) {
    cleanNote = rawClean;
  }

  return {
    type,
    amount,
    currency,
    categoryId,
    paymentMethod,
    note: cleanNote,
  };
}

export function buildTransactionFromParsed(
  parsed: ParsedResult,
  exchangeRate: number = 4100
) {
  const amountUSD =
    parsed.currency === 'USD'
      ? parsed.amount
      : convertCurrency(parsed.amount, 'KHR', 'USD', exchangeRate);

  const amountKHR =
    parsed.currency === 'KHR'
      ? parsed.amount
      : convertCurrency(parsed.amount, 'USD', 'KHR', exchangeRate);

  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: parsed.type,
    amount: parsed.amount,
    currency: parsed.currency,
    amountUSD,
    amountKHR,
    categoryId: parsed.categoryId,
    date: getTodayDateString(),
    time: getCurrentTimeString(),
    paymentMethod: parsed.paymentMethod,
    note: parsed.note,
    createdAt: Date.now(),
  };
}
