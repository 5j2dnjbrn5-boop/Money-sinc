import {
  MoneySyncDataV2,
  Transaction,
  Wallet,
  BudgetSetting,
  FinancialGoal,
  RecurringRule,
} from '../types';
import {
  STORAGE_KEYS,
  DEFAULT_CATEGORIES,
  DEFAULT_WALLETS,
} from '../constants';

// Initial sample data across months so multi-year features are vividly demonstrated
const generateSampleTransactions = (): Transaction[] => {
  const list: Transaction[] = [
    // 2026 - October (Current month)
    {
      id: 'tx-2026-10-01',
      type: 'income',
      amount: 45000,
      title: 'เงินเดือนประจำเดือน',
      category: '💼 เงินเดือน/ค่าจ้าง',
      date: '2026-10-01',
      walletId: 'bank',
      note: 'โอนเข้าบัญชีหลัก',
      createdAt: new Date('2026-10-01T09:00:00').getTime(),
    },
    {
      id: 'tx-2026-10-02',
      type: 'expense',
      amount: 8500,
      title: 'ค่าเช่าคอนโด',
      category: '🏠 ค่าที่พัก/บ้าน',
      date: '2026-10-02',
      walletId: 'bank',
      note: 'รวมค่าน้ำไฟ',
      createdAt: new Date('2026-10-02T10:30:00').getTime(),
    },
    {
      id: 'tx-2026-10-03',
      type: 'expense',
      amount: 1500,
      title: 'ซื้อของซูเปอร์มาร์เก็ต',
      category: '🛒 ของใช้',
      date: '2026-10-03',
      walletId: 'credit',
      note: 'ของสดเข้าตู้เย็น',
      createdAt: new Date('2026-10-03T14:15:00').getTime(),
    },
    {
      id: 'tx-2026-10-05',
      type: 'expense',
      amount: 250,
      title: 'กาแฟและขนมคาเฟ่',
      category: '🍚 อาหาร',
      date: '2026-10-05',
      walletId: 'cash',
      note: 'นัดเพื่อนทำงาน',
      createdAt: new Date('2026-10-05T15:20:00').getTime(),
    },
    {
      id: 'tx-2026-10-07',
      type: 'expense',
      amount: 600,
      title: 'เติมน้ำมันรถยนต์',
      category: '🚗 เดินทาง',
      date: '2026-10-07',
      walletId: 'credit',
      note: 'เต็มถัง',
      createdAt: new Date('2026-10-07T08:45:00').getTime(),
    },
    {
      id: 'tx-2026-10-09',
      type: 'expense',
      amount: 350,
      title: 'บุฟเฟต์ชาบูกับเพื่อน',
      category: '🍚 อาหาร',
      date: '2026-10-09',
      walletId: 'bank',
      note: 'วันศุกร์สังสรรค์',
      createdAt: new Date('2026-10-09T19:30:00').getTime(),
    },
    {
      id: 'tx-2026-10-10',
      type: 'income',
      amount: 7500,
      title: 'รับงานออกแบบฟรีแลนซ์',
      category: '💻 งานฟรีแลนซ์/รับจ้าง',
      date: '2026-10-10',
      walletId: 'bank',
      note: 'งวดแรกเว็บแอป',
      createdAt: new Date('2026-10-10T16:00:00').getTime(),
    },

    // 2026 - September (Previous month)
    {
      id: 'tx-2026-09-01',
      type: 'income',
      amount: 45000,
      title: 'เงินเดือน',
      category: '💼 เงินเดือน/ค่าจ้าง',
      date: '2026-09-01',
      walletId: 'bank',
      createdAt: new Date('2026-09-01T09:00:00').getTime(),
    },
    {
      id: 'tx-2026-09-02',
      type: 'expense',
      amount: 8500,
      title: 'ค่าเช่าห้อง',
      category: '🏠 ค่าที่พัก/บ้าน',
      date: '2026-09-02',
      walletId: 'bank',
      createdAt: new Date('2026-09-02T11:00:00').getTime(),
    },
    {
      id: 'tx-2026-09-12',
      type: 'expense',
      amount: 3200,
      title: 'ค่าอาหารรวมสัปดาห์',
      category: '🍚 อาหาร',
      date: '2026-09-12',
      walletId: 'cash',
      createdAt: new Date('2026-09-12T13:00:00').getTime(),
    },
    {
      id: 'tx-2026-09-20',
      type: 'expense',
      amount: 1200,
      title: 'ค่าแพ็กเกจอินเทอร์เน็ต',
      category: '💳 บิล/อินเทอร์เน็ต',
      date: '2026-09-20',
      walletId: 'bank',
      createdAt: new Date('2026-09-20T17:00:00').getTime(),
    },

    // 2026 - August
    {
      id: 'tx-2026-08-01',
      type: 'income',
      amount: 45000,
      title: 'เงินเดือน',
      category: '💼 เงินเดือน/ค่าจ้าง',
      date: '2026-08-01',
      walletId: 'bank',
      createdAt: new Date('2026-08-01T09:00:00').getTime(),
    },
    {
      id: 'tx-2026-08-15',
      type: 'expense',
      amount: 4200,
      title: 'ช้อปปิ้งอุปกรณ์ทำงาน',
      category: '🛍️ ช้อปปิ้ง',
      date: '2026-08-15',
      walletId: 'credit',
      createdAt: new Date('2026-08-15T15:00:00').getTime(),
    },
    {
      id: 'tx-2026-08-25',
      type: 'expense',
      amount: 2100,
      title: 'ทานอาหารนอกบ้าน',
      category: '🍚 อาหาร',
      date: '2026-08-25',
      walletId: 'cash',
      createdAt: new Date('2026-08-25T19:00:00').getTime(),
    },

    // 2025 - December (Previous Year)
    {
      id: 'tx-2025-12-01',
      type: 'income',
      amount: 42000,
      title: 'เงินเดือนปลายปี',
      category: '💼 เงินเดือน/ค่าจ้าง',
      date: '2025-12-01',
      walletId: 'bank',
      createdAt: new Date('2025-12-01T09:00:00').getTime(),
    },
    {
      id: 'tx-2025-12-28',
      type: 'income',
      amount: 25000,
      title: 'โบนัสประจำปี 2025',
      category: '💰 โบนัส/เบี้ยเลี้ยง',
      date: '2025-12-28',
      walletId: 'bank',
      createdAt: new Date('2025-12-28T10:00:00').getTime(),
    },
    {
      id: 'tx-2025-12-29',
      type: 'expense',
      amount: 6800,
      title: 'ของขวัญปีใหม่ครอบครัว',
      category: '🎁 อื่น ๆ',
      date: '2025-12-29',
      walletId: 'bank',
      createdAt: new Date('2025-12-29T14:00:00').getTime(),
    },
  ];
  return list;
};

