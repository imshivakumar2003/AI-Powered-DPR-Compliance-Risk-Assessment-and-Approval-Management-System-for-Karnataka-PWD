// TOPLINE - DPR Template PDF Viewer Page
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { fetchTemplateDetail, downloadTemplateFile, DprTemplate } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft, Download, Printer, FileText, Layers, RefreshCw, AlertCircle
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TemplateViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [template, setTemplate] = useState<DprTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await fetchTemplateDetail(id);
        if (data) {
          setTemplate(data);
        } else {
          setError('DPR template not found.');
        }
      } catch (err) {
        console.error('Error loading template viewer:', err);
        setError('Failed to load template details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const pdfUrl = `${API_BASE_URL}/api/templates/${id}/file`;

  return (
    <>
      <Topbar
        title={template ? `PDF Template: ${template.title}` : 'DPR Template Viewer'}
        subtitle={template ? `Official ${template.category} Standard Template · Version ${template.version}` : 'Viewing DPR Template PDF'}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => router.back()}
              className="topbar-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            {template && (
              <button
                onClick={() => downloadTemplateFile(template.id, template.original_filename)}
                className="topbar-btn primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
              >
                <Download size={14} /> Download PDF
              </button>
            )}
          </div>
        }
      />

      <div className="page-content fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
            Loading template PDF viewer…
          </div>
        ) : error || !template ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', maxWidth: 500, margin: '40px auto' }}>
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
              Template Not Found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {error || 'The requested DPR template could not be loaded.'}
            </p>
            <Link
              href="/user/templates"
              className="topbar-btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              Return to Template Library
            </Link>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            
            {/* Viewer Sub-header */}
            <div style={{ padding: '12px 20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#38bdf8', border: '1px solid rgba(59,130,246,0.3)' }}>
                  {template.category}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-amber)' }}>
                  {template.version}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  📄 {template.original_filename}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="topbar-btn"
                  style={{ fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <FileText size={13} /> Open in Browser Tab
                </a>
                <button
                  onClick={() => downloadTemplateFile(template.id, template.original_filename)}
                  className="topbar-btn primary"
                  style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Download size={13} /> Save PDF
                </button>
              </div>
            </div>

            {/* Embedded IFrame Viewer */}
            <div style={{ flex: 1, position: 'relative', background: '#1e293b' }}>
              <iframe
                src={pdfUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`DPR Template - ${template.title}`}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
