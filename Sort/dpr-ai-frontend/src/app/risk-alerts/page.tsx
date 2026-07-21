'use client';
import { Topbar } from '@/components/layout/Topbar';
import { RiskAlertsList } from '@/components/dashboard/RiskAlertsList';
import { riskAlerts } from '@/lib/mockData';
import { ShieldAlert } from 'lucide-react';

export default function RiskAlertsPage() {
  return (
    <>
      <Topbar title="Risk Alerts" subtitle="High-risk DPRs requiring immediate attention" />
      <div className="page-content fade-in">
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 20 }}>
          <ShieldAlert size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{riskAlerts.length} high-risk projects</strong> have been flagged by the AI risk prediction model.
            Projects scoring above 70% require enhanced review and monitoring.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🔴 Active Risk Alerts</div>
            <span className="badge badge-high">{riskAlerts.length} Active</span>
          </div>
          <RiskAlertsList alerts={riskAlerts} />
        </div>
      </div>
    </>
  );
}
