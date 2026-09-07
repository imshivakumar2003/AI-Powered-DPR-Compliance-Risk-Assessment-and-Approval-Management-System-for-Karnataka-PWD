// TOPLINE
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Eye,
  AlertTriangle, Send, Download, RefreshCw, FileText,
  Building2, MessageSquare, History, Check, X, Sparkles
} from 'lucide-react';
import { getUserHeaders, fetchDprAiScores, DprAiScores } from '@/lib/api';
import { AiScoreBadge, DprScoreStrip, AiScoresFullCard } from '@/components/common/AiScoreBadges';

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface DepartmentTrackItem {
  department_key: string;
  department_name: string;
  assigned_officer: string;
  role_title: string;
  review_status: 'APPROVED' | 'IN_REVIEW' | 'PENDING' | 'CHANGES_REQUESTED' | 'REJECTED';
  approval_date: string | null;
  comments: string;
  pending_days: number;
  sla_status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'COMPLETED' | 'TERMINATED';
}

interface StageItem {
  index: number;
  key: string;
  label: string;
  pct: number;
}

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

interface AppDetail {
  id: string;
  ref_number: string;
  title: string;
  original_filename: string;
  district: string;
  state: string;
  sector: string;
  department: string;
  submitted_by: string;
  upload_date: string;
  status: string;
  overall_status: string;
  granular_status: string;
  current_department: string;
  current_approver: string;
  progress_pct: number;
  step_index: number;
  nine_stages: StageItem[];
  expected_completion_date: string;
  priority_level: string;
  estimated_cost: number;
  duration_months: number;
  department_tracking: DepartmentTrackItem[];
  comments: Comment[];
  timeline: TimelineEvent[];
  certificate?: any;
  approval_comment: string | null;
  overall_score?: number;
  overall_ai_score?: number;
  dpr_quality_score?: number;
  compliance_score?: number;
  risk_score?: number;
  technical_score?: number;
  financial_score?: number;
  documentation_score?: number;
  approval_readiness_score?: number;
  confidence_score?: number;
  ocr_accuracy?: number;
  rag_confidence?: number;
  recommendation_score?: number;
  grade?: string;
  color?: string;
}

function getStatusBadge(status: string) {
  const s = (status || '').toUpperCase();
  if (s.includes('APPROVED') || s === 'FINAL_APPROVED') return { label: 'Final Approved', bg: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.35)', icon: <CheckCircle2 size={13} /> };
  if (s.includes('REJECT')) return { label: 'Rejected', bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)', icon: <XCircle size={13} /> };
  if (s.includes('REVISION') || s.includes('CHANGES')) return { label: 'Returned for Revision', bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.35)', icon: <AlertTriangle size={13} /> };
  return { label: 'In Department Review', bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.35)', icon: <Clock size={13} /> };
}

