import React from 'react';

export interface PerformanceMeterProps {
  score: number;
  tier?: 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk';
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const getPerformanceTier = (score: number): 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk' => {
  if (score >= 90) return 'Exceeding';
  if (score >= 75) return 'On Track';
  if (score >= 60) return 'Needs Support';
  return 'At Risk';
};

export const PerformanceMeter: React.FC<PerformanceMeterProps> = ({
  score,
  tier: providedTier,
  size = 'md',
  showBar = true,
  showLabel = true,
  className = '',
}) => {
  const safeScore = Math.min(100, Math.max(0, Math.round(score || 0)));
  const tier = providedTier || getPerformanceTier(safeScore);

  const getTierConfig = (t: 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk') => {
    switch (t) {
      case 'Exceeding':
        return {
          label: 'Exceeding',
          icon: 'workspace_premium',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          barClass: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
          textColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'On Track':
        return {
          label: 'On Track',
          icon: 'check_circle',
          badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          barClass: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]',
          textColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'Needs Support':
        return {
          label: 'Needs Support',
          icon: 'warning',
          badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          barClass: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
          textColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'At Risk':
        return {
          label: 'At Risk',
          icon: 'error',
          badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
          barClass: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
          textColor: 'text-rose-600 dark:text-rose-400',
        };
    }
  };

  const config = getTierConfig(tier);

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${config.badgeClass}`}
          title={`Performance Score: ${safeScore}% (${config.label})`}
        >
          <span className="material-symbols-outlined text-[13px]">{config.icon}</span>
          <span>{safeScore}%</span>
          {showLabel && <span className="font-medium opacity-85">· {config.label}</span>}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${config.badgeClass}`}
          >
            <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
            <span>{config.label}</span>
          </span>
        </div>
        <span className={`font-mono font-bold text-sm ${config.textColor}`}>
          {safeScore}%
        </span>
      </div>

      {showBar && (
        <div className="relative w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${config.barClass}`}
            style={{ width: `${safeScore}%` }}
          />
        </div>
      )}
    </div>
  );
};
