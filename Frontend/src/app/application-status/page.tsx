// TOPLINE
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { useUser } from '@/lib/UserContext';
import { getUserHeaders } from '@/lib/api';
import Link from 'next/link';
import {
  ClipboardCheck, Search, Filter, RefreshCw, Clock, CheckCircle2,
  XCircle, FileText, Eye, AlertTriangle, Building2, User,
  Calendar, Layers, CheckSquare, ChevronRight, Globe, Download, Sparkles
} from 'lucide-react';
import { AiScoreBadge, DprScoreStrip } from '@/components/common/AiScoreBadges';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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

interface AppStatus {
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

const UI_TEXT: Record<string, Record<string, string>> = {
  en: {
    pageTitle: 'DPR Application Status & Workflow Tracking',
    pageSubtitle: 'Real-time multi-department review progression, stage tracking, and official approval status',
    searchPlaceholder: 'Search by DPR name, ref number, district...',
    allStatus: 'All Status',
    inReview: 'In Review',
    approved: 'Final Approved',
    needsRevision: 'Needs Revision',
    rejected: 'Rejected',
    activeDprs: 'In-Flight DPRs',
    sanctioned: 'Final Approved',
    needsAction: 'Revision Required',
    targetSla: 'SLA Standard Turnaround',
    viewDetail: 'Track Full Workflow',
    viewDpr: 'View DPR Document',
    exportReport: 'Export Status Report',
  },
  kn: {
    pageTitle: 'ಡಿಪಿಆರ್ ಅರ್ಜಿ ಸ್ಥಿತಿ ಮತ್ತು ಕಾರ್ಯಪ್ರವಾಹ ಟ್ರ್ಯಾಕಿಂಗ್',
    pageSubtitle: 'ಕರ್ನಾಟಕ ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆ (PWD) ನೈಜ-ಸಮಯದ ಇಲಾಖಾವಾರು ಅನುಮೋದನೆ ಪ್ರಗತಿ',
    searchPlaceholder: 'ಯೋಜನೆಯ ಹೆಸರು ಅಥವಾ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆಯಿಂದ ಹುಡುಕಿ...',
    allStatus: 'ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು',
    inReview: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
    approved: 'ಅಂತಿಮ ಅನುಮೋದನೆ',
    needsRevision: 'ತಿದ್ದುಪಡಿ ಅಗತ್ಯವಿದೆ',
    rejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
    activeDprs: 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿರುವ ಡಿಪಿಆರ್‌ಗಳು',
    sanctioned: 'ಅನುಮೋದಿತ ಡಿಪಿಆರ್‌ಗಳು',
    needsAction: 'ತಿದ್ದುಪಡಿ ಅಗತ್ಯವಿದೆ',
    targetSla: 'ಗುರಿ ಸಮಯ',
    viewDetail: 'ಪೂರ್ಣ ಪ್ರಕ್ರಿಯೆ ವೀಕ್ಷಿಸಿ',
    viewDpr: 'ಡಿಪಿಆರ್ ವೀಕ್ಷಿಸಿ',
    exportReport: 'ವರದಿ ಡೌನ್‌ಲೋಡ್',
  },
  hi: {
    pageTitle: 'डीपीआर आवेदन स्थिति एवं कार्यप्रवाह ट्रैकिंग',
    pageSubtitle: 'कर्नाटक पीडब्ल्यूडी वास्तविक समय बहु-विभागीय स्वीकृति प्रगति एवं स्थिति',
    searchPlaceholder: 'डीपीआर नाम या संदर्भ संख्या से खोजें...',
    allStatus: 'सभी स्थिति',
    inReview: 'समीक्षाधीन',
    approved: 'अंतिम स्वीकृत',
    needsRevision: 'संशोधन आवश्यक',
    rejected: 'अस्वीकृत',
    activeDprs: 'प्रक्रियाधीन डीपीआर',
    sanctioned: 'स्वीकृत परियोजनाएं',
    needsAction: 'संशोधन आवश्यक',
    targetSla: 'मानक समय',
    viewDetail: 'पूर्ण कार्यप्रवाह देखें',
    viewDpr: 'डीपीआर देखें',
    exportReport: 'रिपोर्ट डाउनलोड करें',
  }
};

function getStatusBadgeClass(status: string) {
  const s = (status || '').toUpperCase();
  if (s.includes('APPROVED') || s === 'FINAL_APPROVED') return { bg: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.35)', icon: <CheckCircle2 size={12} /> };
  if (s.includes('REJECT')) return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)', icon: <XCircle size={12} /> };
  if (s.includes('REVISION') || s.includes('CHANGES')) return { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.35)', icon: <AlertTriangle size={12} /> };
  return { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.35)', icon: <Clock size={12} /> };
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { user } = useUser();

