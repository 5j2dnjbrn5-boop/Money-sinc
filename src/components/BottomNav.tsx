import React from 'react';
import { LayoutDashboard, CalendarCheck, Plus, BarChart3, Menu } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {/* 1: Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1">หน้าหลัก</span>
        </button>

        {/* 2: History */}
        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'history'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          <span className="text-[10px] mt-1">ประวัติ</span>
        </button>

        {/* 3: Add (Prominent Center Button) */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenAddModal}
            className="w-12 h-12 -mt-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
            aria-label="เพิ่มรายการ"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4: Analytics */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'analytics'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-1">วิเคราะห์</span>
        </button>

        {/* 5: More / Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            ['settings', 'budget', 'goals', 'wallets'].includes(activeTab)
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1">เพิ่มเติม</span>
        </button>
      </div>
    </nav>
  );
};
