// TOPLINE

'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const TOOLTIP_STYLE = {
  background: '#1c2333',
  border: '1px solid #2d3748',
  borderRadius: 8,
  color: '#f0f6fc',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
};

export function TrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gRejected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,72,0.6)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#5a7080', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#5a7080', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#9caabb', marginBottom: 4, fontWeight: 600 }}
          itemStyle={{ color: '#f0f6fc' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#9caabb', paddingTop: 8 }}
          iconType="circle"
          iconSize={7}
        />
        <Area type="monotone" dataKey="submitted" stroke="#3b82f6" fill="url(#gSubmitted)" strokeWidth={2} name="Submitted" dot={false} activeDot={{ r: 4, fill: '#60a5fa' }} />
        <Area type="monotone" dataKey="approved"  stroke="#22c55e" fill="url(#gApproved)"  strokeWidth={2} name="Approved"  dot={false} activeDot={{ r: 4, fill: '#4ade80' }} />
        <Area type="monotone" dataKey="rejected"  stroke="#f43f5e" fill="url(#gRejected)"  strokeWidth={2} name="Rejected"  dot={false} activeDot={{ r: 4, fill: '#fb7185' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
