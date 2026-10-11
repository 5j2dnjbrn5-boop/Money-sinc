import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowRightLeft,
  X,
  CreditCard,
  Building,
  Smartphone,
  Banknote,
  Edit2,
} from 'lucide-react';
import { Wallet, Transaction, WalletType } from '../types';
import { formatMoney, formatDisplayDate } from '../constants';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  onAddWallet: (wallet: Wallet) => void;
  onEditWallet: (wallet: Wallet) => void;
  onTransfer: (fromWalletId: string, toWalletId: string, amount: number, note?: string) => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  transactions,
  onAddWallet,
  onEditWallet,
  onTransfer,
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || 'cash');

  // Modal states
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('bank');
  const [initialBalance, setInitialBalance] = useState('');

  // Transfer Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || 'cash');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || 'bank');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const calculateWalletBalance = (w: Wallet) => {
    const wTxs = transactions.filter(t => t.walletId === w.id);
    const inc = wTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = wTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return w.initialBalance + (inc - exp);
  };

  const selectedWallet = wallets.find(w => w.id === selectedWalletId) || wallets[0];
  const selectedWalletTransactions = transactions
    .filter(t => t.walletId === selectedWallet?.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const openAddWalletModal = () => {
    setEditingWallet(null);
    setWalletName('');
    setWalletType('bank');
    setInitialBalance('0');
    setIsWalletModalOpen(true);
  };

  const openEditWalletModal = (w: Wallet) => {
    setEditingWallet(w);
    setWalletName(w.name);
    setWalletType(w.type);
    setInitialBalance(w.initialBalance.toString());
    setIsWalletModalOpen(true);
  };

  const handleWalletFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;

    const wData: Wallet = {
      id: editingWallet ? editingWallet.id : crypto.randomUUID(),
      name: walletName.trim(),
      type: walletType,
      initialBalance: parseFloat(initialBalance) || 0,
      color: editingWallet?.color || '#3b82f6',
    };

    if (editingWallet) {
      onEditWallet(wData);
    } else {
      onAddWallet(wData);
    }
    setIsWalletModalOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (fromWalletId === toWalletId) return;

    onTransfer(fromWalletId, toWalletId, amt, transferNote.trim() || undefined);
    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferNote('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            ระบบจัดการแหล่งเงิน
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>💳 บัญชี & กระเป๋าเงิน (Wallets)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            แยกบันทึกเงินสด ธนาคาร บัตรเครดิต และ e-Wallet พร้อมโอนย้ายเงินระหว่างบัญชี
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
            <span>โอนเงินระหว่างบัญชี</span>
          </button>
          <button
            onClick={openAddWalletModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มบัญชี</span>
          </button>
        </div>
      </div>

      {/* Wallets Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map((w) => {
          const balance = calculateWalletBalance(w);
          const isSelected = selectedWalletId === w.id;

          return (
            <button
              key={w.id}
              onClick={() => setSelectedWalletId(w.id)}
              className={`p-5 rounded-3xl text-left transition-all border ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-900 shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {w.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditWalletModal(w);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                  title="แก้ไขบัญชี"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xl font-extrabold font-mono-num text-slate-900 dark:text-white">
                {formatMoney(balance)}
              </div>

              <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
                <span>ยอดตั้งต้น</span>
                <span className="font-mono-num">{formatMoney(w.initialBalance)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Wallet History List */}
      {selectedWallet && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                รายการเคลื่อนไหวของ {selectedWallet.name}
              </h2>
              <p className="text-xs text-slate-500">
                พบ {selectedWalletTransactions.length} รายการในบัญชีนี้
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">คงเหลือปัจจุบัน</span>
              <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                {formatMoney(calculateWalletBalance(selectedWallet))}
              </div>
            </div>
          </div>

          {selectedWalletTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedWalletTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {tx.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {tx.category} · {formatDisplayDate(tx.date)} {tx.note ? `· ${tx.note}` : ''}
                    </div>
                  </div>

                  <div
                    className={`font-mono-num font-bold text-sm ${
                      tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '−'}
                    {formatMoney(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              ยังไม่มีรายการเคลื่อนไหวในบัญชีนี้
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingWallet ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีใหม่'}
              </h2>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalletFormSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  required
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="เช่น บัญชีเงินเดือน กสิกร, บัตร KTC, TrueMoney"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ประเภทย่อย
                </label>
                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="bank">🏦 ธนาคาร</option>
                  <option value="cash">💵 เงินสด</option>
                  <option value="credit">💳 บัตรเครดิต</option>
                  <option value="ewallet">📱 e-Wallet</option>
                  <option value="investment">📈 พอร์ตลงทุน</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ยอดยกมาเริ่มต้น (฿)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Between Wallets Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                <span>โอนเงินระหว่างบัญชี</span>
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    จากบัญชี (ต้นทาง)
                  </label>
                  <select
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ไปยังบัญชี (ปลายทาง)
                  </label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  จำนวนเงินที่โอน (฿)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  บันทึกโน้ต (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="เช่น กดเงินสดจากตู้, โอนเข้า e-Wallet"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  ยืนยันการโอน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
