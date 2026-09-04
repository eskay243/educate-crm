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
    const op = payload.find((p: any) => p.dataKey === 'operatingCost')?.value || 0;
    const hon = payload.find((p: any) => p.dataKey === 'honorariums')?.value || 0;
    const netProfit = rev - op - hon;
    const margin = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 shadow-lg text-xs space-y-1.5 font-sans z-50 min-w-[200px]">
        <p className="font-bold text-on-surface border-b border-outline-variant/60 pb-1">{label}</p>
        <div className="space-y-1 font-data-tabular">
          <div className="flex justify-between items-center text-primary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00236f]"></span>
              <span>Tuition Revenue:</span>
            </span>
            <span className="font-bold">{formatNaira(rev)}</span>
          </div>
          <div className="flex justify-between items-center text-[#1e3a8a]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1e3a8a]"></span>
              <span>Mentor Honorariums:</span>
            </span>
            <span className="font-semibold">{formatNaira(hon)}</span>
          </div>
          <div className="flex justify-between items-center text-error">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#b91c1c]"></span>
              <span>Operating Costs:</span>
            </span>
            <span className="font-semibold">{formatNaira(op)}</span>
          </div>
          <div className="pt-1.5 border-t border-outline-variant/60 flex justify-between items-center font-bold text-on-surface">
            <span>Net Profit Margin:</span>
            <span className="text-[#166534] bg-[#dcfce7] px-1.5 py-0.5 rounded text-[11px]">
              {formatNaira(netProfit)} ({margin}%)
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueCostChart: React.FC = () => {
  const { students, sessions, expenses, mentors } = useCRM();

  const chartData = useMemo(() => {
    const totalRev = students.reduce((sum, s) => sum + (s.totalFees - (s.outstandingBalance || 0)), 0);
    const totalHonorariums = sessions.reduce((sum, s) => sum + s.compensationAmount, 0) + mentors.reduce((sum, m) => sum + m.pendingPayout, 0);
    const totalExpenses = expenses
      .filter(e => e.status === 'Approved' || e.status === 'Paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (totalRev === 0 && totalHonorariums === 0 && totalExpenses === 0) {
      return [];
    }

    return [
      {
        month: currentMonth,
        revenue: totalRev,
        operatingCost: totalExpenses,
        honorariums: totalHonorariums,
      }
    ];
  }, [students, sessions, expenses, mentors]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline-variant rounded-lg bg-surface-container-low/20">
        <span className="material-symbols-outlined text-secondary text-[36px] mb-2">bar_chart</span>
        <h4 className="font-bold text-xs text-on-surface">No Financial Transactions Yet</h4>
        <p className="text-[11px] text-secondary max-w-xs mt-1">
          Tuition revenue and operating overhead will automatically populate here as you enroll students and record business expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(val) => formatNaira(val)} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
            formatter={(value) => {
              if (value === 'revenue') return <span className="text-on-surface font-medium">Tuition Revenue (₦)</span>;
              if (value === 'honorariums') return <span className="text-on-surface font-medium">Faculty Honorariums (₦)</span>;
              if (value === 'operatingCost') return <span className="text-on-surface font-medium">Operating Overhead (₦)</span>;
              return value;
            }}
          />
          <Bar dataKey="revenue" fill="#00236f" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="honorariums" fill="#1e3a8a" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="operatingCost" fill="#b91c1c" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
