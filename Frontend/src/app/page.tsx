// TOPLINE
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useUser } from '@/lib/UserContext';
import {
  fetchDashboardStats,
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
  Search, AlertTriangle, Zap,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
}

function fmtDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso.slice(0, 16); }
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

// ─── Mini bar chart (SVG, no lib) ────────────────────────────────────────────

function MiniBarChart({ data }: { data: TrendDataPoint[] }) {
  const max = Math.max(...data.map(d => d.submitted), 1);
  const W = 500, H = 120, pad = 40, barW = 28;
  const n = data.length;
  const spacing = (W - pad * 2) / n;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ overflow: 'visible' }}>
      {/* Y grid */}
      {[0, 0.5, 1].map(f => (
        <g key={f}>
          <line x1={pad} x2={W - pad} y1={H - H * f} y2={H - H * f}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          <text x={pad - 6} y={H - H * f + 4} textAnchor="end"
            fill="rgba(255,255,255,0.3)" fontSize={9}>{Math.round(max * f)}</text>
        </g>
      ))}

      {data.map((d, i) => {
        const cx = pad + i * spacing + spacing / 2;
        const h1 = d.submitted / max * H;
        const h2 = d.approved / max * H;
        const h3 = d.rejected / max * H;
        return (
          <g key={i}>
            {/* submitted */}
            <rect x={cx - barW * 1.5} y={H - h1} width={barW} height={h1}
              fill="rgba(59,130,246,0.7)" rx={2} />
            {/* approved */}
            <rect x={cx - barW * 0.5} y={H - h2} width={barW} height={h2}
              fill="rgba(34,197,94,0.7)" rx={2} />
            {/* rejected */}
            <rect x={cx + barW * 0.5} y={H - h3} width={barW} height={h3}
              fill="rgba(239,68,68,0.65)" rx={2} />
            <text x={cx} y={H + 16} textAnchor="middle"
              fill="rgba(255,255,255,0.4)" fontSize={9}>{d.month}</text>
          </g>
        );
      })}

      {/* Legend */}
      {[
        { color: 'rgba(59,130,246,0.8)', label: 'Submitted' },
        { color: 'rgba(34,197,94,0.8)',  label: 'Approved' },
        { color: 'rgba(239,68,68,0.75)', label: 'Rejected' },
      ].map((l, i) => (
        <g key={i} transform={`translate(${pad + i * 90}, ${H + 30})`}>
          <rect width={10} height={10} fill={l.color} rx={2} />
          <text x={14} y={9} fill="rgba(255,255,255,0.5)" fontSize={9}>{l.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Mini horizontal bar chart for district data ──────────────────────────────

function DistrictChart({ data }: { data: DistrictDataPoint[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.slice(0, 6).map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.district}>{d.district}</span>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4, width: `${d.total / max * 100}%`,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              transition: 'width 0.8s ease',
            }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{d.total}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart (SVG) ────────────────────────────────────────────────────────

function DonutChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140,
      color: 'var(--text-muted)', fontSize: 12 }}>No data yet</div>
  );
  const r = 50, cx = 70, cy = 70, strokeW = 18;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = items.map(item => {
    const frac = item.value / total;
    const dash = frac * circ;
    const gap = circ - dash;
    const slice = { dash, gap, offset: offset * circ, item };
    offset += frac;
    return slice;
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width={140} height={140} style={{ flexShrink: 0 }}>
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={strokeW} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.item.color}
            strokeWidth={strokeW} strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset} transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--text-primary)" fontSize={20} fontWeight={800}>{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiDef {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; sub?: string; arrow?: 'up' | 'down' | 'neutral';
}

