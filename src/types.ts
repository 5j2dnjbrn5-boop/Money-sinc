export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  walletId: string;
  createdAt: number;
  updatedAt?: number;
  recurringId?: string;
}

export type WalletType = 'cash' | 'bank' | 'credit' | 'ewallet' | 'investment';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  color?: string;
  icon?: string;
}

export interface BudgetSetting {
  monthlyOverall: number;
  categoryBudgets: Record<string, number>;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  color?: string;
  icon?: string;
  notes?: string;
  createdAt: number;
}

export interface RecurringRule {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  category: string;
  walletId: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth: number; // 1-31
  note?: string;
  active: boolean;
  lastProcessedMonth?: string; // YYYY-MM
}

export interface MoneySyncDataV2 {
  version: 2;
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: BudgetSetting;
  goals: FinancialGoal[];
  recurring: RecurringRule[];
  customCategories: {
    expense: string[];
    income: string[];
  };
  lastRecurringCheck?: string;
}

export type ActiveTab = 'dashboard' | 'history' | 'analytics' | 'budget' | 'goals' | 'wallets' | 'settings';
export type HistorySubTab = 'year' | 'month' | 'calendar' | 'search';
export type AnalyticsSubTab = 'monthly' | 'annual' | 'compare';
