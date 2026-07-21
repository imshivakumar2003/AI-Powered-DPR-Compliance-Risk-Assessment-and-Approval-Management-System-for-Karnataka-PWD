'use client';
import { Topbar } from '@/components/layout/Topbar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DprTable } from '@/components/dashboard/DprTable';
import { QualityRadarChart } from '@/components/charts/QualityRadarChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { SectorChart } from '@/components/charts/SectorChart';
import { RiskAlertsList } from '@/components/dashboard/RiskAlertsList';
import { kpiStats, recentDprs, riskAlerts, trendData, sectorBreakdown, radarData } from '@/lib/mockData';
import {
  FileText, Clock, ShieldAlert, CheckCircle, IndianRupee, Map
} from 'lucide-react';
import Link from 'next/link';

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText size={20} />,
  Clock: <Clock size={20} />,
  ShieldAlert: <ShieldAlert size={20} />,
  CheckCircle: <CheckCircle size={20} />,
  IndianRupee: <IndianRupee size={20} />,
  Map: <Map size={20} />,
};

export default function DashboardPage() {
  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Topbar
        title="Command Center"
        subtitle={`MDoNER DPR Intelligence Portal · ${now}`}
        actions={
          <Link href="/dpr/upload" className="topbar-btn primary">
            + Upload DPR
          </Link>
        }
      />
      <div className="page-content fade-in">

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{
            width: 8, height: 8, background: 'var(--accent-green)',
            borderRadius: '50%', display: 'inline-block'
          }} className="pulse" />
          <span className="text-muted" style={{ fontSize: 12 }}>
            Live — Last updated just now · PM-DevINE Monitoring Active
          </span>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          {kpiStats.map((stat) => (
            <KpiCard
              key={stat.id}
              label={stat.label}
              value={stat.value}
              icon={iconMap[stat.icon]}
              color={stat.color}
              change={stat.change}
              changeType={stat.changeType as 'up' | 'down'}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid-3-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">DPR Submission Trends</div>
                <div className="card-subtitle">Monthly submissions, approvals & rejections</div>
              </div>
              <span className="badge badge-approved">Live</span>
            </div>
            <div className="card-body">
              <TrendChart data={trendData} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Sector Breakdown</div>
                <div className="card-subtitle">524 DPRs by sector</div>
              </div>
            </div>
            <div className="card-body">
              <SectorChart data={sectorBreakdown} />
            </div>
          </div>
        </div>

        {/* Bottom Row: Table + Radar + Alerts */}
        <div className="grid-3-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent DPRs</div>
                <div className="card-subtitle">Latest submissions across NE states</div>
              </div>
              <Link href="/dpr/queue" className="topbar-btn" style={{ padding: '6px 12px' }}>
                View All →
              </Link>
            </div>
            <DprTable dprs={recentDprs.slice(0, 5)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Quality Profile</div>
                  <div className="card-subtitle">8-Dimension avg across all DPRs</div>
                </div>
              </div>
              <div className="card-body">
                <QualityRadarChart data={radarData} />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">🔴 Risk Alerts</div>
                  <div className="card-subtitle">High-risk projects requiring attention</div>
                </div>
                <Link href="/risk-alerts" className="topbar-btn" style={{ padding: '6px 12px' }}>
                  All →
                </Link>
              </div>
              <div className="card-body" style={{ padding: '0 0 8px' }}>
                <RiskAlertsList alerts={riskAlerts.slice(0, 2)} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(33,150,243,0.08), rgba(139,92,246,0.08))',
          border: '1px solid rgba(33,150,243,0.2)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              🏆 SIH 2025 Winner · Team NEXUS · IIIT Bangalore
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              DPR-AI · Automated Quality Assessment Platform for MDoNER · PM-DevINE Integration Ready
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <span className="badge badge-approved">Production Ready</span>
            <span className="badge badge-processing">AI-Powered</span>
          </div>
        </div>

      </div>
    </>
  );
}
