// TOPLINE
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import {
  Lightbulb, TrendingUp, AlertTriangle, ChevronRight, Zap,
  CheckCircle2, ShieldCheck, ShieldAlert, Award, Clock,
  DollarSign, Wrench, FileText, Search, RefreshCw, Filter,
  ExternalLink, Eye, Copy, Check, X, ArrowRight, BookOpen,
  Layers, CheckSquare, Square
} from 'lucide-react';
import {
  fetchProjects, Project, getUserHeaders,
  fetchDprDeepRecommendations, fetchExtractedPages,
  DprDeepRecommendationsResult, ExplainableRecommendation,
  DprInsightsDashboard, DocumentPage
} from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CATEGORIES = [
  'All', 'Technical', 'Financial', 'Environmental', 'Timeline', 'Compliance', 'Risk', 'Procurement'
];

const IMPACT_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

const SECTOR_ICONS: Record<string, string> = {
  Roads: '🛣️', Power: '⚡', Healthcare: '🏥', Education: '🎓',
  Tourism: '🏔️', Agriculture: '🌾', Urban: '🏙️', Telecom: '📡',
  Infrastructure: '🏗️',
};

function getImpactBadgeStyle(impact: string) {
  const imp = (impact || '').toLowerCase();
  if (imp === 'critical') return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.35)' };
  if (imp === 'high') return { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.35)' };
  if (imp === 'medium') return { bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59, 130, 246, 0.35)' };
  return { bg: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34, 197, 94, 0.35)' };
}

