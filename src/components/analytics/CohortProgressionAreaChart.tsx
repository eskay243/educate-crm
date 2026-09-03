import React, { useMemo } from 'react';
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
import { useCRM } from '../../context/CRMContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const enrolled = payload.find((p: any) => p.dataKey === 'enrolled')?.value || 0;
    const activeStudents = payload.find((p: any) => p.dataKey === 'activeStudents')?.value || 0;

    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 shadow-lg text-xs space-y-1.5 font-sans z-50 min-w-[210px]">
        <p className="font-bold text-on-surface border-b border-outline-variant/60 pb-1">Cohort Batch: {label}</p>
        <div className="space-y-1 font-data-tabular">
          <div className="flex justify-between items-center text-[#00236f]">
            <span>Admitted Capacity:</span>
            <strong className="font-bold">{enrolled}</strong>
          </div>
          <div className="flex justify-between items-center text-[#10b981]">
            <span>Active Enrolled Students:</span>
            <strong className="font-bold">{activeStudents}</strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const CohortProgressionAreaChart: React.FC = () => {
  const { cohorts, students } = useCRM();

  const chartData = useMemo(() => {
    if (cohorts.length === 0) return [];

    return cohorts.map(c => {
      const matchedStudents = students.filter(s => 
        s.cohort?.toLowerCase().includes(c.name.toLowerCase()) || 
        s.cohort?.toLowerCase().includes(c.cohortCode.toLowerCase())
      );

      return {
        cohort: c.cohortCode || c.name.slice(0, 10),
        enrolled: c.maxCapacity || 40,
        activeStudents: matchedStudents.length,
      };
    });
  }, [cohorts, students]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline-variant rounded-lg bg-surface-container-low/20">
        <span className="material-symbols-outlined text-secondary text-[36px] mb-2">date_range</span>
        <h4 className="font-bold text-xs text-on-surface">No Academic Cohorts Scheduled</h4>
        <p className="text-[11px] text-secondary max-w-xs mt-1">
          When you launch upcoming student cohorts in Programs &amp; Cohorts, admissions capacity progression will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00236f" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#00236f" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
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
              if (value === 'enrolled') return <span className="text-on-surface font-medium">Cohort Max Capacity</span>;
              if (value === 'activeStudents') return <span className="text-on-surface font-medium">Active Enrolled Students</span>;
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
            dataKey="activeStudents" 
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorActive)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
