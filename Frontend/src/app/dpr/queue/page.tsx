// TOPLINE

'use client';
import { Topbar } from '@/components/layout/Topbar';
import { DprTable } from '@/components/dashboard/DprTable';
import { Filter, Download, Search, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';

const API_URL = 'http://localhost:8000';

// Shape returned from GET /api/projects
interface ApiProject {
  id: string;
  filename: string;
  original_filename: string;
  status: string;
  upload_date: string;
  estimated_cost: number;
  sector: string;
  state: string;
  title: string;
  duration_months: number;
  submitted_by: string;
  notes: string;
  overall_score: number | null;
  risk_score: number | null;
  compliance_score: number | null;
}

// Shape expected by DprTable
interface DprRow {
  id: string;
  title: string;
  state: string;
  sector: string;
  cost: string;
  status: string;
  riskLevel: string;
  qualityScore: number;
  submittedDate: string;
  submittedBy: string;
}

function mapStatus(apiStatus: string): string {
  switch (apiStatus?.toUpperCase()) {
    case 'APPROVED':    return 'Approved';
    case 'REJECTED':    return 'Rejected';
    case 'PROCESSING':  return 'Processing';
    case 'NEEDS_REVISION': return 'Review';
    default:            return 'Pending';
  }
}

function mapRisk(riskScore: number | null): string {
  if (riskScore === null || riskScore === undefined) return 'Medium';
  if (riskScore > 65) return 'High';
  if (riskScore > 35) return 'Medium';
  return 'Low';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function toRow(p: ApiProject): DprRow {
  return {
    id: p.id,
    title: p.title || p.original_filename || p.filename,
    state: p.state,
    sector: p.sector,
    cost: `₹ ${p.estimated_cost?.toFixed(0) ?? '—'} Cr`,
    status: mapStatus(p.status),
    riskLevel: mapRisk(p.risk_score),
    qualityScore: p.overall_score ?? 0,
    submittedDate: formatDate(p.upload_date),
    submittedBy: p.submitted_by || '—',
  };
}

export default function DprQueuePage() {
  const { user } = useUser();
  const isSubmitter = user.role === 'submitter';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterSector, setFilterSector] = useState('All');
  const [dprs, setDprs] = useState<DprRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: ApiProject[] = await res.json();
      setDprs(data.map(toRow));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // Submitters only see their own DPRs
  const visibleDprs = useMemo(() => {
    if (!isSubmitter || !user.username) return dprs;
    const uname = user.username.toLowerCase();
    const udisp = user.displayName.toLowerCase();
    const matched = dprs.filter(d => {
      const sub = (d.submittedBy || '').toLowerCase();
      return sub.includes(uname) || sub.includes(udisp) || uname.includes(sub);
    });
    return matched.length > 0 ? matched : dprs;
  }, [dprs, isSubmitter, user.username, user.displayName]);



  useEffect(() => {
    fetchProjects();
    // Auto-refresh every 15 seconds to catch newly uploaded/processed DPRs
    const interval = setInterval(fetchProjects, 15000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  const filtered = visibleDprs.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.state.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    const matchRisk = filterRisk === 'All' || d.riskLevel === filterRisk;
    const matchSector = filterSector === 'All' || d.sector === filterSector;
    return matchSearch && matchStatus && matchRisk && matchSector;
  });

  const counts = {
    All: visibleDprs.length,
    Pending: visibleDprs.filter((d) => d.status === 'Pending').length,
    Review: visibleDprs.filter((d) => d.status === 'Review').length,
    Approved: visibleDprs.filter((d) => d.status === 'Approved').length,
    Rejected: visibleDprs.filter((d) => d.status === 'Rejected').length,
    Processing: visibleDprs.filter((d) => d.status === 'Processing').length,
  };

  return (
    <>
      <Topbar
        title={isSubmitter ? 'My DPRs' : 'DPR Queue'}
        subtitle={isSubmitter
          ? `Your submitted DPRs · ${visibleDprs.length} total`
          : 'All incoming Detailed Project Reports across Karnataka districts'}
        actions={
          <Link href="/dpr/upload" className="topbar-btn primary">
            + Upload DPR
          </Link>
        }
      />
      <div className="page-content fade-in">
        {/* Tab bar */}
        <div className="tab-bar">
          {Object.entries(counts).map(([status, count]) => (
            <div
              key={status}
              className={`tab-item ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
              <span style={{
                marginLeft: 6,
                background: filterStatus === status ? 'rgba(33,150,243,0.2)' : 'var(--bg-secondary)',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
              }}>
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              className="input-field"
              style={{ paddingLeft: 32 }}
              placeholder="Search by project title, ID, or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field" style={{ width: 140 }} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
            <option value="All">All Risks</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
          <select className="select-field" style={{ width: 150 }} value={filterSector} onChange={e => setFilterSector(e.target.value)}>
            <option value="All">All Sectors</option>
            <option value="Roads">Roads</option>
            <option value="Power">Power</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Tourism">Tourism</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Urban">Urban</option>
            <option value="Telecom">Telecom</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchProjects} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
            ⚠ {error} — <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }} onClick={fetchProjects}>Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {loading ? 'Loading…' : `${filtered.length} DPR${filtered.length !== 1 ? 's' : ''} found`}
              </div>
              <div className="card-subtitle">Click any row to view detailed AI assessment</div>
            </div>
          </div>
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ animation: 'spin 1s linear infinite' }}>⟳</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading DPRs…</div>
            </div>
          ) : filtered.length > 0 ? (
            <DprTable dprs={filtered} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                No DPRs match your filters
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Try adjusting your search or filter criteria
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