export default function RecommendationsPage() {
  const searchParams = useSearchParams();
  const initialDprId = searchParams.get('id') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDprId, setSelectedDprId] = useState<string>(initialDprId);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Recommendations & Dashboard states
  const [deepResult, setDeepResult] = useState<DprDeepRecommendationsResult | null>(null);
  const [extractedPages, setExtractedPages] = useState<DocumentPage[]>([]);

  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedImpact, setSelectedImpact] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Checklist Completed steps state
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Page Inspector Modal states
  const [inspectPageNum, setInspectPageNum] = useState<number | null>(null);
  const [pageTextCopied, setPageTextCopied] = useState<boolean>(false);

  const loadProjectsAndRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const projList = await fetchProjects().catch(() => []);
      setProjects(projList);

      let targetId = selectedDprId;
      if (projList.length > 0) {
        if (!targetId || !projList.some(p => p.id === targetId)) {
          targetId = projList[0].id;
          setSelectedDprId(targetId);
        }
      }

      if (targetId) {
        const [recData, pgs] = await Promise.all([
          fetchDprDeepRecommendations(targetId),
          fetchExtractedPages(targetId).catch(() => [])
        ]);
        setDeepResult(recData);
        setExtractedPages(pgs);
      }
    } catch (err) {
      console.error('Failed loading deep recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDprId]);

  useEffect(() => {
    loadProjectsAndRecommendations();
  }, [loadProjectsAndRecommendations]);

  const handleSelectProject = async (projId: string) => {
    setSelectedDprId(projId);
    setRefreshing(true);
    try {
      const [recData, pgs] = await Promise.all([
        fetchDprDeepRecommendations(projId),
        fetchExtractedPages(projId).catch(() => [])
      ]);
      setDeepResult(recData);
      setExtractedPages(pgs);
    } catch (err) {
      console.error('Error switching project:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleStep = (stepKey: string) => {
    setCompletedSteps(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const handleCopyPageText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setPageTextCopied(true);
    setTimeout(() => setPageTextCopied(false), 2000);
  };

  const activeProject = projects.find(p => p.id === selectedDprId) || projects[0];
  const dashboard = deepResult?.dashboard;
  const rawRecs = deepResult?.recommendations || [];

  const filteredRecs = rawRecs.filter(r => {
    const matchCat = selectedCategory === 'All' || r.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchImp = selectedImpact === 'All' || r.impact.toLowerCase() === selectedImpact.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      r.title.toLowerCase().includes(q) ||
      (r.explanation || r.description || '').toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      (r.guideline_reference || '').toLowerCase().includes(q) ||
      (r.dpr_section_name || '').toLowerCase().includes(q);
    return matchCat && matchImp && matchSearch;
  });

  const inspectedPageObj = extractedPages.find(p => p.page_number === inspectPageNum);

  return (
    <>
      <Topbar
        title="AI Recommendations & Suggestions Platform"
        subtitle="Explainable, evidence-grounded improvement suggestions aligned with Karnataka PWD & IRC standards"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/dpr/${selectedDprId}`} className="topbar-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> View Full DPR
            </Link>
            <Link href="/dpr/upload" className="topbar-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Upload DPR
            </Link>
            <button
              className="topbar-btn"
              onClick={loadProjectsAndRecommendations}
              disabled={loading || refreshing}
              title="Refresh Recommendations"
            >
              <RefreshCw size={14} className={loading || refreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. DPR SELECTOR HEADER STRIP ── */}
        <div className="card" style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(147,51,234,0.3))', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                <Lightbulb size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Analyze DPR Proposal:
                </div>
                <select
                  value={selectedDprId}
                  onChange={e => handleSelectProject(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', maxWidth: 480, marginTop: 3, padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#fff' }}
                  disabled={loading || projects.length === 0}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {SECTOR_ICONS[p.sector] || '📁'} {p.title || p.filename} ({p.sector || 'Infrastructure'} · ₹{p.estimated_cost?.toFixed(0)} Cr)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeProject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                  <strong style={{ color: '#fff' }}>{activeProject.district ? `${activeProject.district}, ` : ''}{activeProject.state || 'Karnataka'}</strong>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Outlay: </span>
                  <strong style={{ color: 'var(--accent-green)' }}>₹{activeProject.estimated_cost?.toFixed(1)} Cr</strong>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.15)', borderRadius: 6, border: '1px solid rgba(34,197,94,0.3)', fontSize: 11.5 }}>
                  <strong style={{ color: 'var(--accent-green)' }}>{dashboard?.dqci_grade || 'Grade A+'}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. AUTO-GENERATED INSIGHTS SCORECARD DASHBOARD (6 KPIs) ── */}
        {dashboard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            
            {/* KPI 1: Compliance Score */}
            <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                <span>Compliance Score</span>
                <ShieldCheck size={15} color="var(--accent-green)" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)', marginTop: 4 }}>
                {dashboard.compliance_score}%
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                IRC &amp; KPWD SoR Verified
              </div>
            </div>

            {/* KPI 2: DQCI Quality Score */}
            <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                <span>Quality Index (DQCI)</span>
                <Award size={15} color="var(--accent-blue)" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-blue)', marginTop: 4 }}>
                {dashboard.dqci_quality_score}%
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                {dashboard.dqci_grade} Completeness
              </div>
            </div>

            {/* KPI 3: Cost Risk */}
            <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                <span>Cost Risk Level</span>
                <DollarSign size={15} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: dashboard.cost_risk_score === 'Low' ? 'var(--accent-green)' : 'var(--accent-amber)', marginTop: 4 }}>
                {dashboard.cost_risk_score} Risk
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Price Variation Protected
              </div>
            </div>

            {/* KPI 4: Schedule Risk */}
            <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                <span>Schedule Risk</span>
                <Clock size={15} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: dashboard.schedule_risk_score === 'Low' ? 'var(--accent-green)' : 'var(--accent-purple)', marginTop: 4 }}>
                {dashboard.schedule_risk_score} Risk
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Monsoon Contingency
              </div>
            </div>

            {/* KPI 5: Approval Readiness */}
            <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(6,182,212,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                <span>Approval Readiness</span>
                <CheckCircle2 size={15} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
                {dashboard.approval_readiness_score}%
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                High Sanction Probability
              </div>
            </div>

            {/* KPI 6: Recommendations Count */}
            <div className="card" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                <span>Total Actions</span>
                <Zap size={15} color="var(--accent-blue)" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                {rawRecs.length} Actions
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                {deepResult?.critical_count || 0} Critical · {deepResult?.high_count || 0} High
              </div>
            </div>

          </div>
        )}

        {/* Missing Information Alerts Banner */}
        {dashboard && dashboard.missing_information_alerts && dashboard.missing_information_alerts.length > 0 && (
          <div className="card" style={{ padding: '12px 18px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertTriangle size={18} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent-amber)' }}>
                DPR Completeness &amp; Document Audit Observations:
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {dashboard.missing_information_alerts.map((alert, aIdx) => (
                  <li key={aIdx}>{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── 3. FILTER TABS & SEARCH BAR ── */}
        <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Impact Level Filters + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Impact:</span>
              {IMPACT_FILTERS.map(imp => (
                <button
                  key={imp}
                  onClick={() => setSelectedImpact(imp)}
                  style={{
                    background: selectedImpact === imp ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: selectedImpact === imp ? '#fff' : 'var(--text-muted)',
                    border: selectedImpact === imp ? '1px solid var(--accent-blue)' : 'none',
                    borderRadius: 4, padding: '3px 8px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {imp}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 220 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="select-field"
                style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 4, paddingBottom: 4, fontSize: 12 }}
              />
            </div>
          </div>

        </div>

        {/* ── 4. EXPLAINABLE AI RECOMMENDATION CARDS (GOOGLE PAIR STANDARD) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredRecs.length === 0 ? (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 10px', color: 'var(--accent-green)' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>No recommendations match the active filter criteria.</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Try clearing the search or category filters above.</div>
            </div>
          ) : (
            filteredRecs.map((rec) => {
              const impactStyle = getImpactBadgeStyle(rec.impact);
              return (
                <div
                  key={rec.id}
                  className="card"
                  style={{
                    padding: 20,
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex', flexDirection: 'column', gap: 14
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, ...impactStyle }}>
                        {rec.impact.toUpperCase()} IMPACT
                      </span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                        {rec.category}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                        ✓ {rec.confidence_score}% Confidence
                      </span>
                    </div>

                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {rec.id}
                    </span>
                  </div>

                  {/* Recommendation Title */}
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                    {rec.title}
                  </div>

                  {/* Reason & Detailed Plain-Language Explanation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, borderLeft: '3px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
                      <strong>Reason for Recommendation:</strong> {rec.reason}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {rec.explanation || rec.description}
                    </div>
                  </div>

                  {/* Verbatim Supporting Evidence Box */}
                  {rec.supporting_evidence && (
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                        📑 Verbatim DPR Supporting Evidence:
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        &ldquo;{rec.supporting_evidence}&rdquo;
                      </div>
                    </div>
                  )}

                  {/* Citations & Guideline References Strip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Source:</span>
                      {rec.dpr_page_numbers && rec.dpr_page_numbers.map(pg => (
                        <button
                          key={pg}
                          onClick={() => setInspectPageNum(pg)}
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11,
                            fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                          title={`Click to inspect exact Page ${pg} in OCR Inspector`}
                        >
                          Page {pg} <Eye size={10} color="var(--accent-blue)" />
                        </button>
                      ))}
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        • {rec.dpr_section_name}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                      <strong>Guideline:</strong> {rec.guideline_reference}
                    </div>
                  </div>

                  {/* Actionable Steps Checklist */}
                  {rec.actionable_steps && rec.actionable_steps.length > 0 && (
                    <div style={{ marginTop: 2, background: 'rgba(255,255,255,0.015)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckSquare size={13} color="var(--accent-green)" />
                        Suggested Action Steps Checklist:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rec.actionable_steps.map((step, sIdx) => {
                          const stepKey = `${rec.id}-step-${sIdx}`;
                          const isDone = !!completedSteps[stepKey];
                          return (
                            <div
                              key={sIdx}
                              onClick={() => toggleStep(stepKey)}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                                fontSize: 12, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: isDone ? 'line-through' : 'none'
                              }}
                            >
                              <span style={{ color: isDone ? 'var(--accent-green)' : 'var(--text-muted)', marginTop: 2 }}>
                                {isDone ? <CheckSquare size={13} /> : <Square size={13} />}
                              </span>
                              <span style={{ lineHeight: 1.5 }}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ── 5. INTERACTIVE DPR PAGE INSPECTOR MODAL ── */}
      {inspectPageNum !== null && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setInspectPageNum(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 880, width: '100%', maxHeight: '88vh', background: '#0f172a', border: '1px solid rgba(59,130,246,0.4)', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--accent-blue)" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  DPR Page Inspector: Page {inspectPageNum}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ({activeProject?.title || activeProject?.filename})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleCopyPageText(inspectedPageObj?.text || inspectedPageObj?.page_text || '')}
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {pageTextCopied ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
                  {pageTextCopied ? 'Copied' : 'Copy Page Text'}
                </button>
                <button onClick={() => setInspectPageNum(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Verbatim extracted OCR text layer from DPR Page {inspectPageNum}:
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8,
                background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap', color: 'var(--text-primary)'
              }}>
                {inspectedPageObj ? (inspectedPageObj.text || inspectedPageObj.page_text || 'No readable text layer on this drawing page.') : `Loading extracted text for Page ${inspectPageNum}...`}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
