'use client';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  change: string;
  changeType: 'up' | 'down';
}

export function KpiCard({ label, value, icon, color, change, changeType }: KpiCardProps) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className={`kpi-icon ${color}`}>{icon}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-change ${changeType}`}>
        {changeType === 'up'
          ? <TrendingUp size={11} />
          : <TrendingDown size={11} />}
        {change}
      </div>
    </div>
  );
}