function getSlaBadge(sla: string) {
  if (sla === 'COMPLETED') return { label: 'Completed', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.15)' };
  if (sla === 'AT_RISK') return { label: 'SLA At Risk', color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.15)' };
  if (sla === 'BREACHED') return { label: 'SLA Breached', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  return { label: 'On Track', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.15)' };
}

export default function ApplicationStatusDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const router = useRouter();
  const { user } = useUser();

  const [detail, setDetail] = useState<AppDetail | null>(null);
  const [aiScores, setAiScores] = useState<DprAiScores | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // New Comment state
  const [newComment, setNewComment] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Language state
  const [language, setLanguage] = useState<'en' | 'kn' | 'hi'>('en');

  const fetchDetail = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [res, scoresData] = await Promise.all([
        fetch(`${API}/api/application-status/${projectId}`, { headers: getUserHeaders() }),
        fetchDprAiScores(projectId)
      ]);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setDetail(data);
      setAiScores(scoresData);
    } catch (err: any) {
      setError(err.message || 'Failed to load application detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [projectId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${API}/api/application-status/${projectId}/comment`, {
        method: 'POST',
        headers: {
          ...getUserHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_role: user?.role || 'Applicant',
          author_name: user?.username || 'Applicant',
          message: newComment.trim(),
        }),
      });
      if (res.ok) {
        setNewComment('');
        fetchDetail();
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar title="Application Tracking" subtitle="Loading application status..." />
        <div className="page-content" style={{ textAlign: 'center', padding: 40 }}>
          <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 10px', color: 'var(--accent-blue)' }} />
          <div style={{ color: 'var(--text-muted)' }}>Retrieving 9-stage workflow status from Karnataka PWD...</div>
        </div>
      </>
    );
  }

  if (error || !detail) {
    return (
      <>
        <Topbar title="Application Tracking" subtitle="Error" />
        <div className="page-content">
          <div className="card" style={{ padding: 30, textAlign: 'center' }}>
            <AlertTriangle size={36} color="var(--accent-amber)" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Failed to load application status</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{error || 'Project not found.'}</div>
            <Link href="/application-status" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>
              <ArrowLeft size={14} /> Back to Applications List
            </Link>
          </div>
        </div>
      </>
    );
  }

  const statusStyle = getStatusBadge(detail.granular_status || detail.overall_status);
  const isFinalApproved = String(detail.overall_status || '').toUpperCase().includes('APPROVED');

  return (
    <>
      <Topbar
        title={detail.title}
        subtitle={`DPR ID: ${detail.ref_number} · ${detail.district}, ${detail.state || 'Karnataka'} · ₹${detail.estimated_cost?.toFixed(1)} Cr`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Multi-language Selector */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: 2 }}>
              {(['en', 'kn', 'hi'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  style={{
                    background: language === l ? 'var(--accent-blue)' : 'transparent',
                    color: language === l ? '#fff' : 'var(--text-muted)',
                    border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {l === 'en' ? 'EN' : l === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
                </button>
              ))}
            </div>

            {/* Dynamic Status-Based Report Download Action */}
            {isFinalApproved ? (
              <a
                href={`${API}/api/dpr/${detail.id}/final-approved-report/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="topbar-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(34,197,94,0.2)', color: 'var(--accent-green)',
                  border: '1px solid rgba(34,197,94,0.45)', fontWeight: 800, fontSize: 12, padding: '5px 12px'
                }}
              >
                <CheckCircle2 size={15} /> Download Final Report (PDF)
              </a>
            ) : String(detail.overall_status || '').toUpperCase().includes('REJECT') ? (
              <a
                href={`${API}/api/dpr/${detail.id}/rejection-report/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="topbar-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(239,68,68,0.2)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.45)', fontWeight: 800, fontSize: 12, padding: '5px 12px'
                }}
              >
                <XCircle size={15} /> Download Rejection Report (PDF)
              </a>
            ) : (
              <a
                href={`${API}/api/dpr/${detail.id}/status-report/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="topbar-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)',
                  border: '1px solid rgba(59,130,246,0.45)', fontWeight: 800, fontSize: 12, padding: '5px 12px'
                }}
              >
                <Clock size={15} /> Download Status Report (PDF)
              </a>
            )}

            <Link href={`/dpr/${detail.id}/viewer`} className="topbar-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> View DPR Document
            </Link>
          </div>
        }
      />

      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. PROJECT HEADER HERO CARD ── */}
        <div className="card" style={{ padding: 22, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
                  DPR ID: {detail.ref_number}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 4, ...statusStyle }}>
                  {statusStyle.icon} Current Status: {detail.granular_status}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                  Progress: {detail.progress_pct}%
                </span>
              </div>

              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 8, lineHeight: 1.3 }}>
                {detail.title}
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                <span>📍 Location: <strong style={{ color: '#fff' }}>{detail.district}, {detail.state || 'Karnataka'}</strong></span>
                <span>🏭 Sector: <strong style={{ color: '#fff' }}>{detail.sector}</strong></span>
                <span>💰 Outlay: <strong style={{ color: 'var(--accent-green)' }}>₹{detail.estimated_cost?.toFixed(2)} Cr</strong></span>
                <span>👤 Submitter: <strong style={{ color: '#fff' }}>{detail.submitted_by}</strong></span>
                <span>📅 Submitted: <strong>{detail.upload_date?.slice(0, 10)}</strong></span>
                <span>🎯 Target SLA: <strong style={{ color: 'var(--accent-cyan)' }}>{detail.expected_completion_date}</strong></span>
              </div>

              {/* AI Scores Summary Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={12} color="#3b82f6" /> AI Evaluation:
                </span>
                <AiScoreBadge score={detail.dpr_quality_score ?? detail.overall_score} label="Quality" size="sm" />
                <AiScoreBadge score={detail.compliance_score} label="Compliance" size="sm" />
                <AiScoreBadge score={detail.risk_score} label="Risk" size="sm" isRisk={true} />
                <AiScoreBadge score={detail.approval_readiness_score} label="Readiness" size="sm" />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-cyan)' }}>
                {detail.progress_pct}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Workflow Progress</div>
              <div style={{ fontSize: 11.5, color: '#fff', marginTop: 4 }}>
                Current Reviewer: <strong>{detail.current_approver}</strong>
              </div>
              <div style={{ fontSize: 11, color: 'var(--accent-blue)' }}>
                {detail.current_department}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. AI SCORES FULL INTELLIGENCE CARD ── */}
        {aiScores && (
          <AiScoresFullCard scores={aiScores} />
        )}

        {/* ── 3. 9-STAGE VISUAL WORKFLOW PROGRESS TIMELINE ── */}
        <div className="card" style={{ padding: 20, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            9-Stage Government Workflow Progression:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
            {(detail.nine_stages || []).map((stg, sIdx) => {
              const isDone = sIdx < detail.step_index || detail.progress_pct === 100;
              const isCurrent = sIdx === detail.step_index && detail.progress_pct < 100;
              return (
                <div
                  key={stg.key}
                  style={{
                    padding: '10px 8px', borderRadius: 6, textAlign: 'center',
                    background: isDone ? 'rgba(34,197,94,0.1)' : isCurrent ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.02)',
                    border: isDone ? '1px solid rgba(34,197,94,0.3)' : isCurrent ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', gap: 4
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    {isDone ? '✅' : isCurrent ? '⏳' : '○'}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: isDone ? 'var(--accent-green)' : isCurrent ? '#fff' : 'var(--text-muted)' }}>
                    STEP {sIdx + 1}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDone ? '#fff' : isCurrent ? 'var(--accent-cyan)' : 'var(--text-secondary)', lineHeight: 1.2 }}>
                    {stg.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. DEPARTMENT-WISE REVIEW MATRIX TABLE ── */}
        <div className="card" style={{ padding: 20, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Building2 size={16} color="var(--accent-blue)" />
            Department-Wise Approval Status &amp; SLA Tracking:
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Department</th>
                  <th style={{ padding: '8px 10px' }}>Assigned Officer</th>
                  <th style={{ padding: '8px 10px' }}>Review Status</th>
                  <th style={{ padding: '8px 10px' }}>Approval Date</th>
                  <th style={{ padding: '8px 10px' }}>Comments / Remarks</th>
                  <th style={{ padding: '8px 10px' }}>SLA Status</th>
                </tr>
              </thead>
              <tbody>
                {(detail.department_tracking || []).map((dt, idx) => {
                  const sla = getSlaBadge(dt.sla_status);
                  const isAppr = dt.review_status === 'APPROVED';
                  const isRev = dt.review_status === 'IN_REVIEW';
                  const isReq = dt.review_status === 'CHANGES_REQUESTED';
                  const isRej = dt.review_status === 'REJECTED';

                  let badgeColor = 'var(--text-muted)';
                  let badgeBg = 'rgba(255,255,255,0.03)';
                  let icon = '○';
                  let statusLabel = 'Pending';

                  if (isAppr) {
                    badgeColor = 'var(--accent-green)';
                    badgeBg = 'rgba(34,197,94,0.15)';
                    icon = '✓';
                    statusLabel = 'Approved';
                  } else if (isRev) {
                    badgeColor = 'var(--accent-blue)';
                    badgeBg = 'rgba(59,130,246,0.15)';
                    icon = '⏳';
                    statusLabel = 'Under Review';
                  } else if (isReq) {
                    badgeColor = 'var(--accent-amber)';
                    badgeBg = 'rgba(245,158,11,0.15)';
                    icon = '⚠️';
                    statusLabel = 'Revision Required';
                  } else if (isRej) {
                    badgeColor = '#ef4444';
                    badgeBg = 'rgba(239,68,68,0.15)';
                    icon = '❌';
                    statusLabel = 'Rejected';
                  }

                  return (
                    <tr key={dt.department_key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#fff' }}>
                        {idx + 1}. {dt.department_name}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{dt.assigned_officer}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{dt.role_title}</div>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                          background: badgeBg, color: badgeColor,
                          border: isAppr ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                          display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          <span>{icon}</span> {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>
                        {dt.approval_date || 'Pending Review'}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-primary)', maxWidth: 280 }}>
                        {dt.comments}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, background: sla.bg, color: sla.color }}>
                          {sla.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Final Approval Row */}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isFinalApproved ? 'rgba(34,197,94,0.05)' : 'transparent' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 800, color: '#fff' }}>
                    6. Final Approval
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>Principal Secretary (PWD)</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Executive Authority</div>
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: isFinalApproved ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isFinalApproved ? 'var(--accent-green)' : 'var(--text-muted)',
                      border: isFinalApproved ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <span>{isFinalApproved ? '✓' : '○'}</span> {isFinalApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>
                    {isFinalApproved ? 'Sanctioned' : 'Awaiting 5-Department Sign-off'}
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-primary)' }}>
                    {isFinalApproved ? 'Administrative Approval & Technical Sanction granted.' : 'Pending prerequisite directorate reviews.'}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, background: isFinalApproved ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)', color: isFinalApproved ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                      {isFinalApproved ? 'Completed' : 'On Track'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 4. OFFICIAL WORKFLOW TIMELINE & AUDIT HISTORY ── */}
        <div className="card" style={{ padding: 20, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} color="var(--accent-blue)" />
            Workflow Timeline &amp; Approval History:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {detail.timeline && detail.timeline.length > 0 ? (
              detail.timeline.map((evt, eIdx) => (
                <div key={evt.id || eIdx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                      <strong style={{ color: '#fff' }}>{evt.title}</strong>
                      <span>{evt.created_at?.slice(0, 16)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {evt.description}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      Actor: {evt.actor_name} ({evt.actor_role})
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Workflow initialized upon DPR submission.
              </div>
            )}
          </div>
        </div>

        {/* ── 5. COMMENTS & REMARKS LOG ── */}
        <div className="card" style={{ padding: 20, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={16} color="var(--accent-blue)" />
            Department Reviewer Comments &amp; Remarks:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
            {detail.comments && detail.comments.length > 0 ? (
              detail.comments.map(c => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <strong>{c.author_name} ({c.author_role})</strong>
                    <span>{c.created_at?.slice(0, 16)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)', marginTop: 4 }}>
                    {c.message}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
                No reviewer remarks recorded yet. Post a comment or status inquiry below.
              </div>
            )}
          </div>

          <form onSubmit={handlePostComment} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Add official comment or remark on this DPR application..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="select-field"
              style={{ flex: 1, fontSize: 12.5, padding: '8px 12px' }}
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              <Send size={13} /> Send Remark
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
