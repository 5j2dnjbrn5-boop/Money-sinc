import React from 'react';
import { RotateCcw, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'error' | 'info';
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-300 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <p className="text-xs font-medium truncate">{toast.text}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{toast.undoLabel || 'เลิกทำ'}</span>
              </button>
            )}
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
