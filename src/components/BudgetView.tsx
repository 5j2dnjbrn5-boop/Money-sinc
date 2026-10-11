import React, { useState } from 'react';
import {
  PieChart,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Plus,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Transaction, BudgetSetting } from '../types';
import {
  formatMoney,
  getMonthKey,
  THAI_MONTHS,
} from '../constants';

interface BudgetViewProps {
  transactions: Transaction[];
  budgets: BudgetSetting;
  categories: string[];
  onSaveBudgets: (newBudgets: BudgetSetting) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  transactions,
  budgets,
  categories,
  onSaveBudgets,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyOverall, setMonthlyOverall] = useState(budgets.monthlyOverall || 0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    budgets.categoryBudgets || {}
  );

  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const currentMonthName = THAI_MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  // Current month expenses
  const currentMonthExpenses = transactions.filter(
    t => t.date.slice(0, 7) === currentMonthKey && t.type === 'expense'
  );

  const totalSpentThisMonth = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Category spending this month
  const categorySpentMap: Record<string, number> = {};
  currentMonthExpenses.forEach(t => {
    categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + t.amount;
  });

  const overallBudget = budgets.monthlyOverall || 0;
  const overallSpent = totalSpentThisMonth;
  const overallRemaining = Math.max(0, overallBudget - overallSpent);
  const overallPct = overallBudget > 0 ? (overallSpent / overallBudget) * 100 : 0;

  const handleSave = () => {
    onSaveBudgets({
      monthlyOverall: Number(monthlyOverall) || 0,
      categoryBudgets,
    });
    setIsEditing(false);
  };

  const handleCategoryBudgetChange = (cat: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCategoryBudgets(prev => ({
      ...prev,
      [cat]: num,
    }));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            วางแผนควบคุมการใช้จ่าย
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>💰 ระบบงบประมาณ (Budget)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ประจำเดือน {currentMonthName} {currentYear}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกงบประมาณ</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMonthlyOverall(budgets.monthlyOverall || 0);
                setCategoryBudgets(budgets.categoryBudgets || {});
                setIsEditing(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
            >
              แก้ไขงบประมาณ
            </button>
          )}
        </div>
      </div>

      {/* Monthly Total Budget Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              งบประมาณรวมประจำเดือน
            </h2>
            <p className="text-xs text-slate-500">
              เพดานรายจ่ายสูงสุดที่ไม่ต้องการให้เกินในเดือนนี้
            </p>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">฿</span>
              <input
                type="number"
                value={monthlyOverall || ''}
                onChange={(e) => setMonthlyOverall(parseFloat(e.target.value) || 0)}
                placeholder="ระบุงบรวม เช่น 20000"
                className="px-3 py-1.5 text-sm font-bold font-mono-num rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white w-40"
              />
            </div>
          ) : (
            <div className="text-right">
              <div className="text-2xl font-extrabold font-mono-num text-slate-900 dark:text-white">
                {overallBudget > 0 ? formatMoney(overallBudget) : 'ยังไม่ระบุ'}
              </div>
              <span className="text-xs text-slate-500">
                เหลือ {formatMoney(overallRemaining)}
              </span>
            </div>
          )}
        </div>

        {overallBudget > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ใช้ไปแล้ว {formatMoney(overallSpent)} ({overallPct.toFixed(1)}%)
              </span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  overallPct >= 100
                    ? 'text-rose-500'
                    : overallPct >= 80
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`}
              >
                {overallPct >= 100 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>⚠️ เกินงบรวมแล้ว</span>
                  </>
                ) : overallPct >= 80 ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>🟡 ใกล้เต็มงบแล้ว ({overallPct.toFixed(0)}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>🟢 อยู่ในเกณฑ์ดี</span>
                  </>
                )}
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overallPct >= 100
                    ? 'bg-rose-500'
                    : overallPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, overallPct)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Budgets Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            งบประมาณแยกตามหมวดหมู่ (Category Budgets)
          </h2>
          <p className="text-xs text-slate-500">
            จำกัดงบสำหรับแต่ละประเภทเพื่อคุมวินัยทางการเงิน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const budgetVal = isEditing
              ? categoryBudgets[cat] || 0
              : budgets.categoryBudgets?.[cat] || 0;
            const spentVal = categorySpentMap[cat] || 0;
            const pct = budgetVal > 0 ? (spentVal / budgetVal) * 100 : 0;
            const remaining = budgetVal - spentVal;

            return (
              <div
                key={cat}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cat}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">฿</span>
                      <input
                        type="number"
                        value={categoryBudgets[cat] ?? ''}
                        onChange={(e) => handleCategoryBudgetChange(cat, e.target.value)}
                        placeholder="0"
                        className="px-2.5 py-1 text-xs font-bold font-mono-num rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-28 text-slate-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono-num text-slate-900 dark:text-white">
                        {budgetVal > 0 ? formatMoney(budgetVal) : 'ไม่ได้ตั้งงบ'}
                      </span>
                    </div>
                  )}
                </div>

                {budgetVal > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>ใช้ไปแล้ว {formatMoney(spentVal)}</span>
                      <span
                        className={`font-semibold ${
                          pct >= 100
                            ? 'text-rose-500'
                            : pct >= 80
                            ? 'text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        {pct >= 100
                          ? `⚠️ เกินงบ (${(pct - 100).toFixed(0)}%)`
                          : pct >= 80
                          ? `🟡 ใช้งบไปแล้ว ${pct.toFixed(0)}%`
                          : `เหลือ ${formatMoney(remaining)}`}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 100
                            ? 'bg-rose-500'
                            : pct >= 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