  const [applications, setApplications] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Multi-language state
  const [language, setLanguage] = useState<'en' | 'kn' | 'hi'>('en');
  const t = UI_TEXT[language] || UI_TEXT.en;

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/application-status`, { headers: getUserHeaders() });
      if (!res.ok) throw new Error('Failed to load application status list');
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching application statuses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const districtsList = useMemo(() => {
    const dSet = new Set<string>();
    applications.forEach(a => { if (a.district) dSet.add(a.district); });
    return Array.from(dSet);
  }, [applications]);

  const filteredApplications = applications.filter(app => {
    // Status filter
    const ost = String(app.overall_status || app.status || '').toUpperCase();
    if (filterStatus === 'APPROVED' && !ost.includes('APPROVED')) return false;
    if (filterStatus === 'REJECTED' && !ost.includes('REJECT')) return false;
    if (filterStatus === 'NEEDS_REVISION' && !ost.includes('REVISION') && !ost.includes('CHANGES')) return false;
    if (filterStatus === 'IN_REVIEW' && (ost.includes('APPROVED') || ost.includes('REJECT'))) return false;

    // District filter
    if (filterDistrict !== 'ALL' && app.district !== filterDistrict) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = (app.title || '').toLowerCase().includes(q);
      const matchRef = (app.ref_number || '').toLowerCase().includes(q);
      const matchDistrict = (app.district || '').toLowerCase().includes(q);
      const matchSector = (app.sector || '').toLowerCase().includes(q);
      if (!matchTitle && !matchRef && !matchDistrict && !matchSector) return false;
    }

    return true;
  });

  const totalInFlight = applications.filter(a => !String(a.overall_status || '').includes('APPROVED') && !String(a.overall_status || '').includes('REJECT')).length;
  const totalApproved = applications.filter(a => String(a.overall_status || '').includes('APPROVED')).length;
  const totalNeedsRevision = applications.filter(a => String(a.overall_status || '').includes('REVISION')).length;

  return (
    <>
      <Topbar
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

            <Link href="/dpr/upload" className="topbar-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Upload DPR
            </Link>
            <button
              className="topbar-btn"
              onClick={fetchApplications}
              disabled={loading || refreshing}
              title="Refresh Status"
            >
              <RefreshCw size={14} className={loading || refreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. WORKFLOW KPI SCORECARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          
          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>{t.activeDprs}</span>
              <Clock size={15} color="var(--accent-blue)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)', marginTop: 4 }}>
              {totalInFlight}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Across Department Stages
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>{t.sanctioned}</span>
              <CheckCircle2 size={15} color="var(--accent-green)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)', marginTop: 4 }}>
              {totalApproved}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Full 5-Department Sign-off
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>{t.needsAction}</span>
              <AlertTriangle size={15} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-amber)', marginTop: 4 }}>
              {totalNeedsRevision}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Pending Submitter Correction
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
              <span>{t.targetSla}</span>
              <Calendar size={15} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
              15 Days
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Karnataka PWD Citizen Charter
            </div>
          </div>

        </div>

        {/* ── 2. FILTER TOOLBAR ── */}
        <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: t.allStatus },
              { key: 'IN_REVIEW', label: t.inReview },
              { key: 'APPROVED', label: t.approved },
              { key: 'NEEDS_REVISION', label: t.needsRevision },
              { key: 'REJECTED', label: t.rejected },
            ].map(st => (
              <button
                key={st.key}
                onClick={() => setFilterStatus(st.key)}
                style={{
                  background: filterStatus === st.key ? 'rgba(59,130,246,0.25)' : 'transparent',
                  color: filterStatus === st.key ? '#fff' : 'var(--text-secondary)',
                  border: filterStatus === st.key ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 4, padding: '4px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={filterDistrict}
              onChange={e => setFilterDistrict(e.target.value)}
              className="select-field"
              style={{ fontSize: 11.5, padding: '4px 8px' }}
            >
              <option value="ALL">All Districts</option>
              {districtsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <div style={{ position: 'relative', width: 240 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="select-field"
                style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 4, paddingBottom: 4, fontSize: 12 }}
              />
            </div>
          </div>

        </div>

        {/* ── 3. WORKFLOW TRACKING CARDS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredApplications.length === 0 ? (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ClipboardCheck size={36} style={{ margin: '0 auto 10px', color: 'var(--accent-green)' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>No DPR applications found matching criteria.</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Try clearing the filters or searching with another term.</div>
            </div>
          ) : (
            filteredApplications.map(app => {
              const statusStyle = getStatusBadgeClass(app.granular_status || app.overall_status);
              const isFinalApproved = String(app.overall_status || '').toUpperCase().includes('APPROVED');

              return (
                <div
                  key={app.id}
                  className="card"
                  style={{
                    padding: 20,
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex', flexDirection: 'column', gap: 14
                  }}
                >
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
                          DPR ID: {app.ref_number}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, ...statusStyle }}>
                          {statusStyle.icon} Current Status: {app.granular_status}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                          Progress: {app.progress_pct}%
                        </span>
                      </div>

                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 6, lineHeight: 1.3 }}>
                        {app.title}
                      </div>

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                        <span>📍 {app.district}, {app.state || 'Karnataka'}</span>
                        <span>🏭 {app.sector}</span>
                        <span>💰 ₹{app.estimated_cost?.toFixed(1)} Cr</span>
                        <span>👤 Submitter: {app.submitted_by}</span>
                        <span>📅 Submitted: {app.upload_date?.slice(0, 10)}</span>
                        <span>🎯 Target SLA: {app.expected_completion_date}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current Approver:</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                        {app.current_approver}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 2 }}>
                        {app.current_department}
                      </div>
                    </div>
                  </div>

                  {/* ── AI ANALYSIS SCORES ── */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 6, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} color="#3b82f6" />
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>AI Analysis Scores:</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <AiScoreBadge score={app.dpr_quality_score ?? app.overall_score} label="DPR Quality" size="xs" />
                      <AiScoreBadge score={app.compliance_score} label="Compliance" size="xs" />
                      <AiScoreBadge score={app.risk_score} label="Risk" size="xs" isRisk={true} />
                      <AiScoreBadge score={app.approval_readiness_score} label="Approval Readiness" size="xs" />
                    </div>
                  </div>

                  {/* ── 4. 9-STAGE VISUAL WORKFLOW PROGRESS TRACKER ── */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        9-Stage Government Workflow Lifecycle:
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700 }}>
                        Stage {app.step_index + 1} of 9 ({app.nine_stages[app.step_index]?.label || 'In Review'})
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
                      {app.nine_stages.map((stg, sIdx) => {
                        const isDone = sIdx < app.step_index || app.progress_pct === 100;
                        const isCurrent = sIdx === app.step_index && app.progress_pct < 100;
                        return (
                          <div key={stg.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{
                              height: 6, borderRadius: 3,
                              background: isDone ? 'var(--accent-green)' : isCurrent ? 'var(--accent-blue)' : 'rgba(255,255,255,0.08)',
                              transition: 'all 0.3s'
                            }} />
                            <div style={{
                              fontSize: 9.5, fontWeight: isCurrent ? 800 : 600,
                              color: isDone ? 'var(--accent-green)' : isCurrent ? '#fff' : 'var(--text-muted)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }} title={stg.label}>
                              {stg.label.split(' ')[0]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── 5. DEPARTMENT-WISE STATUS DISPLAY ── */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      Department-Wise Approval Status:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                      {(app.department_tracking || []).map(dt => {
                        const isAppr = dt.review_status === 'APPROVED';
                        const isRev = dt.review_status === 'IN_REVIEW';
                        const isReq = dt.review_status === 'CHANGES_REQUESTED';
                        const isRej = dt.review_status === 'REJECTED';

                        let icon = '○';
                        let label = 'Pending';
                        let color = 'var(--text-muted)';
                        let bg = 'rgba(255,255,255,0.02)';

                        if (isAppr) {
                          icon = '✓';
                          label = 'Approved';
                          color = 'var(--accent-green)';
                          bg = 'rgba(34,197,94,0.12)';
                        } else if (isRev) {
                          icon = '⏳';
                          label = 'Under Review';
                          color = 'var(--accent-blue)';
                          bg = 'rgba(59,130,246,0.12)';
                        } else if (isReq) {
                          icon = '⚠️';
                          label = 'Revision Required';
                          color = 'var(--accent-amber)';
                          bg = 'rgba(245,158,11,0.12)';
                        } else if (isRej) {
                          icon = '❌';
                          label = 'Rejected';
                          color = '#ef4444';
                          bg = 'rgba(239,68,68,0.12)';
                        }

                        return (
                          <div
                            key={dt.department_key}
                            style={{
                              padding: '8px 10px', borderRadius: 6,
                              background: bg, border: '1px solid rgba(255,255,255,0.06)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                          >
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>
                              {dt.department_name.replace(' Review', '').replace(' Department', '')}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: color, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{icon}</span> {label}
                            </span>
                          </div>
                        );
                      })}

                      {/* Final Approval Stage */}
                      <div
                        style={{
                          padding: '8px 10px', borderRadius: 6,
                          background: isFinalApproved ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.02)',
                          border: isFinalApproved ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>
                          Final Approval
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isFinalApproved ? 'var(--accent-green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{isFinalApproved ? '✓' : '○'}</span> {isFinalApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── 6. CARD FOOTER ACTIONS ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link
                        href={`/application-status/${app.id}`}
                        className="btn btn-primary"
                        style={{ fontSize: 11.5, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Eye size={13} /> {t.viewDetail}
                      </Link>

                      <Link
                        href={`/dpr/${app.id}/viewer`}
                        className="btn btn-secondary"
                        style={{ fontSize: 11.5, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <FileText size={12} /> {t.viewDpr}
                      </Link>
                    </div>

                    {/* Dynamic Status-Based Report Button */}
                    {isFinalApproved ? (
                      <a
                        href={`${API}/api/dpr/${app.id}/final-approved-report/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.35)',
                          fontWeight: 700
                        }}
                      >
                        <CheckCircle2 size={13} /> Download Final Report (PDF)
                      </a>
                    ) : String(app.overall_status || '').toUpperCase().includes('REJECT') ? (
                      <a
                        href={`${API}/api/dpr/${app.id}/rejection-report/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)',
                          fontWeight: 700
                        }}
                      >
                        <XCircle size={13} /> Download Rejection Report (PDF)
                      </a>
                    ) : (
                      <a
                        href={`${API}/api/dpr/${app.id}/status-report/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.35)',
                          fontWeight: 700
                        }}
                      >
                        <Clock size={13} /> Download Status Report (PDF)
                      </a>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
}
