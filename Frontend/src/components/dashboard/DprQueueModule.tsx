// TOPLINE
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useUser } from '@/lib/UserContext';
import { fetchProjects, approveDpr, downloadDprReport, Project } from '@/lib/api';
import Link from 'next/link';
import {
  FileText, Search, Filter, RefreshCw, Eye, CheckCircle,
  XCircle, Clock, ShieldAlert, ArrowUpRight, ChevronLeft, ChevronRight, X
} from 'lucide-react';

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
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

function riskBadge(score: number | null | undefined) {
  if (score === null || score === undefined) return null;
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

const ITEMS_PER_PAGE = 8;

export function DprQueueModule() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [page, setPage] = useState(0);

  // Decision Modal State
  const [actionModal, setActionModal] = useState<{ dprId: string; title: string; type: 'approve' | 'reject' } | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const loadProjects = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await fetchProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching DPR queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(() => loadProjects(false), 20_000);
    return () => clearInterval(interval);
  }, [loadProjects]);

  const handleExecuteDecision = async () => {
    if (!actionModal || !actionComment.trim()) return;
    setSubmittingAction(true);
    try {
      await approveDpr(actionModal.dprId, actionModal.type, actionComment);
      setActionSuccessMsg(`DPR proposal ${actionModal.dprId} successfully ${actionModal.type === 'approve' ? 'APPROVED' : 'REJECTED'}.`);
      setActionModal(null);
      setActionComment('');
      await loadProjects(true);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (e) {
      console.error('Error executing decision:', e);
      alert('Failed to submit decision. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const districts = useMemo(() => [...new Set(projects.map(p => p.state || p.district || '').filter(Boolean))].sort(), [projects]);
  const sectors = useMemo(() => [...new Set(projects.map(p => p.sector).filter(Boolean))].sort(), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter && p.status?.toUpperCase() !== statusFilter) return false;
      if (districtFilter && (p.state || p.district) !== districtFilter) return false;
      if (sectorFilter && p.sector !== sectorFilter) return false;
      if (riskFilter) {
        const s = p.risk_score ?? 0;
        if (riskFilter === 'High' && s <= 70) return false;
        if (riskFilter === 'Medium' && (s <= 40 || s > 70)) return false;
        if (riskFilter === 'Low' && s > 40) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const title = (p.title || p.original_filename || p.filename || '').toLowerCase();
        const dist = (p.state || p.district || '').toLowerCase();
        const sub = (p.submitted_by || '').toLowerCase();
        const id = (p.id || '').toLowerCase();
        return title.includes(q) || dist.includes(q) || sub.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [projects, statusFilter, districtFilter, sectorFilter, riskFilter, search]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
  const pagedProjects = useMemo(() => {
    return filteredProjects.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  }, [filteredProjects, page]);

  return (
    <>
      <Topbar
        title="DPR Queue Management Module"
        subtitle="Dedicated queue workspace for inspecting, tracking, reviewing, and viewing Detailed Project Reports"
        actions={
          <button
            onClick={() => loadProjects(true)}
            className="topbar-btn"
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
            {refreshing ? 'Syncing Queue…' : 'Sync Queue'}
          </button>
        }
      />

      <div className="page-content fade-in">
        
        {/* Banner Alert if Action Executed */}
        {actionSuccessMsg && (
          <div style={{ padding: '12px 18px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            {actionSuccessMsg}
          </div>
        )}

        {/* Main Queue Card */}
        <div className="card">
          
          {/* Header Controls */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--accent-blue)" /> Karnataka PWD DPR Queue ({filteredProjects.length} proposals)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Real-time queue synchronized directly with database records
              </div>
            </div>

            {/* Filter Inputs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search title, ID, submitter, area..."
                  className="search-input"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  style={{ width: '100%', paddingLeft: 28, fontSize: 11 }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                className="select-input"
                style={{ fontSize: 11 }}
              >
                <option value="">Status: All</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="UNDER_REVIEW">Under Review</option>
              </select>

              <select
                value={riskFilter}
                onChange={e => { setRiskFilter(e.target.value); setPage(0); }}
                className="select-input"
                style={{ fontSize: 11 }}
              >
                <option value="">Risk: All</option>
                <option value="High">High Risk (&gt;70)</option>
                <option value="Medium">Medium Risk (41-70)</option>
                <option value="Low">Low Risk (≤40)</option>
              </select>

              <select
                value={sectorFilter}
                onChange={e => { setSectorFilter(e.target.value); setPage(0); }}
                className="select-input"
                style={{ fontSize: 11 }}
              >
                <option value="">Sector: All</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={districtFilter}
                onChange={e => { setDistrictFilter(e.target.value); setPage(0); }}
                className="select-input"
                style={{ fontSize: 11 }}
              >
                <option value="">District: All</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {(statusFilter || riskFilter || sectorFilter || districtFilter || search) && (
                <button
                  onClick={() => { setStatusFilter(''); setRiskFilter(''); setSectorFilter(''); setDistrictFilter(''); setSearch(''); setPage(0); }}
                  style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table View */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Project Title & ID</th>
                  <th style={{ padding: '12px 16px' }}>Submitted By</th>
                  <th style={{ padding: '12px 16px' }}>District / State</th>
                  <th style={{ padding: '12px 16px' }}>Outlay ₹Cr</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Quality</th>
                  <th style={{ padding: '12px 16px' }}>Risk Factor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                      Loading DPR queue proposals...
                    </td>
                  </tr>
                ) : pagedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No Detailed Project Reports found matching your queue filters.
                    </td>
                  </tr>
                ) : pagedProjects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.title || p.original_filename}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{p.id}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.submitted_by || 'Karnataka PWD'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.state || p.district || 'Karnataka'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800 }}>₹{p.estimated_cost ?? 100} Cr</td>
                    <td style={{ padding: '12px 16px' }}>{statusBadge(p.status)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>{p.overall_score ?? '—'}</span> / 100
                    </td>
                    <td style={{ padding: '12px 16px' }}>{riskBadge(p.risk_score)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link
                          href={`/dpr/${p.id}/viewer`}
                          style={{
                            padding: '6px 12px', borderRadius: 6, background: 'rgba(59,130,246,0.15)',
                            color: '#38bdf8', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11,
                            fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <FileText size={12} /> Open PDF Document
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Page {page + 1} of {totalPages} ({filteredProjects.length} total proposals)
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="topbar-btn"
                  style={{ padding: '4px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ChevronLeft size={13} /> Previous
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="topbar-btn"
                  style={{ padding: '4px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
