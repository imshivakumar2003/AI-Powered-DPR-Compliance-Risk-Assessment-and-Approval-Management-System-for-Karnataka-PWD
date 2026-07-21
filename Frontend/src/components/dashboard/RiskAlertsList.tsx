// TOPLINE

'use client';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: string;
  dprId: string;
  title: string;
  state: string;
  riskScore: number;
  riskFactors: string[];
  flaggedAt: string;
}

export function RiskAlertsList({ alerts }: { alerts: Alert[] }) {
  return (
    <div>
      {alerts.map((alert, i) => (
        <Link
          key={alert.id}
          href={`/dpr/${alert.dprId}`}
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div style={{
            padding: '12px 20px',
            borderBottom: i < alerts.length - 1 ? '1px solid rgba(30,58,95,0.5)' : 'none',
            transition: 'background 0.15s',
            cursor: 'pointer',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
              <ShieldAlert size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {alert.dprId} · {alert.state} · Flagged {alert.flaggedAt}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {alert.riskFactors.map((f, j) => (
                    <div key={j} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 6 }}>
                      <span style={{ color: 'var(--accent-red)', flexShrink: 0 }}>▸</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <div style={{
                  fontSize: 18, fontWeight: 800,
                  color: alert.riskScore > 70 ? 'var(--accent-red)' : 'var(--accent-amber)',
                }}>
                  {alert.riskScore}%
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Risk</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
