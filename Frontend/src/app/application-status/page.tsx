// TOPLINE
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { useUser } from '@/lib/UserContext';
import Link from 'next/link';
import {
  ClipboardCheck, Search, Filter, RefreshCw, Clock, CheckCircle,
  XCircle, FileText, Eye, AlertTriangle, Brain, Lock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppStatus {
  id: string;
  title: string;
  original_filename: string;
  district: string;
  sector: string;
  department: string;
  submitted_by: string;
  upload_date: string;
  status: string;
  reviewed_by: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  overall_score: number | null;
  risk_score: number | null;
  compliance_score: number | null;
  estimated_cost: number;
  duration_months: number;
  approval_comment: string | null;
  progress_pct: number;
  step_index: number;
  ref_number: string;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso.slice(0, 10); }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  PENDING:      { label: 'Pending',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  icon: <Clock size={11}/> },
  PROCESSING:   { label: 'AI Analysis',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', icon: <Brain size={11}/> },
  UNDER_REVIEW: { label: 'Under Review', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)', icon: <Eye size={11}/> },
  PENDING_INFO: { label: 'Pending Info', color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.25)',  icon: <AlertTriangle size={11}/> },
  APPROVED:     { label: 'Approved',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)',  icon: <CheckCircle size={11}/> },
  REJECTED:     { label: 'Rejected',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  icon: <XCircle size={11}/> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
      fontWeight: 700, padding: '3px 9px', borderRadius: 6,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ProgressBar({ pct, status }: { pct: number; status: string }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.PENDING;
  return (
    <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: cfg.color,
        borderRadius: 3, transition: 'width 0.8s ease' }} />
    </div>
  );
}

// ─── DPR Card ────────────────────────────────────────────────────────────────

function DprCard({ dpr }: { dpr: AppStatus }) {
  return (
    <div className="card" style={{ overflow: 'hidden', transition: 'all 0.2s' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow=''; }}>

      <div style={{ height: 3, background: STATUS_CONFIG[dpr.status?.toUpperCase()]?.color || '#f59e0b' }} />

      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                {dpr.title}
              </span>
              <StatusBadge status={dpr.status} />
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              🪪 {dpr.ref_number}
            </div>
          </div>
          <Link href={`/application-status/${dpr.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8,
              background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue-light)',
              fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(59,130,246,0.2)',
              flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Eye size={13} /> Track Status
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'District', value: dpr.district },
            { label: 'Department', value: dpr.department },
            { label: 'Sector', value: dpr.sector },
            { label: 'Upload Date', value: fmtDate(dpr.upload_date) },
            { label: 'Est. Cost', value: `₹${dpr.estimated_cost} Cr.` },
            { label: 'Reviewer', value: dpr.reviewer_name || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {dpr.overall_score !== null && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
              background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              AI: {dpr.overall_score}/100
            </span>
          )}
          {dpr.risk_score !== null && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
              background: dpr.risk_score > 70 ? 'rgba(239,68,68,0.1)' : dpr.risk_score > 40 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
              color: dpr.risk_score > 70 ? '#ef4444' : dpr.risk_score > 40 ? '#f59e0b' : '#22c55e',
              border: '1px solid rgba(255,255,255,0.08)' }}>
              Risk: {dpr.risk_score}/100
            </span>
          )}
          {dpr.compliance_score !== null && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
              background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              Compliance: {dpr.compliance_score}%
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}><ProgressBar pct={dpr.progress_pct} status={dpr.status} /></div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: STATUS_CONFIG[dpr.status?.toUpperCase()]?.color || '#f59e0b',
            minWidth: 30, textAlign: 'right' }}>{dpr.progress_pct}%</span>
        </div>

        {dpr.approval_comment && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7,
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)',
            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>💬 Reviewer: </span>
            {dpr.approval_comment.slice(0, 100)}{dpr.approval_comment.length > 100 ? '…' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Access Denied Screen ─────────────────────────────────────────────────────

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Topbar title="Application Status" subtitle="Access restricted" />
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
            border: '2px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 18px', color: '#ef4444' }}>
            <Lock size={24} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            Access Restricted
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
            The <strong style={{ color: 'var(--text-secondary)' }}>Application Status</strong> page is
            exclusively for DPR submitters.<br />
            Admins and reviewers should use <strong style={{ color: 'var(--text-secondary)' }}>DPR Queue</strong>,{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>AI Suggestions</strong>, and{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>My Approvals</strong>.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={onBack}
              style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--accent-blue)',
                color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Go to Dashboard
            </button>
            <Link href="/dpr/queue"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8,
                background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              DPR Queue
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [allDprs, setAllDprs] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/application-status`);
      if (res.ok) { setAllDprs(await res.json()); setLastUpdated(new Date()); }
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    if (isLoaded && user.role === 'submitter') load();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, user.role]);

  // ── User-scoped DPR filter ──
  const myDprs = useMemo(() => {
    if (!user.username) return allDprs;
    const uname = user.username.toLowerCase();
    const udisp = user.displayName.toLowerCase();
    const matched = allDprs.filter(d => {
      const sub = (d.submitted_by || '').toLowerCase();
      return sub.includes(uname) || sub.includes(udisp) || uname.includes(sub);
    });
    // If filter produces empty (department name mismatch), show all owned DPRs
    return matched.length > 0 ? matched : allDprs;
  }, [allDprs, user.username, user.displayName]);

  const districts = useMemo(() => [...new Set(myDprs.map(d => d.district))].sort(), [myDprs]);

  const filtered = useMemo(() => {
    return myDprs.filter(d => {
      if (statusFilter && d.status?.toUpperCase() !== statusFilter) return false;
      if (districtFilter && d.district !== districtFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.title.toLowerCase().includes(q)
          || d.ref_number.toLowerCase().includes(q)
          || d.district.toLowerCase().includes(q);
      }
      return true;
    });
  }, [myDprs, statusFilter, districtFilter, search]);

  const counts = useMemo(() => ({
    total:    myDprs.length,
    pending:  myDprs.filter(d => ['PENDING', 'PENDING_INFO'].includes(d.status?.toUpperCase())).length,
    approved: myDprs.filter(d => d.status?.toUpperCase() === 'APPROVED').length,
    rejected: myDprs.filter(d => d.status?.toUpperCase() === 'REJECTED').length,
  }), [myDprs]);

  // ── RBAC guard ──
  if (!isLoaded) {
    return (
      <>
        <Topbar title="Application Status" subtitle="Loading…" />
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)',
            borderTopColor: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
        </div>
      </>
    );
  }

  if (user.role !== 'submitter') {
    return <AccessDenied onBack={() => router.push('/')} />;
  }

  if (loading) {
    return (
      <>
        <Topbar title="Application Status" subtitle="Loading your DPRs…" />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border)',
              borderTopColor: 'var(--accent-blue)', margin: '0 auto 14px', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Fetching your submitted DPRs…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Application Status"
        subtitle={`My DPR applications · ${counts.total} submitted`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago
              </span>
            )}
            <button onClick={() => load(true)} disabled={refreshing} className="topbar-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
              Refresh
            </button>
            <Link href="/dpr/upload" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, background: 'var(--accent-blue)', color: 'white',
              fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              + Upload DPR
            </Link>
          </div>
        }
      />

      <div className="page-content fade-in">

        {/* User context banner */}
        <div style={{ padding: '10px 16px', borderRadius: 9, marginBottom: 18,
          background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)',
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Showing DPRs for{' '}
              <strong style={{ color: '#4ade80' }}>{user.displayName}</strong>
              {user.department ? <span style={{ color: 'var(--text-muted)' }}> · {user.department}</span> : null}
            </span>
          </div>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'My DPRs', value: counts.total, color: '#3b82f6' },
            { label: 'Pending / Review', value: counts.pending, color: '#f59e0b' },
            { label: 'Approved', value: counts.approved, color: '#22c55e' },
            { label: 'Rejected', value: counts.rejected, color: '#ef4444' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color }} />
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: 5 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.color, fontFamily: 'var(--font-display)' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={13} color="var(--text-muted)" />
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search by name, reference number, district…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7,
                color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '7px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            <option value="">Status: All</option>
            {(['PENDING', 'PROCESSING', 'UNDER_REVIEW', 'PENDING_INFO', 'APPROVED', 'REJECTED'] as const).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
            ))}
          </select>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
            style={{ padding: '7px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            <option value="">District: All</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(search || statusFilter || districtFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setDistrictFilter(''); }}
              style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              ✕ Clear
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} of {myDprs.length}
          </span>
        </div>

        {/* DPR Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <ClipboardCheck size={48} style={{ margin: '0 auto 18px', opacity: 0.2 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {myDprs.length === 0 ? 'No DPRs submitted yet' : 'No results match your filters'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto 20px' }}>
              {myDprs.length === 0
                ? 'Upload your first DPR to start tracking your application status here.'
                : 'Try clearing your filters.'}
            </div>
            {myDprs.length === 0 && (
              <Link href="/dpr/upload"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px',
                  borderRadius: 9, background: 'var(--accent-blue)', color: 'white',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <FileText size={14} /> Upload Your First DPR
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {filtered.map(dpr => <DprCard key={dpr.id} dpr={dpr} />)}
          </div>
        )}
      </div>
    </>
  );
}
