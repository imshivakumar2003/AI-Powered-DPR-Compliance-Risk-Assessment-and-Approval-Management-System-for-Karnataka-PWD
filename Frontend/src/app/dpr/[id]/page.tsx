// TOPLINE
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, AlertCircle, Download, ShieldCheck, Clock,
  MapPin, Tag, IndianRupee, Info, ArrowLeft, TrendingUp, AlertTriangle, Eye
} from 'lucide-react';
import Link from 'next/link';
import {
  fetchDprQuality, fetchDprCompliance, fetchDprRisk, downloadDprReport,
  ProjectCompliance, QualityAssessment
} from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiProject {
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
  notes: string;
  file_available: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_comment?: string;
}

interface RiskResult {
  risk_score: number;
  risk_category: string;
  top_risk_factors: string[];
  mitigation_recommendations: string[];
}

function CircleScore({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={128} height={128} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={64} cy={64} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
        <motion.circle
          cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {score}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function DprDetailsPage() {
  const { id } = useParams();
  const dprId = id as string;
  const router = useRouter();

  const [assessment, setAssessment] = useState<QualityAssessment | null>(null);
  const [compliance, setCompliance] = useState<ProjectCompliance | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch real project metadata + AI assessment in parallel
      const [infoRes, a, c, r] = await Promise.all([
        fetch(`${API_BASE}/api/dpr/${dprId}/info`).then(res => res.ok ? res.json() : null).catch(() => null),
        fetchDprQuality(dprId),
        fetchDprCompliance(dprId),
        fetchDprRisk(dprId),
      ]);
      setProject(infoRes);
      setAssessment(a);
      setCompliance(c);
      setRisk(r as unknown as RiskResult);
      setLoading(false);
    }
    load();
  }, [dprId]);

  if (loading) {
    return (
      <>
        <Topbar title={`DPR: ${dprId}`} subtitle="Loading assessment..." />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Running AI assessment...</div>
          </div>
        </div>
      </>
    );
  }

  const overallScore = assessment?.overall_score ?? 0;
  const complianceScore = compliance?.overall_compliance_score ?? 0;
  const riskScore = risk?.risk_score ?? 0;
  const riskColor = riskScore > 70 ? 'var(--accent-red)' : riskScore > 40 ? 'var(--accent-amber)' : 'var(--accent-green)';
  const qualityColor = overallScore >= 80 ? 'var(--accent-green)' : overallScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const compColor = complianceScore >= 80 ? 'var(--accent-green)' : complianceScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <>
      <Topbar
        title={project ? project.title : `DPR Analysis`}
        subtitle={project ? `${project.original_filename} · ${project.state}` : 'Detailed AI Assessment'}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/dpr/queue" className="topbar-btn">
              <ArrowLeft size={14} /> Back
            </Link>
            <button onClick={() => downloadDprReport(dprId)} className="topbar-btn primary">
              <Download size={14} /> Download Report
            </button>
          </div>
        }
      />

      <div className="page-content fade-in">

        {/* ── Top 3-score row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {/* Quality Score */}
          <div className="card" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${qualityColor}88, ${qualityColor})` }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>Quality Score</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={60} cy={60} r={50} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
                <motion.circle
                  cx={60} cy={60} r={50} fill="none" stroke={qualityColor} strokeWidth={10}
                  strokeDasharray={314}
                  initial={{ strokeDashoffset: 314 }}
                  animate={{ strokeDashoffset: 314 * (1 - overallScore / 100) }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', fontSize: 24, fontWeight: 900, color: qualityColor, fontFamily: 'var(--font-display)' }}>
                {overallScore}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: qualityColor }}>
              {assessment?.status ?? '—'}
            </div>
          </div>

          {/* Compliance */}
          <div className="card" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${compColor}88, ${compColor})` }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>Compliance</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={60} cy={60} r={50} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
                <motion.circle
                  cx={60} cy={60} r={50} fill="none" stroke={compColor} strokeWidth={10}
                  strokeDasharray={314}
                  initial={{ strokeDashoffset: 314 }}
                  animate={{ strokeDashoffset: 314 * (1 - complianceScore / 100) }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', fontSize: 24, fontWeight: 900, color: compColor, fontFamily: 'var(--font-display)' }}>
                {complianceScore}%
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: compColor, fontWeight: 700 }}>
              <ShieldCheck size={13} />
              {complianceScore === 100 ? 'Fully Compliant' : 'Needs Verification'}
            </div>
          </div>

          {/* Risk Score */}
          <div className="card" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${riskColor}88, ${riskColor})` }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>Risk Score</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={60} cy={60} r={50} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
                <motion.circle
                  cx={60} cy={60} r={50} fill="none" stroke={riskColor} strokeWidth={10}
                  strokeDasharray={314}
                  initial={{ strokeDashoffset: 314 }}
                  animate={{ strokeDashoffset: 314 * (1 - riskScore / 100) }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', fontSize: 24, fontWeight: 900, color: riskColor, fontFamily: 'var(--font-display)' }}>
                {riskScore}%
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: riskColor }}>
              {risk?.risk_category ?? '—'} Risk
            </div>
          </div>
        </div>

        {/* ── Project Metadata banner ── */}
        {project && (
          <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color="var(--accent-blue)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>State:</strong> {project.state}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag size={14} color="var(--accent-purple)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Sector:</strong> {project.sector}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IndianRupee size={14} color="var(--accent-green)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Cost:</strong> ₹ {project.estimated_cost?.toFixed(0) ?? '—'} Cr</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={14} color="var(--accent-cyan)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Submitted:</strong>{' '}
                  {new Date(project.upload_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {project.submitted_by ? ` by ${project.submitted_by}` : ''}
                </span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`badge badge-${project.status?.toLowerCase?.() === 'approved' ? 'approved' : project.status?.toLowerCase?.() === 'rejected' ? 'rejected' : project.status?.toLowerCase?.() === 'processing' ? 'processing' : 'pending'}`}>
                  {project.status}
                </span>
                {project.file_available && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    📄 File Ready
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Reviewer Info Panel (shown after admin action) ── */}
        {project && (project.status === 'APPROVED' || project.status === 'REJECTED') && (
          <div className="card" style={{ marginBottom: 16, padding: '12px 20px', borderLeft: `4px solid ${project.status === 'APPROVED' ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{project.status === 'APPROVED' ? '✅' : '❌'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: project.status === 'APPROVED' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {project.status === 'APPROVED' ? 'Approved by Admin' : 'Rejected by Admin'}
                </span>
              </div>
              {project.reviewed_by && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Reviewer:</strong> {project.reviewed_by}
                </div>
              )}
              {project.reviewed_at && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Review Date:</strong>{' '}
                  {new Date(project.reviewed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}
              {project.approval_comment && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Comment:</strong> {project.approval_comment}
                </div>
              )}
            </div>
          </div>
        )}


        {/* ── View DPR Button ── */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => project?.file_available !== false && router.push(`/dpr/${dprId}/viewer`)}
            title={project?.file_available === false ? 'No document uploaded yet' : 'Open PDF Viewer'}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 24px',
              background: project?.file_available === false
                ? 'var(--bg-secondary)'
                : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: project?.file_available === false ? 'var(--text-muted)' : 'white',
              border: project?.file_available === false ? '1px dashed var(--border)' : 'none',
              borderRadius: 12,
              fontSize: 14, fontWeight: 700,
              cursor: project?.file_available === false ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: project?.file_available === false ? 'none' : '0 4px 20px rgba(79,70,229,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (project?.file_available !== false) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Eye size={17} />
            {project?.file_available === false ? 'No Document Uploaded' : 'View DPR'}
          </button>
        </div>

        {/* ── Main content: Quality + Compliance ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>

          {/* Quality Dimensions */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Quality Dimensions</div>
                <div className="card-subtitle">8-axis AI audit across DPR components</div>
              </div>
              <span className="badge badge-processing">AI Audit</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {assessment?.dimensions.map((dim, idx) => (
                <motion.div
                  key={dim.dimension}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  style={{ padding: '12px 18px', borderBottom: idx < (assessment.dimensions.length - 1) ? '1px solid rgba(45,55,72,0.5)' : 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{dim.dimension}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: dim.score >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{dim.score}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6, marginBottom: 6 }}>
                    <motion.div
                      className="progress-fill"
                      style={{ background: dim.score >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${dim.score}%` }}
                      transition={{ duration: 1, delay: 0.4 + idx * 0.08 }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dim.feedback}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Compliance Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Compliance Checklist</div>
                  <div className="card-subtitle">Karnataka PWD regulatory standards</div>
                </div>
                <span className="badge badge-review">Karnataka PWD</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {compliance?.checks.map((check, idx) => {
                  const st = check.status?.toUpperCase() ?? 'PENDING';
                  const isCompliant = st === 'COMPLIANT';
                  const isNA = st === 'NOT_APPLICABLE';
                  const isNonCompliant = st === 'NON_COMPLIANT';

                  const iconBg = isCompliant ? 'rgba(34,197,94,0.12)' : isNA ? 'rgba(100,116,139,0.1)' : isNonCompliant ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)';
                  const iconColor = isCompliant ? 'var(--accent-green)' : isNA ? 'var(--text-muted)' : isNonCompliant ? 'var(--accent-red)' : 'var(--accent-amber)';

                  return (
                    <div
                      key={check.id}
                      style={{ padding: '11px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: idx < (compliance.checks.length - 1) ? '1px solid rgba(45,55,72,0.4)' : 'none' }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: iconBg, color: iconColor, fontWeight: 800, fontSize: 14,
                      }}>
                        {isCompliant ? '✓' : isNA ? <span style={{ fontSize: 9, fontWeight: 800 }}>N/A</span> : isNonCompliant ? '✗' : <Clock size={14} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{check.label}</span>
                          {check.is_mandatory && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-red)', padding: '1px 5px', borderRadius: 4 }}>Mandatory</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{check.description}</div>
                        {check.reason && (
                          <div style={{
                            fontSize: 10.5, marginTop: 5, padding: '4px 8px', borderRadius: 5,
                            background: isNonCompliant ? 'rgba(244,63,94,0.06)' : isNA ? 'transparent' : 'rgba(245,158,11,0.06)',
                            color: isNonCompliant ? '#ef4444' : 'var(--text-secondary)',
                            fontWeight: isNonCompliant ? 600 : 400,
                            borderLeft: isNonCompliant ? '2px solid rgba(244,63,94,0.4)' : 'none',
                          }}>
                            {isNonCompliant ? `⚠ ${check.reason}` : check.reason}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0, marginTop: 2,
                        color: iconColor,
                      }}>
                        {isCompliant ? 'COMPLIANT' : isNA ? 'N/A' : isNonCompliant ? 'NON-COMPLIANT' : 'PENDING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approval Recommendation → AI Suggestions */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', border: 'none', padding: '20px 22px' }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  🤖
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 6, fontFamily: 'var(--font-display)' }}>Approval Recommendation</div>
                  <div style={{ fontSize: 12, color: 'rgba(196,181,253,0.85)', lineHeight: 1.6, marginBottom: 14 }}>
                    View AI-generated category-level recommendations for this DPR across 10 dimensions — Budget, Technical Feasibility, Environmental Compliance, and more.
                  </div>
                  <Link
                    href={`/ai-suggestions/${dprId}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'white', color: '#1d4ed8', borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-body)' }}
                  >
                    🔍 View AI Suggestions
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Risk Factors & Mitigation ── */}
        {risk && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">🔴 Top Risk Factors</div>
                <span className={`badge badge-${riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'}`}>{risk.risk_category} Risk</span>
              </div>
              <div className="card-body">
                {risk.top_risk_factors.map((f, i) => {
                  // Parse "[Budget Risk] description" format
                  const match = f.match(/^\[([^\]]+)\]\s*(.+)/);
                  const category = match ? match[1] : null;
                  const text = match ? match[2] : f;
                  return (
                    <div key={i} style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
                      {category && (
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: 4, marginBottom: 5, display: 'inline-block' }}>
                          {category}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: category ? 4 : 0 }}>
                        <AlertTriangle size={12} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">✅ Mitigation Actions</div>
                <span className="badge badge-approved">Karnataka PWD</span>
              </div>
              <div className="card-body">
                {risk.mitigation_recommendations.map((m, i) => {
                  const match = m.match(/^\[([^\]]+)\]\s*(.+)/);
                  const category = match ? match[1] : null;
                  const text = match ? match[2] : m;
                  return (
                    <div key={i} style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                      {category && (
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent-green)', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 4, marginBottom: 5, display: 'inline-block' }}>
                          {category}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: category ? 4 : 0 }}>
                        <TrendingUp size={12} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
