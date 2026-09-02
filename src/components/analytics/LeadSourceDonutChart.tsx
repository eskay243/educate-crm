import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatNaira } from '../../context/CRMContext';

interface LeadSourceData {
  name: string;
  count: number;
  value: number;
  color: string;
}

const defaultLeadSources: LeadSourceData[] = [
  { name: 'Lagos FinTech Week / Events', count: 42, value: 35700000, color: '#00236f' },
  { name: 'Corporate Enterprise Referrals', count: 31, value: 26350000, color: '#1e3a8a' },
  { name: 'LinkedIn Tech Ads & Digital', count: 24, value: 20400000, color: '#3b82f6' },
  { name: 'Alumni Network & Word of Mouth', count: 18, value: 15300000, color: '#10b981' },
  { name: 'Developer Webinars & Meetups', count: 11, value: 9350000, color: '#f59e0b' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as LeadSourceData;
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 shadow-lg text-xs space-y-1 z-50 min-w-[180px]">
        <div className="flex items-center gap-1.5 font-bold text-on-surface">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span>{data.name}</span>
        </div>
        <div className="text-secondary font-data-tabular flex justify-between">
          <span>Prospect Leads:</span>
          <strong className="text-on-surface font-mono">{data.count}</strong>
        </div>
        <div className="text-secondary font-data-tabular flex justify-between">
          <span>Pipeline Value (₦):</span>
          <strong className="text-primary font-mono">{formatNaira(data.value)}</strong>
        </div>
      </div>
    );
  }
  return null;
};

export const LeadSourceDonutChart: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalLeads = defaultLeadSources.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-72">
      {/* Donut Chart Container */}
      <div className="w-full sm:w-1/2 h-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={defaultLeadSources}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="count"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {defaultLeadSources.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? '#00236f' : 'transparent'}
                  strokeWidth={2}
                  style={{
                    transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease-in-out',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-xl font-bold text-on-surface font-mono">
            {totalLeads}
          </span>
          <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">
            Total Leads
          </span>
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="w-full sm:w-1/2 space-y-2 text-xs">
        {defaultLeadSources.map((source, index) => {
          const pct = Math.round((source.count / totalLeads) * 100);
          return (
            <div
              key={source.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                activeIndex === index ? 'bg-surface-container' : 'hover:bg-surface-container/50'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-on-surface font-medium truncate">{source.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono flex-shrink-0">
                <span className="text-secondary">{source.count}</span>
                <span className="font-bold text-primary px-1 py-0.2 bg-secondary-container rounded text-[10px]">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
