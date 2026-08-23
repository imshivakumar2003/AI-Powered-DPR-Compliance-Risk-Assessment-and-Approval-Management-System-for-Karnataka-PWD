// TOPLINE
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { DashboardStats, RecentDpr } from '@/lib/api';
import { CurrentUser } from '@/lib/UserContext';
import { DprAiChatbot } from '@/components/dashboard/DprAiChatbot';
import {
  FileText, CheckCircle, Clock, XCircle, ShieldAlert,
  Brain, RefreshCw, Eye, Search, Filter, Map, BarChart3,
  TrendingUp, ArrowRight, ClipboardCheck, Sparkles, AlertTriangle,
  IndianRupee, Building2, ChevronRight, Layers
} from 'lucide-react';

interface ViewerDashboardProps {
  stats: DashboardStats;
  user: CurrentUser;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: Date | null;
}

const ITEMS_PER_PAGE = 6;

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
    APPROVED:     { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.25)', label: 'Approved' },
    REJECTED:     { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.25)', label: 'Rejected' },
    PENDING:      { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', label: 'Pending' },
    PROCESSING:   { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.25)', label: 'AI Analysis' },
    UNDER_REVIEW: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', border: 'rgba(251,146,60,0.25)', label: 'Under Review' },
  };
  const c = cfg[s] || cfg.PENDING;
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      ● {c.label}
    </span>
  );
}

function riskBadge(score: number | null) {
  if (score === null) return null;
  const cfg = score > 70
    ? { bg: 'rgba(239,68,68,0.10)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', label: 'High Risk' }
    : score > 40
    ? { bg: 'rgba(245,158,11,0.10)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)', label: 'Med Risk' }
    : { bg: 'rgba(34,197,94,0.10)', color: '#22c55e', border: 'rgba(34,197,94,0.2)', label: 'Low Risk' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 5, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label} ({score})
    </span>
  );
}

export function ViewerDashboard({ stats, user, onRefresh, refreshing, lastUpdated }: ViewerDashboardProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [page, setPage] = useState(0);

  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const recentDprs = stats.recent_dprs || [];
  const districts = useMemo(() => [...new Set(recentDprs.map(d => d.district))].sort(), [recentDprs]);
  const sectors = useMemo(() => [...new Set(recentDprs.map(d => d.sector))].sort(), [recentDprs]);

  const filteredDprs = useMemo(() => {
    return recentDprs.filter(d => {
      if (statusFilter && d.status?.toUpperCase() !== statusFilter) return false;
      if (districtFilter && d.district !== districtFilter) return false;
      if (sectorFilter && d.sector !== sectorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.title.toLowerCase().includes(q) ||
               d.uploaded_by.toLowerCase().includes(q) ||
               d.district.toLowerCase().includes(q) ||
               d.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [recentDprs, statusFilter, districtFilter, sectorFilter, search]);

  const totalPages = Math.ceil(filteredDprs.length / ITEMS_PER_PAGE);
  const pagedDprs = filteredDprs.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // Sector breakdown stats
  const sectorCounts = useMemo(() => {
    const map: Record<string, number> = {};
    recentDprs.forEach(d => {
      const s = d.sector || 'Other';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count);
  }, [recentDprs]);

  const totalFundAlloc = stats.total_fund_allocation_cr || 0;
  const lowRiskPct = stats.total_dprs > 0 ? Math.round(((stats.low_risk_projects || 0) / stats.total_dprs) * 100) : 0;

  return (
    <>
      <Topbar
        title="Viewer Dashboard"
        subtitle={`${now} · Karnataka PWD Infrastructure Monitoring`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Updated {timeAgo(lastUpdated.toISOString())}
              </span>
            )}
            <button
              onClick={onRefresh}
              className="topbar-btn"
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link href="/application-status" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, background: 'var(--accent-blue)', color: 'white',
              fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <ClipboardCheck size={14} /> Track Application Status
            </Link>
          </div>
        }
      />

      <div className="page-content fade-in">

        {/* ── Viewer Hero Banner ── */}
        <div style={{
          padding: '20px 24px', borderRadius: 14, marginBottom: 22,
          background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(59,130,246,0.08))',
          border: '1px solid rgba(6,182,212,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0
            }}>
              <Eye size={24} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
                Welcome to Viewer Portal Mode
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Public & stakeholder transparency hub for monitoring Karnataka PWD infrastructure projects, AI assessments, and status stages.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/application-status" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 8, background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)',
              fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <ClipboardCheck size={14} /> Application Status
            </Link>
            <Link href="/dpr/queue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
              fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              <FileText size={14} /> DPR Queue
            </Link>
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Monitored DPRs', value: stats.total_dprs, icon: <FileText size={18}/>, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', sub: 'Active in portal' },
            { label: 'Approved DPRs', value: stats.approved_count, icon: <CheckCircle size={18}/>, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', sub: `${stats.total_dprs ? Math.round(stats.approved_count/stats.total_dprs*100) : 0}% approval rate` },
            { label: 'Under Review', value: stats.pending_review, icon: <Clock size={18}/>, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', sub: 'In assessment pipeline' },
            { label: 'Total Investment', value: `₹${totalFundAlloc.toFixed(0)} Cr`, icon: <IndianRupee size={18}/>, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', sub: 'Allocated budget' },
            { label: 'Low Risk Projects', value: `${lowRiskPct}%`, icon: <TrendingUp size={18}/>, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', sub: `${stats.low_risk_projects || 0} projects compliant` },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                  {k.label}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
                  {k.icon}
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                {k.value}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Status & Sector Insights Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
          
          {/* Left: Sector Breakdown */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} color="var(--accent-blue)" /> Sector Project Distribution
              </div>
              <Link href="/analytics" style={{ fontSize: 11, color: 'var(--accent-blue-light)', fontWeight: 600, textDecoration: 'none' }}>
                View Analytics →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sectorCounts.slice(0, 5).map((sec, i) => {
                const pct = Math.round((sec.count / (recentDprs.length || 1)) * 100);
                const colors = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#06b6d4'];
                const color = colors[i % colors.length];
                return (
                  <div key={sec.sector}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{sec.sector}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sec.count} DPRs ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Application Status Quick Tracker & Shortcuts */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardCheck size={16} color="#06b6d4" /> Fast Track Application Status
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                Track approval steps, reviewer comments, revision versions, and progress percentages for any submitted DPR application.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <Link href="/application-status" style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', textDecoration: 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', marginBottom: 2 }}>📋 All Applications</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Track status across all districts</div>
                </Link>
                <Link href="/risk-map" style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textDecoration: 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 2 }}>🗺️ Risk Map</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Geographic risk distribution</div>
                </Link>
                <Link href="/analytics" style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', textDecoration: 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>📊 District Analytics</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Per-district compliance metrics</div>
                </Link>
                <Link href="/dpr-guide" style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', textDecoration: 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 2 }}>📖 DPR Guide</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Karnataka PWD Guidelines</div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Separate DPR Queue Module Link Card ── */}
        <div className="card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={20} color="#06b6d4" /> Standalone DPR Queue Module Workspace
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 650, lineHeight: 1.5 }}>
                The DPR Queue has been separated into its own dedicated workspace. Access the full DPR Queue module to inspect proposals, run multi-filters, view uploaded PDF documents, and track approval workflows.
              </div>
            </div>
            <Link
              href="/dpr/queue"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8,
                background: '#06b6d4', color: 'white', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(6,182,212,0.35)'
              }}
            >
              Open DPR Queue Module <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Groq AI Chatbot Widget */}
      <DprAiChatbot />
    </>
  );
}
