import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const defaultCohortProgression = [
  { cohort: '2026-Q1', enrolled: 32, graduated: 30, placedTechJobs: 28 },
  { cohort: '2026-Q2', enrolled: 40, graduated: 37, placedTechJobs: 35 },
  { cohort: '2026-Q3', enrolled: 45, graduated: 42, placedTechJobs: 39 },
  { cohort: '2026-Q4', enrolled: 52, graduated: 48, placedTechJobs: 46 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const enrolled = payload.find((p: any) => p.dataKey === 'enrolled')?.value || 0;
    const graduated = payload.find((p: any) => p.dataKey === 'graduated')?.value || 0;
    const placed = payload.find((p: any) => p.dataKey === 'placedTechJobs')?.value || 0;
    const retentionRate = enrolled > 0 ? Math.round((graduated / enrolled) * 100) : 0;
    const hireRate = graduated > 0 ? Math.round((placed / graduated) * 100) : 0;

    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 shadow-lg text-xs space-y-1.5 font-sans z-50 min-w-[210px]">
        <p className="font-bold text-on-surface border-b border-outline-variant/60 pb-1">Cohort Batch: {label}</p>
        <div className="space-y-1 font-data-tabular">
          <div className="flex justify-between items-center text-[#00236f]">
            <span>Admitted Students:</span>
            <strong className="font-mono">{enrolled}</strong>
          </div>
          <div className="flex justify-between items-center text-[#10b981]">
            <span>Successfully Graduated:</span>
            <strong className="font-mono">{graduated} ({retentionRate}%)</strong>
          </div>
          <div className="flex justify-between items-center text-[#3b82f6]">
            <span>Placed in Nigerian/Global Tech:</span>
            <strong className="font-mono">{placed} ({hireRate}%)</strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const CohortProgressionAreaChart: React.FC = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={defaultCohortProgression} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00236f" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#00236f" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorGraduated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="cohort" 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
            formatter={(value) => {
              if (value === 'enrolled') return <span className="text-on-surface font-medium">Total Enrolled</span>;
              if (value === 'graduated') return <span className="text-on-surface font-medium">Graduated &amp; Retained</span>;
              return value;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="enrolled" 
            stroke="#00236f" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorEnrolled)" 
          />
          <Area 
            type="monotone" 
            dataKey="graduated" 
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorGraduated)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