export const loadData = (): MoneySyncDataV2 => {
  try {
    // 1. Check if v2 exists
    const v2Raw = localStorage.getItem(STORAGE_KEYS.DATA_V2);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw) as MoneySyncDataV2;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }

    // 2. Check legacy storage
    const legacyRaw = localStorage.getItem(STORAGE_KEYS.LEGACY_TRANSACTIONS);
    if (legacyRaw) {
      const legacyItems = JSON.parse(legacyRaw);
      if (Array.isArray(legacyItems) && legacyItems.length > 0) {
        // Safe backup before migration!
        localStorage.setItem(STORAGE_KEYS.LEGACY_BACKUP, legacyRaw);

        const migratedTransactions: Transaction[] = legacyItems.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          type: item.type === 'income' ? 'income' : 'expense',
          amount: Number(item.amount) || 0,
          title: String(item.title || 'รายการทั่วไป'),
          category: String(item.category || '🍚 อาหาร'),
          date: String(item.date || new Date().toISOString().slice(0, 10)),
          note: item.note ? String(item.note) : undefined,
          walletId: item.walletId || 'cash',
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || item.createdAt || Date.now(),
        }));

        const initialV2: MoneySyncDataV2 = {
          version: 2,
          transactions: migratedTransactions,
          wallets: DEFAULT_WALLETS,
          budgets: {
            monthlyOverall: 20000,
            categoryBudgets: {
              '🍚 อาหาร': 6000,
              '🚗 เดินทาง': 2500,
              '🛒 ของใช้': 2000,
              '🏠 ค่าที่พัก/บ้าน': 9000,
            },
          },
          goals: [
            {
              id: 'goal-emergency-fund',
              title: 'เงินสำรองฉุกเฉิน 6 เดือน',
              targetAmount: 150000,
              currentAmount: 65000,
              deadline: '2027-12-31',
              color: '#3b82f6',
              createdAt: Date.now(),
            },
          ],
          recurring: [
            {
              id: 'rec-rent',
              title: 'ค่าเช่าห้อง',
              type: 'expense',
              amount: 8500,
              category: '🏠 ค่าที่พัก/บ้าน',
              walletId: 'bank',
              frequency: 'monthly',
              dayOfMonth: 1,
              active: true,
            },
          ],
          customCategories: DEFAULT_CATEGORIES,
        };

        saveData(initialV2);
        return initialV2;
      }
    }

    // 3. First time user setup: Provide realistic starter structure
    const freshData: MoneySyncDataV2 = {
      version: 2,
      transactions: generateSampleTransactions(),
      wallets: DEFAULT_WALLETS,
      budgets: {
        monthlyOverall: 22000,
        categoryBudgets: {
          '🍚 อาหาร': 6000,
          '🚗 เดินทาง': 2500,
          '🛒 ของใช้': 2000,
          '🏠 ค่าที่พัก/บ้าน': 9000,
        },
      },
      goals: [
        {
          id: 'goal-emergency',
          title: 'กองทุนสำรองฉุกเฉิน',
          targetAmount: 100000,
          currentAmount: 42000,
          deadline: '2027-06-30',
          color: '#10b981',
          createdAt: Date.now(),
        },
        {
          id: 'goal-car',
          title: 'ดาวน์รถยนต์คันใหม่',
          targetAmount: 80000,
          currentAmount: 28000,
          deadline: '2027-12-31',
          color: '#f59e0b',
          createdAt: Date.now(),
        },
      ],
      recurring: [
        {
          id: 'rec-salary',
          title: 'เงินเดือนประจำ',
          type: 'income',
          amount: 45000,
          category: '💼 เงินเดือน/ค่าจ้าง',
          walletId: 'bank',
          frequency: 'monthly',
          dayOfMonth: 1,
          active: true,
        },
        {
          id: 'rec-netflix',
          title: 'Netflix Family',
          type: 'expense',
          amount: 419,
          category: '🎬 ความบันเทิง',
          walletId: 'credit',
          frequency: 'monthly',
          dayOfMonth: 15,
          active: true,
        },
      ],
      customCategories: DEFAULT_CATEGORIES,
    };

    saveData(freshData);
    return freshData;
  } catch (err) {
    console.error('Error loading data:', err);
    return {
      version: 2,
      transactions: [],
      wallets: DEFAULT_WALLETS,
      budgets: { monthlyOverall: 0, categoryBudgets: {} },
      goals: [],
      recurring: [],
      customCategories: DEFAULT_CATEGORIES,
    };
  }
};

