import React from 'react';
import { Link } from 'react-router-dom';

export type KineticIntent = 'blue' | 'amber' | 'sky' | 'emerald' | 'red' | 'purple';

export const KINETIC_INTENT_STYLES: Record<
  KineticIntent,
  {
    hoverBorder: string;
    hoverGlow: string;
    cornerGlow: string;
    tileHover: string;
    iconWell: string;
    iconText: string;
    badge: string;
    pulseDot: string;
  }
> = {
  blue: {
    hoverBorder: 'hover:border-blue-500/45',
    hoverGlow: 'hover:shadow-[0_14px_30px_-8px_rgba(24,114,245,0.22)]',
    cornerGlow: 'from-blue-500/12 via-blue-400/5 to-transparent',
    tileHover: 'hover:border-blue-500/50 hover:bg-blue-500/[0.04] hover:shadow-[0_10px_24px_-6px_rgba(24,114,245,0.18)]',
    iconWell: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 group-hover:bg-blue-500/15 group-hover:shadow-[0_0_16px_rgba(24,114,245,0.28)]',
    iconText: 'text-blue-600',
    badge: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    pulseDot: 'bg-blue-500 shadow-[0_0_8px_rgba(24,114,245,0.7)]',
  },
  amber: {
    hoverBorder: 'hover:border-amber-500/45',
    hoverGlow: 'hover:shadow-[0_14px_30px_-8px_rgba(217,119,6,0.22)]',
    cornerGlow: 'from-amber-500/14 via-amber-400/5 to-transparent',
    tileHover: 'hover:border-amber-500/50 hover:bg-amber-500/[0.04] hover:shadow-[0_10px_24px_-6px_rgba(217,119,6,0.18)]',
    iconWell: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 group-hover:bg-amber-500/15 group-hover:shadow-[0_0_16px_rgba(217,119,6,0.28)]',
    iconText: 'text-amber-600',
    badge: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    pulseDot: 'bg-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.7)]',
  },
  sky: {
    hoverBorder: 'hover:border-sky-500/45',
    hoverGlow: 'hover:shadow-[0_14px_30px_-8px_rgba(2,132,199,0.22)]',
    cornerGlow: 'from-sky-500/14 via-sky-400/5 to-transparent',
    tileHover: 'hover:border-sky-500/50 hover:bg-sky-500/[0.04] hover:shadow-[0_10px_24px_-6px_rgba(2,132,199,0.18)]',
    iconWell: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 group-hover:bg-sky-500/15 group-hover:shadow-[0_0_16px_rgba(2,132,199,0.28)]',
    iconText: 'text-sky-600',
    badge: 'text-sky-600 bg-sky-500/10 border-sky-500/20',
    pulseDot: 'bg-sky-500 shadow-[0_0_8px_rgba(2,132,199,0.7)]',
  },
  emerald: {
    hoverBorder: 'hover:border-emerald-500/45',
    hoverGlow: 'hover:shadow-[0_14px_30px_-8px_rgba(22,163,74,0.22)]',
    cornerGlow: 'from-emerald-500/14 via-emerald-400/5 to-transparent',
    tileHover: 'hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] hover:shadow-[0_10px_24px_-6px_rgba(22,163,74,0.18)]',
    iconWell: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/15 group-hover:shadow-[0_0_16px_rgba(22,163,74,0.28)]',
    iconText: 'text-emerald-600',
    badge: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    pulseDot: 'bg-emerald-500 shadow-[0_0_8px_rgba(22,163,74,0.7)]',
  },
  red: {
    hoverBorder: 'hover:border-red-500/45',
    hoverGlow: 'hover:shadow-[0_14px_30px_-8px_rgba(224,32,32,0.22)]',
    cornerGlow: 'from-red-500/14 via-red-400/5 to-transparent',
    tileHover: 'hover:border-red-500/50 hover:bg-red-500/[0.04] hover:shadow-[0_10px_24px_-6px_rgba(224,32,32,0.18)]',
    iconWell: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20 group-hover:bg-red-500/15 group-hover:shadow-[0_0_16px_rgba(224,32,32,0.28)]',
    iconText: 'text-red-600',
    badge: 'text-red-600 bg-red-500/10 border-red-500/20',
    pulseDot: 'bg-red-500 shadow-[0_0_8px_rgba(224,32,32,0.7)]',
  },
  purple: {
    hoverBorder: 'hover:border-purple-500/45',
    hoverGlow: 'hover:shadow-[0_14px_30px_-8px_rgba(143,83,242,0.22)]',
    cornerGlow: 'from-purple-500/14 via-purple-400/5 to-transparent',
    tileHover: 'hover:border-purple-500/50 hover:bg-purple-500/[0.04] hover:shadow-[0_10px_24px_-6px_rgba(143,83,242,0.18)]',
    iconWell: 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20 group-hover:bg-purple-500/15 group-hover:shadow-[0_0_16px_rgba(143,83,242,0.28)]',
    iconText: 'text-purple-600',
    badge: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
    pulseDot: 'bg-purple-500 shadow-[0_0_8px_rgba(143,83,242,0.7)]',
  },
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeIntent?: KineticIntent;
  badgePulse?: boolean;
  metaText?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badgeText,
  badgeIntent = 'emerald',
  badgePulse = false,
  metaText,
  actions,
  className = '',
}) => {
  const styles = KINETIC_INTENT_STYLES[badgeIntent];

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-outline-variant/60 ${className}`}
    >
      <div className="min-w-0">
        {(badgeText || metaText) && (
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {badgeText && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-sm ${styles.badge}`}
              >
                {badgePulse && (
                  <span className={`w-2 h-2 rounded-full animate-pulse ${styles.pulseDot}`} />
                )}
                {badgeText}
              </span>
            )}
            {metaText && <span className="text-xs text-secondary">{metaText}</span>}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
      )}
    </div>
  );
};

