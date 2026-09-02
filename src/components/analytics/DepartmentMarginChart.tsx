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

const defaultDepartmentFinancials = [
  { department: 'Software Eng.', revenue: 8200000, honorariumsAndCosts: 3300000 },
  { department: 'Data & AI', revenue: 6800000, honorariumsAndCosts: 2700000 },
  { department: 'Cloud DevOps', revenue: 5400000, honorariumsAndCosts: 1900000 },
  { department: 'Product Design', revenue: 3900000, honorariumsAndCosts: 1300000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rev = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0;
    const cost = payload.find((p: any) => p.dataKey === 'honorariumsAndCosts')?.value || 0;
    const margin = rev > 0 ? (((rev - cost) / rev) * 100).toFixed(1) : 0;

    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 shadow-lg text-xs space-y-1.5 font-sans z-50 min-w-[200px]">
        <p className="font-bold text-on-surface border-b border-outline-variant/60 pb-1">{label} Department</p>
        <div className="space-y-1 font-data-tabular">
          <div className="flex justify-between items-center text-primary">
            <span>Gross Tuition (₦):</span>
            <strong className="font-bold">{formatNaira(rev)}</strong>
          </div>
          <div className="flex justify-between items-center text-secondary">
            <span>Faculty + Compute (₦):</span>
            <strong className="font-semibold">{formatNaira(cost)}</strong>
          </div>
          <div className="pt-1.5 border-t border-outline-variant/60 flex justify-between items-center font-bold text-on-surface">
            <span>Net Operating Margin:</span>
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
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={defaultDepartmentFinancials} 
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
            type="category"
            dataKey="department"
            tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
            formatter={(value) => {
              if (value === 'revenue') return <span className="text-on-surface font-medium">Gross Tuition (₦)</span>;
              if (value === 'honorariumsAndCosts') return <span className="text-on-surface font-medium">Faculty &amp; Compute Costs (₦)</span>;
              return value;
            }}
          />
          <Bar dataKey="revenue" fill="#00236f" radius={[0, 4, 4, 0]} maxBarSize={20} />
          <Bar dataKey="honorariumsAndCosts" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