function KpiCard({ label, value, icon, color, sub, arrow }: KpiDef) {
  const colors: Record<string, { bg: string; accent: string; grad: string }> = {
    blue:   { bg: 'rgba(59,130,246,0.08)',  accent: '#3b82f6', grad: '#60a5fa' },
    green:  { bg: 'rgba(34,197,94,0.08)',   accent: '#22c55e', grad: '#4ade80' },
    amber:  { bg: 'rgba(245,158,11,0.08)',  accent: '#f59e0b', grad: '#fbbf24' },
    red:    { bg: 'rgba(239,68,68,0.08)',   accent: '#ef4444', grad: '#f87171' },
    purple: { bg: 'rgba(139,92,246,0.08)',  accent: '#8b5cf6', grad: '#a78bfa' },
    cyan:   { bg: 'rgba(6,182,212,0.08)',   accent: '#06b6d4', grad: '#22d3ee' },
    indigo: { bg: 'rgba(99,102,241,0.08)',  accent: '#6366f1', grad: '#818cf8' },
    rose:   { bg: 'rgba(244,63,94,0.08)',   accent: '#f43f5e', grad: '#fb7185' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${c.accent}, ${c.grad})` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
          {sub && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {arrow === 'up'   && <ArrowUp size={10} color="var(--accent-green)" />}
              {arrow === 'down' && <ArrowDown size={10} color="var(--accent-red)" />}
              {sub}
            </div>
          )}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Activity icon ────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  const cfg: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    upload:      { icon: <Upload size={13} />,    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    ai_analysis: { icon: <Brain size={13} />,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    review:      { icon: <CheckCircle size={13}/>, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    rejected:    { icon: <XCircle size={13} />,   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };
  const c = cfg[type] || cfg.upload;
  return (
    <div style={{ width: 30, height: 30, borderRadius: 8, background: c.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>
      {c.icon}
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;

export default function DashboardPage() {
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

  useEffect(() => { load(); }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(() => load(false), 60_000);
    return () => clearInterval(t);
  }, []);

  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Filtered Recent DPRs ───────────────────────────────────────────────────
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

  if (loading) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="Loading live data..." />
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

  const s = stats!;
  const districts = [...new Set((s.recent_dprs || []).map(d => d.district))];

  // ── KPI rows ───────────────────────────────────────────────────────────────
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

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`${now} · Karnataka PWD DPR-AI`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
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

        {/* ── Welcome Banner ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 20, padding: '12px 18px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
          border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, background: 'var(--accent-green)', borderRadius: '50%',
              display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user.displayName}</strong>
              {' · '}<span style={{ color: 'var(--accent-blue-light)' }}>Karnataka PWD Admin</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(s.notifications || []).slice(0, 2).map((n, i) => (
              <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6,
                background: n.type === 'danger' ? 'rgba(239,68,68,0.1)' : n.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                color: n.type === 'danger' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#3b82f6',
                border: `1px solid ${n.type === 'danger' ? 'rgba(239,68,68,0.2)' : n.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`,
              }}>
                {n.icon} {n.message}
              </span>
            ))}
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
          {kpis.slice(0, 5).map((k, i) => <KpiCard key={i} {...k} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          {kpis.slice(5).map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        {/* ── Quick Actions ── */}
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={13} color="var(--accent-amber)" /> Quick Actions
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { href: '/dpr/upload',       icon: <Upload size={14}/>,     label: 'Upload DPR',         bg: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
              { href: '/dpr/queue',        icon: <Clock size={14}/>,      label: 'Review Pending',      bg: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
              { href: '/ai-suggestions',   icon: <Brain size={14}/>,      label: 'AI Suggestions',      bg: 'linear-gradient(135deg,#8b5cf6,#6366f1)' },
              { href: '/dpr/approvals',    icon: <CheckCircle size={14}/>,label: 'My Approvals',        bg: 'linear-gradient(135deg,#22c55e,#16a34a)' },
              { href: '/reports',          icon: <BarChart3 size={14}/>,  label: 'Reports',             bg: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
              { href: '/settings',         icon: <Users size={14}/>,      label: 'Manage Settings',     bg: 'linear-gradient(135deg,#64748b,#475569)' },
            ].map((a, i) => (
              <Link key={i} href={a.href} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px',
                background: a.bg, color: 'white', borderRadius: 9, fontSize: 12, fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)'; }}
              >
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Monthly Trend */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={15} color="var(--accent-blue)" /> Monthly DPR Trend
                </div>
                <div className="card-subtitle">Submissions, approvals & rejections (last 6 months)</div>
              </div>
              <span className="badge badge-approved">Live DB</span>
            </div>
            <div style={{ padding: '8px 16px 4px' }}>
              {(s.trend_data || []).length > 0
                ? <MiniBarChart data={s.trend_data} />
                : <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>No data yet</div>
              }
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChart size={15} color="var(--accent-purple)" /> Status Distribution
                </div>
                <div className="card-subtitle">Approval vs Rejection</div>
              </div>
            </div>
            <div style={{ padding: '8px 16px 16px' }}>
              <DonutChart items={(s.status_distribution || []).map(d => ({
                label: d.status, value: d.count, color: d.color,
              }))} />
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={15} color="var(--accent-red)" /> Risk Distribution
                </div>
                <div className="card-subtitle">AI risk level breakdown</div>
              </div>
            </div>
            <div style={{ padding: '8px 16px 16px' }}>
              <DonutChart items={(s.risk_distribution || []).map(d => ({
                label: d.level + ' Risk', value: d.count, color: d.color,
              }))} />
            </div>
          </div>
        </div>

        {/* ── District + Notifications ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* District-wise chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Map size={15} color="var(--accent-cyan)" /> District-wise DPR Count
                </div>
                <div className="card-subtitle">Top 6 districts by total DPRs</div>
              </div>
            </div>
            <div style={{ padding: '8px 20px 16px' }}>
              {(s.district_data || []).length > 0
                ? <DistrictChart data={s.district_data} />
                : <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 12 }}>No district data</div>
              }
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={15} color="var(--accent-amber)" /> Notifications
                </div>
                <div className="card-subtitle">Alerts from live database</div>
              </div>
            </div>
            <div style={{ padding: '4px 0 8px' }}>
              {(s.notifications || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                  ✅ All clear — no pending alerts
                </div>
              ) : (s.notifications || []).map((n, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                  borderBottom: i < (s.notifications.length - 1) ? '1px solid rgba(45,55,72,0.5)' : 'none',
                }}>
                  <span style={{ fontSize: 18 }}>{n.icon}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', flex: 1 }}>{n.message}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4,
                    background: n.type === 'danger' ? 'rgba(239,68,68,0.1)' : n.type === 'warning' ? 'rgba(245,158,11,0.1)' : n.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                    color: n.type === 'danger' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : n.type === 'success' ? '#22c55e' : '#3b82f6',
                  }}>
                    {n.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent DPRs + Activity Feed ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Recent DPRs with filters */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={15} color="var(--accent-blue)" /> Recent DPRs
                </div>
                <div className="card-subtitle">Latest from database · {filteredDprs.length} results</div>
              </div>
              <Link href="/dpr/queue" className="topbar-btn" style={{ padding: '5px 12px', fontSize: 12 }}>
                View All →
              </Link>
            </div>

            {/* Filters */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(45,55,72,0.4)',
              display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
                <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  placeholder="Search DPR name, uploader…"
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setPage(0); }}
                  style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7,
                    color: 'var(--text-primary)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
                style={{ padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
                <option value="">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PENDING">Pending</option>
              </select>
              <select value={filterDistrict} onChange={e => { setFilterDistrict(e.target.value); setPage(0); }}
                style={{ padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
                <option value="">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(0); }}
                style={{ padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
                <option value="">All Risk Levels</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
              {(filterStatus || filterDistrict || filterRisk || searchQ) && (
                <button onClick={() => { setFilterStatus(''); setFilterDistrict(''); setFilterRisk(''); setSearchQ(''); setPage(0); }}
                  style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Table */}
            {pagedDprs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                {s.recent_dprs.length === 0 ? '📂 No DPRs uploaded yet.' : '🔍 No results match your filters.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['DPR Name', 'Uploaded By', 'District', 'Date', 'Status', 'AI Score', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10,
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
                          color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDprs.map((dpr, i) => (
                      <tr key={dpr.id}
                        style={{ borderBottom: '1px solid rgba(45,55,72,0.4)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.03)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)',
                            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={dpr.title}>{dpr.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{dpr.sector}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-secondary)' }}>{dpr.uploaded_by}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-secondary)' }}>{dpr.district}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {fmtDate(dpr.upload_date)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>{statusBadge(dpr.status)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {dpr.ai_score !== null
                            ? <span style={{ fontSize: 13, fontWeight: 800,
                                color: (dpr.ai_score ?? 0) >= 80 ? '#22c55e' : (dpr.ai_score ?? 0) >= 60 ? '#f59e0b' : '#ef4444' }}>
                                {dpr.ai_score}
                              </span>
                            : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          }
                          {' '}{riskBadge(dpr.risk_score)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <Link href={`/dpr/${dpr.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 11px', borderRadius: 7, background: 'rgba(59,130,246,0.1)',
                              color: 'var(--accent-blue)', fontSize: 11, fontWeight: 700, textDecoration: 'none',
                              transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.2)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.1)'}
                          >
                            <Eye size={12} /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderTop: '1px solid rgba(45,55,72,0.4)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Page {page + 1} of {totalPages} · {filteredDprs.length} records
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)',
                      background: page === 0 ? 'transparent' : 'var(--bg-secondary)',
                      color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ← Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)',
                      background: page >= totalPages - 1 ? 'transparent' : 'var(--bg-secondary)',
                      color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={15} color="var(--accent-green)" /> Recent Activity
                </div>
                <div className="card-subtitle">Live event log from database</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 480 }}>
              {(s.activities || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                  No activities yet.
                </div>
              ) : (s.activities || []).map((a: ActivityItem, i: number) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '12px 18px',
                  borderBottom: i < (s.activities.length - 1) ? '1px solid rgba(45,55,72,0.35)' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <ActivityIcon type={a.status === 'REJECTED' ? 'rejected' : a.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={a.message}>{a.message}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                      by <strong style={{ color: 'var(--text-secondary)' }}>{a.by}</strong>
                      {' · '}{timeAgo(a.at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer note ── */}
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: 'var(--text-muted)',
          borderTop: '1px solid rgba(45,55,72,0.4)', marginTop: 8 }}>
          All data is fetched live from the database · Auto-refreshes every 60 seconds
          {lastUpdated && ` · Last updated: ${lastUpdated.toLocaleTimeString('en-IN')}`}
        </div>

      </div>
    </>
  );
}
