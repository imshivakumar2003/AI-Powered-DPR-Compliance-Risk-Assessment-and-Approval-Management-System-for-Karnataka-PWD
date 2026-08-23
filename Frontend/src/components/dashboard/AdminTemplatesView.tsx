// TOPLINE - Admin DPR Templates Management View
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import {
  fetchTemplates, uploadTemplate, updateTemplate, toggleTemplateStatus,
  deleteTemplate, downloadTemplateFile, DprTemplate
} from '@/lib/api';
import Link from 'next/link';
import {
  FileText, Upload, Search, Filter, RefreshCw, Eye, Download,
  Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, Plus, X, Layers, Clock
} from 'lucide-react';

const CATEGORIES = ['General', 'Roads', 'Bridges', 'Buildings', 'Irrigation', 'Water Supply'];

export function AdminTemplatesView() {
  const [templates, setTemplates] = useState<DprTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DprTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const data = await fetchTemplates(false); // Admin gets all templates
      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openUploadModal = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('General');
    setFormVersion('v1.0');
    setFormFile(null);
    setFormError('');
    setShowUploadModal(true);
  };

  const openEditModal = (t: DprTemplate) => {
    setEditingTemplate(t);
    setFormTitle(t.title);
    setFormDescription(t.description || '');
    setFormCategory(t.category || 'General');
    setFormVersion(t.version || 'v1.0');
    setFormFile(null);
    setFormError('');
    setShowUploadModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Template title is required.');
      return;
    }
    if (!editingTemplate && !formFile) {
      setFormError('Please select a PDF template file to upload.');
      return;
    }
    if (formFile && !formFile.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Only PDF files (.pdf) are supported.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('description', formDescription.trim());
      formData.append('category', formCategory);
      formData.append('version', formVersion.trim());
      if (formFile) {
        formData.append('file', formFile);
      }

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
        setSuccessMsg(`Template '${formTitle}' updated successfully. Dynamic update notification broadcast to users.`);
      } else {
        await uploadTemplate(formData);
        setSuccessMsg(`New template '${formTitle}' uploaded successfully! Dynamic notification broadcast to users.`);
      }

      setShowUploadModal(false);
      await loadData(true);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Error saving template:', err);
      setFormError(err.message || 'Failed to save template. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (t: DprTemplate) => {
    try {
      const newStatus = t.is_active === 0;
      await toggleTemplateStatus(t.id, newStatus);
      setSuccessMsg(`Template '${t.title}' is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}. User notification broadcast.`);
      await loadData(true);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error toggling template status:', err);
      alert('Failed to change template status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteTemplate(deletingId);
      setSuccessMsg('Template deleted successfully.');
      setDeletingId(null);
      await loadData(true);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template.');
    }
  };

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

  const activeCount = useMemo(() => templates.filter(t => t.is_active === 1).length, [templates]);
  const inactiveCount = useMemo(() => templates.filter(t => t.is_active === 0).length, [templates]);

  return (
    <>
      <Topbar
        title="DPR Templates Management"
        subtitle="Upload, replace, activate, and manage official Karnataka PWD DPR template PDFs for users"
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="topbar-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              onClick={openUploadModal}
              className="topbar-btn primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
            >
              <Plus size={15} /> Upload DPR Template
            </button>
          </div>
        }
      />

      <div className="page-content fade-in">
        
        {/* Banner Notification Alert */}
        {successMsg && (
          <div style={{ padding: '12px 18px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 13, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Templates</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>{templates.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Stored in platform storage</div>
          </div>
          <div className="card" style={{ padding: 18, borderLeft: '4px solid #22c55e' }}>
            <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, textTransform: 'uppercase' }}>Active in User Module</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#22c55e', marginTop: 4 }}>{activeCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Visible to all submitters/users</div>
          </div>
          <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>Inactive / Drafts</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{inactiveCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Hidden from public view</div>
          </div>
        </div>

        {/* Main Templates Table Card */}
        <div className="card">
          {/* Header Controls */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--accent-blue)" /> Official DPR Standard Templates ({filteredTemplates.length})
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Admin management panel for DPR template PDFs
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search template title, version..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7,
                    color: 'var(--text-primary)', fontSize: 11.5, outline: 'none'
                  }}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 7, color: 'var(--text-primary)', fontSize: 11.5, outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="">Category: All</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {(search || categoryFilter) && (
                <button
                  onClick={() => { setSearch(''); setCategoryFilter(''); }}
                  style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>Template Title & Info</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>Version</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>Uploaded By / Date</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>User Status</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                      Loading DPR templates…
                    </td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No DPR templates found. Click <strong>"Upload DPR Template"</strong> to add your first template.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{t.title}</div>
                        {t.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 320 }}>
                            {t.description}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>
                          📄 {t.original_filename} ({t.id})
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', color: '#38bdf8', border: '1px solid rgba(59,130,246,0.25)' }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-amber)' }}>
                          {t.version}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        <div>{t.uploaded_by}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {new Date(t.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          title="Click to toggle Active/Inactive status"
                          style={{
                            fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                            background: t.is_active === 1 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                            color: t.is_active === 1 ? '#4ade80' : '#f59e0b',
                            border: `1px solid ${t.is_active === 1 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`
                          }}
                        >
                          {t.is_active === 1 ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link
                            href={`/templates/${t.id}/viewer`}
                            style={{
                              padding: '5px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.15)',
                              color: '#38bdf8', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11,
                              fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Eye size={12} /> View PDF
                          </Link>
                          <button
                            onClick={() => downloadTemplateFile(t.id, t.original_filename)}
                            title="Download PDF"
                            style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Download size={12} /> Download
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            title="Edit metadata / Replace file"
                            style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setDeletingId(t.id)}
                            title="Delete template"
                            style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload & Edit Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={18} color="var(--accent-blue)" /> {editingTemplate ? 'Update DPR Template' : 'Upload New DPR Template'}
              </h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Template Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Karnataka PWD Road DPR Standard Template"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Project Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Version
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. v1.2"
                    value={formVersion}
                    onChange={e => setFormVersion(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Description / Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter notes on structural guidelines, mandatory BOQ tables, or submission standards..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  {editingTemplate ? 'Replace PDF File (Optional)' : 'Select DPR Template PDF File *'}
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setFormFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: 8, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
                />
                {editingTemplate && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Current File: {editingTemplate.original_filename}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="topbar-btn"
                  style={{ fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="topbar-btn primary"
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  {formSubmitting ? 'Saving…' : editingTemplate ? 'Update & Broadcast' : 'Upload & Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card" style={{ maxWidth: 420, width: '100%', padding: 24, borderRadius: 12, textAlign: 'center' }}>
            <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
              Confirm Template Deletion
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to permanently delete this DPR template? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => setDeletingId(null)} className="topbar-btn" style={{ fontSize: 12 }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{ padding: '8px 20px', borderRadius: 7, background: '#ef4444', color: 'white', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
