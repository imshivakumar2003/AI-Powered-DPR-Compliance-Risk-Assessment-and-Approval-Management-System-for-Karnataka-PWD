// TOPLINE
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import {
  CheckCircle2, XCircle, Clock, Eye, RefreshCw, User, CalendarDays,
  ChevronDown, ChevronUp, Sparkles, FileText, AlertTriangle, ShieldCheck,
  Award, DollarSign, Wrench, ShieldAlert, ArrowRight, ExternalLink,
  Download, Stamp, CheckSquare, Search, Filter, Send, Lightbulb,
  Building2, Hash, Layers, Check, X
} from 'lucide-react';
import {
  fetchApprovalsDashboard, fetchDprWorkflowDetail,
  submitDepartmentApprovalAction, fetchDprCertificate,
  ApprovalsDashboardKpis, DprApprovalWorkflow,
  DprWorkflowDetailResponse, DepartmentStage, ApprovalCertificate,
  AiApprovalAssistantInsights
} from '@/lib/api';

const DEPARTMENTS = [
  { key: 'technical', name: 'Technical Review', role: 'Chief Engineer (Technical)' },
  { key: 'financial', name: 'Financial Review', role: 'Chief Accounts Officer (Finance)' },
  { key: 'compliance', name: 'Compliance Review', role: 'Compliance & Legal Director' },
  { key: 'risk', name: 'Risk Assessment Review', role: 'Director (Quality & Safety)' },
  { key: 'executive', name: 'Executive Sanction', role: 'Principal Secretary (PWD)' },
];

const SECTOR_ICONS: Record<string, string> = {
  Roads: '🛣️', Power: '⚡', Healthcare: '🏥', Education: '🎓',
  Tourism: '🏔️', Agriculture: '🌾', Urban: '🏙️', Telecom: '📡',
  Infrastructure: '🏗️',
};

function getOverallStatusBadge(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'FINAL_APPROVED' || s === 'APPROVED') {
    return { label: 'Final Approved', bg: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34, 197, 94, 0.35)', icon: <CheckCircle2 size={13} /> };
  }
  if (s === 'REJECTED') {
    return { label: 'Rejected', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.35)', icon: <XCircle size={13} /> };
  }
  if (s === 'NEEDS_REVISION' || s === 'CHANGES_REQUESTED') {
    return { label: 'Returned for Revision', bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.35)', icon: <AlertTriangle size={13} /> };
  }
  return { label: 'In Department Review', bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59, 130, 246, 0.35)', icon: <Clock size={13} /> };
}

