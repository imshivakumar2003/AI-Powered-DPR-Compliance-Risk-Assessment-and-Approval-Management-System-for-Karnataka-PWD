// TOPLINE - User DPR Templates Library View
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { fetchTemplates, downloadTemplateFile, DprTemplate } from '@/lib/api';
import Link from 'next/link';
import {
  FileText, Search, Filter, RefreshCw, Eye, Download,
  BookOpen, Layers, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';

const CATEGORIES = ['General', 'Roads', 'Bridges', 'Buildings', 'Irrigation', 'Water Supply'];

export function UserTemplatesView() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('id');

  const [templates, setTemplates] = useState<DprTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadData = useCallback(async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const data = await fetchTemplates(true); // Active templates only for users
      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading user templates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) ||
               (t.description || '').toLowerCase().includes(q) ||
               t.category.toLowerCase().includes(q) ||
               t.version.toLowerCase().includes(q);
      }
      return true;
    });
  }, [templates, categoryFilter, search]);

  return (
    <>
      <Topbar
        title="DPR Templates Library"
        subtitle="Official Karnataka PWD standard templates, structural guidelines, and downloadable sample PDFs"
        actions={
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="topbar-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
            {refreshing ? 'Refreshing…' : 'Refresh Library'}
          </button>
        }
      />

      <div className="page-content fade-in">
        
        {/* Banner Card */}
        <div className="card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} color="var(--accent-blue)" /> Karnataka PWD Standard DPR Templates & BOQ Formats
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 700, lineHeight: 1.5 }}>
                Ensure 100% compliance with MoRTH specs, IRC codes, and Karnataka Schedule of Rates by referencing official templates uploaded by PWD Admins. View PDFs inline or download to your machine.
              </div>
            </div>
            <Link
              href="/dpr-guide"
              className="topbar-btn primary"
              style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              View DPR Guidelines <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
            Available DPR Templates ({filteredTemplates.length})
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search templates by title, sector..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text-primary)', fontSize: 12, outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setCategoryFilter('')}
                style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  background: categoryFilter === '' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                  color: categoryFilter === '' ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${categoryFilter === '' ? 'var(--accent-blue)' : 'var(--border)'}`
                }}
              >
                All Sectors
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    background: categoryFilter === c ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: categoryFilter === c ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${categoryFilter === c ? 'var(--accent-blue)' : 'var(--border)'}`
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            Loading active DPR templates…
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="card" style={{ padding: 50, textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              No Templates Found
            </div>
            <div style={{ fontSize: 12 }}>
              No active DPR templates match your search or category filter. Check back soon for updates from Admin.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {filteredTemplates.map(t => {
              const isHighlighted = highlightId === t.id;
              return (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    border: isHighlighted ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                    boxShadow: isHighlighted ? '0 0 16px rgba(59,130,246,0.3)' : undefined,
                    background: isHighlighted ? 'rgba(59,130,246,0.05)' : 'var(--card-bg)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#38bdf8', border: '1px solid rgba(59,130,246,0.3)' }}>
                        {t.category}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-amber)' }}>
                        {t.version}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
                      {t.title}
                    </h3>

                    {t.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                        {t.description}
                      </p>
                    )}

                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 16 }}>
                      📄 {t.original_filename} · Updated {new Date(t.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <Link
                      href={`/templates/${t.id}/viewer`}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 7, background: 'rgba(59,130,246,0.15)',
                        color: '#38bdf8', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5,
                        fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}
                    >
                      <Eye size={14} /> View PDF Template
                    </Link>
                    <button
                      onClick={() => downloadTemplateFile(t.id, t.original_filename)}
                      style={{
                        padding: '8px 14px', borderRadius: 7, background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 11.5,
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
