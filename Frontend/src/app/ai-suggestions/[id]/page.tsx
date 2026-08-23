// TOPLINE
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Send, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CategoryRec {
  category: string;
  icon: string;
  status: 'Good' | 'Needs Improvement' | 'Critical';
  confidence: number;
  recommendation: string;
  reason: string;
}

interface CategoryAnalysis {
  dpr_id: string;
  title: string;
  in_approvals: boolean;
  categories: CategoryRec[];
}

interface ProjectInfo {
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
  file_available: boolean;
}

function statusStyle(status: string): { bg: string; color: string; icon: React.ReactNode } {
  switch (status) {
    case 'Good':
      return {
        bg: 'rgba(34,197,94,0.1)',
        color: 'var(--accent-green)',
        icon: <CheckCircle size={14} />,
      };
    case 'Needs Improvement':
      return {
        bg: 'rgba(245,158,11,0.1)',
        color: 'var(--accent-amber)',
        icon: <AlertTriangle size={14} />,
      };
    case 'Critical':
      return {
        bg: 'rgba(239,68,68,0.1)',
        color: '#ef4444',
        icon: <XCircle size={14} />,
      };
    default:
      return { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', icon: null };
  }
}

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 99,
        background: 'var(--bg-secondary)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${value}%`, height: '100%',
          background: color, borderRadius: 99,
          transition: 'width 1s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color, width: 34, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

import { useUser } from '@/lib/UserContext';
import { getUserHeaders } from '@/lib/api';
import { MessageSquare, Upload, Shield } from 'lucide-react';

interface CommentItem {
  id: string;
  author_role: string;
  author_name: string;
  message: string;
  attachment_filename?: string | null;
  created_at: string;
}

export default function AiSuggestionDetailPage() {
  const { id } = useParams();
  const dprId = id as string;
  const router = useRouter();
  const { user } = useUser();

  const [analysis, setAnalysis] = useState<CategoryAnalysis | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [replyMsg, setReplyMsg] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const loadComments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/application-status/${dprId}/comments`, { headers: getUserHeaders() });
      if (res.ok) {
        const cData = await res.json();
        setComments(cData);
      }
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [infoRes, catRes, commRes] = await Promise.all([
          fetch(`${API_BASE}/api/dpr/${dprId}/info`, { headers: getUserHeaders() }).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/api/dpr/${dprId}/category-analysis`, { headers: getUserHeaders() }).then(r => {
            if (!r.ok) throw new Error(`Analysis failed (${r.status})`);
            return r.json();
          }),
          fetch(`${API_BASE}/api/application-status/${dprId}/comments`, { headers: getUserHeaders() }).then(r => r.ok ? r.json() : []),
        ]);
        setProject(infoRes);
        setAnalysis(catRes);
        setComments(commRes);
        setSent(catRes?.in_approvals ?? false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dprId]);

  const handleSendComment = async () => {
    if (!replyMsg.trim()) return;
    setSendingReply(true);
    try {
      const form = new FormData();
      form.append('author_role', ['admin', 'state_reviewer', 'reviewer'].includes(user.role?.toLowerCase() || '') ? 'reviewer' : 'user');
      form.append('author_name', user.displayName || user.username || 'User');
      form.append('message', replyMsg.trim());
      if (replyFile) form.append('file', replyFile);

      const res = await fetch(`${API_BASE}/api/application-status/${dprId}/comment-with-file`, {
        method: 'POST',
        headers: getUserHeaders(),
        body: form,
      });

      if (res.ok) {
        setReplyMsg('');
        setReplyFile(null);
        await loadComments();
      }
    } catch (e) {
      console.error('Error sending comment:', e);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendToApprovals = async () => {
    if (sent) {
      router.push('/approvals');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`${API_BASE}/api/dpr/${dprId}/send-to-approvals`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || `Error ${res.status}`);
      }
      setSent(true);
      setAnalysis(prev => prev ? { ...prev, in_approvals: true } : prev);
      // Brief delay then navigate
      setTimeout(() => router.push('/approvals'), 1200);
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Failed to send to approvals');
    } finally {
      setSending(false);
    }
  };

  // Counts
  const goodCount     = analysis?.categories.filter(c => c.status === 'Good').length ?? 0;
  const improveCount  = analysis?.categories.filter(c => c.status === 'Needs Improvement').length ?? 0;
  const criticalCount = analysis?.categories.filter(c => c.status === 'Critical').length ?? 0;

  if (loading) {
    return (
      <>
        <Topbar title="AI Category Analysis" subtitle="Loading recommendations…" />
        <div className="page-content fade-in">
          <div className="empty-state">
            <div style={{ fontSize: 36, animation: 'spin 1.4s linear infinite' }}>⟳</div>
            <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
              Running AI analysis on DPR document…
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Topbar title="AI Category Analysis" subtitle="Error" />
        <div className="page-content">
          <button className="btn btn-secondary" style={{ marginBottom: 20 }} onClick={() => router.push('/ai-suggestions')}>
            <ArrowLeft size={14} /> Back to AI Suggestions
          </button>
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444' }}>
            ⚠ {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="AI Category Analysis"
        subtitle={analysis?.title || dprId}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {project?.file_available && (
              <Link href={`/dpr/${dprId}/viewer`} className="topbar-btn">
                <Eye size={14} /> View DPR
              </Link>
            )}
            <Link href="/ai-suggestions" className="topbar-btn">
              <ArrowLeft size={14} /> All DPRs
            </Link>
          </div>
        }
      />

      <div className="page-content fade-in">

        {/* ── Back link (mobile) ── */}
        <button
          onClick={() => router.push('/ai-suggestions')}
          className="btn btn-secondary"
          style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          <ArrowLeft size={13} /> Back to AI Suggestions
        </button>

        {/* ── Project Header Card ── */}
        {project && (
          <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(139,92,246,0.04))', borderColor: 'rgba(79,70,229,0.2)' }}>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(139,92,246,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, flexShrink: 0,
                }}>
                  📂
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                    {project.title || project.original_filename}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>📍 {project.state}</span>
                    <span>🏭 {project.sector}</span>
                    <span>💰 ₹ {project.estimated_cost?.toFixed(0)} Cr</span>
                    <span>🏢 {project.submitted_by || '—'}</span>
                    <span>📅 {formatDate(project.upload_date)}</span>
                  </div>
                </div>
                {project.overall_score && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 30, fontWeight: 900, fontFamily: 'var(--font-display)',
                      color: project.overall_score >= 80 ? 'var(--accent-green)' : project.overall_score >= 60 ? 'var(--accent-amber)' : '#ef4444',
                    }}>
                      {project.overall_score}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Quality Score</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Summary stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Good', count: goodCount, color: 'var(--accent-green)', icon: '✅' },
            { label: 'Needs Improvement', count: improveCount, color: 'var(--accent-amber)', icon: '⚠️' },
            { label: 'Critical', count: criticalCount, color: '#ef4444', icon: '🚨' },
          ].map(item => (
            <div key={item.label} className="card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: item.color }} />
              <div style={{ fontSize: 26, fontWeight: 900, color: item.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {item.count}<span style={{ fontSize: 14, opacity: 0.5 }}>/10</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {item.icon} {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Section header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <div style={{
            fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '1.5px',
            padding: '4px 14px', background: 'var(--bg-secondary)', borderRadius: 20,
            border: '1px solid var(--border)',
          }}>
            🤖 Category Recommendations
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Category Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}>
          {analysis?.categories.map((cat, idx) => {
            const s = statusStyle(cat.status);
            const isExpanded = expandedIdx === idx;

            return (
              <div
                key={cat.category}
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  borderColor: isExpanded ? s.color + '44' : 'var(--border)',
                  background: isExpanded ? s.bg : 'var(--bg-card)',
                }}
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div style={{ padding: '16px 18px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3, fontFamily: 'var(--font-display)' }}>
                        {cat.category}
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                        color: s.color, background: s.bg,
                        padding: '3px 8px', borderRadius: 20,
                        border: `1px solid ${s.color}33`,
                      }}>
                        {s.icon}
                        {cat.status}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12, color: 'var(--text-muted)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}>▶</div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ marginBottom: isExpanded ? 14 : 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600 }}>
                      AI CONFIDENCE
                    </div>
                    <ConfidenceBar value={cat.confidence} color={s.color} />
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ marginTop: 14, borderTop: `1px solid ${s.color}22`, paddingTop: 14 }}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                          📋 Recommendation
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.65, fontWeight: 500 }}>
                          {cat.recommendation}
                        </div>
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: 9,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
                          💡 Reason
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {cat.reason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Send to My Approvals CTA ── */}
        <div className="card" style={{
          background: sent
            ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.06))'
            : 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(139,92,246,0.08))',
          borderColor: sent ? 'rgba(34,197,94,0.3)' : 'rgba(79,70,229,0.25)',
          padding: '24px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                {sent ? '✅ Sent to My Approvals' : '📨 Send to My Approvals'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {sent
                  ? 'This DPR has been successfully sent to the Approvals queue. The admin can now review the AI recommendations and make a decision.'
                  : 'Once satisfied with the AI analysis, click below to send this DPR to the My Approvals page where the admin can Approve, Reject, or Keep it Pending.'}
              </div>
              {sendError && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>⚠ {sendError}</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', minWidth: 200 }}>
              <button
                onClick={handleSendToApprovals}
                disabled={sending}
                style={{
                  padding: '14px 28px',
                  border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 800,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  background: sent
                    ? 'linear-gradient(135deg, var(--accent-green), #16a34a)'
                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  boxShadow: sent
                    ? '0 4px 20px rgba(34,197,94,0.35)'
                    : '0 4px 20px rgba(79,70,229,0.35)',
                  opacity: sending ? 0.75 : 1,
                }}
              >
                {sending ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending…
                  </>
                ) : sent ? (
                  <>
                    <CheckCircle size={16} />
                    Go to My Approvals
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send to My Approvals
                  </>
                )}
              </button>
              {!sent && (
                <Link
                  href={`/dpr/${dprId}`}
                  className="btn btn-secondary"
                  style={{ textAlign: 'center', fontSize: 12, padding: '10px' }}
                >
                  View Full DPR Analysis
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Synchronized Reviewer Conversation & Message Thread ── */}
        <div className="card" style={{ marginTop: 24, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={18} color="#3b82f6" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  DPR Application Conversation Thread
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Synchronized message thread between Submitter and Reviewers for DPR #{dprId.slice(0, 8)}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
              {comments.length} Messages
            </span>
          </div>

          {/* Messages list */}
          <div style={{ padding: '20px 22px', minHeight: 180, maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No messages yet. Send a message below to start a conversation with the Technical Reviewer.
              </div>
            ) : (
              comments.map(c => {
                const isReviewer = c.author_role.toLowerCase() === 'reviewer' || c.author_role.toLowerCase() === 'admin';
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isReviewer ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: isReviewer ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                      border: `1px solid ${isReviewer ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: isReviewer ? '#60a5fa' : '#34d399' }}>
                          {isReviewer ? '🧑‍💼 Reviewer' : '👤 Submitter'} ({c.author_name})
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {c.message}
                      </div>
                      {c.attachment_filename && (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                          📎 Attachment: {c.attachment_filename}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive Reply Input */}
          <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
            <textarea
              value={replyMsg}
              onChange={e => setReplyMsg(e.target.value)}
              placeholder="Type your message or reply to the reviewer…"
              rows={3}
              style={{
                width: '100%', padding: '12px 14px', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)',
                fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 11.5, color: 'var(--text-muted)' }}>
                <Upload size={13} />
                {replyFile ? replyFile.name.slice(0, 20) + '…' : 'Attach file'}
                <input type="file" style={{ display: 'none' }} onChange={e => setReplyFile(e.target.files?.[0] || null)} />
              </label>

              <button
                onClick={handleSendComment}
                disabled={sendingReply || !replyMsg.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9,
                  background: replyMsg.trim() ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-secondary)',
                  color: replyMsg.trim() ? 'white' : 'var(--text-muted)', border: 'none', fontSize: 13, fontWeight: 700,
                  cursor: replyMsg.trim() ? 'pointer' : 'default', transition: 'all 0.15s'
                }}
              >
                {sendingReply ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
