import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  FileText,
  Check,
} from 'lucide-react';
import { Transaction, TransactionType, Wallet } from '../types';
import { parseQuickTransaction } from '../services/smartParser';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, editingId?: string) => void;
  editingTransaction?: Transaction | null;
  wallets: Wallet[];
  categories: {
    expense: string[];
    income: string[];
  };
  initialDate?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  wallets,
  categories,
  initialDate,
}) => {
  const [smartInput, setSmartInput] = useState('');
  const [smartPreview, setSmartPreview] = useState<ReturnType<typeof parseQuickTransaction>>(null);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [walletId, setWalletId] = useState('cash');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setTitle(editingTransaction.title);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setWalletId(editingTransaction.walletId || 'cash');
      setNote(editingTransaction.note || '');
      setSmartInput('');
      setSmartPreview(null);
    } else {
      const today = initialDate || new Date().toISOString().slice(0, 10);
      setType('expense');
      setAmount('');
      setTitle('');
      setCategory(categories.expense[0] || '🍚 อาหาร');
      setDate(today);
      setWalletId(wallets[0]?.id || 'cash');
      setNote('');
      setSmartInput('');
      setSmartPreview(null);
    }
  }, [editingTransaction, isOpen, initialDate, categories, wallets]);

  // Update default category when type switches
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories[newType];
    if (available && available.length && !available.includes(category)) {
      setCategory(available[0]);
    }
  };

  // Live parse natural language
  const handleSmartInputChange = (val: string) => {
    setSmartInput(val);
    const parsed = parseQuickTransaction(val);
    setSmartPreview(parsed);
  };

  const applySmartParse = () => {
    if (!smartPreview) return;
    setTitle(smartPreview.title);
    setAmount(smartPreview.amount.toString());
    setType(smartPreview.type);
    setCategory(smartPreview.category);
    if (wallets.some(w => w.id === smartPreview.walletId)) {
      setWalletId(smartPreview.walletId);
    }
    setSmartInput('');
    setSmartPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!title.trim()) return;

    onSave(
      {
        type,
        amount: numAmount,
        title: title.trim(),
        category: category || (type === 'expense' ? '🍚 อาหาร' : '💼 เงินเดือน/ค่าจ้าง'),
        date: date || new Date().toISOString().slice(0, 10),
        walletId: walletId || 'cash',
        note: note.trim() || undefined,
      },
      editingTransaction?.id
    );
    onClose();
  };

  if (!isOpen) return null;

  const currentCategoryList = type === 'expense' ? categories.expense : categories.income;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Personal OS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Smart Quick Input (Only shown when adding new) */}
          {!editingTransaction && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Smart Quick Add (พิมพ์เร็ว เช่น "ข้าว 60" หรือ "เงินเดือน 15000")</span>
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smartInput}
                  onChange={(e) => handleSmartInputChange(e.target.value)}
                  placeholder="เช่น กาแฟ 65 หรือ ค่าน้ำมัน 800 บัตร"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {smartPreview && (
                  <button
                    type="button"
                    onClick={applySmartParse}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
                  >
                    ใส่ในฟอร์ม
                  </button>
                )}
              </div>

              {smartPreview && (
                <div className="flex items-center flex-wrap gap-2 pt-1 text-[11px] text-indigo-700 dark:text-indigo-300">
                  <span>ตรวจพบ:</span>
                  <span className="font-bold">{smartPreview.title}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 font-mono-num font-semibold">
                    ฿{smartPreview.amount.toLocaleString()}
                  </span>
                  <span>({smartPreview.type === 'expense' ? 'รายจ่าย' : 'รายรับ'})</span>
                  <span>{smartPreview.category}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>รายจ่าย (Expense)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>รายรับ (Income)</span>
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                จำนวนเงิน (฿) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  ฿
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 text-lg font-bold font-mono-num rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ชื่อรายการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ข้าวมันไก่, เงินเดือน, ค่าไฟ"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category & Wallet Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>หมวดหมู่</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {currentCategoryList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <WalletIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>กระเป๋า / บัญชี</span>
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>วันที่</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>โน้ตเพิ่มเติม (ไม่บังคับ)</span>
              </label>
              <input
                type="text"
                maxLength={120}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม หรือเหตุการณ์"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{editingTransaction ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
