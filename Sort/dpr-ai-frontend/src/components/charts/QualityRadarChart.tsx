'use client';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';

interface RadarDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

export function QualityRadarChart({ data }: { data: RadarDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(30,58,95,0.8)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
        />
        <Radar
          name="Quality"
          dataKey="A"
          stroke="#2196f3"
          fill="#2196f3"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 12,
          }}
          formatter={(val) => [`${val ?? ''}/100`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
