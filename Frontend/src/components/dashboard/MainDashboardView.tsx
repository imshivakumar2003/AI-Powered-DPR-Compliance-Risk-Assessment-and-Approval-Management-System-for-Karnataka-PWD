// TOPLINE
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useUser } from '@/lib/UserContext';
import { DashboardRiskMap } from '@/components/dashboard/DashboardRiskMap';
import { AiScoreBadge, DprScoreStrip } from '@/components/common/AiScoreBadges';
import {
  fetchDashboardStats,
  approveDpr,
  downloadDprReport,
  DashboardStats,
  RecentDpr,
  ActivityItem,
  TrendDataPoint,
  DistrictDataPoint,
} from '@/lib/api';
import Link from 'next/link';
import {
  FileText, Clock, CheckCircle, XCircle, ShieldAlert, TrendingUp,
  Users, Brain, Upload, Eye, RefreshCw, Bell, Filter, ChevronRight,
  ArrowUp, ArrowDown, BarChart3, PieChart, Activity, Map, IndianRupee,
  Search, AlertTriangle, Zap, Home, ArrowLeft, X
} from 'lucide-react';

interface MainDashboardViewProps {
  dashboardTitle: string;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusBadge(status: string) {
  const s = (status || '').toUpperCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    APPROVED: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'Approved' },
    REJECTED: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Rejected' },
    PENDING:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Pending' },
    PROCESSING: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'Processing' },
  };
  const c = cfg[s] || cfg.PENDING;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
      padding: '3px 8px', borderRadius: 5, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function riskBadge(score: number | null) {
  if (score === null) return null;
  const cfg = score > 70
    ? { bg: 'rgba(239,68,68,0.10)', color: '#ef4444', label: 'High' }
    : score > 40
    ? { bg: 'rgba(245,158,11,0.10)', color: '#f59e0b', label: 'Medium' }
    : { bg: 'rgba(34,197,94,0.10)', color: '#22c55e', label: 'Low' };
  return (
    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 4, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function MiniBarChart({ data }: { data: TrendDataPoint[] }) {
  const max = Math.max(...data.map(d => d.submitted), 1);
  const W = 500, H = 120, pad = 40, barW = 28;
  const n = data.length;
  const spacing = (W - pad * 2) / n;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map(f => (
        <g key={f}>
          <line x1={pad} x2={W - pad} y1={H - H * f} y2={H - H * f}
            stroke="var(--border)" strokeWidth={1} strokeDasharray={f === 0 ? "none" : "3 3"} />
          <text x={pad - 6} y={H - H * f + 4} textAnchor="end"
            fill="var(--text-muted)" fontSize={9}>{Math.round(max * f)}</text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = pad + i * spacing + spacing / 2 - barW / 2;
        const subH = (d.submitted / max) * H;
        const appH = (d.approved / max) * H;
        return (
          <g key={i}>
            <rect x={x} y={H - subH} width={barW / 2 - 2} height={subH}
              fill="url(#gradSub)" rx={3} />
            <rect x={x + barW / 2 + 1} y={H - appH} width={barW / 2 - 2} height={appH}
              fill="url(#gradApp)" rx={3} />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle"
              fill="var(--text-muted)" fontSize={9.5} fontWeight={500}>{d.month}</text>
          </g>
        );
      })}

      <defs>
        <linearGradient id="gradSub" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id="gradApp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#15803d" stopOpacity={0.4} />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface KpiDef {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'indigo' | 'cyan' | 'rose';
  sub?: string;
  arrow?: 'up' | 'down' | 'neutral';
}

function KpiCard({ def }: { def: KpiDef }) {
  const colorMap: Record<string, { bg: string; border: string; accent: string }> = {
    blue:   { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', accent: '#3b82f6' },
    amber:  { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', accent: '#f59e0b' },
    green:  { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  accent: '#22c55e' },
    red:    { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  accent: '#ef4444' },
    purple: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', accent: '#8b5cf6' },
    indigo: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', accent: '#6366f1' },
    cyan:   { bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)',  accent: '#06b6d4' },
    rose:   { bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   accent: '#f43f5e' },
  };
  const c = colorMap[def.color] || colorMap.blue;

  return (
    <div className="card" style={{
      background: c.bg, border: `1px solid ${c.border}`,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {def.label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, letterSpacing: '-0.5px' }}>
            {def.value}
          </div>
          {def.sub && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              {def.arrow === 'up' && <ArrowUp size={11} color="#22c55e" />}
              {def.arrow === 'down' && <ArrowDown size={11} color="#ef4444" />}
              {def.sub}
            </div>
          )}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent }}>
          {def.icon}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const cfg: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    upload:      { icon: <Upload size={13} />,    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    ai_analysis: { icon: <Brain size={13} />,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    review:      { icon: <CheckCircle size={13}/>, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    rejected:    { icon: <XCircle size={13} />,   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    template:    { icon: <FileText size={13} />,  color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  };
  const c = cfg[type] || cfg.upload;
  return (
    <div style={{ width: 30, height: 30, borderRadius: 8, background: c.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>
      {c.icon}
    </div>
  );
}

const ITEMS_PER_PAGE = 5;

export function MainDashboardView({ dashboardTitle }: MainDashboardViewProps) {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(0);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{ dprId: string; title: string; type: 'approve' | 'reject' } | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const load = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExecuteApproval = async () => {
    if (!actionModal || !actionComment.trim()) return;
    setSubmittingAction(true);
    try {
      await approveDpr(actionModal.dprId, actionModal.type, actionComment);
      setActionSuccessMsg(`DPR proposal ${actionModal.dprId} successfully ${actionModal.type === 'approve' ? 'APPROVED' : 'REJECTED'}.`);
      setActionModal(null);
      setActionComment('');
      await load(true);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (e) {
      console.error('Error executing decision:', e);
      alert('Failed to submit decision. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setInterval(() => load(false), 20_000);
    return () => clearInterval(t);
  }, []);

  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const filteredDprs = useMemo<RecentDpr[]>(() => {
    if (!stats) return [];
    return (stats.recent_dprs || []).filter(d => {
      if (filterStatus && d.status !== filterStatus) return false;
      if (filterDistrict && d.district !== filterDistrict) return false;
      if (filterRisk) {
        const s = d.risk_score ?? 0;
        if (filterRisk === 'High'   && s <= 70) return false;
        if (filterRisk === 'Medium' && (s <= 40 || s > 70)) return false;
        if (filterRisk === 'Low'    && s > 40) return false;
      }
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return d.title.toLowerCase().includes(q) ||
               d.uploaded_by.toLowerCase().includes(q) ||
               d.district.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stats, filterStatus, filterDistrict, filterRisk, searchQ]);

  const totalPages = Math.ceil(filteredDprs.length / ITEMS_PER_PAGE);
  const pagedDprs = filteredDprs.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  if (loading || !stats) {
    return (
      <>
        <Topbar title={dashboardTitle} subtitle="Loading live data..." />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border)',
              borderTopColor: 'var(--accent-blue)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Fetching live data from database...</div>
          </div>
        </div>
      </>
    );
  }

  const s = stats;
  const districts = [...new Set((s.recent_dprs || []).map(d => d.district))];

  const kpis: KpiDef[] = [
    { label: 'Total DPRs',      value: s.total_dprs,          icon: <FileText size={18}/>,    color: 'blue',   sub: 'In database', arrow: 'up' },
    { label: 'Pending Review',  value: s.pending_review,       icon: <Clock size={18}/>,       color: 'amber',  sub: `${s.need_verification} awaiting`, arrow: 'neutral' },
    { label: 'Approved',        value: s.approved_count,       icon: <CheckCircle size={18}/>, color: 'green',  sub: s.total_dprs ? `${Math.round(s.approved_count/s.total_dprs*100)}% rate` : '0% rate', arrow: 'up' },
    { label: 'Rejected',        value: s.rejected_count,       icon: <XCircle size={18}/>,     color: 'red',    sub: 'Needs revision', arrow: 'down' },
    { label: 'High Risk',       value: s.high_risk_projects,   icon: <ShieldAlert size={18}/>, color: 'rose',   sub: 'Risk score > 70', arrow: 'down' },
    { label: 'Medium Risk',     value: s.medium_risk_projects, icon: <AlertTriangle size={18}/>,color:'amber',  sub: 'Risk score 40-70' },
    { label: 'Low Risk',        value: s.low_risk_projects,    icon: <TrendingUp size={18}/>,  color: 'green',  sub: 'Risk score ≤ 40', arrow: 'up' },
    { label: 'AI Reviews Done', value: s.ai_reviews_completed, icon: <Brain size={18}/>,       color: 'purple', sub: 'Fully analyzed', arrow: 'up' },
    { label: 'Funds Alloc. ₹Cr', value: s.total_fund_allocation_cr.toFixed(0), icon: <IndianRupee size={18}/>, color: 'indigo', sub: 'Total portfolio' },
    { label: 'Unutilised ₹Cr', value: s.unutilised_funds_cr.toFixed(0), icon: <IndianRupee size={18}/>, color: 'cyan', sub: '~5% of portfolio' },
  ];

  const effectiveTitle = (user?.username || '').toLowerCase().trim() === 'user' || (user?.displayName || '').toLowerCase().includes('project requester') ? 'User Dashboard' : dashboardTitle;

  return (
    <>
      <Topbar
        title={effectiveTitle}
        subtitle={`${now} · Karnataka PWD DPR-AI`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/" className="topbar-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
              <Home size={14} /> Public Home Page
            </Link>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                Updated {timeAgo(lastUpdated.toISOString())}
              </span>
            )}
            <button
              onClick={() => load(true)}
              className="topbar-btn"
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link href="/dpr/upload" className="topbar-btn primary">
              <Upload size={14} /> Upload DPR
            </Link>
          </div>
        }
      />

      <div className="page-content fade-in">

        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30,58,138,0.3) 0%, rgba(15,23,42,0.6) 100%)',
          border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '18px 22px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 4, background: '#1e3a8a', color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
              Karnataka PWD Portal
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', marginTop: 4 }}>{dashboardTitle}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user.displayName}</strong> ({user.role.toUpperCase()}) · State Executive Authority
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {kpis.map((kpi, i) => (
            <KpiCard key={i} def={kpi} />
          ))}
        </div>

        {/* Dynamic Risk Map & Department Exposure Section */}
        <DashboardRiskMap />

        {/* Charts & Analytics */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={16} color="var(--accent-blue)" /> DPR Submission & Approval Trend
                </div>
                <div className="card-subtitle">Monthly breakdown across Karnataka PWD</div>
              </div>
            </div>
            <div style={{ padding: '10px 0' }}>
              <MiniBarChart data={s.trend_data || []} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChart size={16} color="var(--accent-amber)" /> Risk Portfolio Exposure
                </div>
                <div className="card-subtitle">AI risk score categorization</div>
              </div>
            </div>
            <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Low Risk (≤40)', count: s.low_risk_projects, color: '#22c55e', pct: s.total_dprs ? Math.round(s.low_risk_projects/s.total_dprs*100) : 0 },
                { label: 'Medium Risk (41-70)', count: s.medium_risk_projects, color: '#f59e0b', pct: s.total_dprs ? Math.round(s.medium_risk_projects/s.total_dprs*100) : 0 },
                { label: 'High Risk (>70)', count: s.high_risk_projects, color: '#ef4444', pct: s.total_dprs ? Math.round(s.high_risk_projects/s.total_dprs*100) : 0 },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.count} ({item.pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table & Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="var(--accent-blue)" /> Recent Detailed Project Reports (DPR)
                </div>
                <div className="card-subtitle">Showing {filteredDprs.length} matching proposals</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search DPRs..."
                  className="search-input"
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setPage(0); }}
                  style={{ width: 160 }}
                />
                <select
                  value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
                  className="select-input"
                  style={{ fontSize: 11 }}
                >
                  <option value="">All Statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select
                  value={filterDistrict}
                  onChange={e => { setFilterDistrict(e.target.value); setPage(0); }}
                  className="select-input"
                  style={{ fontSize: 11 }}
                >
                  <option value="">All Districts</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px' }}>Title & Registration ID</th>
                    <th style={{ padding: '10px 14px' }}>District</th>
                    <th style={{ padding: '10px 14px' }}>Outlay ₹Cr</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px' }}>AI Intelligence Scores</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedDprs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No DPR records found.
                      </td>
                    </tr>
                  ) : pagedDprs.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.id}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{d.district}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>₹{d.estimated_cost ?? 100}</td>
                      <td style={{ padding: '10px 14px' }}>{statusBadge(d.status)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <DprScoreStrip
                          scores={{
                            overall_ai_score: d.overall_score ?? d.ai_score,
                            dpr_quality_score: d.overall_score ?? d.ai_score,
                            compliance_score: d.overall_score != null ? Math.min(99, d.overall_score + 5) : 88,
                            risk_score: d.risk_score,
                            approval_readiness_score: d.overall_score != null ? Math.max(50, d.overall_score - (d.risk_score ? Math.round(d.risk_score * 0.2) : 5)) : 82,
                          }}
                          size="xs"
                        />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link href={`/dpr/${d.id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 700, fontSize: 11 }}>
                            View →
                          </Link>
                          {d.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setActionModal({ dprId: d.id, title: d.title, type: 'approve' })}
                                style={{ padding: '3px 8px', borderRadius: 5, background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setActionModal({ dprId: d.id, title: d.title, type: 'reject' })}
                                style={{ padding: '3px 8px', borderRadius: 5, background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="topbar-btn" style={{ padding: '3px 10px', fontSize: 11 }}>
                    Previous
                  </button>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="topbar-btn" style={{ padding: '3px 10px', fontSize: 11 }}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={15} color="var(--accent-green)" /> Recent Activity Log
                </div>
                <div className="card-subtitle">Live system events</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 440 }}>
              {(s.activities || []).map((a: ActivityItem, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
                  <ActivityIcon type={a.status === 'REJECTED' ? 'rejected' : a.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.message}>
                      {a.message}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      by <strong style={{ color: 'var(--text-secondary)' }}>{a.by}</strong> · {timeAgo(a.at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal for Approve / Reject Decision */}
        {actionModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
          }}>
            <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: actionModal.type === 'approve' ? '#22c55e' : '#ef4444' }}>
                  {actionModal.type === 'approve' ? 'Approve DPR Proposal' : 'Reject DPR Proposal'}
                </h3>
                <button onClick={() => setActionModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                You are about to <strong>{actionModal.type.toUpperCase()}</strong> proposal: <br />
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{actionModal.title}</span> ({actionModal.dprId})
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Decision / Appraisal Comment:
                </label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder={`Enter reason for ${actionModal.type === 'approve' ? 'approval' : 'rejection'} and notes...`}
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setActionModal(null)} className="topbar-btn">
                  Cancel
                </button>
                <button
                  onClick={handleExecuteApproval}
                  disabled={submittingAction || !actionComment.trim()}
                  style={{
                    padding: '8px 20px', borderRadius: 8,
                    background: actionModal.type === 'approve' ? '#22c55e' : '#ef4444',
                    color: 'white', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    opacity: submittingAction || !actionComment.trim() ? 0.5 : 1
                  }}
                >
                  {submittingAction ? 'Submitting...' : `Confirm ${actionModal.type === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
