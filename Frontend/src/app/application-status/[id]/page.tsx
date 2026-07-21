// TOPLINE
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Brain, Eye,
  AlertTriangle, Send, Upload, Bell, BellOff, FileText,
  RefreshCw, Download, Printer, ChevronDown, ChevronUp,
  History, MessageSquare, GitBranch, Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  author_role: string;
  author_name: string;
  message: string;
  attachment_filename: string | null;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  actor_name: string;
  actor_role: string;
  created_at: string;
}

interface DprVersion {
  id: string;
  version_number: number;
  original_filename: string;
  uploaded_by: string;
  upload_date: string;
  notes: string | null;
}

interface Notification {
  id: string;
  event_type: string;
  message: string;
  is_read: number;
  created_at: string;
}

interface AppDetail {
  id: string;
  title: string;
  original_filename: string;
  district: string;
  sector: string;
  department: string;
  submitted_by: string;
  upload_date: string;
  status: string;
  reviewed_by: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  overall_score: number | null;
  risk_score: number | null;
  compliance_score: number | null;
  estimated_cost: number;
  duration_months: number;
  approval_comment: string | null;
  progress_pct: number;
  step_index: number;
  ref_number: string;
  steps: string[];
  comments: Comment[];
  timeline: TimelineEvent[];
  versions: DprVersion[];
  notifications: Notification[];
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso.slice(0, 16); }
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:      { label: 'Pending',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <Clock size={12}/> },
  PROCESSING:   { label: 'AI Analysis',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <Brain size={12}/> },
  UNDER_REVIEW: { label: 'Under Review', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', icon: <Eye size={12}/> },
  PENDING_INFO: { label: 'Pending Info', color: '#eab308', bg: 'rgba(234,179,8,0.1)',  icon: <AlertTriangle size={12}/> },
  APPROVED:     { label: 'Approved',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  icon: <CheckCircle size={12}/> },
  REJECTED:     { label: 'Rejected',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={12}/> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status?.toUpperCase()] || STATUS_CFG.PENDING;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
      fontWeight: 700, padding: '4px 10px', borderRadius: 7,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Progress Timeline ────────────────────────────────────────────────────────

function ProgressTimeline({ steps, currentIdx, status }: { steps: string[]; currentIdx: number; status: string }) {
  const statusCfg = STATUS_CFG[status?.toUpperCase()] || STATUS_CFG.PENDING;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
      {steps.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFinal = i === steps.length - 1;
        const stepColor = isCurrent
          ? statusCfg.color
          : isCompleted
            ? '#22c55e'
            : 'rgba(255,255,255,0.1)';
        const textColor = isCurrent ? statusCfg.color : isCompleted ? '#22c55e' : 'var(--text-muted)';

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: isFinal ? 'none' : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              {/* Circle */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isCurrent ? stepColor : isCompleted ? '#22c55e' : 'var(--bg-secondary)',
                border: `2px solid ${stepColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isCurrent ? `0 0 12px ${stepColor}50` : 'none',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {isCompleted
                  ? <CheckCircle size={16} color="white" />
                  : isCurrent
                    ? (i === steps.length - 1
                      ? (status === 'APPROVED' ? <CheckCircle size={16} color="white" /> : <XCircle size={16} color="white" />)
                      : <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white' }} />)
                    : <div style={{ width: 8, height: 8, borderRadius: '50%', background: stepColor }} />
                }
              </div>
              {/* Label */}
              <div style={{ marginTop: 8, fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                color: textColor, textAlign: 'center', lineHeight: 1.3, maxWidth: 74, wordBreak: 'break-word' }}>
                {step}
              </div>
              {isCurrent && (
                <div style={{ marginTop: 3, fontSize: 9, color: statusCfg.color, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.5px' }}>← Current</div>
              )}
            </div>
            {/* Connector */}
            {!isFinal && (
              <div style={{ flex: 1, height: 2, margin: '-18px 4px 0',
                background: isCompleted ? '#22c55e' : 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────

function ChatBubble({ comment }: { comment: Comment }) {
  const isReviewer = comment.author_role === 'reviewer';
  const bg = isReviewer ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.08)';
  const borderColor = isReviewer ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)';
  const nameColor = isReviewer ? 'var(--accent-blue-light)' : '#4ade80';
  return (
    <div style={{ display: 'flex', flexDirection: 'column',
      alignItems: isReviewer ? 'flex-start' : 'flex-end', marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 4,
        display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: nameColor }}>{comment.author_name}</span>
        <span style={{ background: `${isReviewer ? '#3b82f6' : '#22c55e'}18`,
          color: isReviewer ? '#60a5fa' : '#4ade80',
          padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
          textTransform: 'uppercase' }}>
          {isReviewer ? 'Reviewer' : 'User'}
        </span>
        <span>{relTime(comment.created_at)}</span>
      </div>
      <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: isReviewer ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: bg, border: `1px solid ${borderColor}`, fontSize: 12.5,
        color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {comment.message}
        {comment.attachment_filename && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'var(--accent-blue-light)', fontWeight: 600 }}>
            <FileText size={12} /> {comment.attachment_filename}
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
        {fmtDateTime(comment.created_at)}
      </div>
    </div>
  );
}

// ─── Timeline Event ───────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  upload:           { icon: <Upload size={13} />,       color: '#3b82f6' },
  ai_analysis:      { icon: <Brain size={13} />,         color: '#8b5cf6' },
  reviewer_comment: { icon: <MessageSquare size={13} />, color: '#fb923c' },
  user_reply:       { icon: <Send size={13} />,          color: '#22c55e' },
  revision_upload:  { icon: <GitBranch size={13} />,     color: '#06b6d4' },
  status_approved:  { icon: <CheckCircle size={13} />,   color: '#22c55e' },
  status_rejected:  { icon: <XCircle size={13} />,       color: '#ef4444' },
  status_pending:   { icon: <Clock size={13} />,         color: '#f59e0b' },
  status_under_review: { icon: <Eye size={13} />,        color: '#fb923c' },
  default:          { icon: <History size={13} />,       color: 'var(--text-muted)' },
};

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const cfg = EVENT_ICONS[event.event_type] || EVENT_ICONS.default;
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* Vertical line */}
      {!isLast && (
        <div style={{ position: 'absolute', left: 16, top: 32, bottom: -14, width: 1,
          background: 'rgba(255,255,255,0.06)' }} />
      )}
      {/* Icon circle */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${cfg.color}18`,
        border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: cfg.color, flexShrink: 0, zIndex: 1 }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{event.title}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{relTime(event.created_at)}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
          {event.description}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
          By <strong style={{ color: cfg.color }}>{event.actor_name}</strong>
          {' · '}{fmtDateTime(event.created_at)}
        </div>
      </div>
    </div>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotifItem({ n }: { n: Notification }) {
  const isUnread = n.is_read === 0;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0',
      borderBottom: '1px solid rgba(45,55,72,0.4)', opacity: isUnread ? 1 : 0.6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isUnread ? '#3b82f6' : 'transparent',
        border: isUnread ? '' : '1px solid var(--border)', flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDateTime(n.created_at)}</div>
      </div>
    </div>
  );
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────

export default function ApplicationStatusDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'chat' | 'versions' | 'notifications'>('timeline');

  // Reply form
  const [replyMsg, setReplyMsg] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  // Revision upload form
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [uploadingRevision, setUploadingRevision] = useState(false);

  // Sections expand/collapse
  const [infoExpanded, setInfoExpanded] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch(`${API}/api/application-status/${id}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeTab, data?.comments]);

  const sendReply = async () => {
    if (!replyMsg.trim() || !data) return;
    setSendingReply(true);
    try {
      const form = new FormData();
      form.append('author_role', 'user');
      form.append('author_name', data.submitted_by || 'User');
      form.append('message', replyMsg);
      if (replyFile) form.append('file', replyFile);
      await fetch(`${API}/api/application-status/${id}/comment-with-file`, { method: 'POST', body: form });
      setReplyMsg('');
      setReplyFile(null);
      await load();
    } finally {
      setSendingReply(false);
    }
  };

  const uploadRevision = async () => {
    if (!revisionFile || !data) return;
    setUploadingRevision(true);
    try {
      const form = new FormData();
      form.append('file', revisionFile);
      form.append('uploaded_by', data.submitted_by || 'User');
      form.append('notes', revisionNotes);
      await fetch(`${API}/api/application-status/${id}/upload-revision`, { method: 'POST', body: form });
      setRevisionFile(null);
      setRevisionNotes('');
      await load();
    } finally {
      setUploadingRevision(false);
    }
  };

  const markRead = async () => {
    await fetch(`${API}/api/application-status/${id}/notifications/read?role=user`, { method: 'POST' });
    await load();
  };

  if (loading) {
    return (
      <>
        <Topbar title="Application Status" subtitle="Loading…" />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border)',
              borderTopColor: 'var(--accent-blue)', margin: '0 auto 14px', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading DPR details…</div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Topbar title="Not Found" />
        <div className="page-content" style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>DPR not found.</div>
          <Link href="/application-status" style={{ display: 'inline-flex', gap: 6, marginTop: 16, alignItems: 'center',
            color: 'var(--accent-blue-light)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to list
          </Link>
        </div>
      </>
    );
  }

  const statusCfg = STATUS_CFG[data.status?.toUpperCase()] || STATUS_CFG.PENDING;
  const isPendingInfo = data.status?.toUpperCase() === 'PENDING_INFO' || data.status?.toUpperCase() === 'PENDING';
  const unreadCount = data.notifications.filter(n => n.is_read === 0).length;
  const nextVersion = (data.versions.length + 1);

  return (
    <>
      <Topbar
        title="Application Status Detail"
        subtitle={`${data.ref_number} · ${data.title}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/application-status" className="topbar-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <ArrowLeft size={13} /> Back
            </Link>
            <button onClick={() => window.print()} className="topbar-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={13} /> Print
            </button>
            <a href={`${API}/api/report/${data.id}`} className="topbar-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }} target="_blank">
              <Download size={13} /> AI Report
            </a>
          </div>
        }
      />

      <div className="page-content fade-in">

        {/* ── Hero Status Banner ── */}
        <div style={{ padding: '18px 22px', borderRadius: 14, marginBottom: 20,
          background: `linear-gradient(135deg, ${statusCfg.color}12, ${statusCfg.color}06)`,
          border: `1px solid ${statusCfg.color}30`,
          display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: `${statusCfg.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusCfg.color, flexShrink: 0 }}>
            {statusCfg.icon && <div style={{ transform: 'scale(2)' }}>{statusCfg.icon}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4,
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Current Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: statusCfg.color, fontFamily: 'var(--font-display)' }}>
                {statusCfg.label}
              </span>
              <StatusBadge status={data.status} />
            </div>
            {data.approval_comment && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                <strong style={{ color: statusCfg.color }}>Reviewer Note: </strong>{data.approval_comment}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Progress</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: statusCfg.color, fontFamily: 'var(--font-display)' }}>
              {data.progress_pct}%
            </div>
            <div style={{ width: 80, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginLeft: 'auto' }}>
              <div style={{ height: '100%', width: `${data.progress_pct}%`, background: statusCfg.color, borderRadius: 3 }} />
            </div>
          </div>
        </div>

        {/* ── Progress Timeline ── */}
        <div className="card" style={{ marginBottom: 20, padding: '18px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', marginBottom: 20 }}>🗂️ Application Progress</div>
          <ProgressTimeline steps={data.steps} currentIdx={data.step_index} status={data.status} />
        </div>

        {/* ── Info Grid ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: infoExpanded ? '1px solid var(--border)' : 'none',
            cursor: 'pointer' }}
            onClick={() => setInfoExpanded(e => !e)}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              📋 DPR Information
            </div>
            {infoExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
          </div>
          {infoExpanded && (
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                {[
                  { label: 'DPR Name', value: data.title },
                  { label: 'Reference No.', value: data.ref_number, mono: true },
                  { label: 'Original File', value: data.original_filename },
                  { label: 'District', value: data.district },
                  { label: 'Department', value: data.department },
                  { label: 'Sector', value: data.sector },
                  { label: 'Submitted By', value: data.submitted_by },
                  { label: 'Submission Date', value: fmtDateTime(data.upload_date) },
                  { label: 'Estimated Cost', value: `₹${data.estimated_cost} Cr.` },
                  { label: 'Duration', value: `${data.duration_months} months` },
                  { label: 'Assigned Reviewer', value: data.reviewer_name || 'Not assigned yet' },
                  { label: 'Last Reviewed', value: fmtDateTime(data.reviewed_at) },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600,
                      fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Score row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 18 }}>
                {[
                  { label: 'AI Quality Score', value: data.overall_score, unit: '/100', color: '#3b82f6' },
                  { label: 'Risk Score', value: data.risk_score, unit: '/100',
                    color: data.risk_score !== null ? (data.risk_score > 70 ? '#ef4444' : data.risk_score > 40 ? '#f59e0b' : '#22c55e') : 'var(--text-muted)' },
                  { label: 'Compliance Score', value: data.compliance_score, unit: '%', color: '#22c55e' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} style={{ padding: '12px 16px', borderRadius: 9,
                    background: value !== null ? `${color}10` : 'var(--bg-secondary)',
                    border: `1px solid ${value !== null ? `${color}25` : 'var(--border)'}` }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{label}</div>
                    {value !== null ? (
                      <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'var(--font-display)' }}>
                        {value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending analysis</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 18, gap: 2, flexWrap: 'wrap' }}>
          {([
            { key: 'timeline', icon: <History size={12}/>, label: 'Timeline History' },
            { key: 'chat', icon: <MessageSquare size={12}/>, label: `Conversation (${data.comments.length})` },
            { key: 'versions', icon: <GitBranch size={12}/>, label: `DPR Versions (${data.versions.length})` },
            { key: 'notifications', icon: <Bell size={12}/>,
              label: `Notifications${unreadCount > 0 ? ` (${unreadCount} new)` : ''}` },
          ] as { key: string; icon: React.ReactNode; label: string }[]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent-blue)' : 'transparent'}`,
                color: activeTab === tab.key ? 'var(--accent-blue-light)' : 'var(--text-muted)',
                marginBottom: -1, transition: 'all 0.15s' }}>
              {tab.icon} {tab.label}
              {tab.key === 'notifications' && unreadCount > 0 && (
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#ef4444',
                  color: 'white', fontSize: 9, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Timeline tab ── */}
        {activeTab === 'timeline' && (
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)', marginBottom: 20 }}>Complete Timeline History</div>
            {data.timeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No events yet.
              </div>
            ) : (
              data.timeline.map((event, i) => (
                <TimelineItem key={event.id} event={event} isLast={i === data.timeline.length - 1} />
              ))
            )}
          </div>
        )}

        {/* ── Chat tab ── */}
        {activeTab === 'chat' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Reviewer Conversation
              </div>
              {data.reviewer_name && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  🧑‍💼 Reviewer: <strong style={{ color: 'var(--text-secondary)' }}>{data.reviewer_name}</strong>
                  {' · '}{data.department}
                </div>
              )}
            </div>

            {/* Chat window */}
            <div style={{ padding: '16px 18px', minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
              {data.comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No messages yet. The reviewer will comment here when they review your DPR.
                </div>
              ) : (
                data.comments.map(c => <ChatBubble key={c.id} comment={c} />)
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reply input */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Your Reply
              </div>
              <textarea
                value={replyMsg}
                onChange={e => setReplyMsg(e.target.value)}
                placeholder="Type your reply to the reviewer…"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                  fontSize: 12.5, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)',
                  lineHeight: 1.5, boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* File attachment */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                  borderRadius: 7, border: '1px dashed var(--border)', cursor: 'pointer',
                  fontSize: 11.5, color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                  <Upload size={12} />
                  {replyFile ? replyFile.name.slice(0, 20) + '…' : 'Attach document'}
                  <input type="file" style={{ display: 'none' }}
                    onChange={e => setReplyFile(e.target.files?.[0] || null)} />
                </label>

                <button onClick={sendReply} disabled={sendingReply || !replyMsg.trim()}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 8,
                    background: replyMsg.trim() ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: replyMsg.trim() ? 'white' : 'var(--text-muted)',
                    border: 'none', fontSize: 12.5, fontWeight: 700, cursor: replyMsg.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s' }}>
                  {sendingReply
                    ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                    : <><Send size={13} /> Send Reply</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Versions tab ── */}
        {activeTab === 'versions' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                DPR Version History
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {data.versions.length === 0 ? 'No revisions uploaded yet.' : `${data.versions.length} version(s)`}
              </div>
            </div>

            {/* Version list */}
            <div style={{ padding: '4px 0' }}>
              {data.versions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No revised DPRs uploaded yet.
                </div>
              ) : (
                data.versions.map((v, i) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px', borderBottom: i < data.versions.length - 1 ? '1px solid rgba(45,55,72,0.4)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9,
                      background: i === data.versions.length - 1 ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)',
                      border: `1px solid ${i === data.versions.length - 1 ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900,
                      color: i === data.versions.length - 1 ? '#22c55e' : 'var(--text-muted)' }}>
                      v{v.version_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.original_filename}
                        </span>
                        {i === data.versions.length - 1 && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                            background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                            LATEST
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Uploaded by {v.uploaded_by} · {fmtDateTime(v.upload_date)}
                      </div>
                      {v.notes && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontStyle: 'italic' }}>
                          {v.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Upload revision form */}
            <div style={{ padding: '16px 18px', borderTop: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
                📤 Upload Revised DPR (Version {nextVersion})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  borderRadius: 9, border: `2px dashed ${revisionFile ? '#22c55e' : 'var(--border)'}`,
                  background: revisionFile ? 'rgba(34,197,94,0.05)' : 'var(--bg-secondary)', cursor: 'pointer' }}>
                  <Upload size={16} color={revisionFile ? '#22c55e' : 'var(--text-muted)'} />
                  <span style={{ fontSize: 12, color: revisionFile ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>
                    {revisionFile ? revisionFile.name : 'Select revised DPR (PDF/DOC)'}
                  </span>
                  <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => setRevisionFile(e.target.files?.[0] || null)} />
                </label>
                <input placeholder="Version notes (optional)…" value={revisionNotes}
                  onChange={e => setRevisionNotes(e.target.value)}
                  style={{ padding: '9px 12px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-primary)',
                    fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)' }} />
                <button onClick={uploadRevision} disabled={uploadingRevision || !revisionFile}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 18px', borderRadius: 8,
                    background: revisionFile ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: revisionFile ? 'white' : 'var(--text-muted)',
                    border: 'none', fontSize: 13, fontWeight: 700, cursor: revisionFile ? 'pointer' : 'default',
                    transition: 'all 0.15s' }}>
                  {uploadingRevision
                    ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
                    : <><Upload size={14} /> Submit Revised DPR v{nextVersion}</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications tab ── */}
        {activeTab === 'notifications' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Notifications
              </div>
              {unreadCount > 0 && (
                <button onClick={markRead}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                    borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}>
                  <BellOff size={12} /> Mark all read
                </button>
              )}
            </div>
            <div style={{ padding: '4px 18px' }}>
              {data.notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No notifications yet.
                </div>
              ) : (
                data.notifications.map(n => <NotifItem key={n.id} n={n} />)
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
