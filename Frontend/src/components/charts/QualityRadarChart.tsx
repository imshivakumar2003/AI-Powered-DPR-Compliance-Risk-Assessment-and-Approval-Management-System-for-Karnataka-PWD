// TOPLINE

'use client';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';

interface RadarDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

export function QualityRadarChart({ data }: { data: RadarDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
        <PolarGrid stroke="rgba(59,130,246,0.15)" gridType="polygon" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#9caabb', fontSize: 11, fontWeight: 500 }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#5a7080', fontSize: 9 }}
          tickCount={4}
          axisLine={false}
        />
        <Radar
          name="Quality Score"
          dataKey="A"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.18}
          strokeWidth={2}
          dot={{ fill: '#60a5fa', strokeWidth: 0, r: 3 }}
        />
        <Tooltip
          contentStyle={{
            background: '#1c2333',
            border: '1px solid #2d3748',
            borderRadius: 8,
            color: '#f0f6fc',
            fontSize: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          labelStyle={{ color: '#9caabb', marginBottom: 2 }}
          formatter={(val) => [`${val ?? ''}/100`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