export interface SemanticMetricCardProps {
  label: string;
  value: React.ReactNode;
  icon: string;
  intent: KineticIntent;
  badge?: string;
  badgePulse?: boolean;
  subtitle?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

export const SemanticMetricCard: React.FC<SemanticMetricCardProps> = ({
  label,
  value,
  icon,
  intent,
  badge,
  badgePulse = false,
  subtitle,
  to,
  onClick,
  footer,
  className = '',
}) => {
  const styles = KINETIC_INTENT_STYLES[intent];
  const interactive = Boolean(to || onClick);

  const cardClasses = `group relative overflow-hidden block text-left w-full p-4 rounded-xl bg-white/80 backdrop-blur-md border border-outline-variant/80 shadow-[0_2px_12px_-4px_rgba(28,41,60,0.06)] ring-1 ring-inset ring-white/80 hover:-translate-y-1.5 hover:bg-white/95 ${styles.hoverBorder} ${styles.hoverGlow} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
    interactive ? 'cursor-pointer active:translate-y-0 active:scale-[0.98]' : ''
  } ${className}`;

  const content = (
    <>
      {/* Ambient semantic corner bloom on hover */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-bl ${styles.cornerGlow} blur-2xl opacity-45 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs font-semibold text-secondary truncate">{label}</span>
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${styles.iconWell}`}
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-black text-on-surface font-data-tabular tracking-tight">
            {value}
          </span>
          {badge && (
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-xs ${styles.badge} ${
                badgePulse ? 'animate-pulse' : ''
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-secondary mt-1 truncate">{subtitle}</p>
        )}
        {footer && <div className="mt-2.5">{footer}</div>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cardClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClasses}>
        {content}
      </button>
    );
  }

  return <div className={cardClasses}>{content}</div>;
};

export interface ActionTileProps {
  title: string;
  subtitle: string;
  icon: string;
  intent: KineticIntent;
  onClick?: () => void;
  to?: string;
}

export const ActionTile: React.FC<ActionTileProps> = ({
  title,
  subtitle,
  icon,
  intent,
  onClick,
  to,
}) => {
  const styles = KINETIC_INTENT_STYLES[intent];
  const baseClasses = `relative overflow-hidden flex items-center gap-2.5 p-3 rounded-xl bg-white/75 backdrop-blur-md border border-outline-variant/80 ring-1 ring-inset ring-white/80 hover:-translate-y-1 ${styles.tileHover} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] text-left cursor-pointer group active:translate-y-0 active:scale-[0.97]`;

  const inner = (
    <>
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${styles.iconWell}`}
      >
        <span className="material-symbols-outlined text-[19px]">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">{title}</p>
        <p className="text-[10px] text-secondary truncate">{subtitle}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={baseClasses}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {inner}
    </button>
  );
};

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  intent?: KineticIntent;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  headerAction,
  children,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-md border border-outline-variant/80 shadow-[0_2px_12px_-4px_rgba(28,41,60,0.06)] ring-1 ring-inset ring-white/80 flex flex-col transition-all duration-300 ${className}`}
    >
      {(title || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/60 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {title && (
                  <h3 className="text-sm sm:text-base font-bold text-on-surface truncate">
                    {title}
                  </h3>
                )}
                {badge}
              </div>
              {subtitle && (
                <p className="text-[11px] text-secondary truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};
