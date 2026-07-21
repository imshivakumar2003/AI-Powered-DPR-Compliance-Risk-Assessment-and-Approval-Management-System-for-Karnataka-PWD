// TOPLINE

'use client';
import { Topbar } from '@/components/layout/Topbar';
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, User, CalendarDays, ChevronDown, ChevronUp, Sparkles, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CategoryRec {
  category: string;
  icon: string;
  status: 'Good' | 'Needs Improvement' | 'Critical';
  confidence: number;
  recommendation: string;
  reason: string;
}

interface ApiProject {
  id: string;
  title: string;
  original_filename: string;
  state: string;
  sector: string;
  estimated_cost: number;
  status: string;
  risk_score: number | null;
  overall_score: number | null;
  upload_date: string;
  submitted_by: string;
  approval_comment: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  in_approvals?: boolean;
}

type Decision = 'approve' | 'reject' | 'pending' | '';

function riskLevel(score: number | null): string {
  if (!score) return 'Medium';
  if (score > 65) return 'High';
  if (score > 35) return 'Medium';
  return 'Low';
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function statusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    APPROVED:       { cls: 'badge-approved',   label: 'Approved' },
    REJECTED:       { cls: 'badge-rejected',   label: 'Rejected' },
    PENDING:        { cls: 'badge-pending',    label: 'Pending' },
    PROCESSING:     { cls: 'badge-processing', label: 'Processing' },
    NEEDS_REVISION: { cls: 'badge-review',     label: 'Needs Revision' },
  };
  const info = map[status?.toUpperCase()] ?? { cls: 'badge-pending', label: status };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}

