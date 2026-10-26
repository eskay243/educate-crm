import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-4 border border-amber-300/40 shadow-xs">
            <span className="material-symbols-outlined text-[28px]">warning</span>
          </div>

          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-1">
            Module Encountered a Temporary Error
          </h3>
          <p className="text-secondary text-xs max-w-md mb-5 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering issue occurred while loading this view.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-xs"
            >
              Retry View
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs"
            >
              Refresh Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
