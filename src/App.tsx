import React, { useState, useEffect, useCallback } from 'react';
import {
  MoneySyncDataV2,
  Transaction,
  Wallet,
  BudgetSetting,
  FinancialGoal,
  RecurringRule,
  ActiveTab,
  HistorySubTab,
} from './types';
import { STORAGE_KEYS, formatMoney } from './constants';
import { loadData, saveData } from './services/storage';
import { processDueRecurringTransactions } from './services/recurring';
import { parseQuickTransaction } from './services/smartParser';

// Components
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetView } from './components/BudgetView';
import { GoalsView } from './components/GoalsView';
import { WalletsView } from './components/WalletsView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  // Primary State
  const [data, setData] = useState<MoneySyncDataV2>(() => loadData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [historySubTab, setHistorySubTab] = useState<HistorySubTab>('year');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals & Forms State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  // Deletion & Undo State
  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(null);

  // Reset Confirmation State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Snapshot Viewer State
  const [snapshotData, setSnapshotData] = useState<{
    createdAt: string;
    range: string;
    transactions: Transaction[];
  } | null>(null);

  // Detect snapshot in hash
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const b64 = hash.startsWith('snapshot=') ? hash.replace('snapshot=', '') : hash;
      if (!b64 || b64.length < 10) return;

      try {
        let s = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        const bin = atob(s);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        const json = JSON.parse(new TextDecoder().decode(bytes));
        if (json && Array.isArray(json.transactions)) {
          setSnapshotData({
            createdAt: json.createdAt || new Date().toISOString(),
            range: json.range || 'all',
            transactions: json.transactions,
          });
        }
      } catch (err) {
        console.error('Failed to parse snapshot hash:', err);
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // Sync theme to <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Toast Helper
  const addToast = useCallback((
    text: string,
    type: 'success' | 'error' | 'info' = 'success',
    undoAction?: () => void,
    undoLabel?: string
  ) => {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { id, text, type, undoAction, undoLabel };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // State update wrapper with automatic local storage persistence
  const updateDataState = useCallback((updater: (prev: MoneySyncDataV2) => MoneySyncDataV2) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  // Process recurring transactions check on mount
  useEffect(() => {
    try {
      const { newTransactions, updatedRules } = processDueRecurringTransactions(
        data.recurring,
        data.transactions
      );

      if (newTransactions.length > 0) {
        updateDataState(prev => ({
          ...prev,
          transactions: [...newTransactions, ...prev.transactions],
          recurring: updatedRules,
        }));
        addToast(
          `ประมวลผลรายการประจำสำหรับเดือนนี้เรียบร้อย (${newTransactions.length} รายการ)`,
          'info'
        );
      }
    } catch (err) {
      console.error('Error running recurring schedule check:', err);
    }
  }, []); // Run once on startup

  // --- TRANSACTION OPERATIONS ---
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      // Edit existing
      updateDataState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t =>
          t.id === editingId
            ? {
                ...t,
                ...txData,
                updatedAt: Date.now(),
              }
            : t
        ),
      }));
      addToast('แก้ไขรายการเรียบร้อยแล้ว ✓', 'success');
    } else {
      // Add new
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        ...txData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updateDataState(prev => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      addToast('บันทึกรายการแล้ว ✓', 'success');
    }
    setEditingTransaction(null);
  };

  const handleQuickAdd = (inputText: string) => {
    const parsed = parseQuickTransaction(inputText);
    if (!parsed) {
      // If parsing fails, open full modal with input text
      setEditingTransaction(null);
      setModalInitialDate(undefined);
      setIsAddModalOpen(true);
      return;
    }

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: parsed.type,
      amount: parsed.amount,
      title: parsed.title,
      category: parsed.category,
      walletId: parsed.walletId,
      date: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateDataState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    addToast(
      `บันทึก "${newTx.title}" จำนวน ${formatMoney(newTx.amount)} แล้ว ✓`,
      'success',
      () => {
        // Undo function
        updateDataState(prev => ({
          ...prev,
          transactions: prev.transactions.filter(t => t.id !== newTx.id),
        }));
        addToast('ยกเลิกรายการแล้ว', 'info');
      },
      'เลิกทำ'
    );
  };

  const handleRequestDelete = (tx: Transaction) => {
    setPendingDeleteTx(tx);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteTx) return;
    const deletedTx = pendingDeleteTx;

    updateDataState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== deletedTx.id),
    }));

    setPendingDeleteTx(null);

    // Provide Undo action with 5-second window
    addToast(
      `ลบรายการ "${deletedTx.title}" แล้ว`,
      'info',
      () => {
        updateDataState(prev => ({
          ...prev,
          transactions: [deletedTx, ...prev.transactions],
        }));
        addToast(`กู้คืน "${deletedTx.title}" เรียบร้อยแล้ว ✓`, 'success');
      },
      'เลิกทำ'
    );
  };

  const handleOpenAddModalWithDate = (dateStr: string) => {
    setEditingTransaction(null);
    setModalInitialDate(dateStr);
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalInitialDate(tx.date);
    setIsAddModalOpen(true);
  };

  // --- BUDGET OPERATIONS ---
  const handleSaveBudgets = (newBudgets: BudgetSetting) => {
    updateDataState(prev => ({
      ...prev,
      budgets: newBudgets,
    }));
    addToast('บันทึกการตั้งค่างบประมาณเรียบร้อยแล้ว ✓', 'success');
  };

  // --- GOAL OPERATIONS ---
  const handleSaveGoal = (goal: FinancialGoal) => {
    updateDataState(prev => {
      const exists = prev.goals.some(g => g.id === goal.id);
      return {
        ...prev,
        goals: exists
          ? prev.goals.map(g => (g.id === goal.id ? goal : g))
          : [...prev.goals, goal],
      };
    });
    addToast('บันทึกเป้าหมายการเงินแล้ว ✓', 'success');
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!window.confirm('คุณต้องการลบเป้าหมายการเงินนี้ใช่หรือไม่?')) return;
    updateDataState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== goalId),
    }));
    addToast('ลบเป้าหมายแล้ว', 'info');
  };

  const handleDepositGoal = (goalId: string, amount: number) => {
    updateDataState(prev => ({
      ...prev,
      goals: prev.goals.map(g =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    }));
    addToast(`บันทึกเงินออม ${formatMoney(amount)} เข้าเป้าหมายแล้ว ✓`, 'success');
  };

  // --- WALLET OPERATIONS ---
  const handleAddWallet = (wallet: Wallet) => {
    updateDataState(prev => ({
      ...prev,
      wallets: [...prev.wallets, wallet],
    }));
    addToast(`เพิ่มบัญชี "${wallet.name}" แล้ว ✓`, 'success');
  };

  const handleEditWallet = (wallet: Wallet) => {
    updateDataState(prev => ({
      ...prev,
      wallets: prev.wallets.map(w => (w.id === wallet.id ? wallet : w)),
    }));
    addToast('แก้ไขข้อมูลบัญชีเรียบร้อย ✓', 'success');
  };

  const handleTransfer = (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    note?: string
  ) => {
    const fromW = data.wallets.find(w => w.id === fromWalletId);
    const toW = data.wallets.find(w => w.id === toWalletId);
    const today = new Date().toISOString().slice(0, 10);

    const outTx: Transaction = {
      id: crypto.randomUUID(),
      type: 'expense',
      amount,
      title: `โอนออกไป ${toW?.name || 'บัญชีปลายทาง'}`,
      category: '🎁 อื่น ๆ',
      walletId: fromWalletId,
      date: today,
      note: note ? `[โอนเงิน] ${note}` : '[โอนเงิน]',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const inTx: Transaction = {
      id: crypto.randomUUID(),
      type: 'income',
      amount,
      title: `โอนเข้ามาจาก ${fromW?.name || 'บัญชีต้นทาง'}`,
      category: '💵 อื่น ๆ',
      walletId: toWalletId,
      date: today,
      note: note ? `[โอนเงิน] ${note}` : '[โอนเงิน]',
      createdAt: Date.now() + 1,
      updatedAt: Date.now() + 1,
    };

    updateDataState(prev => ({
      ...prev,
      transactions: [inTx, outTx, ...prev.transactions],
    }));

    addToast(`โอนเงิน ${formatMoney(amount)} เรียบร้อยแล้ว ✓`, 'success');
  };

  // --- RECURRING & SETTINGS OPERATIONS ---
  const handleSaveRecurringRule = (rule: RecurringRule) => {
    updateDataState(prev => ({
      ...prev,
      recurring: [...prev.recurring, rule],
    }));
  };

  const handleDeleteRecurringRule = (ruleId: string) => {
    updateDataState(prev => ({
      ...prev,
      recurring: prev.recurring.filter(r => r.id !== ruleId),
    }));
    addToast('ลบรายการประจำแล้ว', 'info');
  };

  const handleProcessRecurringNow = () => {
    const { newTransactions, updatedRules } = processDueRecurringTransactions(
      data.recurring,
      data.transactions
    );

    if (newTransactions.length > 0) {
      updateDataState(prev => ({
        ...prev,
        transactions: [...newTransactions, ...prev.transactions],
        recurring: updatedRules,
      }));
      addToast(
        `บันทึกรายการประจำเพิ่มสำเร็จ (${newTransactions.length} รายการ)`,
        'success'
      );
    } else {
      addToast('ไม่มีรายการประจำที่ยังไม่ได้ลงบัญชีในเดือนนี้', 'info');
    }
  };

  const handleAddCategory = (type: 'expense' | 'income', newCategory: string) => {
    if (!newCategory.trim()) return;
    updateDataState(prev => ({
      ...prev,
      customCategories: {
        ...prev.customCategories,
        [type]: [...prev.customCategories[type], newCategory.trim()],
      },
    }));
    addToast(`เพิ่มหมวดหมู่ "${newCategory}" แล้ว ✓`, 'success');
  };

  const handleImportData = (imported: MoneySyncDataV2, isMerge: boolean) => {
    if (isMerge) {
      updateDataState(prev => ({
        ...imported,
        transactions: [...imported.transactions, ...prev.transactions],
      }));
    } else {
      updateDataState(() => imported);
    }
  };

  const handleResetToEmpty = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    const emptyData: MoneySyncDataV2 = {
      version: 2,
      transactions: [],
      wallets: data.wallets,
      budgets: { monthlyOverall: 0, categoryBudgets: {} },
      goals: [],
      recurring: [],
      customCategories: data.customCategories,
    };
    updateDataState(() => emptyData);
    setIsResetConfirmOpen(false);
    addToast('ล้างข้อมูลเรียบร้อยแล้ว พร้อมเริ่มใช้งานใหม่', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'history') setHistorySubTab('year');
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setModalInitialDate(undefined);
          setIsAddModalOpen(true);
        }}
        onOpenSearch={() => {
          setActiveTab('history');
          setHistorySubTab('search');
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={data.transactions}
            wallets={data.wallets}
            budgets={data.budgets}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setModalInitialDate(undefined);
              setIsAddModalOpen(true);
            }}
            onQuickAdd={handleQuickAdd}
            onEditTransaction={handleEditTransaction}
            onRequestDeleteTransaction={handleRequestDelete}
            onNavigateToHistory={() => {
              setActiveTab('history');
              setHistorySubTab('year');
            }}
            onNavigateToAnalytics={() => setActiveTab('analytics')}
            onNavigateToBudget={() => setActiveTab('budget')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            transactions={data.transactions}
            wallets={data.wallets}
            categories={data.customCategories}
            initialSubTab={historySubTab}
            onEditTransaction={handleEditTransaction}
            onRequestDeleteTransaction={handleRequestDelete}
            onOpenAddModalWithDate={handleOpenAddModalWithDate}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView transactions={data.transactions} />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            transactions={data.transactions}
            budgets={data.budgets}
            categories={data.customCategories.expense}
            onSaveBudgets={handleSaveBudgets}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={data.goals}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
            onDepositGoal={handleDepositGoal}
          />
        )}

        {activeTab === 'wallets' && (
          <WalletsView
            wallets={data.wallets}
            transactions={data.transactions}
            onAddWallet={handleAddWallet}
            onEditWallet={handleEditWallet}
            onTransfer={handleTransfer}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            data={data}
            onImportData={handleImportData}
            onSaveRecurringRule={handleSaveRecurringRule}
            onDeleteRecurringRule={handleDeleteRecurringRule}
            onProcessRecurringNow={handleProcessRecurringNow}
            onAddCategory={handleAddCategory}
            onResetToEmpty={handleResetToEmpty}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (Ergonomic thumb zone) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'history') setHistorySubTab('year');
        }}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setModalInitialDate(undefined);
          setIsAddModalOpen(true);
        }}
      />

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
          setModalInitialDate(undefined);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        wallets={data.wallets}
        categories={data.customCategories}
        initialDate={modalInitialDate}
      />

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={pendingDeleteTx !== null}
        title="ยืนยันการลบรายการ"
        message={
          pendingDeleteTx
            ? `คุณต้องการลบรายการ "${pendingDeleteTx.title}" จำนวน ${formatMoney(pendingDeleteTx.amount)} ใช่หรือไม่? (สามารถกดเลิกทำได้หลังจากลบ)`
            : ''
        }
        confirmLabel="ลบรายการ"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteTx(null)}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="ยืนยันการล้างข้อมูลทั้งหมด"
        message="การดำเนินการนี้จะลบประวัติธุรกรรมทั้งหมดเพื่อเริ่มต้นใหม่ ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้ แนะนำให้ดาวน์โหลดไฟล์สำรองข้อมูล JSON ก่อนดำเนินการ"
        confirmLabel="ล้างข้อมูลและเริ่มต้นใหม่"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Snapshot Viewer Modal */}
      {snapshotData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Read-Only Snapshot
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  ข้อมูลที่แชร์ ({snapshotData.transactions.length} รายการ)
                </h2>
              </div>
              <button
                onClick={() => {
                  setSnapshotData(null);
                  window.location.hash = '';
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                ปิด
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {snapshotData.transactions.map((tx, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{tx.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {tx.category} · {tx.date} {tx.note ? `· ${tx.note}` : ''}
                    </div>
                  </div>
                  <span
                    className={`font-mono-num font-bold ${
                      tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '−'}
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                นำเข้าข้อมูลนี้เพื่อรวมเข้ากับบัญชีของคุณในเครื่องนี้
              </span>
              <button
                onClick={() => {
                  updateDataState(prev => ({
                    ...prev,
                    transactions: [
                      ...snapshotData.transactions.map(t => ({
                        ...t,
                        id: crypto.randomUUID(),
                        createdAt: Date.now(),
                      })),
                      ...prev.transactions,
                    ],
                  }));
                  setSnapshotData(null);
                  window.location.hash = '';
                  addToast(`นำเข้าข้อมูล Snapshot ${snapshotData.transactions.length} รายการแล้ว ✓`, 'success');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                📥 นำข้อมูลเข้าเครื่องนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
