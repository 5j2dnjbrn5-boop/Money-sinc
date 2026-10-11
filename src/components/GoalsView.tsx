import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  TrendingUp,
  X,
  Edit2,
  Trash2,
  PiggyBank,
} from 'lucide-react';
import { FinancialGoal } from '../types';
import { formatMoney, formatDisplayDate } from '../constants';

interface GoalsViewProps {
  goals: FinancialGoal[];
  onSaveGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onDepositGoal: (goalId: string, amount: number) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onSaveGoal,
  onDeleteGoal,
  onDepositGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Quick Deposit State
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('2027-12-31');
    setIsModalOpen(true);
  };

  const openEditModal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tAmt = parseFloat(targetAmount);
    if (isNaN(tAmt) || tAmt <= 0) return;
    const cAmt = parseFloat(currentAmount) || 0;

    const newGoal: FinancialGoal = {
      id: editingGoal ? editingGoal.id : crypto.randomUUID(),
      title: title.trim(),
      targetAmount: tAmt,
      currentAmount: cAmt,
      deadline: deadline || '2027-12-31',
      createdAt: editingGoal ? editingGoal.createdAt : Date.now(),
      color: editingGoal?.color || '#3b82f6',
    };

    onSaveGoal(newGoal);
    setIsModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    onDepositGoal(depositGoalId, amt);
    setDepositGoalId(null);
    setDepositAmount('');
  };

  // Calculate required savings per month until deadline
  const calculateMonthlyTarget = (target: number, current: number, deadlineStr: string) => {
    const remaining = Math.max(0, target - current);
    if (remaining === 0) return 0;

    const today = new Date();
    const targetDate = new Date(deadlineStr);
    const monthsDiff = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    const validMonths = Math.max(1, monthsDiff);

    return Math.ceil(remaining / validMonths);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            วางแผนอนาคตระยะยาว
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>🎯 เป้าหมายการเงิน (Goals)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            คำนวณเงินออมที่ต้องเก็บต่อเดือนอัตโนมัติเพื่อบรรลุตามกำหนดเวลา
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างเป้าหมายใหม่</span>
        </button>
      </div>

      {/* Goals Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => {
          const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
          const monthlyReq = calculateMonthlyTarget(g.targetAmount, g.currentAmount, g.deadline);
          const isCompleted = g.currentAmount >= g.targetAmount;

          return (
            <div
              key={g.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {g.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>เป้าหมายภายใน {formatDisplayDate(g.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                      title="แก้ไขเป้าหมาย"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="ลบเป้าหมาย"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">ยอดเป้าหมาย</span>
                    <strong className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-white">
                      {formatMoney(g.targetAmount)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">เก็บสะสมแล้ว</span>
                    <strong className="text-sm font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400">
                      {formatMoney(g.currentAmount)}
                    </strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">ความคืบหน้า</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono-num">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom calculations & Deposit button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {isCompleted ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>สำเร็จเป้าหมายแล้ว! 🎉</span>
                  </span>
                ) : (
                  <div>
                    <span className="text-slate-400">ต้องเก็บประมาณ:</span>{' '}
                    <strong className="text-slate-900 dark:text-white font-mono-num">
                      {formatMoney(monthlyReq)} / เดือน
                    </strong>
                  </div>
                )}

                <button
                  onClick={() => {
                    setDepositGoalId(g.id);
                    setDepositAmount('');
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                >
                  + ฝากเงินออม
                </button>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            ยังไม่มีเป้าหมายทางการเงิน กดปุ่ม "สร้างเป้าหมายใหม่" เพื่อเริ่มต้น
          </div>
        )}
      </div>

      {/* Create / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGoal ? 'แก้ไขเป้าหมาย' : 'สร้างเป้าหมายใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ชื่อเป้าหมาย
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ซื้อรถยนต์, ดาวน์บ้าน, เที่ยวญี่ปุ่น"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  จำนวนเงินเป้าหมาย (฿)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  เงินที่มีเก็บอยู่แล้ว (฿)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  กำหนดเป้าหมาย (Deadline)
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  บันทึกเป้าหมาย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-indigo-500" />
                <span>ฝากเงินเก็บเข้าเป้าหมาย</span>
              </h3>
              <button
                onClick={() => setDepositGoalId(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  จำนวนเงินที่ต้องการฝากเพิ่ม (฿)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  autoFocus
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="เช่น 1000"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  ยืนยันการฝาก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
