'use client';
import { Topbar } from '@/components/layout/Topbar';
import { recentDprs, qualityDimensions, riskAlerts } from '@/lib/mockData';
import { QualityRadarChart } from '@/components/charts/QualityRadarChart';
import {
  CheckCircle, XCircle, ArrowLeft, FileText, ShieldAlert,
  TrendingUp, Calendar, MapPin, Building2, AlertTriangle,
  Download, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';

const radarData = qualityDimensions.map(d => ({
  subject: d.dimension.split(' ')[0],
  A: d.score,
  fullMark: 100,
}));

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(30,58,95,0.8)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.24, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: size * 0.11, color: 'var(--text-muted)' }}>/100</span>
      </div>
    </div>
  );
}

export default function DprDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dpr = recentDprs.find(d => d.id === id) || recentDprs[0];
  const [activeTab, setActiveTab] = useState('assessment');
  const [decision, setDecision] = useState<string | null>(null);

  const riskScore = dpr.riskLevel === 'High' ? 82 : dpr.riskLevel === 'Medium' ? 55 : 22;
  const riskColor = riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981';
  const riskAlert = riskAlerts.find(r => r.dprId === dpr.id);

  return (
    <>
      <Topbar
        title={`DPR · ${dpr.id}`}
        subtitle={dpr.title}
        actions={
          <>
            <button className="topbar-btn"><Download size={14} /> Export</button>
            <Link href="/dpr/queue" className="topbar-btn"><ArrowLeft size={14} /> Back</Link>
          </>
        }
      />
      <div className="page-content fade-in">
        {/* Header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <FileText size={20} color="var(--accent-blue)" />
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{dpr.title}</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {dpr.state}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Building2 size={13} /> {dpr.sector}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {dpr.submittedDate}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dpr.cost}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={`badge ${dpr.status === 'Approved' ? 'badge-approved' : dpr.status === 'Pending' ? 'badge-pending' : dpr.status === 'Rejected' ? 'badge-rejected' : 'badge-review'}`}>{dpr.status}</span>
                  <span className={`badge ${dpr.riskLevel === 'High' ? 'badge-high' : dpr.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low'}`}>{dpr.riskLevel} Risk</span>
                  <span className="badge badge-processing">{dpr.sector}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <ScoreRing score={dpr.qualityScore} size={100} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Quality Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <ScoreRing score={riskScore} size={100} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Risk Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {['assessment', 'risk', 'timeline', 'documents'].map(tab => (
            <div key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        {/* Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="grid-3-2" style={{ gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">8-Dimension Quality Scores</div>
                  <span className="badge badge-processing">AI Generated</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {qualityDimensions.map((dim) => (
                    <div key={dim.dimension}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{dim.dimension}</span>
                        <span style={{ color: dim.color, fontWeight: 700 }}>{dim.score}/100</span>
                      </div>
                      <div className="progress-bar" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${dim.score}%`, background: dim.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Reviewer Decision</div></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="label">Decision</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className={`btn ${decision === 'approve' ? 'btn-success' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setDecision('approve')}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className={`btn ${decision === 'reject' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setDecision('reject')}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Feedback / Justification (Mandatory)</label>
                    <textarea className="input-field" rows={3} placeholder="Provide reasoning for your decision..." style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    <MessageSquare size={14} /> Submit Decision
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Quality Radar Profile</div></div>
                <div className="card-body"><QualityRadarChart data={radarData} /></div>
              </div>
              <div className="card">
                <div className="card-header"><div className="card-title">AI Recommendations</div></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { type: 'warn', msg: 'Geological survey missing for Himalayan stretch — landslide risk' },
                    { type: 'warn', msg: 'Cost contingency at 5% is below recommended 10%' },
                    { type: 'ok', msg: 'Environmental clearance documents are current and complete' },
                    { type: 'warn', msg: 'Timeline does not account for 3-month monsoon window' },
                    { type: 'ok', msg: 'Stakeholder consultation records are well-documented' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, padding: '9px 12px',
                      background: item.type === 'warn' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${item.type === 'warn' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                      borderRadius: 8,
                    }}>
                      {item.type === 'warn'
                        ? <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                        : <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />}
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">ML Risk Prediction</div>
              <div className="card-subtitle">XGBoost Model · Trained on 200+ historical MDoNER projects</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 40, alignItems: 'center', marginBottom: 24 }}>
                <ScoreRing score={riskScore} size={130} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: riskColor, marginBottom: 4 }}>{dpr.riskLevel} Risk</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {riskScore}% probability of delay, cost overrun, or failure
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Projects &gt;70% flagged for enhanced monitoring</div>
                </div>
              </div>
              <div className="divider" />
              <div className="grid-2">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Top Risk Factors</div>
                  {(riskAlert?.riskFactors || ['Terrain complexity', 'Missing geological data', 'Monsoon constraints']).map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700, flexShrink: 0 }}>#{i + 1}</span>{f}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Mitigation Actions</div>
                  {['Conduct LiDAR topographic survey before tender', 'Front-load procurement before monsoon', 'Increase contingency to 12%', 'Set up multi-agency coordination committee'].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: 8, marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <TrendingUp size={13} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: 1 }} />{a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="card">
            <div className="card-header"><div className="card-title">Project Timeline</div></div>
            <div className="card-body">
              {[
                { phase: 'Land Acquisition & Survey', duration: '3 months', status: 'done', note: 'Completed' },
                { phase: 'Environmental Clearance', duration: '4 months', status: 'done', note: 'Approved by MOEFCC' },
                { phase: 'Tendering & Procurement', duration: '3 months', status: 'active', note: 'In Progress' },
                { phase: 'Construction Phase 1', duration: '12 months', status: 'pending', note: 'Q3 2026 Start' },
                { phase: 'Construction Phase 2', duration: '10 months', status: 'pending', note: 'Q3 2027 Start' },
                { phase: 'Handover & Testing', duration: '2 months', status: 'pending', note: 'Q1 2029 Target' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.status === 'done' ? 'var(--accent-green)' : m.status === 'active' ? 'var(--accent-blue)' : 'var(--bg-secondary)', border: `2px solid ${m.status === 'done' ? 'var(--accent-green)' : m.status === 'active' ? 'var(--accent-blue)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                      {m.status === 'done' ? '✓' : i + 1}
                    </div>
                    {i < 5 && <div style={{ width: 2, height: 32, background: 'var(--border)', marginTop: 4 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.phase}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Duration: {m.duration} · {m.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="card">
            <div className="card-header"><div className="card-title">Attached Documents</div></div>
            <div className="card-body">
              {['DPR_Main_Document.pdf|18.4 MB|Main DPR', 'Environmental_Impact_Assessment.pdf|4.2 MB|EIA', 'Cost_Estimate_Detailed.xlsx|1.1 MB|Financial', 'Site_Survey_Report.pdf|9.7 MB|Survey', 'Stakeholder_Consultation.pdf|2.3 MB|Compliance'].map((doc, i, arr) => {
                const [name, size, type] = doc.split('|');
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(30,58,95,0.5)' : 'none' }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(33,150,243,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{type} · {size}</div>
                    </div>
                    <span className="badge badge-approved" style={{ fontSize: 10 }}>✓ Parsed</span>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px' }}><Download size={12} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
