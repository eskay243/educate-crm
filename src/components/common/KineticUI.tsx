import React from 'react';
import { Link } from 'react-router-dom';

export type KineticIntent = 'blue' | 'amber' | 'sky' | 'emerald' | 'red' | 'purple';

export const KINETIC_INTENT_STYLES: Record<
  KineticIntent,
  {
    topBorder: string;
    hoverBorder: string;
    tileHover: string;
    iconWell: string;
    iconText: string;
    badge: string;
    pulseDot: string;
  }
> = {
  blue: {
    topBorder: 'border-t-2 border-t-blue-500',
    hoverBorder: 'hover:border-blue-500/60',
    tileHover: 'hover:border-blue-500 hover:bg-blue-500/5',
    iconWell: 'bg-blue-500/10 text-blue-600',
    iconText: 'text-blue-600',
    badge: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    pulseDot: 'bg-blue-500',
  },
  amber: {
    topBorder: 'border-t-2 border-t-amber-500',
    hoverBorder: 'hover:border-amber-500/60',
    tileHover: 'hover:border-amber-500 hover:bg-amber-500/5',
    iconWell: 'bg-amber-500/10 text-amber-600',
    iconText: 'text-amber-600',
    badge: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    pulseDot: 'bg-amber-500',
  },
  sky: {
    topBorder: 'border-t-2 border-t-sky-500',
    hoverBorder: 'hover:border-sky-500/60',
    tileHover: 'hover:border-sky-500 hover:bg-sky-500/5',
    iconWell: 'bg-sky-500/10 text-sky-600',
    iconText: 'text-sky-600',
    badge: 'text-sky-600 bg-sky-500/10 border-sky-500/20',
    pulseDot: 'bg-sky-500',
  },
  emerald: {
    topBorder: 'border-t-2 border-t-emerald-500',
    hoverBorder: 'hover:border-emerald-500/60',
    tileHover: 'hover:border-emerald-500 hover:bg-emerald-500/5',
    iconWell: 'bg-emerald-500/10 text-emerald-600',
    iconText: 'text-emerald-600',
    badge: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    pulseDot: 'bg-emerald-500',
  },
  red: {
    topBorder: 'border-t-2 border-t-red-500',
    hoverBorder: 'hover:border-red-500/60',
    tileHover: 'hover:border-red-500 hover:bg-red-500/5',
    iconWell: 'bg-red-500/10 text-red-600',
    iconText: 'text-red-600',
    badge: 'text-red-600 bg-red-500/10 border-red-500/20',
    pulseDot: 'bg-red-500',
  },
  purple: {
    topBorder: 'border-t-2 border-t-purple-500',
    hoverBorder: 'hover:border-purple-500/60',
    tileHover: 'hover:border-purple-500 hover:bg-purple-500/5',
    iconWell: 'bg-purple-500/10 text-purple-600',
    iconText: 'text-purple-600',
    badge: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
    pulseDot: 'bg-purple-500',
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
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles.badge}`}
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

  const cardClasses = `group block text-left w-full p-4 rounded-xl bg-surface border border-outline-variant ${styles.topBorder} ${styles.hoverBorder} hover:shadow-md transition-all duration-200 ${
    interactive ? 'cursor-pointer active:scale-[0.99]' : ''
  } ${className}`;

  const content = (
    <>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-xs font-semibold text-secondary truncate">{label}</span>
        <span
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${styles.iconWell}`}
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
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${styles.badge} ${
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
  const baseClasses = `flex items-center gap-2.5 p-3 rounded-lg bg-surface border border-outline-variant/80 ${styles.tileHover} transition-all text-left cursor-pointer group active:scale-[0.985]`;

  const inner = (
    <>
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${styles.iconWell}`}
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
  intent,
  children,
  className = '',
  bodyClassName = '',
}) => {
  const topAccent = intent ? KINETIC_INTENT_STYLES[intent].topBorder : '';

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl bg-surface border border-outline-variant shadow-xs flex flex-col ${topAccent} ${className}`}
    >
      {(title || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/60 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
