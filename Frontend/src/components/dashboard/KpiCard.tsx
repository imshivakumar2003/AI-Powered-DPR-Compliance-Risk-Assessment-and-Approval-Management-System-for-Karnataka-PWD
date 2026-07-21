// TOPLINE

'use client';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  change: string;
  changeType: 'up' | 'down';
  loading?: boolean;
}

export function KpiCard({ label, value, icon, color, change, changeType, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className={`kpi-card ${color}`}>
        <div className="kpi-skeleton-icon skeleton-pulse" />
        <div className="kpi-skeleton-value skeleton-pulse" />
        <div className="kpi-skeleton-label skeleton-pulse" />
        <div className="kpi-skeleton-change skeleton-pulse" />
      </div>
    );
  }

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
