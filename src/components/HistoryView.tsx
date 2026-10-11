import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  ArrowUpDown,
  Plus,
  Layers,
  CalendarRange,
} from 'lucide-react';
import { Transaction, Wallet, HistorySubTab } from '../types';
import {
  formatMoney,
  formatDisplayDate,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
  getMonthKey,
} from '../constants';

interface HistoryViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: {
    expense: string[];
    income: string[];
  };
  initialSubTab?: HistorySubTab;
  onEditTransaction: (tx: Transaction) => void;
  onRequestDeleteTransaction: (tx: Transaction) => void;
  onOpenAddModalWithDate: (dateStr: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  wallets,
  categories,
  initialSubTab = 'year',
  onEditTransaction,
  onRequestDeleteTransaction,
  onOpenAddModalWithDate,
}) => {
  const [subTab, setSubTab] = useState<HistorySubTab>(initialSubTab);

  // Year Selection state
  const currentSystemYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentSystemYear);
    yearsSet.add(currentSystemYear - 1);
    yearsSet.add(currentSystemYear + 1);
    transactions.forEach(t => {
      const y = parseInt(t.date.slice(0, 4), 10);
      if (!isNaN(y)) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, currentSystemYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentSystemYear);

  // Selected Month (for Monthly Detail & Calendar)
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(new Date().getMonth());

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Calendar Day Selection
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Month String "YYYY-MM"
  const currentSelectedMonthKey = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}`;

  // Next / Previous month helpers
  const handlePrevMonth = () => {
    if (selectedMonthIdx === 0) {
      setSelectedMonthIdx(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonthIdx(prev => prev - 1);
    }
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    if (selectedMonthIdx === 11) {
      setSelectedMonthIdx(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonthIdx(prev => prev + 1);
    }
    setSelectedCalendarDay(null);
  };

  // --- ANNUAL DATA CALCULATIONS ---
  const yearTxs = useMemo(() => {
    return transactions.filter(t => parseInt(t.date.slice(0, 4), 10) === selectedYear);
  }, [transactions, selectedYear]);

  const annualIncome = useMemo(() => {
    return yearTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [yearTxs]);

  const annualExpense = useMemo(() => {
    return yearTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [yearTxs]);

  const annualNet = annualIncome - annualExpense;

  // Monthly breakdown for all 12 months in selected year
  const monthlyBreakdown = useMemo(() => {
    return THAI_MONTHS.map((monthName, idx) => {
      const mKey = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const mTxs = transactions.filter(t => t.date.slice(0, 7) === mKey);
      const inc = mTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = mTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return {
        monthIndex: idx,
        monthName,
        monthKey: mKey,
        income: inc,
        expense: exp,
        net: inc - exp,
        count: mTxs.length,
      };
    });
  }, [transactions, selectedYear]);

  // Highest expense month & Highest income month
  const highestExpenseMonth = useMemo(() => {
    const sorted = [...monthlyBreakdown].filter(m => m.expense > 0).sort((a, b) => b.expense - a.expense);
    return sorted[0] || null;
  }, [monthlyBreakdown]);

  const highestIncomeMonth = useMemo(() => {
    const sorted = [...monthlyBreakdown].filter(m => m.income > 0).sort((a, b) => b.income - a.income);
    return sorted[0] || null;
  }, [monthlyBreakdown]);

  // Top expense category in this year
  const topAnnualCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    yearTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    return sorted[0] || null;
  }, [yearTxs]);

  // --- MONTHLY DETAIL FILTERING & SORTING ---
  const monthlyDetailTxs = useMemo(() => {
    let list = transactions.filter(t => t.date.slice(0, 7) === currentSelectedMonthKey);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q))
      );
    }

    if (filterType !== 'all') {
      list = list.filter(t => t.type === filterType);
    }

    if (filterCategory !== 'all') {
      list = list.filter(t => t.category === filterCategory);
    }

    if (filterWallet !== 'all') {
      list = list.filter(t => t.walletId === filterWallet);
    }

    return list.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, currentSelectedMonthKey, searchQuery, filterType, filterCategory, filterWallet, sortBy]);

  const monthlyDetailIncome = useMemo(() => {
    return transactions
      .filter(t => t.date.slice(0, 7) === currentSelectedMonthKey && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentSelectedMonthKey]);

  const monthlyDetailExpense = useMemo(() => {
    return transactions
      .filter(t => t.date.slice(0, 7) === currentSelectedMonthKey && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentSelectedMonthKey]);

  // Category breakdown for selected month
  const monthlyCategoryList = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions
      .filter(t => t.date.slice(0, 7) === currentSelectedMonthKey && t.type === 'expense')
      .forEach(t => {
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [transactions, currentSelectedMonthKey]);

  // --- GLOBAL SEARCH (Requirement 16) ---
  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return transactions
      .filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, searchQuery]);

  const globalSearchTotalSpent = useMemo(() => {
    return globalSearchResults
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [globalSearchResults]);

  const globalSearchTotalIncome = useMemo(() => {
    return globalSearchResults
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [globalSearchResults]);

  // --- CALENDAR GENERATION ---
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonthIdx, 1);
    const lastDay = new Date(selectedYear, selectedMonthIdx + 1, 0);
    const totalDays = lastDay.getDate();

    // Monday as start of week: 0=Mon, 1=Tue, ..., 6=Sun
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    // Padding before 1st of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ dayNumber: 0, dateStr: '', inMonth: false });
    }

    // Days in month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = transactions.filter(t => t.date === dateStr);
      const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      days.push({
        dayNumber: d,
        dateStr,
        inMonth: true,
        transactions: dayTxs,
        income: inc,
        expense: exp,
      });
    }

    return days;
  }, [selectedYear, selectedMonthIdx, transactions]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedCalendarDay) return [];
    return transactions.filter(t => t.date === selectedCalendarDay);
  }, [transactions, selectedCalendarDay]);

  const allAvailableCategories = [...categories.expense, ...categories.income];

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            ระบบเก็บข้อมูลการเงินระยะยาว
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>📚 ประวัติการเงิน</span>
          </h1>
        </div>

        {/* SubTab navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setSubTab('year')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              subTab === 'year'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ภาพรวมรายปี
          </button>
          <button
            onClick={() => setSubTab('month')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              subTab === 'month'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setSubTab('calendar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              subTab === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ปฏิทิน
          </button>
          <button
            onClick={() => setSubTab('search')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              subTab === 'search'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ค้นหาทั้งระบบ
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. ANNUAL OVERVIEW TAB (Requirement 3) */}
      {/* ---------------------------------------------------- */}
      {subTab === 'year' && (
        <div className="space-y-6">
          {/* Year Selector */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">เลือกปีประวัติศาสตร์:</span>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="px-4 py-1.5 pr-8 text-sm font-extrabold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>
                      ปี {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setSelectedYear(prev => prev - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400"
              >
                ← ปี {selectedYear - 1}
              </button>
              <button
                onClick={() => setSelectedYear(prev => prev + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400"
              >
                ปี {selectedYear + 1} →
              </button>
            </div>
          </div>

          {/* Annual KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">รายรับทั้งปี {selectedYear}</span>
              <div className="text-2xl font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1">
                {formatMoney(annualIncome)}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {highestIncomeMonth
                  ? `เดือนรับสูงสุด: ${highestIncomeMonth.monthName} (${formatMoney(highestIncomeMonth.income)})`
                  : 'ยังไม่มีข้อมูล'}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">รายจ่ายทั้งปี {selectedYear}</span>
              <div className="text-2xl font-extrabold font-mono-num text-rose-600 dark:text-rose-400 mt-1">
                {formatMoney(annualExpense)}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {highestExpenseMonth
                  ? `เดือนใช้สูงสุด: ${highestExpenseMonth.monthName} (${formatMoney(highestExpenseMonth.expense)})`
                  : 'ยังไม่มีข้อมูล'}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-800 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">เงินสุทธิทั้งปี {selectedYear}</span>
              <div
                className={`text-2xl font-extrabold font-mono-num mt-1 ${
                  annualNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {annualNet >= 0 ? '+' : ''}
                {formatMoney(annualNet)}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {topAnnualCategory
                  ? `หมวดใช้จ่ายสูงสุด: ${topAnnualCategory[0]} (${formatMoney(topAnnualCategory[1])})`
                  : 'ยังไม่มีข้อมูล'}
              </p>
            </div>
          </div>

          {/* 12-Month Detailed Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  ข้อมูลสรุปรายเดือน ประจำปี {selectedYear}
                </h2>
                <p className="text-xs text-slate-500">
                  คลิกที่เดือนใดก็ได้เพื่อเปิดดูรายละเอียดและจัดการรายการของเดือนนั้น
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {monthlyBreakdown.map((m) => (
                <button
                  key={m.monthKey}
                  onClick={() => {
                    setSelectedMonthIdx(m.monthIndex);
                    setSubTab('month');
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {m.monthName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono-num">
                      {m.count} รายการ
                    </span>
                  </div>

                  <div className="space-y-1 text-xs w-full">
                    <div className="flex justify-between text-slate-500">
                      <span>รายรับ</span>
                      <span className="font-semibold text-emerald-600 font-mono-num">
                        {formatMoney(m.income)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>รายจ่าย</span>
                      <span className="font-semibold text-rose-600 font-mono-num">
                        {formatMoney(m.expense)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">สุทธิ</span>
                      <span
                        className={`font-mono-num ${
                          m.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                        }`}
                      >
                        {m.net >= 0 ? '+' : ''}
                        {formatMoney(m.net)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. MONTHLY DETAIL TAB (Requirement 4) */}
      {/* ---------------------------------------------------- */}
      {subTab === 'month' && (
        <div className="space-y-6">
          {/* Month Selector Bar with ← Prev / Next → */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center px-3">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {THAI_MONTHS[selectedMonthIdx]} {selectedYear}
                </h2>
                <span className="text-[11px] text-slate-500">
                  {currentSelectedMonthKey}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick jump to current month */}
            <button
              onClick={() => {
                setSelectedYear(new Date().getFullYear());
                setSelectedMonthIdx(new Date().getMonth());
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 self-start sm:self-auto"
            >
              กลับมาเดือนปัจจุบัน
            </button>
          </div>

          {/* Month summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500">รายรับเดือนนี้</span>
              <div className="text-xl font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1">
                {formatMoney(monthlyDetailIncome)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500">รายจ่ายเดือนนี้</span>
              <div className="text-xl font-extrabold font-mono-num text-rose-600 dark:text-rose-400 mt-1">
                {formatMoney(monthlyDetailExpense)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500">คงเหลือสุทธิ</span>
              <div
                className={`text-xl font-extrabold font-mono-num mt-1 ${
                  monthlyDetailIncome - monthlyDetailExpense >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600'
                }`}
              >
                {monthlyDetailIncome - monthlyDetailExpense >= 0 ? '+' : ''}
                {formatMoney(monthlyDetailIncome - monthlyDetailExpense)}
              </div>
            </div>
          </div>

          {/* Monthly category list if any */}
          {monthlyCategoryList.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                การกระจายรายจ่ายตามหมวดหมู่
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {monthlyCategoryList.map(([cName, cAmt]) => (
                  <div
                    key={cName}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="text-slate-500 truncate">{cName}</div>
                    <div className="font-extrabold font-mono-num text-slate-900 dark:text-white mt-0.5">
                      {formatMoney(cAmt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters, Search & Sort Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาในเดือนนี้..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">ทุกประเภท</option>
                  <option value="expense">เฉพาะรายจ่าย</option>
                  <option value="income">เฉพาะรายรับ</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {allAvailableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Wallet Filter */}
                <select
                  value={filterWallet}
                  onChange={(e) => setFilterWallet(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">ทุกบัญชี/กระเป๋า</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="date-desc">วันที่ (ใหม่ไปเก่า)</option>
                  <option value="date-asc">วันที่ (เก่าไปใหม่)</option>
                  <option value="amount-desc">จำนวนเงิน (มากไปน้อย)</option>
                  <option value="amount-asc">จำนวนเงิน (น้อยไปมาก)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                รายการธุรกรรม ({monthlyDetailTxs.length} รายการ)
              </h3>
              <button
                onClick={() => onOpenAddModalWithDate(`${currentSelectedMonthKey}-01`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มในเดือนนี้</span>
              </button>
            </div>

            {monthlyDetailTxs.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {monthlyDetailTxs.map((tx) => {
                  const walletObj = wallets.find(w => w.id === tx.walletId);
                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                            <span>{tx.category}</span>
                            <span>·</span>
                            <span>{formatDisplayDate(tx.date)}</span>
                            {walletObj && (
                              <>
                                <span>·</span>
                                <span>{walletObj.name}</span>
                              </>
                            )}
                            {tx.note && (
                              <>
                                <span>·</span>
                                <span className="italic text-slate-400">"{tx.note}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div
                          className={`text-xs sm:text-sm font-extrabold font-mono-num ${
                            tx.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '−'}
                          {formatMoney(tx.amount)}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="แก้ไขรายการ"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRequestDeleteTransaction(tx)}
                            title="ลบรายการ"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                ไม่พบรายการตามเงื่อนไขที่เลือกในเดือนนี้
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. CALENDAR VIEW TAB (Requirement 5) */}
      {/* ---------------------------------------------------- */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Month Navigation */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h2 className="text-base font-extrabold text-slate-900 dark:text-white px-2">
                {THAI_MONTHS[selectedMonthIdx]} {selectedYear}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs text-slate-500 hidden sm:inline">
              แตะที่วันเพื่อดูรายละเอียดรายจ่ายและบันทึกรายการ
            </span>
          </div>

          {/* Calendar Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              {/* Day of week headers (Mon - Sun / จ. - อา.) */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
                <span>จ.</span>
                <span>อ.</span>
                <span>พ.</span>
                <span>พฤ.</span>
                <span>ศ.</span>
                <span className="text-indigo-500">ส.</span>
                <span className="text-rose-500">อา.</span>
              </div>

              {/* Grid of days */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((item, idx) => {
                  if (!item.inMonth) {
                    return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-transparent" />;
                  }

                  const isSelected = selectedCalendarDay === item.dateStr;
                  const hasExpense = (item.expense || 0) > 0;
                  const hasIncome = (item.income || 0) > 0;

                  return (
                    <button
                      key={item.dateStr}
                      onClick={() => setSelectedCalendarDay(item.dateStr)}
                      className={`h-16 sm:h-20 p-1.5 rounded-2xl flex flex-col justify-between text-left transition-all border ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                          : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-bold ${
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.dayNumber}
                        </span>

                        <div className="flex items-center gap-1">
                          {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        </div>
                      </div>

                      <div className="space-y-0.5 overflow-hidden">
                        {hasExpense && (
                          <div className="text-[10px] font-bold font-mono-num text-rose-500 truncate">
                            -{Math.round(item.expense || 0)}
                          </div>
                        )}
                        {hasIncome && (
                          <div className="text-[10px] font-bold font-mono-num text-emerald-500 truncate">
                            +{Math.round(item.income || 0)}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details Panel */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedCalendarDay ? formatDisplayDate(selectedCalendarDay) : 'เลือกวันที่ในปฏิทิน'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCalendarDay ? `พบ ${selectedDayTransactions.length} รายการ` : 'คลิกเลือกวันเพื่อดู'}
                  </p>
                </div>

                {selectedCalendarDay && (
                  <button
                    onClick={() => onOpenAddModalWithDate(selectedCalendarDay)}
                    className="p-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    title="เพิ่มรายการในวันนี้"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {selectedCalendarDay ? (
                selectedDayTransactions.length > 0 ? (
                  <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedDayTransactions.map(tx => (
                      <div key={tx.id} className="pt-2 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {tx.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {tx.category} {tx.note ? `· ${tx.note}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono-num">
                          <span
                            className={`font-bold ${
                              tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '−'}
                            {formatMoney(tx.amount)}
                          </span>

                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs flex justify-between font-bold">
                      <span>รวมรายจ่ายวันนี้</span>
                      <span className="text-rose-500 font-mono-num">
                        {formatMoney(
                          selectedDayTransactions
                            .filter(t => t.type === 'expense')
                            .reduce((s, t) => s + t.amount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <p>ไม่มีรายการในวันที่นี้</p>
                    <button
                      onClick={() => onOpenAddModalWithDate(selectedCalendarDay)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                    >
                      + บันทึกรายการของวันนี้
                    </button>
                  </div>
                )
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  โปรดแตะเลือกวันจากตารางปฏิทินทางซ้าย
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. GLOBAL SEARCH TAB (Requirement 16) */}
      {/* ---------------------------------------------------- */}
      {subTab === 'search' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ค้นหาข้อมูลการเงินย้อนหลังหลายปี
              </h2>
              <p className="text-xs text-slate-500">
                พิมพ์คำค้นหา เช่น "กาแฟ", "น้ำมัน", "netflix", "เงินเดือน" เพื่อดูรายการและยอดรวมสะสมทั้งหมด
              </p>
            </div>

            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='พิมพ์คำค้น เช่น "กาแฟ" หรือ "อาหาร" หรือ "shopee"...'
                className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {searchQuery.trim() && (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-indigo-900 dark:text-indigo-200 font-bold">
                    ผลลัพธ์คำค้น "{searchQuery}":
                  </span>{' '}
                  <span className="text-indigo-700 dark:text-indigo-300">
                    พบทั้งหมด {globalSearchResults.length} รายการ
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono-num font-bold">
                  {globalSearchTotalSpent > 0 && (
                    <span className="text-rose-600 dark:text-rose-400">
                      รวมรายจ่าย {formatMoney(globalSearchTotalSpent)}
                    </span>
                  )}
                  {globalSearchTotalIncome > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      รวมรายรับ {formatMoney(globalSearchTotalIncome)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              {globalSearchResults.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {globalSearchResults.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-xl"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tx.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                          <span>{tx.category}</span>
                          <span>·</span>
                          <span>{formatDisplayDate(tx.date)}</span>
                          {tx.note && (
                            <>
                              <span>·</span>
                              <span className="italic text-slate-400">"{tx.note}"</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-extrabold font-mono-num ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '−'}
                          {formatMoney(tx.amount)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRequestDeleteTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  ไม่พบรายการที่ตรงกับคำค้นหา
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
