import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { useCRM, formatNaira } from '../../context/CRMContext';

interface LeadSourceData {
  name: string;
  count: number;
  value: number;
  color: string;
}

const PALETTE = ['#00236f', '#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

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
  const { leads } = useCRM();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sourceData: LeadSourceData[] = useMemo(() => {
    if (leads.length === 0) return [];

    const map = new Map<string, { count: number; value: number }>();
    leads.forEach(lead => {
      const src = lead.source || 'Direct Intake';
      const prev = map.get(src) || { count: 0, value: 0 };
      map.set(src, {
        count: prev.count + 1,
        value: prev.value + (lead.dealValue || 850000),
      });
    });

    let index = 0;
    const result: LeadSourceData[] = [];
    map.forEach((val, name) => {
      result.push({
        name,
        count: val.count,
        value: val.value,
        color: PALETTE[index % PALETTE.length],
      });
      index++;
    });

    return result;
  }, [leads]);

  const totalLeads = sourceData.reduce((acc, s) => acc + s.count, 0);

  if (sourceData.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline-variant rounded-lg bg-surface-container-low/20">
        <span className="material-symbols-outlined text-secondary text-[36px] mb-2">pie_chart</span>
        <h4 className="font-bold text-xs text-on-surface">No Lead Sources Recorded</h4>
        <p className="text-[11px] text-secondary max-w-xs mt-1">
          When candidates submit inquiries through your website or ads, acquisition channels will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-72">
      {/* Donut Chart Container */}
      <div className="w-full sm:w-1/2 h-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
              dataKey="count"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {sourceData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke="transparent"
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center center',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Hole Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-xl font-bold text-on-surface leading-tight font-mono">{totalLeads}</span>
          <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Total Leads</span>
        </div>
      </div>

      {/* Legend List */}
      <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-1.5 overflow-y-auto max-h-64 pr-1">
        {sourceData.map((entry, index) => {
          const percent = totalLeads > 0 ? Math.round((entry.count / totalLeads) * 100) : 0;
          const isSelected = activeIndex === index;

          return (
            <div 
              key={entry.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-between text-xs ${
                isSelected ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="font-medium text-on-surface truncate">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2 font-data-tabular shrink-0 pl-2">
                <span className="font-bold text-on-surface font-mono">{entry.count}</span>
                <span className="text-[11px] text-secondary w-7 text-right font-mono">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
