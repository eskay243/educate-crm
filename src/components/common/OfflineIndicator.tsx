import React, { useState, useEffect } from 'react';
import { usePWA } from '../../context/PWAContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, hasUpdate, updateApp } = usePWA();
  const [showReconnected, setShowReconnected] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    if (!prevOnline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    }
    setPrevOnline(isOnline);
  }, [isOnline, prevOnline]);

  return (
    <>
      {/* 1. Offline Mode Banner */}
      {!isOnline && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-stone-950 px-4 py-1 text-center text-xs font-bold shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200"
        >
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          <span>Offline Mode Active • Working from cached device storage</span>
        </div>
      )}

      {/* 2. Reconnected Toast */}
      {showReconnected && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300"
        >
          <span className="material-symbols-outlined text-[16px]">wifi</span>
          <span>Connection Restored • Synchronized</span>
        </div>
      )}

      {/* 3. New App Version Available Toast */}
      {hasUpdate && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-16 sm:bottom-6 right-4 z-50 bg-surface-container-highest border border-primary/40 rounded-xl p-3 shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-300 max-w-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">update</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-on-surface">Update Ready</p>
            <p className="text-[11px] text-secondary">A newer version of Nexus CRM is available.</p>
          </div>
          <button
            type="button"
            onClick={updateApp}
            className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors shrink-0 cursor-pointer"
          >
            Reload
          </button>
        </div>
      )}
    </>
  );
};
