import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet as WalletIcon,
  PiggyBank,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Edit2,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Transaction, Wallet, BudgetSetting } from '../types';
import {
  formatMoney,
  formatDisplayDate,
  getMonthKey,
  THAI_MONTHS,
} from '../constants';
import { parseQuickTransaction } from '../services/smartParser';

interface DashboardViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: BudgetSetting;
  onOpenAddModal: () => void;
  onQuickAdd: (input: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onRequestDeleteTransaction: (tx: Transaction) => void;
  onNavigateToHistory: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToBudget: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  wallets,
  budgets,
  onOpenAddModal,
  onQuickAdd,
  onEditTransaction,
  onRequestDeleteTransaction,
  onNavigateToHistory,
  onNavigateToAnalytics,
  onNavigateToBudget,
}) => {
  const [quickInputText, setQuickInputText] = useState('');

  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const prevMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentMonthName = THAI_MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  // Current Month Data
  const currentMonthTxs = transactions.filter(t => t.date.slice(0, 7) === currentMonthKey);
  const currentIncome = currentMonthTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentNet = currentIncome - currentExpense;

  // Previous Month Data for Insights
  const prevMonthTxs = transactions.filter(t => t.date.slice(0, 7) === prevMonthKey);
  const prevExpense = prevMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // All-time Net Worth across Wallets
  const totalNetWorth = wallets.reduce((acc, wallet) => {
    const walletTxs = transactions.filter(t => t.walletId === wallet.id);
    const inc = walletTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = walletTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return acc + wallet.initialBalance + (inc - exp);
  }, 0);

  // Saving Rate
  const savingRate = currentIncome > 0 ? Math.max(0, Math.round((currentNet / currentIncome) * 100)) : 0;

  // Daily Average Spend for Current Month
  const daysInCurrentMonthPassed = Math.max(1, now.getDate());
  const dailyAverageSpend = currentExpense / daysInCurrentMonthPassed;

  // Expense change %
  const expenseChangePct = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : null;

  // Category breakdown for current month
  const categoryMap: Record<string, number> = {};
  currentMonthTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];

  // Budget remaining
  const monthlyBudgetLimit = budgets.monthlyOverall || 0;
  const budgetRemaining = monthlyBudgetLimit > 0 ? monthlyBudgetLimit - currentExpense : 0;
  const budgetPct = monthlyBudgetLimit > 0 ? Math.min(100, Math.round((currentExpense / monthlyBudgetLimit) * 100)) : 0;

  // Recent transactions (latest 8)
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 8);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInputText.trim()) return;
    onQuickAdd(quickInputText);
    setQuickInputText('');
  };

  const parsedPreview = quickInputText.trim() ? parseQuickTransaction(quickInputText) : null;

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Top Welcome & Month Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            สถานะการเงินประจำ {currentMonthName} {currentYear}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ภาพรวมการเงิน
          </h1>
        </div>

        <button
          onClick={onOpenAddModal}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ บันทึกรายการใหม่</span>
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="p-5 rounded-3xl bg-slate-900 text-white dark:bg-slate-800/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>ยอดสินทรัพย์สุทธิรวม</span>
            <WalletIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono-num tracking-tight">
            {formatMoney(totalNetWorth)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-2.5">
            <span>สุทธิเดือนนี้</span>
            <span
              className={`font-semibold font-mono-num ${
                currentNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentNet >= 0 ? '+' : ''}
              {formatMoney(currentNet)}
            </span>
          </div>
        </div>

        {/* Income this month */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>รายรับเดือนนี้</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatMoney(currentIncome)}
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between">
            <span>อัตราการออม</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono-num">
              {savingRate}%
            </span>
          </div>
        </div>

        {/* Expense this month */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>รายจ่ายเดือนนี้</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono-num text-rose-600 dark:text-rose-400 tracking-tight">
            {formatMoney(currentExpense)}
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between">
            <span>เฉลี่ยต่อวัน</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono-num">
              {formatMoney(dailyAverageSpend)}
            </span>
          </div>
        </div>

        {/* Budget Remaining */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>งบประมาณเดือนนี้</span>
            <button
              onClick={onNavigateToBudget}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>ตั้งค่า</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="text-2xl font-extrabold font-mono-num text-slate-900 dark:text-white tracking-tight">
            {monthlyBudgetLimit > 0 ? formatMoney(budgetRemaining) : 'ยังไม่ตั้งงบ'}
          </div>

          <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-1.5">
            {monthlyBudgetLimit > 0 ? (
              <>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>ใช้ไปแล้ว {budgetPct}%</span>
                  <span>{currentExpense > monthlyBudgetLimit ? '⚠️ เกินงบ' : 'ปกติ'}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      budgetPct >= 100
                        ? 'bg-rose-500'
                        : budgetPct >= 80
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, budgetPct)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-400">
                กด "ตั้งค่า" เพื่อกำหนดเพดานใช้จ่ายประจำเดือน
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Smart Quick Add Bar right on Dashboard */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickInputText}
              onChange={(e) => setQuickInputText(e.target.value)}
              placeholder='พิมพ์บันทึกเร็ว เช่น "ข้าวกะเพรา 60" หรือ "เงินเดือน 45000 ธนาคาร" หรือ "ค่าน้ำมัน 700 บัตร"'
              className="w-full pl-3.5 pr-20 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {parsedPreview && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 pointer-events-none">
                {parsedPreview.type === 'expense' ? 'รายจ่าย' : 'รายรับ'} ฿{parsedPreview.amount.toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors whitespace-nowrap self-stretch sm:self-auto"
          >
            + บันทึกทันที
          </button>
        </form>
      </div>

      {/* Financial Insights Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                MoneySync Insight ประจำเดือน
              </h2>
              <span className="text-[10px] font-semibold text-slate-500">
                วิเคราะห์อัตโนมัติ
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {expenseChangePct !== null ? (
                <>
                  เดือนนี้คุณใช้เงิน{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {formatMoney(currentExpense)}
                  </strong>
                  {expenseChangePct > 0 ? (
                    <span className="text-rose-500 font-bold ml-1">
                      (เพิ่มขึ้น {expenseChangePct.toFixed(1)}% จากเดือนก่อน)
                    </span>
                  ) : expenseChangePct < 0 ? (
                    <span className="text-emerald-500 font-bold ml-1">
                      (ลดลง {Math.abs(expenseChangePct).toFixed(1)}% จากเดือนก่อน)
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold ml-1">
                      (เท่ากับเดือนก่อน)
                    </span>
                  )}
                  {topCategory && (
                    <span className="ml-1">
                      หมวดที่ใช้มากที่สุดคือ{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {topCategory[0]} ({formatMoney(topCategory[1])})
                      </strong>
                    </span>
                  )}
                </>
              ) : (
                <>
                  เดือนนี้บันทึกรายรับ {formatMoney(currentIncome)} และรายจ่าย{' '}
                  {formatMoney(currentExpense)} มีเงินเหลือสุทธิ {formatMoney(currentNet)}
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToAnalytics}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 shrink-0"
        >
          <span>ดูบทวิเคราะห์เต็ม</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Wallets Strip & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallets Summary Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <WalletIcon className="w-4 h-4 text-indigo-500" />
              <span>แหล่งเงิน / บัญชี</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono-num">{wallets.length} บัญชี</span>
          </div>

          <div className="space-y-2.5">
            {wallets.map((wallet) => {
              const walletTxs = transactions.filter(t => t.walletId === wallet.id);
              const inc = walletTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const exp = walletTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
              const bal = wallet.initialBalance + (inc - exp);

              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: wallet.color || '#6366f1' }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {wallet.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono-num text-slate-900 dark:text-white">
                    {formatMoney(bal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown (Top Expenses this month) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              หมวดหมู่รายจ่ายเดือนนี้ ({currentMonthName})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              รวม {formatMoney(currentExpense)}
            </span>
          </div>

          {sortedCategories.length > 0 ? (
            <div className="space-y-3">
              {sortedCategories.slice(0, 5).map(([catName, catAmount]) => {
                const pct = currentExpense > 0 ? (catAmount / currentExpense) * 100 : 0;
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {catName}
                      </span>
                      <div className="flex items-center gap-2 font-mono-num">
                        <span className="text-slate-500">{pct.toFixed(1)}%</span>
                        <strong className="text-slate-900 dark:text-white">
                          {formatMoney(catAmount)}
                        </strong>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              ยังไม่มีบันทึกรายจ่ายในเดือนนี้
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Panel */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              รายการล่าสุด
            </h2>
            <p className="text-xs text-slate-500">
              บันทึกเข้าสู่ระบบ จัดการแก้ไขหรือลบได้ทันที
            </p>
          </div>

          <button
            onClick={onNavigateToHistory}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <span>ดูประวัติทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentTransactions.map((tx) => {
              const walletObj = wallets.find(w => w.id === tx.walletId);
              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-xl"
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
            ยังไม่มีรายการธุรกรรมในระบบ
          </div>
        )}
      </div>
    </div>
  );
};
