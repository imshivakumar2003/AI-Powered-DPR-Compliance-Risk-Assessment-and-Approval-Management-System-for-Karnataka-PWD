// TOPLINE
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import Link from 'next/link';
import {
  ArrowLeft, ZoomIn, ZoomOut, Download, Printer,
  FileText, AlertCircle, RotateCcw,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DprInfo {
  id: string;
  title: string;
  original_filename: string;
  file_available: boolean;
  file_url: string | null;
}

export default function DprViewerPage() {
  const { id } = useParams();
  const dprId = id as string;

  const [zoom, setZoom]           = useState(100);        // percent
  const [status, setStatus]       = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg]   = useState('');
  const [info, setInfo]           = useState<DprInfo | null>(null);
  const iframeRef                 = useRef<HTMLIFrameElement>(null);

  const fileUrl = `${API_BASE}/api/dpr/${dprId}/file`;

  // Use the /info endpoint to verify file availability — avoids HEAD request issues
  useEffect(() => {
    setStatus('loading');
    setErrorMsg('');

    fetch(`${API_BASE}/api/dpr/${dprId}/info`)
      .then(res => {
        if (!res.ok) throw new Error(`Project not found (HTTP ${res.status})`);
        return res.json() as Promise<DprInfo>;
      })
      .then(data => {
        console.log('[DprViewer] /info response:', data);
        setInfo(data);
        if (data.file_available) {
          setStatus('ready');
        } else {
          setErrorMsg('The project exists but no file has been uploaded or the file was removed from the server.');
          setStatus('error');
        }
      })
      .catch(err => {
        console.error('[DprViewer] Failed to load project info:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Could not reach the backend server.');
        setStatus('error');
      });
  }, [dprId]);

  const handleZoomIn  = () => setZoom(z => Math.min(z + 20, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 20, 40));
  const handleReset   = () => setZoom(100);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = info?.original_filename ?? 'DPR_Document.pdf';
    a.click();
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.print();
      } catch {
        // cross-origin fallback — open in new tab so the browser can print
        window.open(fileUrl, '_blank');
      }
    }
  };

  const displayName = info?.original_filename ?? info?.title ?? 'DPR Document';

  return (
    <>
      <Topbar
        title="DPR Viewer"
        subtitle={displayName}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/dpr/${dprId}`} className="topbar-btn">
              <ArrowLeft size={14} /> Back to Analysis
            </Link>
          </div>
        }
      />

      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Toolbar ── */}
        <div className="card" style={{ padding: '10px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

            {/* File info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
              <FileText size={16} color="var(--accent-blue)" />
              <span style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {displayName}
              </span>
              {status === 'ready' && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  background: 'rgba(34,197,94,0.1)', color: 'var(--accent-green)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}>
                  ● LIVE
                </span>
              )}
            </div>

            {/* Zoom controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={handleZoomOut} disabled={zoom <= 40 || status !== 'ready'}
                title="Zoom Out" style={toolbarBtnStyle(zoom <= 40 || status !== 'ready')}>
                <ZoomOut size={15} />
              </button>

              <button onClick={handleReset} disabled={status !== 'ready'}
                title="Reset Zoom"
                style={{ ...toolbarBtnStyle(status !== 'ready'), minWidth: 60, fontWeight: 700, fontSize: 12 }}>
                {zoom}%
              </button>

              <button onClick={handleZoomIn} disabled={zoom >= 200 || status !== 'ready'}
                title="Zoom In" style={toolbarBtnStyle(zoom >= 200 || status !== 'ready')}>
                <ZoomIn size={15} />
              </button>

              <button onClick={handleReset} disabled={status !== 'ready'}
                title="Reset Zoom" style={toolbarBtnStyle(status !== 'ready')}>
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

            {/* Action buttons */}
            <button onClick={handlePrint} disabled={status !== 'ready'}
              title="Print" style={toolbarBtnStyle(status !== 'ready')}>
              <Printer size={15} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Print</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={status !== 'ready'}
              title="Download"
              style={{
                ...toolbarBtnStyle(status !== 'ready'),
                ...(status === 'ready' ? {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white', border: 'none',
                  boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                } : {}),
              }}
            >
              <Download size={15} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Download</span>
            </button>
          </div>
        </div>

        {/* ── Viewer area ── */}
        <div
          className="card"
          style={{
            overflow: 'hidden', minHeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, position: 'relative',
          }}
        >
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div
                className="spin"
                style={{
                  width: 44, height: 44,
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent-blue)',
                  borderRadius: '50%', margin: '0 auto 18px',
                }}
              />
              <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
                Loading DPR document…
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>
                Connecting to backend at <code style={{ fontFamily: 'monospace' }}>{API_BASE}</code>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: 60, maxWidth: 480 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(239,68,68,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <AlertCircle size={32} color="var(--accent-red)" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                No DPR Document Available
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
                The uploaded DPR file could not be found on the server. It may not have been uploaded yet, or the file may have been removed.
              </div>
              {errorMsg && (
                <div style={{
                  fontSize: 11, color: 'var(--accent-amber)',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 8, padding: '8px 14px', marginBottom: 20,
                  fontFamily: 'monospace', textAlign: 'left', wordBreak: 'break-all',
                }}>
                  Debug: {errorMsg}
                </div>
              )}
              <Link
                href={`/dpr/${dprId}`}
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '9px 22px' }}
              >
                ← Back to Analysis
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#525659' }}>
              <div style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease',
                minHeight: `${700 * (100 / zoom)}px`,
              }}>
                <iframe
                  ref={iframeRef}
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  title="DPR Document Viewer"
                  style={{
                    width: '100%',
                    height: `${700 * (100 / zoom)}px`,
                    border: 'none', display: 'block',
                  }}
                  allow="fullscreen"
                  onLoad={() => console.log('[DprViewer] iframe loaded:', fileUrl)}
                  onError={() => {
                    console.error('[DprViewer] iframe failed to load:', fileUrl);
                    setStatus('error');
                    setErrorMsg(`Browser could not load the PDF from: ${fileUrl}`);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer note ── */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingBottom: 8 }}>
          DPR ID: <code style={{ fontFamily: 'monospace' }}>{dprId}</code>
          {info && <> · File: <code style={{ fontFamily: 'monospace' }}>{info.original_filename}</code></>}
          {' · '}Karnataka PWD DPR-AI
        </div>
      </div>
    </>
  );
}

// Helper: shared toolbar button style
function toolbarBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 12px', borderRadius: 8,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
    fontFamily: 'var(--font-body)',
  };
}
