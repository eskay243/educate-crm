import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useCRM, formatNaira } from '../../context/CRMContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rev = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0;
    const cost = payload.find((p: any) => p.dataKey === 'honorariumsAndCosts')?.value || 0;
    const margin = rev > 0 ? (((rev - cost) / rev) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 shadow-lg text-xs space-y-1.5 font-sans z-50 min-w-[200px]">
        <p className="font-bold text-on-surface border-b border-outline-variant/60 pb-1">{label} Track</p>
        <div className="space-y-1 font-data-tabular">
          <div className="flex justify-between items-center text-primary">
            <span>Gross Tuition (₦):</span>
            <strong className="font-bold">{formatNaira(rev)}</strong>
          </div>
          <div className="flex justify-between items-center text-secondary">
            <span>Allocated Expenses (₦):</span>
            <strong className="font-semibold">{formatNaira(cost)}</strong>
          </div>
          <div className="pt-1.5 border-t border-outline-variant/60 flex justify-between items-center font-bold text-on-surface">
            <span>Net Track Margin:</span>
            <span className="text-[#166534] bg-[#dcfce7] px-1.5 py-0.5 rounded text-[11px]">
              {formatNaira(rev - cost)} ({margin}%)
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DepartmentMarginChart: React.FC = () => {
  const { courses, students, expenses } = useCRM();

  const chartData = useMemo(() => {
    if (courses.length === 0) return [];

    const map = new Map<string, { revenue: number; cost: number }>();

    courses.forEach(c => {
      const dept = c.category || c.title.slice(0, 15);
      const prev = map.get(dept) || { revenue: 0, cost: 0 };

      // Calculate revenue from students in this course track
      const trackStudents = students.filter(s => 
        s.program?.toLowerCase().includes(c.title.toLowerCase())
      );
      const trackRev = trackStudents.reduce((sum, s) => sum + (s.totalFees - (s.outstandingBalance || 0)), 0);

      // Allocated departmental expenses
      const deptExpenses = expenses.filter(e => 
        e.department?.toLowerCase().includes(dept.toLowerCase())
      ).reduce((sum, e) => sum + e.amount, 0);

      map.set(dept, {
        revenue: prev.revenue + trackRev,
        cost: prev.cost + deptExpenses,
      });
    });

    const result: Array<{ department: string; revenue: number; honorariumsAndCosts: number }> = [];
    map.forEach((val, department) => {
      result.push({
        department,
        revenue: val.revenue,
        honorariumsAndCosts: val.cost,
      });
    });

    return result;
  }, [courses, students, expenses]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline-variant rounded-lg bg-surface-container-low/20">
        <span className="material-symbols-outlined text-secondary text-[36px] mb-2">category</span>
        <h4 className="font-bold text-xs text-on-surface">No Department Tracks Created</h4>
        <p className="text-[11px] text-secondary max-w-xs mt-1">
          When you register academic programs in Programs &amp; Cohorts, departmental unit economics will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis 
            type="number" 
            tickFormatter={(val) => formatNaira(val)} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis 
            dataKey="department" 
            type="category" 
            width={110}
            tick={{ fontSize: 11, fill: '#334155' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
            formatter={(value) => {
              if (value === 'revenue') return <span className="text-on-surface font-medium">Track Revenue (₦)</span>;
              if (value === 'honorariumsAndCosts') return <span className="text-on-surface font-medium">Direct Operating Cost (₦)</span>;
              return value;
            }}
          />
          <Bar dataKey="revenue" fill="#00236f" radius={[0, 4, 4, 0]} maxBarSize={20} />
          <Bar dataKey="honorariumsAndCosts" fill="#64748b" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
