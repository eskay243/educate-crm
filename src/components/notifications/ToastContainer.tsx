import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { ToastMessage } from '../../types/crm';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useCRM();

  if (toasts.length === 0) return null;

  const getToastStyle = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: 'check_circle',
          borderColor: 'border-[#86efac]',
          bgColor: 'bg-[#f0fdf4]',
          iconColor: 'text-[#166534]',
        };
      case 'warning':
        return {
          icon: 'warning',
          borderColor: 'border-[#fde047]',
          bgColor: 'bg-[#fefce8]',
          iconColor: 'text-[#854d0e]',
        };
      case 'error':
        return {
          icon: 'error',
          borderColor: 'border-[#fca5a5]',
          bgColor: 'bg-[#fef2f2]',
          iconColor: 'text-[#991b1b]',
        };
      default:
        return {
          icon: 'info',
          borderColor: 'border-outline-variant',
          bgColor: 'bg-surface-container-lowest',
          iconColor: 'text-primary',
        };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const { icon, borderColor, bgColor, iconColor } = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg border ${borderColor} ${bgColor} shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200`}
          >
            <span className={`material-symbols-outlined text-[20px] ${iconColor} shrink-0 mt-0.5`}>
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <h5 className="font-headline-sm text-xs font-bold text-on-surface">
                {toast.title}
              </h5>
              <p className="font-body-sm text-xs text-secondary mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-secondary hover:text-on-surface p-0.5 rounded transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
