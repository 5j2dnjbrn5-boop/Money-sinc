import { TransactionType } from '../types';

export interface SmartParseResult {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  walletId: string;
  confidence: number;
}

const INCOME_KEYWORDS = [
  'เงินเดือน', 'ค่าจ้าง', 'ฟรีแลนซ์', 'รับจ้าง', 'โบนัส', 'ขายของ',
  'กำไร', 'เงินโอนเข้า', 'ของขวัญ', 'เบี้ยเลี้ยง', 'ดอกเบี้ย', 'เงินคืน',
  'ปันผล', 'ถูกหวย', 'income', 'salary', 'bonus'
];

const CATEGORY_MAP: Record<string, { category: string; type: TransactionType }> = {
  // Food & Drink
  'ข้าว': { category: '🍚 อาหาร', type: 'expense' },
  'อาหาร': { category: '🍚 อาหาร', type: 'expense' },
  'ก๋วยเตี๋ยว': { category: '🍚 อาหาร', type: 'expense' },
  'กาแฟ': { category: '🍚 อาหาร', type: 'expense' },
  'ชา': { category: '🍚 อาหาร', type: 'expense' },
  'น้ำ': { category: '🍚 อาหาร', type: 'expense' },
  'ขนม': { category: '🍚 อาหาร', type: 'expense' },
  'ส้มตำ': { category: '🍚 อาหาร', type: 'expense' },
  'หมูกระทะ': { category: '🍚 อาหาร', type: 'expense' },
  'ชาบู': { category: '🍚 อาหาร', type: 'expense' },
  'บุฟเฟต์': { category: '🍚 อาหาร', type: 'expense' },
  'เซเว่น': { category: '🍚 อาหาร', type: 'expense' },
  'food': { category: '🍚 อาหาร', type: 'expense' },
  'coffee': { category: '🍚 อาหาร', type: 'expense' },

  // Transport
  'รถ': { category: '🚗 เดินทาง', type: 'expense' },
  'น้ำมัน': { category: '🚗 เดินทาง', type: 'expense' },
  'bts': { category: '🚗 เดินทาง', type: 'expense' },
  'mrt': { category: '🚗 เดินทาง', type: 'expense' },
  'แท็กซี่': { category: '🚗 เดินทาง', type: 'expense' },
  'grab': { category: '🚗 เดินทาง', type: 'expense' },
  'วิน': { category: '🚗 เดินทาง', type: 'expense' },
  'ทางด่วน': { category: '🚗 เดินทาง', type: 'expense' },
  'จอดรถ': { category: '🚗 เดินทาง', type: 'expense' },

  // Utilities & Bills
  'ค่าไฟ': { category: '💳 บิล/อินเทอร์เน็ต', type: 'expense' },
  'ค่าน้ำ': { category: '💳 บิล/อินเทอร์เน็ต', type: 'expense' },
  'ค่าเน็ต': { category: '💳 บิล/อินเทอร์เน็ต', type: 'expense' },
  'โทรศัพท์': { category: '💳 บิล/อินเทอร์เน็ต', type: 'expense' },
  'บิล': { category: '💳 บิล/อินเทอร์เน็ต', type: 'expense' },

  // Housing
  'ค่าเช่า': { category: '🏠 ค่าที่พัก/บ้าน', type: 'expense' },
  'คอนโด': { category: '🏠 ค่าที่พัก/บ้าน', type: 'expense' },
  'หอ': { category: '🏠 ค่าที่พัก/บ้าน', type: 'expense' },

  // Shopping & Supplies
  'ช้อป': { category: '🛍️ ช้อปปิ้ง', type: 'expense' },
  'เสื้อ': { category: '🛍️ ช้อปปิ้ง', type: 'expense' },
  'กางเกง': { category: '🛍️ ช้อปปิ้ง', type: 'expense' },
  'รองเท้า': { category: '🛍️ ช้อปปิ้ง', type: 'expense' },
  'ของใช้': { category: '🛒 ของใช้', type: 'expense' },
  'สบู่': { category: '🛒 ของใช้', type: 'expense' },
  'ผงซักฟอก': { category: '🛒 ของใช้', type: 'expense' },

  // Entertainment
  'หนัง': { category: '🎬 ความบันเทิง', type: 'expense' },
  'netflix': { category: '🎬 ความบันเทิง', type: 'expense' },
  'เกม': { category: '🎬 ความบันเทิง', type: 'expense' },
  'spotify': { category: '🎬 ความบันเทิง', type: 'expense' },

  // Education
  'หนังสือ': { category: '📚 การเรียน', type: 'expense' },
  'คอร์ส': { category: '📚 การเรียน', type: 'expense' },
  'เรียน': { category: '📚 การเรียน', type: 'expense' },

  // Health
  'ยา': { category: '🏥 สุขภาพ/ยา', type: 'expense' },
  'หมอ': { category: '🏥 สุขภาพ/ยา', type: 'expense' },
  'คลินิก': { category: '🏥 สุขภาพ/ยา', type: 'expense' },

  // Income
  'เงินเดือน': { category: '💼 เงินเดือน/ค่าจ้าง', type: 'income' },
  'salary': { category: '💼 เงินเดือน/ค่าจ้าง', type: 'income' },
  'ฟรีแลนซ์': { category: '💻 งานฟรีแลนซ์/รับจ้าง', type: 'income' },
  'งานนอก': { category: '💻 งานฟรีแลนซ์/รับจ้าง', type: 'income' },
  'โบนัส': { category: '💰 โบนัส/เบี้ยเลี้ยง', type: 'income' },
  'ขายของ': { category: '🏷️ ขายของ/ค้าขาย', type: 'income' },
  'กำไร': { category: '📈 กำไรจากการลงทุน', type: 'income' },
};

export const parseQuickTransaction = (input: string): SmartParseResult | null => {
  const raw = input.trim();
  if (!raw) return null;

  // Extract amount: look for numbers (e.g. 60, 15000, 120.50, 45,000)
  const numberRegex = /([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/;
  const match = raw.match(numberRegex);
  if (!match) return null;

  const rawNumberStr = match[1].replace(/,/g, '');
  const amount = parseFloat(rawNumberStr);
  if (isNaN(amount) || amount <= 0) return null;

  // Remaining string without the number
  let text = raw.replace(match[0], '').replace(/[฿.,\-บาท]+/g, '').trim();
  if (!text) {
    text = 'รายการทั่วไป';
  }

  // Detect Wallet
  let walletId = 'cash';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('บัตร') || lowerText.includes('credit') || lowerText.includes('card')) {
    walletId = 'credit';
  } else if (lowerText.includes('ธนาคาร') || lowerText.includes('แบงก์') || lowerText.includes('โอน') || lowerText.includes('bank')) {
    walletId = 'bank';
  } else if (lowerText.includes('wallet') || lowerText.includes('วอลเล็ต') || lowerText.includes('ทรู')) {
    walletId = 'ewallet';
  }

  // Detect Type & Category
  let type: TransactionType = 'expense';
  let category = '🍚 อาหาร';

  const isIncome = INCOME_KEYWORDS.some(kw => lowerText.includes(kw));
  if (isIncome) {
    type = 'income';
    category = '💼 เงินเดือน/ค่าจ้าง';
  }

  for (const [key, mapping] of Object.entries(CATEGORY_MAP)) {
    if (lowerText.includes(key)) {
      category = mapping.category;
      type = mapping.type;
      break;
    }
  }

  return {
    title: text,
    amount,
    type,
    category,
    walletId,
    confidence: 0.85,
  };
};
