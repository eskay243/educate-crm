import React from 'react';
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
import { formatNaira } from '../../context/CRMContext';

interface RevenueCostChartProps {
  data?: Array<{
    month: string;
    revenue: number;
    operatingCost: number;
    honorariums: number;
  }>;
}

const defaultMonthlyFinancials = [
  { month: 'May 2026', revenue: 1850000, operatingCost: 280000, honorariums: 620000 },
  { month: 'Jun 2026', revenue: 2100000, operatingCost: 310000, honorariums: 710000 },
  { month: 'Jul 2026', revenue: 1950000, operatingCost: 295000, honorariums: 680000 },
  { month: 'Aug 2026', revenue: 2300000, operatingCost: 340000, honorariums: 790000 },
  { month: 'Sep 2026', revenue: 2450000, operatingCost: 320000, honorariums: 850000 },
  { month: 'Oct 2026', revenue: 2800000, operatingCost: 350000, honorariums: 920000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rev = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0;
    const op = payload.find((p: any) => p.dataKey === 'operatingCost')?.value || 0;
    const hon = payload.find((p: any) => p.dataKey === 'honorariums')?.value || 0;
    const netProfit = rev - op - hon;
    const margin = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : 0;

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

export const RevenueCostChart: React.FC<RevenueCostChartProps> = ({ data = defaultMonthlyFinancials }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