export default function ApprovalsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'MY_APPROVALS' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Per-card state
  const [decisions, setDecisions]     = useState<Record<string, Decision>>({});
  const [comments, setComments]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting]   = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<Record<string, string>>({});
  const [submitOk, setSubmitOk]       = useState<Record<string, boolean>>({});
  const [showRecs, setShowRecs]       = useState<Record<string, boolean>>({});
  const [recs, setRecs]               = useState<Record<string, CategoryRec[]>>({});
  const [loadingRecs, setLoadingRecs] = useState<Record<string, boolean>>({});

  const loadCategoryRecs = async (projectId: string) => {
    if (recs[projectId]) {
      setShowRecs(prev => ({ ...prev, [projectId]: !prev[projectId] }));
      return;
    }
    setLoadingRecs(prev => ({ ...prev, [projectId]: true }));
    try {
      const res = await fetch(`${API_URL}/api/dpr/${projectId}/category-analysis`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setRecs(prev => ({ ...prev, [projectId]: data.categories || [] }));
      setShowRecs(prev => ({ ...prev, [projectId]: true }));
    } catch {
      setRecs(prev => ({ ...prev, [projectId]: [] }));
      setShowRecs(prev => ({ ...prev, [projectId]: true }));
    } finally {
      setLoadingRecs(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const fetchProjects = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: ApiProject[] = await res.json();
      setProjects(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Counts
  const pendingCount  = projects.filter(p => !['APPROVED','REJECTED'].includes(p.status?.toUpperCase())).length;
  const approvedCount = projects.filter(p => p.status?.toUpperCase() === 'APPROVED').length;
  const rejectedCount = projects.filter(p => p.status?.toUpperCase() === 'REJECTED').length;
  const inApprovalsCount = projects.filter(p => p.in_approvals).length;

  // Filter
  const filtered = projects.filter(p => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'MY_APPROVALS') return p.in_approvals === true;
    if (filterTab === 'PENDING') return !['APPROVED','REJECTED'].includes(p.status?.toUpperCase());
    return p.status?.toUpperCase() === filterTab;
  });

  const setDecision = (id: string, val: Decision) => {
    setDecisions(prev => ({ ...prev, [id]: val }));
    setSubmitError(prev => ({ ...prev, [id]: '' }));
    setSubmitOk(prev => ({ ...prev, [id]: false }));
  };

  const confirmDecision = async (projectId: string) => {
    const decision = decisions[projectId];
    const comment  = (comments[projectId] || '').trim();
    if (!comment) {
      setSubmitError(prev => ({ ...prev, [projectId]: 'A justification comment is required before confirming.' }));
      return;
    }
    setSubmitting(prev => ({ ...prev, [projectId]: true }));
    setSubmitError(prev => ({ ...prev, [projectId]: '' }));
    try {
      const res = await fetch(`${API_URL}/api/dpr/${projectId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment, reviewed_by: 'Admin' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || `Error ${res.status}`);
      }
      const statusMap: Record<string, string> = { approve: 'APPROVED', reject: 'REJECTED', pending: 'PENDING' };
      const newStatus = statusMap[decision] || 'PENDING';
      const now = new Date().toISOString();
      setProjects(prev => prev.map(p => p.id === projectId
        ? { ...p, status: newStatus, approval_comment: comment, reviewed_by: 'Admin', reviewed_at: now }
        : p
      ));
      setDecisions(prev => ({ ...prev, [projectId]: '' }));
      setComments(prev => ({ ...prev, [projectId]: '' }));
      setSubmitOk(prev => ({ ...prev, [projectId]: true }));
      setTimeout(() => setSubmitOk(prev => ({ ...prev, [projectId]: false })), 3000);
    } catch (e: unknown) {
      setSubmitError(prev => ({ ...prev, [projectId]: e instanceof Error ? e.message : 'Failed to submit decision' }));
    } finally {
      setSubmitting(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const tabs: { key: typeof filterTab; label: string; count: number }[] = [
    { key: 'ALL',          label: 'All DPRs',    count: projects.length },
    { key: 'MY_APPROVALS', label: 'My Approvals', count: inApprovalsCount },
    { key: 'PENDING',      label: 'Pending',     count: pendingCount },
    { key: 'APPROVED',     label: 'Approved',    count: approvedCount },
    { key: 'REJECTED',     label: 'Rejected',    count: rejectedCount },
  ];

  return (
    <>
      <Topbar
        title="Approvals"
        subtitle="Manually review, approve, reject, or keep DPRs as pending"
        actions={
          <button className="topbar-btn" onClick={() => fetchProjects(true)} disabled={refreshing}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        }
      />
      <div className="page-content fade-in">

        {/* ── Summary Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Pending Decision', count: pendingCount,  color: 'var(--accent-amber)', icon: <Clock size={18} /> },
            { label: 'Approved',         count: approvedCount, color: 'var(--accent-green)', icon: <CheckCircle size={18} /> },
            { label: 'Rejected',         count: rejectedCount, color: 'var(--accent-red)',   icon: <XCircle size={18} /> },
          ].map(item => (
            <div key={item.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: item.color }} />
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color: item.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{item.count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="tab-bar" style={{ marginBottom: 20 }}>
          {tabs.map(t => (
            <div key={t.key} className={`tab-item ${filterTab === t.key ? 'active' : ''}`} onClick={() => setFilterTab(t.key)}>
              {t.label}
              <span style={{ marginLeft: 6, background: filterTab === t.key ? 'rgba(33,150,243,0.2)' : 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                {t.count}
              </span>
            </div>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
            ⚠ {error} — <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }} onClick={() => fetchProjects()}>Retry</button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <div className="empty-state"><div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading DPRs…</div></div>}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No DPRs in this category</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try switching to a different tab.</div>
          </div>
        )}

        {/* ── DPR Cards ── */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(dpr => {
              const dec        = decisions[dpr.id] || '';
              const isBusy     = submitting[dpr.id] || false;
              const errMsg     = submitError[dpr.id] || '';
              const wasOk      = submitOk[dpr.id] || false;
              const ql         = dpr.overall_score ?? 0;
              const risk       = riskLevel(dpr.risk_score);
              const isActioned = ['APPROVED','REJECTED'].includes(dpr.status?.toUpperCase());

              return (
                <div key={dpr.id} className="card" style={{
                  borderColor:
                    dpr.status === 'APPROVED' ? 'rgba(34,197,94,0.35)' :
                    dpr.status === 'REJECTED' ? 'rgba(244,63,94,0.35)' :
                    dec === 'approve'          ? 'rgba(34,197,94,0.3)' :
                    dec === 'reject'           ? 'rgba(244,63,94,0.3)' :
                    dec === 'pending'          ? 'rgba(245,158,11,0.3)' :
                    'var(--border)',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ padding: '18px 20px' }}>

                    {/* ── Header row ── */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

                      {/* Left: project info */}
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent-blue-light)' }}>{dpr.id.slice(0, 8)}…</span>
                          <span className={`badge badge-${risk.toLowerCase()}`}>{risk} Risk</span>
                          {statusBadge(dpr.status)}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                          {dpr.title || dpr.original_filename}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span>📍 {dpr.state}</span>
                          <span>🏭 {dpr.sector}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹ {dpr.estimated_cost?.toFixed(0)} Cr</span>
                          <span style={{ color: 'var(--text-muted)' }}>📅 {formatDate(dpr.upload_date)}</span>
                          {dpr.submitted_by && <span style={{ color: 'var(--text-muted)' }}>🏢 {dpr.submitted_by}</span>}
                        </div>
                      </div>

                      {/* Center: quality score */}
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', color: ql >= 80 ? 'var(--accent-green)' : ql >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                          {ql || '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Quality /100</div>
                      </div>

                      {/* Right: action buttons */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                        <Link href={`/dpr/${dpr.id}`} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }}>
                          <Eye size={13} /> Review
                        </Link>

                        {/* ── APPROVE ── */}
                        <button
                          onClick={() => setDecision(dpr.id, dec === 'approve' ? '' : 'approve')}
                          disabled={isBusy}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            cursor: isBusy ? 'not-allowed' : 'pointer', border: 'none',
                            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                            background: dec === 'approve' ? 'var(--accent-green)' : dpr.status === 'APPROVED' ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
                            color: dec === 'approve' ? 'white' : 'var(--accent-green)',
                            boxShadow: dec === 'approve' ? '0 2px 8px rgba(34,197,94,0.4)' : 'none',
                          }}
                        >
                          <CheckCircle size={13} />
                          Approve
                        </button>

                        {/* ── REJECT ── */}
                        <button
                          onClick={() => setDecision(dpr.id, dec === 'reject' ? '' : 'reject')}
                          disabled={isBusy}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            cursor: isBusy ? 'not-allowed' : 'pointer', border: 'none',
                            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                            background: dec === 'reject' ? '#ef4444' : dpr.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                            color: dec === 'reject' ? 'white' : '#ef4444',
                            boxShadow: dec === 'reject' ? '0 2px 8px rgba(239,68,68,0.4)' : 'none',
                          }}
                        >
                          <XCircle size={13} />
                          Reject
                        </button>

                        {/* ── KEEP PENDING ── */}
                        <button
                          onClick={() => setDecision(dpr.id, dec === 'pending' ? '' : 'pending')}
                          disabled={isBusy}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            cursor: isBusy ? 'not-allowed' : 'pointer', border: 'none',
                            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                            background: dec === 'pending' ? 'var(--accent-amber)' : 'rgba(245,158,11,0.1)',
                            color: dec === 'pending' ? 'white' : 'var(--accent-amber)',
                            boxShadow: dec === 'pending' ? '0 2px 8px rgba(245,158,11,0.4)' : 'none',
                          }}
                        >
                          <Clock size={13} />
                          Pending
                        </button>
                      </div>
                    </div>

                    {/* ── Reviewer info (actioned DPRs) ── */}
                    {isActioned && dpr.reviewed_by && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <User size={12} /> Reviewed by <strong style={{ color: 'var(--text-secondary)' }}>{dpr.reviewed_by}</strong>
                        </span>
                        {dpr.reviewed_at && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CalendarDays size={12} /> {formatDate(dpr.reviewed_at)}
                          </span>
                        )}
                        {dpr.approval_comment && (
                          <span style={{ fontStyle: 'italic' }}>"{dpr.approval_comment}"</span>
                        )}
                      </div>
                    )}

                    {/* ── Quick links row ── */}
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                      <Link
                        href={`/dpr/${dpr.id}/viewer`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <FileText size={12} /> PDF Preview
                      </Link>
                      <Link
                        href={`/ai-suggestions/${dpr.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Sparkles size={12} /> AI Suggestions
                      </Link>
                      {dpr.in_approvals && (
                        <button
                          onClick={() => loadCategoryRecs(dpr.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                          disabled={loadingRecs[dpr.id]}
                        >
                          {loadingRecs[dpr.id]
                            ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            : showRecs[dpr.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                          }
                          {loadingRecs[dpr.id] ? 'Loading…' : showRecs[dpr.id] ? 'Hide AI Recs' : 'View AI Recommendations'}
                        </button>
                      )}
                    </div>

                    {/* ── AI Category Recommendations Panel ── */}
                    {showRecs[dpr.id] && (
                      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={12} /> AI Category Recommendations
                        </div>
                        {recs[dpr.id]?.length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No recommendations found. Visit AI Suggestions to generate them.
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          {(recs[dpr.id] || []).map((rec) => {
                            const recColor = rec.status === 'Good' ? 'var(--accent-green)' : rec.status === 'Critical' ? '#ef4444' : 'var(--accent-amber)';
                            return (
                              <div key={rec.category} style={{
                                padding: '10px 12px', borderRadius: 9,
                                background: 'var(--bg-secondary)', border: `1px solid ${recColor}22`,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 16 }}>{rec.icon}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {rec.category}
                                    </div>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: recColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      {rec.status} · {rec.confidence}% confidence
                                    </div>
                                  </div>
                                </div>
                                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                  {rec.recommendation}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Decision confirm row ── */}

                    {dec && (
                      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {dec === 'approve' ? '✅ Confirming Approval' : dec === 'reject' ? '❌ Confirming Rejection' : '🕐 Setting Back to Pending'}
                          {' '}— add a mandatory comment:
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <textarea
                            className="input-field"
                            rows={2}
                            placeholder={
                              dec === 'approve'  ? 'Reason for approval… (e.g. All clearances verified, quality score adequate)' :
                              dec === 'reject'   ? 'Reason for rejection… (e.g. Missing EIA, cost estimates unrealistic)' :
                              'Reason for keeping pending… (e.g. Awaiting state NOC, additional info requested)'
                            }
                            style={{ resize: 'none', flex: 1 }}
                            value={comments[dpr.id] || ''}
                            onChange={e => setComments(prev => ({ ...prev, [dpr.id]: e.target.value }))}
                            disabled={isBusy}
                          />
                          <button
                            onClick={() => confirmDecision(dpr.id)}
                            disabled={isBusy}
                            style={{
                              padding: '9px 18px', borderRadius: 8, border: 'none',
                              fontSize: 12, fontWeight: 800, cursor: isBusy ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                              background:
                                dec === 'approve' ? 'var(--accent-green)' :
                                dec === 'reject'  ? '#ef4444' :
                                'var(--accent-amber)',
                              color: 'white',
                              opacity: isBusy ? 0.7 : 1,
                            }}
                          >
                            {isBusy ? 'Saving…' : `Confirm ${dec === 'approve' ? 'Approval' : dec === 'reject' ? 'Rejection' : 'Pending'}`}
                          </button>
                        </div>
                        {errMsg && <div style={{ marginTop: 7, fontSize: 12, color: '#ef4444' }}>⚠ {errMsg}</div>}
                      </div>
                    )}

                    {/* ── Success toast ── */}
                    {wasOk && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                        ✓ Status updated successfully
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