export const saveData = (data: MoneySyncDataV2): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DATA_V2, JSON.stringify(data));
    // Keep legacy key in sync for backwards-compatibility
    localStorage.setItem(STORAGE_KEYS.LEGACY_TRANSACTIONS, JSON.stringify(data.transactions));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
    throw new Error('ไม่สามารถบันทึกข้อมูลได้ เนื่องจากพื้นที่จัดเก็บในเบราว์เซอร์เต็ม');
  }
};

export const exportDataAsJSON = (data: MoneySyncDataV2): void => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `moneysync-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportDataAsCSV = (transactions: Transaction[]): void => {
  // UTF-8 BOM (\uFEFF) ensures Thai characters open flawlessly in Excel and Sheets
  const headers = ['วันที่ (Date)', 'ประเภท (Type)', 'รายการ (Title)', 'จำนวนเงิน (Amount)', 'หมวดหมู่ (Category)', 'กระเป๋า (Wallet)', 'โน้ต (Note)'];
  const rows = transactions.map(t => [
    `"${t.date}"`,
    `"${t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.amount.toString(),
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${t.walletId}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `moneysync-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateImportData = (parsed: any): MoneySyncDataV2 | null => {
  if (!parsed || typeof parsed !== 'object') return null;

  // Case 1: Standard v2 export
  if (parsed.version === 2 && Array.isArray(parsed.transactions)) {
    return {
      version: 2,
      transactions: parsed.transactions.map((t: any) => ({
        id: t.id || crypto.randomUUID(),
        type: t.type === 'income' ? 'income' : 'expense',
        amount: Math.abs(Number(t.amount) || 0),
        title: String(t.title || 'รายการ'),
        category: String(t.category || '🍚 อาหาร'),
        date: String(t.date || new Date().toISOString().slice(0, 10)),
        note: t.note ? String(t.note) : undefined,
        walletId: t.walletId || 'cash',
        createdAt: Number(t.createdAt) || Date.now(),
        updatedAt: Number(t.updatedAt) || Date.now(),
      })),
      wallets: Array.isArray(parsed.wallets) && parsed.wallets.length ? parsed.wallets : DEFAULT_WALLETS,
      budgets: parsed.budgets || { monthlyOverall: 0, categoryBudgets: {} },
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
      customCategories: parsed.customCategories || DEFAULT_CATEGORIES,
    };
  }

  // Case 2: Array of transactions (legacy or raw list)
  if (Array.isArray(parsed)) {
    const txs: Transaction[] = parsed.map((t: any) => ({
      id: t.id || crypto.randomUUID(),
      type: t.type === 'income' ? 'income' : 'expense',
      amount: Math.abs(Number(t.amount) || 0),
      title: String(t.title || 'รายการ'),
      category: String(t.category || '🍚 อาหาร'),
      date: String(t.date || new Date().toISOString().slice(0, 10)),
      note: t.note ? String(t.note) : undefined,
      walletId: t.walletId || 'cash',
      createdAt: Number(t.createdAt) || Date.now(),
      updatedAt: Date.now(),
    }));
    return {
      version: 2,
      transactions: txs,
      wallets: DEFAULT_WALLETS,
      budgets: { monthlyOverall: 0, categoryBudgets: {} },
      goals: [],
      recurring: [],
      customCategories: DEFAULT_CATEGORIES,
    };
  }

  return null;
};
