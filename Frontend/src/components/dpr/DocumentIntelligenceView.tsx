// TOPLINE
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { DprDocumentIntelligence } from '@/components/dpr/DprDocumentIntelligence';
import { fetchProjects, Project, getUserHeaders } from '@/lib/api';
import {
  Brain, FileText, Sparkles, FolderOpen, Search, Upload,
  RefreshCw, ChevronRight, CheckCircle2, Clock, XCircle,
  LayoutGrid, Layers, Database, Compass, Wrench, Shield
} from 'lucide-react';

const SECTOR_ICONS: Record<string, string> = {
  Roads: '🛣️',
  Power: '⚡',
  Healthcare: '🏥',
  Education: '🎓',
  Tourism: '🏔️',
  Agriculture: '🌾',
  Urban: '🏙️',
  Telecom: '📡',
  Highways: '🛣️',
  Bridges: '🌉',
  Infrastructure: '🏗️',
};

interface DocumentIntelligenceViewProps {
  moduleType: 'admin' | 'user';
  title?: string;
}

export function DocumentIntelligenceView({ moduleType, title }: DocumentIntelligenceViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('id') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'inspector' | 'grid'>('inspector');

  const loadAllProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await fetchProjects();
      setProjects(data);

      if (data && data.length > 0) {
        // If initialProjectId is in data, select it, otherwise select the first project
        const match = data.find(p => p.id === initialProjectId);
        if (match) {
          setSelectedProjectId(match.id);
        } else if (!selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed fetching projects for Document Intelligence:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [initialProjectId, selectedProjectId]);

  useEffect(() => {
    loadAllProjects();
  }, [loadAllProjects]);

  // Keep URL query param synced when project changes
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    setViewMode('inspector');
    const path = moduleType === 'admin' ? '/admin/document-intelligence' : '/user/document-intelligence';
    router.replace(`${path}?id=${projId}`, { scroll: false });
  };

  const filteredProjects = projects.filter(p => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (p.title || p.filename || '').toLowerCase().includes(q) ||
      (p.sector || '').toLowerCase().includes(q) ||
      (p.state || '').toLowerCase().includes(q) ||
      (p.district || '').toLowerCase().includes(q)
    );
  });

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const getStatusBadge = (status?: string) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'APPROVED') {
      return (
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={11} /> Approved
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <XCircle size={11} /> Rejected
        </span>
      );
    }
    return (
      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Clock size={11} /> Pending Review
      </span>
    );
  };

  const displayTitle = title || (moduleType === 'admin' ? 'Admin Document Intelligence & RAG' : 'Document Intelligence & RAG');

  return (
    <>
      <Topbar
        title={displayTitle}
        subtitle="OCR text extraction, visual asset diagrams, and grounded multimodal RAG assistant"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/dpr/upload" className="topbar-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} /> Upload DPR
            </Link>
            <button
              className="topbar-btn"
              onClick={loadAllProjects}
              disabled={loadingProjects}
              title="Refresh DPR list"
            >
              <RefreshCw size={14} className={loadingProjects ? 'spin-icon' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* ── Project Switcher & Header Bar ── */}
        <div className="card" style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            
            {/* Left: Project Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                <Brain size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select DPR Document:
                </div>
                <select
                  value={selectedProjectId}
                  onChange={e => handleSelectProject(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', maxWidth: 460, marginTop: 3, padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#fff' }}
                  disabled={loadingProjects || projects.length === 0}
                >
                  {projects.length === 0 ? (
                    <option value="">No DPR documents uploaded yet</option>
                  ) : (
                    projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {SECTOR_ICONS[p.sector] || '📁'} {p.title || p.filename} ({p.sector || 'Infrastructure'} · ₹{p.estimated_cost?.toFixed(0)} Cr)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Middle: Active Project Quick Info Pills */}
            {activeProject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sector: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{activeProject.sector || 'Roads'}</strong>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{activeProject.district ? `${activeProject.district}, ` : ''}{activeProject.state || 'Karnataka'}</strong>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cost: </span>
                  <strong style={{ color: 'var(--accent-green)' }}>₹{activeProject.estimated_cost?.toFixed(1)} Cr</strong>
                </div>
                {getStatusBadge(activeProject.status)}
              </div>
            )}

            {/* Right: View Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setViewMode('inspector')}
                style={{
                  background: viewMode === 'inspector' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
                  color: viewMode === 'inspector' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <Layers size={13} /> Document Inspector
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
                  color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <LayoutGrid size={13} /> Browse All DPRs ({projects.length})
              </button>
            </div>

          </div>
        </div>

        {/* ── VIEW MODE 1: GRID BROWSER (All Projects) ── */}
        {viewMode === 'grid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Search Input */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search DPRs by project title, sector, district..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', paddingLeft: 34, fontSize: 12.5 }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {filteredProjects.length} of {projects.length} DPR documents
              </span>
            </div>

            {/* Grid of Project Cards */}
            {filteredProjects.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <FolderOpen size={36} style={{ margin: '0 auto 12px', color: 'var(--accent-blue)' }} />
                <div style={{ fontSize: 15, fontWeight: 600 }}>No DPR documents found matching your filter.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {filteredProjects.map(p => {
                  const isSelected = p.id === selectedProjectId;
                  const icon = SECTOR_ICONS[p.sector] || '📁';
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProject(p.id)}
                      className="card"
                      style={{
                        padding: 16, cursor: 'pointer',
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.8)',
                        border: isSelected ? '1.5px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', flexDirection: 'column', gap: 10, transition: 'transform 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 22 }}>{icon}</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              {p.sector || 'Infrastructure'}
                            </div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.title || p.filename}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(p.status)}
                      </div>

                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div>📍 {p.district ? `${p.district}, ` : ''}{p.state || 'Karnataka'}</div>
                        <div>💰 ₹{p.estimated_cost?.toFixed(1)} Cr · 🏢 {p.submitted_by || 'Karnataka PWD'}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600 }}>
                        <span>Open Document Intelligence</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW MODE 2: DOCUMENT INSPECTOR (Active Project Intelligence) ── */}
        {viewMode === 'inspector' && (
          <div>
            {selectedProjectId ? (
              <DprDocumentIntelligence
                projectId={selectedProjectId}
                projectTitle={activeProject?.title || activeProject?.filename}
                onSelectProject={handleSelectProject}
              />
            ) : (
              <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Brain size={36} style={{ margin: '0 auto 12px', color: 'var(--accent-blue)' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  No DPR Selected
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
                  Upload a new DPR or select an existing project from the dropdown above to run Document Intelligence &amp; RAG.
                </div>
                <Link href="/dpr/upload" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
                  <Upload size={14} style={{ marginRight: 6 }} /> Upload DPR Document
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
