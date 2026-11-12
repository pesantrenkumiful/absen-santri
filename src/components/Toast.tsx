import React from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => {
        let bg = 'bg-slate-900/95 text-white border-slate-700';
        let icon = 'fa-solid fa-circle-info text-blue-400';

        if (t.type === 'success') {
          bg = 'bg-emerald-900/95 text-emerald-100 border-emerald-700';
          icon = 'fa-solid fa-circle-check text-emerald-400';
        } else if (t.type === 'error') {
          bg = 'bg-rose-900/95 text-rose-100 border-rose-700';
          icon = 'fa-solid fa-circle-exclamation text-rose-400';
        } else if (t.type === 'warning') {
          bg = 'bg-amber-900/95 text-amber-100 border-amber-700';
          icon = 'fa-solid fa-triangle-exclamation text-amber-400';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto border p-3.5 rounded-xl shadow-2xl text-xs flex items-center space-x-2.5 transition-all duration-300 ${bg}`}
          >
            <i className={`${icon} text-base shrink-0`}></i>
            <span className="font-medium">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};
