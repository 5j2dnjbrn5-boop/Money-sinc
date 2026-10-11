import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Lightbulb,
  ArrowRight,
  BarChart2,
  PieChart as PieIcon,
} from 'lucide-react';
import { Transaction, AnalyticsSubTab } from '../types';
import {
  formatMoney,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
} from '../constants';

interface AnalyticsViewProps {
  transactions: Transaction[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions }) => {
  const [subTab, setSubTab] = useState<AnalyticsSubTab>('annual');

  const currentYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    set.add(currentYear - 1);
    transactions.forEach(t => {
      const y = parseInt(t.date.slice(0, 4), 10);
      if (!isNaN(y)) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Selected year for annual analytics
  const [analysisYear, setAnalysisYear] = useState<number>(currentYear);

  // Compare years: Year A vs Year B
  const [compareYearA, setCompareYearA] = useState<number>(
    availableYears[1] || currentYear - 1
  );
  const [compareYearB, setCompareYearB] = useState<number>(
    availableYears[0] || currentYear
  );

  // --- ANNUAL DATA FOR analysisYear ---
  const annualMonthlyData = useMemo(() => {
    return THAI_MONTHS_SHORT.map((shortName, idx) => {
      const mKey = `${analysisYear}-${String(idx + 1).padStart(2, '0')}`;
      const mTxs = transactions.filter(t => t.date.slice(0, 7) === mKey);
      const inc = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        month: shortName,
        income: inc,
        expense: exp,
        net: inc - exp,
      };
    });
  }, [transactions, analysisYear]);

  const maxValInYear = useMemo(() => {
    let max = 1;
    annualMonthlyData.forEach(d => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max;
  }, [annualMonthlyData]);

  const annualStats = useMemo(() => {
    const yearTxs = transactions.filter(t => parseInt(t.date.slice(0, 4), 10) === analysisYear);
    const inc = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = inc - exp;
    const avgMonthlyExpense = exp / 12;

    const catMap: Record<string, number> = {};
    yearTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    return {
      income: inc,
      expense: exp,
      net,
      avgMonthlyExpense,
      topCategory: topCats[0] || null,
      topCategoriesList: topCats.slice(0, 6),
    };
  }, [transactions, analysisYear]);

  // --- COMPARISON CALCULATIONS (Year A vs Year B) ---
  const getYearSummary = (y: number) => {
    const yearTxs = transactions.filter(t => parseInt(t.date.slice(0, 4), 10) === y);
    const inc = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = inc - exp;
    const avgExp = exp / 12;

    const catMap: Record<string, number> = {};
    yearTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    return {
      year: y,
      income: inc,
      expense: exp,
      net,
      avgMonthlyExpense: avgExp,
      topCategory: sortedCats[0] || null,
      categories: catMap,
    };
  };

  const summaryA = useMemo(() => getYearSummary(compareYearA), [transactions, compareYearA]);
  const summaryB = useMemo(() => getYearSummary(compareYearB), [transactions, compareYearB]);

  // Comparison % diffs (B vs A)
  const incomeDiffPct = summaryA.income > 0 ? ((summaryB.income - summaryA.income) / summaryA.income) * 100 : null;
  const expenseDiffPct = summaryA.expense > 0 ? ((summaryB.expense - summaryA.expense) / summaryA.expense) * 100 : null;
  const netDiffPct = summaryA.net !== 0 ? ((summaryB.net - summaryA.net) / Math.abs(summaryA.net)) * 100 : null;

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header & SubTabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            ระบบวิเคราะห์การเงินขั้นสูง
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            📊 วิเคราะห์รายปี & เปรียบเทียบ
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setSubTab('annual')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              subTab === 'annual'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            วิเคราะห์รายปี
          </button>
          <button
            onClick={() => setSubTab('compare')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              subTab === 'compare'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            เปรียบเทียบปี (Compare)
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. ANNUAL ANALYTICS (Requirement 6) */}
      {/* ---------------------------------------------------- */}
      {subTab === 'annual' && (
        <div className="space-y-6">
          {/* Year selector */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">ปีที่วิเคราะห์:</span>
              <select
                value={analysisYear}
                onChange={(e) => setAnalysisYear(parseInt(e.target.value, 10))}
                className="px-4 py-1.5 text-sm font-extrabold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono-num font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> รายรับรวม {formatMoney(annualStats.income)}
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> รายจ่ายรวม {formatMoney(annualStats.expense)}
              </span>
            </div>
          </div>

          {/* Monthly Comparison Bar Chart for the Year */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                แนวโน้มรายรับ vs รายจ่าย แต่ละเดือน (ปี {analysisYear})
              </h2>
              <p className="text-xs text-slate-500">
                เปรียบเทียบสัดส่วนการเงินทั้ง 12 เดือน
              </p>
            </div>

            {/* Custom high-performance responsive bar chart */}
            <div className="h-64 flex items-end gap-2 pt-8 pb-2 border-b border-slate-200 dark:border-slate-800">
              {annualMonthlyData.map((d) => {
                const incHeightPct = (d.income / maxValInYear) * 100;
                const expHeightPct = (d.expense / maxValInYear) * 100;

                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Income Bar */}
                      <div
                        className="w-1/2 max-w-[14px] bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400"
                        style={{ height: `${Math.max(incHeightPct, 2)}%` }}
                        title={`${d.month}: รายรับ ${formatMoney(d.income)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1/2 max-w-[14px] bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:bg-rose-400"
                        style={{ height: `${Math.max(expHeightPct, 2)}%` }}
                        title={`${d.month}: รายจ่าย ${formatMoney(d.expense)}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 mt-2">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span>รายรับ (Income)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500" />
                <span>รายจ่าย (Expense)</span>
              </span>
            </div>
          </div>

          {/* Annual Insights & Top Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                หมวดหมู่ใช้จ่ายสูงสุด ประจำปี {analysisYear}
              </h2>

              {annualStats.topCategoriesList.length > 0 ? (
                <div className="space-y-3">
                  {annualStats.topCategoriesList.map(([cat, amt]) => {
                    const pct = annualStats.expense > 0 ? (amt / annualStats.expense) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {cat}
                          </span>
                          <span className="font-bold font-mono-num text-slate-900 dark:text-white">
                            {formatMoney(amt)} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-500 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  ไม่มีข้อมูลรายจ่ายในปี {analysisYear}
                </div>
              )}
            </div>

            {/* Smart Summary Breakdown */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>สรุปบทวิเคราะห์ประจำปี {analysisYear}</span>
              </h2>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">
                    ค่าใช้จ่ายเฉลี่ยต่อเดือน:
                  </span>{' '}
                  <span className="font-mono-num font-bold text-rose-600 dark:text-rose-400">
                    {formatMoney(annualStats.avgMonthlyExpense)}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    คำนวณจากรายจ่ายสะสมตลอด 12 เดือน
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">
                    อัตราเงินออมสะสมทั้งปี:
                  </span>{' '}
                  <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                    {annualStats.income > 0
                      ? `${Math.max(0, Math.round((annualStats.net / annualStats.income) * 100))}%`
                      : '0%'}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    เก็บออมได้สุทธิ {formatMoney(annualStats.net)} จากรายรับทั้งหมด
                  </p>
                </div>

                {annualStats.topCategory && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white">
                      หมวดที่มีภาระค่าใช้จ่ายหนักที่สุด:
                    </span>{' '}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {annualStats.topCategory[0]}
                    </span>{' '}
                    ยอดรวม {formatMoney(annualStats.topCategory[1])}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. COMPARE YEARS (Requirement 7) */}
      {/* ---------------------------------------------------- */}
      {subTab === 'compare' && (
        <div className="space-y-6">
          {/* Compare Year Selectors: [Year A] VS [Year B] */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  เปรียบเทียบสถิติระหว่างปี
                </h2>
                <p className="text-xs text-slate-500">
                  เลือก 2 ปีที่ต้องการเปรียบเทียบพัฒนาการทางการเงิน
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">เปรียบเทียบ:</span>
                  <select
                    value={compareYearA}
                    onChange={(e) => setCompareYearA(parseInt(e.target.value, 10))}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>
                        ปี {y}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-bold text-indigo-500">VS</span>

                <div className="flex items-center gap-2">
                  <select
                    value={compareYearB}
                    onChange={(e) => setCompareYearB(parseInt(e.target.value, 10))}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>
                        ปี {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Human-Readable Insights Callout (Requirement 7 & 15) */}
          <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
              <span>บทสรุปการเปรียบเทียบ {compareYearA} vs {compareYearB}</span>
            </div>
            <div className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed space-y-1">
              {expenseDiffPct !== null ? (
                <p>
                  • ในปี {compareYearB} คุณมีรายจ่ายรวม{' '}
                  <strong className="font-bold">
                    {expenseDiffPct > 0 ? `มากกว่าปี ${compareYearA} ประมาณ ${expenseDiffPct.toFixed(1)}%` : `ประหยัดกว่าปี ${compareYearA} ประมาณ ${Math.abs(expenseDiffPct).toFixed(1)}%`}
                  </strong>
                </p>
              ) : null}

              {incomeDiffPct !== null ? (
                <p>
                  • รายรับในปี {compareYearB}{' '}
                  <strong className="font-bold">
                    {incomeDiffPct >= 0 ? `เติบโตขึ้น +${incomeDiffPct.toFixed(1)}%` : `ลดลง ${Math.abs(incomeDiffPct).toFixed(1)}%`}
                  </strong>{' '}
                  เทียบกับปี {compareYearA}
                </p>
              ) : null}

              {summaryB.topCategory && summaryA.categories[summaryB.topCategory[0]] ? (
                (() => {
                  const oldCatVal = summaryA.categories[summaryB.topCategory[0]];
                  const newCatVal = summaryB.topCategory[1];
                  const catDiff = ((newCatVal - oldCatVal) / oldCatVal) * 100;
                  return (
                    <p>
                      • ค่าใช้จ่ายในหมวด "{summaryB.topCategory[0]}" {catDiff >= 0 ? `เพิ่มขึ้น +${catDiff.toFixed(1)}%` : `ลดลง ${Math.abs(catDiff).toFixed(1)}%`}
                    </p>
                  );
                })()
              ) : null}
            </div>
          </div>

          {/* Comparison Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Year A Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  ปี {summaryA.year}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  ปีอ้างอิง
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">รายรับทั้งปี</span>
                  <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">
                    {formatMoney(summaryA.income)}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">รายจ่ายทั้งปี</span>
                  <strong className="font-mono-num text-rose-600 dark:text-rose-400">
                    {formatMoney(summaryA.expense)}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-100 dark:border-slate-800 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">เงินสุทธิคงเหลือ</span>
                  <strong className="font-mono-num text-slate-900 dark:text-white">
                    {formatMoney(summaryA.net)}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">เฉลี่ยต่อเดือน</span>
                  <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                    {formatMoney(summaryA.avgMonthlyExpense)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">หมวดที่ใช้มากที่สุด</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {summaryA.topCategory ? `${summaryA.topCategory[0]} (${formatMoney(summaryA.topCategory[1])})` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Year B Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  ปี {summaryB.year}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  ปีเปรียบเทียบ
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">รายรับทั้งปี</span>
                  <div className="flex items-center gap-2">
                    {incomeDiffPct !== null && (
                      <span className={`text-[10px] font-bold ${incomeDiffPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {incomeDiffPct >= 0 ? '+' : ''}{incomeDiffPct.toFixed(1)}%
                      </span>
                    )}
                    <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">
                      {formatMoney(summaryB.income)}
                    </strong>
                  </div>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">รายจ่ายทั้งปี</span>
                  <div className="flex items-center gap-2">
                    {expenseDiffPct !== null && (
                      <span className={`text-[10px] font-bold ${expenseDiffPct <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {expenseDiffPct >= 0 ? '+' : ''}{expenseDiffPct.toFixed(1)}%
                      </span>
                    )}
                    <strong className="font-mono-num text-rose-600 dark:text-rose-400">
                      {formatMoney(summaryB.expense)}
                    </strong>
                  </div>
                </div>

                <div className="flex justify-between py-1 border-t border-slate-100 dark:border-slate-800 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">เงินสุทธิคงเหลือ</span>
                  <strong className="font-mono-num text-slate-900 dark:text-white">
                    {formatMoney(summaryB.net)}
                  </strong>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">เฉลี่ยต่อเดือน</span>
                  <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                    {formatMoney(summaryB.avgMonthlyExpense)}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">หมวดที่ใช้มากที่สุด</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {summaryB.topCategory ? `${summaryB.topCategory[0]} (${formatMoney(summaryB.topCategory[1])})` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
