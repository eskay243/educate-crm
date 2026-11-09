import { Component, ErrorInfo, ReactNode } from 'react';
import { pwaService } from '../../services/pwaService';
import { safeLocalStorage, safeSessionStorage } from '../../utils/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Uncaught application error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleClearCacheAndReset = async () => {
    try {
      safeLocalStorage.clear();
      safeSessionStorage.clear();
      await pwaService.clearCacheAndReload();
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-300/40 shadow-xs">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Application Notice
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              We encountered an unexpected display issue while launching the application. You can reload or clear your local cache to continue.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-left border border-slate-200 dark:border-slate-700 overflow-x-auto text-xs text-rose-600 dark:text-rose-400 font-mono">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                Reload Workspace
              </button>
              <button
                onClick={this.handleClearCacheAndReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-xs"
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