function getStageBadge(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'APPROVED') return { label: 'Approved', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.15)' };
  if (s === 'IN_REVIEW') return { label: 'In Review', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.15)' };
  if (s === 'CHANGES_REQUESTED') return { label: 'Changes Requested', color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.15)' };
  if (s === 'REJECTED') return { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  return { label: 'Pending', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
}

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const highlightDprId = searchParams.get('id') || '';

  const [dashboardData, setDashboardData] = useState<ApprovalsDashboardKpis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active expanded DPR detail map
  const [expandedDetails, setExpandedDetails] = useState<Record<string, DprWorkflowDetailResponse>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  // Action Modal state
  const [actionModalDpr, setActionModalDpr] = useState<DprApprovalWorkflow | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('technical');
  const [selectedDecision, setSelectedDecision] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'>('APPROVE');
  const [reviewerName, setReviewerName] = useState<string>('Chief Engineer (Technical)');
  const [reviewerRole, setReviewerRole] = useState<string>('Technical Directorate');
  const [actionComments, setActionComments] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');

  // Certificate Modal state
  const [certificateModalData, setCertificateModalData] = useState<{
    projectTitle: string;
    certificate: ApprovalCertificate;
    stages: DepartmentStage[];
    cost: number;
    dprId: string;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApprovalsDashboard();
      setDashboardData(data);

      // If there's a highlighted DPR ID from query params, auto-expand it
      if (highlightDprId && data) {
        loadDprDetail(highlightDprId);
      }
    } catch (err) {
      console.error('Error loading approvals dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [highlightDprId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const loadDprDetail = async (dprId: string) => {
    if (expandedDetails[dprId]) {
      // Toggle collapse
      setExpandedDetails(prev => {
        const next = { ...prev };
        delete next[dprId];
        return next;
      });
      return;
    }

    setLoadingDetails(prev => ({ ...prev, [dprId]: true }));
    try {
      const detail = await fetchDprWorkflowDetail(dprId);
      if (detail) {
        setExpandedDetails(prev => ({ ...prev, [dprId]: detail }));
      }
    } catch (err) {
      console.error(`Error loading detail for ${dprId}:`, err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [dprId]: false }));
    }
  };

  const handleOpenActionModal = (wf: DprApprovalWorkflow) => {
    setActionModalDpr(wf);
    const currStage = wf.current_stage || 'technical';
    setSelectedDept(currStage === 'completed' ? 'technical' : currStage);
    const matchedDept = DEPARTMENTS.find(d => d.key === currStage) || DEPARTMENTS[0];
    setReviewerName(matchedDept.role);
    setReviewerRole(matchedDept.name);
    setSelectedDecision('APPROVE');
    setActionComments('');
    setActionError('');
  };

  const handleDeptChange = (deptKey: string) => {
    setSelectedDept(deptKey);
    const matched = DEPARTMENTS.find(d => d.key === deptKey);
    if (matched) {
      setReviewerName(matched.role);
      setReviewerRole(matched.name);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModalDpr) return;
    if (!actionComments.trim()) {
      setActionError('Justification remarks / comments are required for this department action.');
      return;
    }

    setSubmittingAction(true);
    setActionError('');

    try {
      const res = await submitDepartmentApprovalAction(
        actionModalDpr.dpr_id,
        selectedDept,
        selectedDecision,
        reviewerName,
        reviewerRole,
        actionComments.trim()
      );

      if (res && res.success) {
        setActionModalDpr(null);
        // Refresh dashboard and detail
        await loadDashboard();
        const updatedDetail = await fetchDprWorkflowDetail(actionModalDpr.dpr_id);
        if (updatedDetail) {
          setExpandedDetails(prev => ({ ...prev, [actionModalDpr.dpr_id]: updatedDetail }));
        }
      } else {
        setActionError(res?.error || 'Failed to record decision.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error processing request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenCertificate = (wf: DprApprovalWorkflow, cert?: ApprovalCertificate | null) => {
    if (!cert && !wf.certificate) return;
    setCertificateModalData({
      projectTitle: wf.project_title || wf.dpr_id,
      certificate: (cert || wf.certificate)!,
      stages: wf.stages || [],
      cost: wf.estimated_cost || 50.0,
      dprId: wf.dpr_id
    });
  };

  const workflows = dashboardData?.workflows || [];

  const filteredWorkflows = workflows.filter(w => {
    // Status filter
    const ost = String(w.overall_status || '').toUpperCase();
    if (filterStatus === 'APPROVED' && ost !== 'FINAL_APPROVED' && ost !== 'APPROVED') return false;
    if (filterStatus === 'REJECTED' && ost !== 'REJECTED') return false;
    if (filterStatus === 'NEEDS_REVISION' && ost !== 'NEEDS_REVISION' && ost !== 'CHANGES_REQUESTED') return false;
    if (filterStatus === 'IN_REVIEW' && ost !== 'IN_REVIEW' && ost !== 'PENDING' && ost !== 'PENDING_REVIEW') return false;

    // Dept filter
    if (filterDept !== 'ALL' && w.current_stage !== filterDept) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = (w.project_title || '').toLowerCase().includes(q);
      const matchId = w.dpr_id.toLowerCase().includes(q);
      const matchSector = (w.sector || '').toLowerCase().includes(q);
      const matchState = (w.state || '').toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchSector && !matchState) return false;
    }

    return true;
  });

  return (
    <>
      <Topbar
        title="Multi-Level Approval Workflow Management System"
        subtitle="Enterprise government-grade 5-department sequential and parallel approval pipelines for Karnataka PWD DPRs"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/recommendations" className="topbar-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb size={14} /> Explainable AI
            </Link>
            <Link href="/dpr/upload" className="topbar-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Upload New DPR
            </Link>
            <button
              className="topbar-btn"
              onClick={loadDashboard}
              disabled={loading || refreshing}
              title="Refresh Approval Workflows"
            >
              <RefreshCw size={14} className={loading || refreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. EXECUTIVE KPI SCORECARD STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          
          {/* Total Pending */}
          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>Pending Approvals</span>
              <Clock size={15} color="var(--accent-blue)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)', marginTop: 4 }}>
              {dashboardData?.pending_approvals ?? 0}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Across 5 Directorate Queues
            </div>
          </div>

          {/* Final Approved */}
          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>Final Approved</span>
              <CheckCircle2 size={15} color="var(--accent-green)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)', marginTop: 4 }}>
              {dashboardData?.approved_dprs ?? 0}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Certified &amp; Sanctioned
            </div>
          </div>

          {/* Returned for Revision */}
          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>Needs Revision</span>
              <AlertTriangle size={15} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-amber)', marginTop: 4 }}>
              {dashboardData?.needs_revision ?? 0}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Returned to Submitter
            </div>
          </div>

          {/* Rejected */}
          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>Rejected DPRs</span>
              <XCircle size={15} color="#ef4444" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
              {dashboardData?.rejected_dprs ?? 0}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Terminated Proposals
            </div>
          </div>

          {/* Completion Rate */}
          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(168,85,247,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>Sanction Rate</span>
              <Award size={15} color="var(--accent-purple)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-purple)', marginTop: 4 }}>
              {dashboardData?.completion_percentage ?? 0}%
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Approval Completion
            </div>
          </div>

          {/* SLA Turnaround */}
          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>Avg SLA Turnaround</span>
              <CalendarDays size={15} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
              {dashboardData?.average_turnaround_days ?? 4.2}d
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Per Department Stage
            </div>
          </div>

        </div>

        {/* ── 2. FILTER & SEARCH TOOLBAR ── */}
        <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'All DPRs' },
              { key: 'IN_REVIEW', label: 'In Review' },
              { key: 'APPROVED', label: 'Final Approved' },
              { key: 'NEEDS_REVISION', label: 'Needs Revision' },
              { key: 'REJECTED', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                style={{
                  background: filterStatus === tab.key ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
                  color: filterStatus === tab.key ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Department Selector & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Stage:</span>
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="select-field"
                style={{ fontSize: 11.5, padding: '4px 8px' }}
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.key} value={d.key}>{d.name}</option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative', width: 220 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search DPRs, sector, state..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="select-field"
                style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 4, paddingBottom: 4, fontSize: 12 }}
              />
            </div>
          </div>

        </div>

        {/* ── 3. DPR WORKFLOW CARDS LIST ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredWorkflows.length === 0 ? (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 10px', color: 'var(--accent-green)' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>No DPR approval workflows match this filter.</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Try switching tabs or resetting the search query.</div>
            </div>
          ) : (
            filteredWorkflows.map(wf => {
              const statusInfo = getOverallStatusBadge(wf.overall_status);
              const isExpanded = !!expandedDetails[wf.dpr_id];
              const detailObj = expandedDetails[wf.dpr_id];
              const aiInsights = detailObj?.ai_insights;

              return (
                <div
                  key={wf.dpr_id}
                  className="card"
                  style={{
                    padding: 20,
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex', flexDirection: 'column', gap: 16
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {SECTOR_ICONS[wf.sector || ''] || '📁'}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                          {wf.project_title || wf.dpr_id}
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                          <span>📍 {wf.state || 'Karnataka'}</span>
                          <span>🏭 {wf.sector || 'Infrastructure'}</span>
                          <span>💰 ₹{wf.estimated_cost?.toFixed(1) || '0.0'} Cr</span>
                          <span style={{ fontFamily: 'monospace' }}>ID: {wf.dpr_id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, ...statusInfo }}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* ── 4. 5-STAGE SEQUENTIAL VISUAL WORKFLOW STEPPER ── */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                      5-Department Sequential Approval Pipeline:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                      {(wf.stages || []).map((stg, sIdx) => {
                        const sBadge = getStageBadge(stg.status);
                        const isCurrentActive = wf.current_stage === stg.department_key && String(wf.overall_status || '').toUpperCase() === 'IN_REVIEW';
                        return (
                          <div
                            key={stg.department_key}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 6,
                              background: isCurrentActive ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.02)',
                              border: isCurrentActive ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.06)',
                              display: 'flex', flexDirection: 'column', gap: 4
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>
                                STEP {sIdx + 1}
                              </span>
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: sBadge.color, background: sBadge.bg, padding: '1px 5px', borderRadius: 4 }}>
                                {sBadge.label}
                              </span>
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                              {stg.department_name.replace(' Review', '')}
                            </div>

                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {stg.reviewer_name ? `By: ${stg.reviewer_name.split(' ')[0]}` : stg.authority.split(' ')[0]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── EXPANDED DETAILS (SMART AI ASSISTANT & AUDIT LOGS) ── */}
                  {isExpanded && detailObj && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      
                      {/* AI Decision Support Box */}
                      {aiInsights && (
                        <div style={{ padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(147, 51, 234, 0.35)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Sparkles size={16} color="var(--accent-purple)" />
                              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                                Smart AI Approval Decision Support
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }}>
                                Compliance: {aiInsights.compliance_score}%
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>
                                Quality: {aiInsights.dqci_grade}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                                Readiness: {aiInsights.approval_readiness_score}%
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid var(--accent-purple)' }}>
                            {aiInsights.ai_recommendation}
                          </div>

                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong>AI Rationale:</strong> {aiInsights.rationale}
                          </div>

                          {aiInsights.suggested_corrections && aiInsights.suggested_corrections.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: 6 }}>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 4 }}>
                                ⚠️ Suggested Pre-Sanction Verifications:
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                {aiInsights.suggested_corrections.map((corr, cIdx) => (
                                  <li key={cIdx}>{corr}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detailed Department Stages Audit Trail */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Stamp size={14} color="var(--accent-cyan)" />
                          Department Reviews &amp; Digital Signatures Audit Trail:
                        </div>

                        {(detailObj.workflow?.stages || []).map((s, idx) => (
                          <div
                            key={s.department_key}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 240 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                                  {idx + 1}. {s.department_name}
                                </span>
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, ...getStageBadge(s.status) }}>
                                  {s.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                                {s.description}
                              </div>
                              {s.comments && (
                                <div style={{ fontSize: 12, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 4, marginTop: 6, fontStyle: 'italic' }}>
                                  &ldquo;{s.comments}&rdquo;
                                </div>
                              )}
                            </div>

                            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                              {s.reviewer_name && (
                                <div style={{ fontWeight: 700, color: '#fff' }}>Signed by: {s.reviewer_name}</div>
                              )}
                              {s.reviewed_at && <div>{s.reviewed_at}</div>}
                              {s.digital_signature && (
                                <div style={{ fontFamily: 'monospace', color: 'var(--accent-blue)', marginTop: 2 }}>
                                  {s.digital_signature}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* ── CARD BOTTOM ACTION STRIP ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOpenActionModal(wf)}
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Stamp size={14} /> Take Department Action
                      </button>

                      {(wf.overall_status === 'FINAL_APPROVED' || wf.certificate) && (
                        <button
                          onClick={() => handleOpenCertificate(wf, detailObj?.workflow?.certificate)}
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                        >
                          <Award size={14} /> View Sanction Certificate
                        </button>
                      )}

                      <Link
                        href={`/dpr/${wf.dpr_id}/viewer`}
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye size={13} /> View DPR
                      </Link>

                      <Link
                        href={`/recommendations?id=${wf.dpr_id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Lightbulb size={13} /> Recommendations
                      </Link>

                      <Link
                        href={`/ai-chatbot?id=${wf.dpr_id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Send size={13} /> AI Chatbot
                      </Link>
                    </div>

                    <button
                      onClick={() => loadDprDetail(wf.dpr_id)}
                      className="btn btn-secondary"
                      style={{ fontSize: 11.5, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {isExpanded ? (
                        <>Hide Workflow &amp; AI <ChevronUp size={13} /></>
                      ) : (
                        <>Inspect Audit &amp; AI <ChevronDown size={13} /></>
                      )}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ── 5. DEPARTMENT APPROVAL ACTION MODAL ── */}
      {actionModalDpr && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setActionModalDpr(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 640, width: '100%', background: '#0f172a', border: '1px solid rgba(59,130,246,0.4)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stamp size={18} color="var(--accent-blue)" />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  Execute Department Approval Action
                </span>
              </div>
              <button onClick={() => setActionModalDpr(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Project: <strong style={{ color: '#fff' }}>{actionModalDpr.project_title || actionModalDpr.dpr_id}</strong>
            </div>

            {/* Department Selector */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Reviewing Department Directorate:
              </label>
              <select
                value={selectedDept}
                onChange={e => handleDeptChange(e.target.value)}
                className="select-field"
                style={{ width: '100%', fontSize: 12.5, padding: '8px 10px' }}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d.key} value={d.key}>{d.name} ({d.role})</option>
                ))}
              </select>
            </div>

            {/* Reviewer Name & Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Officer Name:
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Designation / Role:
                </label>
                <input
                  type="text"
                  value={reviewerRole}
                  onChange={e => setReviewerRole(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', fontSize: 12 }}
                />
              </div>
            </div>

            {/* Decision Selector Buttons */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Approval Decision:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedDecision('APPROVE')}
                  style={{
                    padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: selectedDecision === 'APPROVE' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: selectedDecision === 'APPROVE' ? '1px solid var(--accent-green)' : '1px solid rgba(255,255,255,0.08)',
                    color: selectedDecision === 'APPROVE' ? 'var(--accent-green)' : 'var(--text-secondary)'
                  }}
                >
                  ✅ Approve &amp; Advance
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecision('REQUEST_CHANGES')}
                  style={{
                    padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: selectedDecision === 'REQUEST_CHANGES' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: selectedDecision === 'REQUEST_CHANGES' ? '1px solid var(--accent-amber)' : '1px solid rgba(255,255,255,0.08)',
                    color: selectedDecision === 'REQUEST_CHANGES' ? 'var(--accent-amber)' : 'var(--text-secondary)'
                  }}
                >
                  ⚠️ Request Revision
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecision('REJECT')}
                  style={{
                    padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: selectedDecision === 'REJECT' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: selectedDecision === 'REJECT' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                    color: selectedDecision === 'REJECT' ? '#ef4444' : 'var(--text-secondary)'
                  }}
                >
                  ❌ Reject DPR
                </button>
              </div>
            </div>

            {/* Comments Textarea */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Review Remarks / Technical Justification:
              </label>
              <textarea
                rows={3}
                placeholder="Enter mandatory audit findings, IRC compliance notes, or conditions for sanction..."
                value={actionComments}
                onChange={e => setActionComments(e.target.value)}
                className="select-field"
                style={{ width: '100%', fontSize: 12.5, lineHeight: 1.5 }}
              />
            </div>

            {actionError && (
              <div style={{ color: '#ef4444', fontSize: 12, background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: 4 }}>
                {actionError}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setActionModalDpr(null)}
                className="btn btn-secondary"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className="btn btn-primary"
                disabled={submittingAction}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {submittingAction ? 'Signing Decision...' : 'Digitally Sign & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. OFFICIAL DIGITAL SANCTION CERTIFICATE MODAL ── */}
      {certificateModalData && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setCertificateModalData(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 780, width: '100%', maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(135deg, #0b1329, #0f172a)',
              border: '2px solid rgba(34, 197, 94, 0.45)', padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Karnataka Emblem / PWD Seal */}
            <div style={{ textAlign: 'center', borderBottom: '2px double rgba(255,255,255,0.15)', paddingBottom: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>🏛️</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                GOVERNMENT OF KARNATAKA
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginTop: 2 }}>
                PUBLIC WORKS DEPARTMENT (PWD)
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 4 }}>
                OFFICIAL TECHNICAL SANCTION &amp; ADMINISTRATIVE APPROVAL ORDER
              </div>
            </div>

            {/* Certificate Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sanction Order Number:</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                  {certificateModalData.certificate.sanction_order_no}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sanction Date:</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {certificateModalData.certificate.sanction_date}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Project Title:</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>
                  {certificateModalData.projectTitle}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sanctioned Budget Outlay:</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-green)' }}>
                  ₹ {certificateModalData.cost?.toFixed(2)} Crores
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Digital Verification Hash:</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent-blue)', wordBreak: 'break-all' }}>
                  SHA256: {certificateModalData.certificate.digital_hash}
                </div>
              </div>
            </div>

            {/* 5-Department Signatures Grid */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Multi-Department Sign-off Stamps:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                {certificateModalData.stages.map((stg) => (
                  <div
                    key={stg.department_key}
                    style={{
                      padding: '10px 8px', borderRadius: 6, textAlign: 'center',
                      background: 'rgba(34, 197, 94, 0.08)', border: '1px dashed rgba(34, 197, 94, 0.4)'
                    }}
                  >
                    <div style={{ fontSize: 14 }}>✅</div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--accent-green)', marginTop: 2 }}>
                      {stg.department_name.replace(' Review', '')}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {stg.reviewer_name?.split(' ')[0] || 'Director'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Seal Strip */}
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Issued by: <strong style={{ color: '#fff' }}>{certificateModalData.certificate.issued_by}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Download size={13} /> Print Certificate
                </button>
                <button
                  onClick={() => setCertificateModalData(null)}
                  className="btn btn-primary"
                  style={{ fontSize: 11.5, padding: '4px 12px' }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
