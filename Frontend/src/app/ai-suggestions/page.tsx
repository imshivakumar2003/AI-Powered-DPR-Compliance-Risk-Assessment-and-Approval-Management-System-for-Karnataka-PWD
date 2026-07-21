// TOPLINE
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Folder, FolderOpen, Clock, CheckCircle, XCircle, RefreshCw, Upload } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiProject {
  id: string;
  title: string;
  original_filename: string;
  state: string;
  sector: string;
  estimated_cost: number;
  submitted_by: string;
  upload_date: string;
  status: string;
  overall_score: number | null;
  risk_score: number | null;
  in_approvals?: boolean;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function statusColor(status: string) {
  const s = status?.toUpperCase();
  if (s === 'APPROVED') return 'var(--accent-green)';
  if (s === 'REJECTED') return '#ef4444';
  return 'var(--accent-amber)';
}

function statusLabel(status: string) {
  const s = status?.toUpperCase();
  if (s === 'APPROVED') return 'Approved';
  if (s === 'REJECTED') return 'Rejected';
  return 'Pending Review';
}

const SECTOR_ICONS: Record<string, string> = {
  Roads: '🛣️', Power: '⚡', Healthcare: '🏥', Education: '🎓',
  Tourism: '🏔️', Agriculture: '🌾', Urban: '🏙️', Telecom: '📡',
  Infrastructure: '🏗️',
};

export default function AiSuggestionsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/projects`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: ApiProject[] = await res.json();
      setProjects(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter(p =>
    (p.title || p.original_filename).toLowerCase().includes(search.toLowerCase()) ||
    p.state?.toLowerCase().includes(search.toLowerCase()) ||
    p.sector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Topbar
        title="AI Suggestions"
        subtitle="Click any DPR folder to view AI-generated category recommendations"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/dpr/upload" className="topbar-btn primary">
              <Upload size={14} /> Upload New DPR
            </Link>
            <button className="topbar-btn" onClick={() => fetchProjects()} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        }
      />

      <div className="page-content fade-in">

        {/* ── Info banner ── */}
        <div style={{
          display: 'flex', gap: 14, padding: '14px 18px', marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(139,92,246,0.08))',
          border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, alignItems: 'center',
        }}>
          <div style={{ fontSize: 28 }}>🤖</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
              AI-Powered DPR Analysis
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Each DPR folder below contains a unique AI analysis across <strong>10 categories</strong> including Budget, Technical Feasibility, Environmental Compliance, Risk Assessment, and more.
              Open any folder → review recommendations → Send to My Approvals for admin decision.
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ marginBottom: 24 }}>
          <input
            className="input-field"
            placeholder="🔍  Search by project name, state, or sector…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 420, fontSize: 13 }}
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#ef4444' }}>
            ⚠ {error} — <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }} onClick={fetchProjects}>Retry</button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ animation: 'spin 1.2s linear infinite', fontSize: 32 }}>⟳</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>Loading DPR folders…</div>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {projects.length === 0 ? 'No DPRs uploaded yet' : 'No DPRs match your search'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              {projects.length === 0 ? 'Upload a DPR to get started with AI analysis.' : 'Try adjusting your search query.'}
            </div>
            {projects.length === 0 && (
              <Link href="/dpr/upload" className="btn btn-primary" style={{ fontSize: 13, padding: '9px 22px' }}>
                Upload Your First DPR
              </Link>
            )}
          </div>
        )}

        {/* ── Folder Grid ── */}
        {!loading && filtered.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {filtered.length} DPR{filtered.length !== 1 ? 's' : ''} found
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18,
            }}>
              {filtered.map(project => {
                const isHovered = hoveredId === project.id;
                const icon = SECTOR_ICONS[project.sector] || '📄';
                const inApprovals = project.in_approvals;

                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/ai-suggestions/${project.id}`)}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      background: isHovered
                        ? 'linear-gradient(145deg, rgba(79,70,229,0.12), rgba(139,92,246,0.08))'
                        : 'var(--bg-card)',
                      border: isHovered
                        ? '1.5px solid rgba(79,70,229,0.45)'
                        : '1.5px solid var(--border)',
                      borderRadius: 16,
                      padding: '22px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                      boxShadow: isHovered
                        ? '0 8px 32px rgba(79,70,229,0.18)'
                        : '0 2px 8px rgba(0,0,0,0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Glow accent top */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: isHovered
                        ? 'linear-gradient(90deg, #4f46e5, #7c3aed)'
                        : 'transparent',
                      transition: 'all 0.2s',
                    }} />

                    {/* In-approvals badge */}
                    {inApprovals && (
                      <div style={{
                        position: 'absolute', top: 12, right: 12,
                        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                        background: 'rgba(34,197,94,0.12)', color: 'var(--accent-green)',
                        border: '1px solid rgba(34,197,94,0.25)', textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        ✓ In Approvals
                      </div>
                    )}

                    {/* Folder icon + sector emoji */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: isHovered
                          ? 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(139,92,246,0.15))'
                          : 'rgba(79,70,229,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, transition: 'all 0.2s', flexShrink: 0,
                        border: isHovered ? '1px solid rgba(79,70,229,0.3)' : '1px solid transparent',
                      }}>
                        {isHovered ? icon : '📂'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 2,
                        }}>
                          {project.sector}
                        </div>
                        <div style={{
                          fontSize: 14, fontWeight: 800, color: 'var(--text-primary)',
                          fontFamily: 'var(--font-display)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 170,
                        }}>
                          {project.title || project.original_filename}
                        </div>
                      </div>
                    </div>

                    {/* Meta rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📁 File</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.original_filename}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🏢 Uploaded By</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {project.submitted_by || '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 Upload Date</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {formatDate(project.upload_date)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 State</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {project.state}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>💰 Cost</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          ₹ {project.estimated_cost?.toFixed(0)} Cr
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

                    {/* Status + CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: statusColor(project.status),
                          boxShadow: `0 0 6px ${statusColor(project.status)}66`,
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(project.status) }}>
                          {statusLabel(project.status)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, color: isHovered ? '#a78bfa' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s',
                      }}>
                        {isHovered ? 'Open Analysis →' : 'View AI Analysis'}
                      </div>
                    </div>

                    {/* Hover score pill */}
                    {isHovered && project.overall_score && (
                      <div style={{
                        marginTop: 12, padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.25)',
                        fontSize: 12, fontWeight: 700,
                        color: project.overall_score >= 80 ? 'var(--accent-green)' : project.overall_score >= 60 ? 'var(--accent-amber)' : '#ef4444',
                        textAlign: 'center',
                      }}>
                        AI Quality Score: {project.overall_score}/100
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
