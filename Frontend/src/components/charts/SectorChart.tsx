// TOPLINE

'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const TOOLTIP_STYLE = {
  background: '#1c2333',
  border: '1px solid #2d3748',
  borderRadius: 8,
  color: '#f0f6fc',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
};

export function SectorChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.92} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#9caabb' }}
          formatter={(val, name) => [`${val ?? ''} DPRs`, String(name)]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#9caabb', paddingTop: 4 }}
          iconType="circle"
          iconSize={7}
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
