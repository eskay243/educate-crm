import React, { useEffect, useRef } from 'react';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string;
  iconColorClass?: string;
  maxWidthClass?: string; // e.g., 'max-w-md', 'max-w-lg', 'max-w-2xl', 'max-w-4xl'
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  hideHeader?: boolean;
  contentClassName?: string;
}

/**
 * Universal Responsive Modal Shell
 * 
 * Enforces responsive viewport scaling, prevents background scroll chaining,
 * handles Escape key listeners, and guarantees sticky header/footer zones
 * so that modal dialogs remain fully operable across tablets (iPad Air/Mini),
 * mobile devices, and landscape orientations with on-screen keyboards.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconColorClass = 'text-primary bg-primary/10',
  maxWidthClass = 'max-w-2xl',
  headerActions,
  footer,
  children,
  hideHeader = false,
  contentClassName = 'p-4 sm:p-6 space-y-4',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex min-h-[100dvh] items-end sm:items-center justify-center animate-in fade-in duration-200"
    >
      {/* Backdrop click dismiss */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidthClass} max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[min(90dvh,850px)] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden z-10 animate-in zoom-in-95 duration-150`}
      >
        {/* Fixed Header */}
        {!hideHeader && (
          <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {icon && (
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">{icon}</span>
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="font-headline-md text-sm sm:text-base md:text-lg font-bold text-on-surface truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="font-body-sm text-[11px] sm:text-xs text-secondary truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${contentClassName}`}>
          {children}
        </div>

        {/* Fixed Sticky Footer */}
        {footer && (
          <div className="shrink-0 p-3 sm:p-4 border-t border-outline-variant bg-surface-bright">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
