import React, { createContext, useContext, useEffect, useState } from 'react';
import { pwaService } from '../services/pwaService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
  isStandalone: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  showIOSInstallGuide: boolean;
  setShowIOSInstallGuide: (show: boolean) => void;
  promptInstall: () => Promise<boolean>;
  updateApp: () => void;
  clearCacheAndReload: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // Platform detection
  const isIOS = typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);

  useEffect(() => {
    // 1. Register service worker
    pwaService.register();

    // 2. Check if currently running in standalone display mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // 3. Listen for Chromium beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed on device');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
      setShowIOSInstallGuide(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Connectivity detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 6. Service worker update listener
    const unsubscribeUpdate = pwaService.onUpdate(() => {
      setHasUpdate(true);
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeUpdate();
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (isIOS) {
      setShowIOSInstallGuide(true);
      return false;
    }

    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        console.log('[PWA] User accepted the installation prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed the installation prompt');
        return false;
      }
    } catch (err) {
      console.error('[PWA] Error displaying install prompt:', err);
      return false;
    }
  };

  const updateApp = () => {
    pwaService.skipWaiting();
  };

  const clearCacheAndReload = async () => {
    await pwaService.clearCacheAndReload();
  };

  return (
    <PWAContext.Provider
      value={{
        isStandalone,
        isInstallable,
        isIOS,
        isAndroid,
        isOnline,
        hasUpdate,
        showIOSInstallGuide,
        setShowIOSInstallGuide,
        promptInstall,
        updateApp,
        clearCacheAndReload,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
