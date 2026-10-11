import { Wallet } from './types';

export const STORAGE_KEYS = {
  LEGACY_TRANSACTIONS: 'moneysync.transactions.v1',
  LEGACY_BACKUP: 'moneysync.backup.legacy',
  DATA_V2: 'moneysync.os.data.v2',
  THEME: 'moneysync.theme.v1',
};

export const DEFAULT_CATEGORIES = {
  expense: [
    '🍚 อาหาร',
    '🚗 เดินทาง',
    '🛒 ของใช้',
    '🎬 ความบันเทิง',
    '📚 การเรียน',
    '💳 บิล/อินเทอร์เน็ต',
    '🛍️ ช้อปปิ้ง',
    '🏥 สุขภาพ/ยา',
    '🏠 ค่าที่พัก/บ้าน',
    '🎁 อื่น ๆ',
  ],
  income: [
    '💼 เงินเดือน/ค่าจ้าง',
    '💻 งานฟรีแลนซ์/รับจ้าง',
    '📈 กำไรจากการลงทุน',
    '🏷️ ขายของ/ค้าขาย',
    '💰 โบนัส/เบี้ยเลี้ยง',
    '🎁 ของขวัญ/สวัสดิการ',
    '💵 อื่น ๆ',
  ],
};

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'cash',
    name: '💵 เงินสด',
    type: 'cash',
    initialBalance: 0,
    color: '#10b981',
  },
  {
    id: 'bank',
    name: '🏦 บัญชีธนาคาร',
    type: 'bank',
    initialBalance: 0,
    color: '#3b82f6',
  },
  {
    id: 'credit',
    name: '💳 บัตรเครดิต',
    type: 'credit',
    initialBalance: 0,
    color: '#f59e0b',
  },
  {
    id: 'ewallet',
    name: '📱 e-Wallet',
    type: 'ewallet',
    initialBalance: 0,
    color: '#8b5cf6',
  },
];

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const formatMoney = (val: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const formatMoneyCompact = (val: number): string => {
  if (Math.abs(val) >= 1_000_000) {
    return `฿${(val / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 10_000) {
    return `฿${(val / 1_000).toFixed(1)}k`;
  }
  return formatMoney(val);
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  const monthIdx = parseInt(m, 10) - 1;
  const thMonth = THAI_MONTHS_SHORT[monthIdx] || m;
  return `${parseInt(d, 10)} ${thMonth} ${y}`;
};

export const getMonthKey = (d: Date = new Date()): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getYearKey = (d: Date = new Date()): string => {
  return String(d.getFullYear());
};
