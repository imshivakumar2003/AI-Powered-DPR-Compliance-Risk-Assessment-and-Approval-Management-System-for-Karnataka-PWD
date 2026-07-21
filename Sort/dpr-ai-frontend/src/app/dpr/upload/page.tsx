'use client';
import { Topbar } from '@/components/layout/Topbar';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';

const STATES = ['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura'];
const SECTORS = ['Roads','Power','Healthcare','Education','Tourism','Agriculture','Urban','Telecom','Infrastructure'];

export default function UploadPage() {
  const [dragover, setDragover] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => setFile(f);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    await new Promise(r => setTimeout(r, 2200));
    setUploading(false);
    setUploaded(true);
  };

  return (
    <>
      <Topbar title="Upload DPR" subtitle="Submit a new Detailed Project Report for AI assessment" />
      <div className="page-content fade-in" style={{ maxWidth: 800 }}>

        {uploaded ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <CheckCircle size={56} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              DPR Submitted Successfully!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Your DPR has been queued for AI analysis. Estimated processing time: <strong>2–4 minutes</strong>.
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Tracking ID: <span style={{ fontFamily: 'monospace', color: 'var(--accent-blue-light)' }}>DPR-2025-0843</span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { setUploaded(false); setFile(null); }}>
                Upload Another
              </button>
              <a href="/dpr/queue" className="btn btn-secondary">View Queue</a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Upload zone */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">DPR Document</div>
                <div className="card-subtitle">Accepted: PDF, DOCX, DOC (max 200 MB)</div>
              </div>
              <div className="card-body">
                <div
                  className={`upload-zone ${dragover ? 'dragover' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragover(true); }}
                  onDragLeave={() => setDragover(false)}
                  onDrop={e => { e.preventDefault(); setDragover(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                >
                  <input type="file" ref={fileRef} hidden accept=".pdf,.doc,.docx" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <>
                      <div className="upload-zone-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>
                        <FileText size={28} />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready for submission</div>
                    </>
                  ) : (
                    <>
                      <div className="upload-zone-icon"><Upload size={28} /></div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        Drag & drop your DPR document here
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>or click to browse files</div>
                      <span className="badge badge-processing">PDF · DOCX · DOC · Max 200 MB</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Project Metadata */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><div className="card-title">Project Information</div></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="label">Project Title *</label>
                  <input className="input-field" placeholder="e.g. NH-217 Four-Lane Highway Extension" required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">State *</label>
                    <select className="select-field" required>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Sector *</label>
                    <select className="select-field" required>
                      <option value="">Select Sector</option>
                      {SECTORS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">Estimated Project Cost (₹ Crore) *</label>
                    <input className="input-field" type="number" placeholder="e.g. 842" min="1" required />
                  </div>
                  <div className="form-group">
                    <label className="label">Proposed Duration (Months) *</label>
                    <input className="input-field" type="number" placeholder="e.g. 36" min="1" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Submitted By (Department / Agency) *</label>
                  <input className="input-field" placeholder="e.g. Arunachal Pradesh PWD" required />
                </div>
                <div className="form-group">
                  <label className="label">Additional Notes</label>
                  <textarea className="input-field" rows={3} placeholder="Any additional context for reviewers..." style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Info box */}
            <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: 10, marginBottom: 20 }}>
              <AlertCircle size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Upon submission, our AI engine will automatically parse your document and generate a quality assessment across 8 dimensions, a risk prediction score, and actionable recommendations within 2–4 minutes.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 14, justifyContent: 'center', opacity: uploading ? 0.7 : 1 }}
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <span className="pulse">⚙</span>
                  Submitting & Processing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Submit DPR for AI Assessment
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
