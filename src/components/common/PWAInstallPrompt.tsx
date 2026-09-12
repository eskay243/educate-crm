import React, { useState, useEffect } from 'react';
import { usePWA } from '../../context/PWAContext';

export const PWAInstallPrompt: React.FC = () => {
  const {
    isStandalone,
    isInstallable,
    isIOS,
    promptInstall,
    showIOSInstallGuide,
    setShowIOSInstallGuide,
  } = usePWA();

  const [isDismissed, setIsDismissed] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem('nexus_pwa_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 3 days
    localStorage.setItem(
      'nexus_pwa_dismissed_until',
      String(Date.now() + 3 * 24 * 60 * 60 * 1000)
    );
  };

  const isMobile = isIOS || (typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768));

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstallGuide(true);
      return;
    }

    const installed = await promptInstall();
    if (!installed) {
      setShowBrowserGuide(true);
    }
  };

  // If app is already installed/running in standalone mode, do not show prompt
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Mobile & Desktop Floating Install Banner */}
      {!isDismissed && (isInstallable || isMobile) && (
        <aside 
          aria-label="Install App Banner"
          className="fixed top-2.5 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="bg-surface-container-lowest/95 backdrop-blur-md border border-primary/30 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Nexus CRM Logo"
              className="w-11 h-11 rounded-xl shadow-md shrink-0 object-contain bg-[#0B0F19] p-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-on-surface truncate">
                  Install Nexus CRM App
                </h4>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                  Mobile
                </span>
              </div>
              <p className="text-[11px] text-secondary truncate">
                Full-screen standalone &amp; instant offline access
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  download
                </span>
                <span>Install</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS Safari Step-by-Step Install Drawer Modal */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="absolute inset-0"
            onClick={() => setShowIOSInstallGuide(false)}
          />

          <div className="relative w-full sm:max-w-md bg-surface-container-lowest border border-outline-variant rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-192.png"
                  alt="CODELAB Logo"
                  className="w-12 h-12 rounded-2xl shadow bg-[#0B0F19] p-1"
                />
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-xs text-secondary">
                    Add to Home Screen for native full-screen experience
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSInstallGuide(false)}
                className="p-1.5 rounded-full text-secondary hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-outline-variant/60">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-on-surface">Tap the Share Icon</p>
                  <p className="text-[11px] text-secondary">
                    In Safari&apos;s bottom navigation bar, tap the Share icon (square with an arrow pointing upward).
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary text-xl shrink-0">
                  ios_share
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-outline-variant/60">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-on-surface">Select &apos;Add to Home Screen&apos;</p>
                  <p className="text-[11px] text-secondary">
                    Scroll down the action sheet menu and tap &apos;Add to Home Screen&apos;.
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary text-xl shrink-0">
                  add_box
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-outline-variant/60">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-on-surface">Tap &apos;Add&apos;</p>
                  <p className="text-[11px] text-secondary">
                    Confirm by tapping &apos;Add&apos; in the top-right corner. Nexus CRM will now launch as a dedicated standalone app!
                  </p>
                </div>
                <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0">
                  check_circle
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full h-11 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Android / Chrome / Mobile Browser Step-by-Step Install Modal */}
      {showBrowserGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="absolute inset-0"
            onClick={() => setShowBrowserGuide(false)}
          />

          <div className="relative w-full sm:max-w-md bg-surface-container-lowest border border-outline-variant rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-192.png"
                  alt="CODELAB Logo"
                  className="w-12 h-12 rounded-2xl shadow bg-[#0B0F19] p-1"
                />
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Install on Your Device
                  </h3>
                  <p className="text-xs text-secondary">
                    Add Nexus CRM to home screen for full-screen app access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBrowserGuide(false)}
                className="p-1.5 rounded-full text-secondary hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-outline-variant/60">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-on-surface">Tap Browser Menu (⋮)</p>
                  <p className="text-[11px] text-secondary">
                    In Chrome or your mobile browser, tap the <strong>three dots (⋮)</strong> menu in the top-right corner.
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary text-xl shrink-0">
                  more_vert
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-outline-variant/60">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-on-surface">Tap &apos;Install app&apos; or &apos;Add to Home screen&apos;</p>
                  <p className="text-[11px] text-secondary">
                    Select <strong>Install app</strong> (or <strong>Add to Home screen</strong>) from the browser options.
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary text-xl shrink-0">
                  install_mobile
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-outline-variant/60">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-on-surface">Confirm &apos;Install&apos;</p>
                  <p className="text-[11px] text-secondary">
                    Confirm prompt. Nexus CRM will now launch directly from your home screen without browser bars.
                  </p>
                </div>
                <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0">
                  check_circle
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBrowserGuide(false)}
              className="w-full h-11 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
