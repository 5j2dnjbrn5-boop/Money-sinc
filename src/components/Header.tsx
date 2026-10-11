import React from 'react';
import {
  Sun,
  Moon,
  Plus,
  LayoutDashboard,
  CalendarCheck,
  BarChart3,
  PieChart,
  Target,
  Wallet as WalletIcon,
  Settings,
  Search,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleTheme,
  onOpenAddModal,
  onOpenSearch,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <span className="font-bold text-base tracking-tighter">M$</span>
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors whitespace-nowrap">
                  MoneySync
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                  OS
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>หน้าหลัก</span>
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>ประวัติการเงิน</span>
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>วิเคราะห์รายปี</span>
            </button>

            <button
              onClick={() => onSelectTab('budget')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'budget'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>งบประมาณ</span>
            </button>

            <button
              onClick={() => onSelectTab('goals')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'goals'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>เป้าหมาย</span>
            </button>

            <button
              onClick={() => onSelectTab('wallets')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'wallets'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <WalletIcon className="w-3.5 h-3.5" />
              <span>กระเป๋าเงิน</span>
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ตั้งค่า/สำรอง</span>
            </button>
          </nav>

          {/* Zone 3: Primary action & system toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenSearch}
              title="ค้นหาทั้งระบบ"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleTheme}
              title="เปลี่ยนธีม มืด/สว่าง"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">เพิ่มรายการ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
