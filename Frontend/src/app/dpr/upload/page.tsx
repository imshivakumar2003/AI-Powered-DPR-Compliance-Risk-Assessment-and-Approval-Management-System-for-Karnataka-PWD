// TOPLINE - User Module Upload DPR Page
'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useUser } from '@/lib/UserContext';
import { getUserHeaders } from '@/lib/api';
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Eye, Clock,
  FileCheck, ShieldCheck, Sparkles, RefreshCw
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DISTRICTS = [
  'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri',
  'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur',
  'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada',
  'Vijayanagara', 'Vijayapura', 'Yadgir'
];

const SECTORS = ['Roads', 'Bridges', 'Infrastructure', 'Buildings', 'Power', 'Healthcare', 'Education', 'Tourism', 'Irrigation', 'Urban', 'Water Supply'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUser();

  const [dragover, setDragover] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedId, setUploadedId] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Form field state
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cost, setCost] = useState('');
  const [duration, setDuration] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-fill logged in user identity
  useEffect(() => {
    if (user?.displayName || user?.username) {
      setSubmittedBy(user.displayName || user.username);
    }
  }, [user]);

  const validateFile = (f: File): boolean => {
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    const validExts = ['.pdf', '.docx', '.doc'];
    if (!validExts.includes(ext)) {
      setError('Invalid file format! Only PDF (.pdf), DOCX (.docx), and DOC (.doc) documents are allowed.');
      return false;
    }
    if (f.size > 200 * 1024 * 1024) {
      setError('File size exceeds the 200 MB maximum limit.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFileSelect = (f: File) => {
    if (validateFile(f)) {
      setFile(f);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a DPR document file to upload.');
      return;
    }
    if (!validateFile(file)) return;

    setError('');
    setUploading(true);
    setUploadStep(1);

    try {
      // Step 1: Upload File & Create Record
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('state', district || 'Karnataka');
      formData.append('sector', sector || 'Roads');
      formData.append('cost_crores', cost || '100');
      formData.append('duration_months', duration || '12');
      formData.append('submitted_by', submittedBy || user.username || 'User');
      if (notes.trim()) formData.append('notes', notes.trim());

      setUploadStep(2); // AI Processing

      const headers = getUserHeaders();
      const res = await fetch(`${API_URL}/api/dpr/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Upload failed (${res.status})`);
      }

      setUploadStep(3); // Registration & Track History
      const data = await res.json();
      setUploadedId(data.id || '');
      setUploaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please check your document and network connection.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAnother = () => {
    setUploaded(false);
    setFile(null);
    setUploadedId('');
    setError('');
    setTitle('');
    setDistrict('');
    setSector('');
    setCost('');
    setDuration('');
    setNotes('');
  };

  return (
    <>
      <Topbar title="Upload DPR" subtitle="Submit a new Detailed Project Report for automated AI quality & compliance assessment" />
      
      <div className="page-content fade-in" style={{ maxWidth: 840 }}>

        {uploaded ? (
          /* Confirmation Screen */
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#22c55e' }}>
              <CheckCircle size={38} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
              DPR Document Uploaded Successfully!
            </h2>
            
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.6 }}>
              Your Detailed Project Report <strong>"{title}"</strong> has been registered in the database, bound to your account (<code>{submittedBy}</code>), and queued for AI compliance evaluation.
            </p>

            {/* Status Card */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 18, border: '1px solid var(--border)', maxWidth: 540, margin: '0 auto 28px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tracking Reference:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-blue-light)' }}>{uploadedId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Project Sector & District:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sector} · {district}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Submitted By:</span>
                <span style={{ fontWeight: 700, color: '#4ade80' }}>{submittedBy}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href={`/dpr/${uploadedId}/viewer`}
                className="topbar-btn primary"
                style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <Eye size={16} /> View Uploaded DPR PDF
              </Link>
              <Link
                href={`/application-status/${uploadedId}`}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#38bdf8', border: '1px solid rgba(59,130,246,0.3)', fontSize: 13, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <Clock size={16} /> View Track &amp; History
              </Link>
              <button
                onClick={handleUploadAnother}
                className="topbar-btn"
                style={{ padding: '10px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={15} /> Upload Another
              </button>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 20 }}>
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>{error}</div>
              </div>
            )}

            {/* Document Picker Card */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} color="var(--accent-blue)" /> DPR Document File Upload
                  </div>
                  <div className="card-subtitle">Supported Formats: PDF (.pdf), Word (.docx, .doc) up to 200 MB</div>
                </div>
              </div>

              <div className="card-body">
                <div
                  className={`upload-zone ${dragover ? 'dragover' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragover(true); }}
                  onDragLeave={() => setDragover(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragover(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileSelect(f);
                  }}
                >
                  <input
                    type="file"
                    ref={fileRef}
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />

                  {file ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className="upload-zone-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', margin: '0 auto 10px' }}>
                        <FileCheck size={32} />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB · Valid Document Selected
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div className="upload-zone-icon" style={{ margin: '0 auto 12px' }}>
                        <Upload size={32} />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                        Drag &amp; drop your DPR PDF document here
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                        or click to browse your local computer files
                      </div>
                      <span className="badge badge-processing" style={{ fontSize: 11, padding: '4px 12px' }}>
                        PDF · DOCX · DOC · Max 200 MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Project Metadata Card */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">Project Details &amp; Account Binding</div>
              </div>

              <div className="card-body">
                <div className="form-group">
                  <label className="label">Project / Highway Proposal Title *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Construction of 4-Lane Highway Bypass (SH-20)"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">District / Location *</label>
                    <select
                      className="select-field"
                      required
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                    >
                      <option value="">Select Karnataka District</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Sector *</label>
                    <select
                      className="select-field"
                      required
                      value={sector}
                      onChange={e => setSector(e.target.value)}
                    >
                      <option value="">Select Infrastructure Sector</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">Estimated Project Cost (₹ Crore) *</label>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="e.g. 120"
                      min="1"
                      required
                      value={cost}
                      onChange={e => setCost(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Proposed Execution Duration (Months) *</label>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="e.g. 24"
                      min="1"
                      required
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Submitted By / Account Owner *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Karnataka PWD / Submitter Name"
                    required
                    value={submittedBy}
                    onChange={e => setSubmittedBy(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Bound to user account: <strong style={{ color: 'var(--text-secondary)' }}>{user.username || 'Logged-in User'}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Additional Notes or Context (Optional)</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Provide additional technical details, KSR 2025-26 rate references, or environmental clearances..."
                    style={{ resize: 'vertical' }}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Submission Progress & Submit Button */}
            {uploading && (
              <div className="card" style={{ padding: 20, marginBottom: 20, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', color: '#38bdf8' }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {uploadStep === 1 && 'Uploading document to secure storage…'}
                    {uploadStep === 2 && 'Running AI compliance & quality scoring engine…'}
                    {uploadStep === 3 && 'Registering Track & History timeline…'}
                  </div>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: uploadStep === 1 ? '35%' : uploadStep === 2 ? '75%' : '95%',
                    background: 'var(--accent-blue)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="topbar-btn primary"
              style={{
                width: '100%', padding: '14px', fontSize: 14, fontWeight: 800,
                justifyContent: 'center', cursor: uploading || !file ? 'not-allowed' : 'pointer',
                opacity: uploading || !file ? 0.7 : 1
              }}
              disabled={uploading || !file}
            >
              {uploading ? (
                <>Processing DPR Document…</>
              ) : (
                <>
                  <Upload size={16} /> Submit DPR Document &amp; Run AI Assessment
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
