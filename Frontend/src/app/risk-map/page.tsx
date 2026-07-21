// TOPLINE

'use client';
import { Topbar } from '@/components/layout/Topbar';
import { statePerformance, riskAlerts } from '@/lib/mockData';
import { ShieldAlert, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

const STATE_POSITIONS: Record<string, { top: string; left: string }> = {
  'Arunachal Pradesh': { top: '12%', left: '78%' },
  'Assam':             { top: '38%', left: '62%' },
  'Manipur':           { top: '55%', left: '70%' },
  'Meghalaya':         { top: '47%', left: '48%' },
  'Mizoram':           { top: '68%', left: '58%' },
  'Nagaland':          { top: '38%', left: '78%' },
  'Sikkim':            { top: '26%', left: '38%' },
  'Tripura':           { top: '68%', left: '40%' },
};

const RISK_COLORS: Record<string, string> = {
  high:   '#f43f5e',
  medium: '#f59e0b',
  low:    '#22c55e',
};

function getRiskLevel(score: number): 'high' | 'medium' | 'low' {
  return score < 68 ? 'high' : score < 75 ? 'medium' : 'low';
}

export default function RiskMapPage() {
  return (
    <>
      <Topbar title="Risk Map" subtitle="Geospatial risk distribution across 8 NE states" />
      <div className="page-content fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>

          {/* Map Panel */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Karnataka districts — DPR Risk Map</div>
                <div className="card-subtitle">Circle size = DPR volume · Color = Risk level</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['High', 'Medium', 'Low'].map(r => (
                  <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS[r.toLowerCase()], display: 'inline-block' }} />
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="card-body">
              {/* Stylised NE India map using SVG placeholder */}
              <div style={{
                position: 'relative', width: '100%', paddingTop: '65%',
                background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                borderRadius: 10, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                {/* Background grid lines */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="#3b82f6" strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={`v${i}`} x1={`${i * 8.33}%`} y1="0" x2={`${i * 8.33}%`} y2="100%" stroke="#3b82f6" strokeWidth="0.5" />
                  ))}
                </svg>

                {/* NE Region outline hint */}
                <div style={{ position: 'absolute', inset: '5% 5% 10% 15%', border: '1px dashed rgba(59,130,246,0.2)', borderRadius: '60% 40% 50% 40% / 40% 50% 60% 50%' }} />

                {/* State nodes */}
                {statePerformance.map((state) => {
                  const pos = STATE_POSITIONS[state.state];
                  const risk = getRiskLevel(state.avgScore);
                  const color = RISK_COLORS[risk];
                  const size = Math.max(36, Math.min(60, state.dprs / 3));
                  return (
                    <div key={state.state} style={{
                      position: 'absolute',
                      top: pos.top, left: pos.left,
                      transform: 'translate(-50%, -50%)',
                    }}>
                      {/* Pulse ring */}
                      <div style={{
                        position: 'absolute', inset: -8,
                        borderRadius: '50%', border: `1px solid ${color}`,
                        opacity: 0.3, animation: 'pulse 2.5s infinite',
                      }} />
                      {/* Main node */}
                      <div style={{
                        width: size, height: size, borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}30, ${color}10)`,
                        border: `2px solid ${color}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        boxShadow: `0 0 20px ${color}40`,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color, lineHeight: 1 }}>{state.dprs}</span>
                        <span style={{ fontSize: 8, color: 'var(--text-muted)', lineHeight: 1 }}>DPRs</span>
                      </div>
                      {/* Label */}
                      <div style={{
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        marginTop: 4, whiteSpace: 'nowrap', fontSize: 9.5,
                        color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center',
                      }}>
                        {state.state.split(' ').pop()}
                      </div>
                    </div>
                  );
                })}

                {/* Corner label */}
                <div style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 10, color: 'var(--text-muted)' }}>
                Karnataka · 31 Districts · PM-DevINE Zone
                </div>
              </div>
            </div>
          </div>

          {/* State List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Districts Risk Summary</div>
              </div>
              <div className="card-body" style={{ padding: '8px 0' }}>
                {statePerformance.map((state, i) => {
                  const risk = getRiskLevel(state.avgScore);
                  const color = RISK_COLORS[risk];
                  return (
                    <div key={state.state} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 18px',
                      borderBottom: i < statePerformance.length - 1 ? '1px solid rgba(45,55,72,0.5)' : 'none',
                    }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>
                          {state.state}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {state.dprs} DPRs · Score {state.avgScore}/100
                        </div>
                      </div>
                      <span className={`badge badge-${risk}`} style={{ fontSize: 10 }}>
                        {risk.charAt(0).toUpperCase() + risk.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active risk alerts */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🔴 Active Alerts</div>
                <span className="badge badge-high">{riskAlerts.length}</span>
              </div>
              <div className="card-body" style={{ padding: '8px 0' }}>
                {riskAlerts.map((alert, i) => (
                  <div key={alert.id} style={{
                    padding: '10px 18px',
                    borderBottom: i < riskAlerts.length - 1 ? '1px solid rgba(45,55,72,0.5)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#f43f5e' }}>{alert.riskScore}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.state} · {alert.flaggedAt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
