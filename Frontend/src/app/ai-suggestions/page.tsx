// TOPLINE
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import {
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  FileText,
  TrendingUp,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Zap,
  Info,
  DollarSign,
  Calendar,
  CheckSquare,
  Square,
  BarChart3,
  PieChart as PieChartIcon,
  HelpCircle,
  Check,
  FolderOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import {
  fetchSuggestionsDashboard,
  fetchComprehensiveSuggestions,
  ComprehensiveSuggestionsData,
  SuggestionsDashboardData,
  ExplainableRecommendation,
  RiskSuggestionItem,
  ComplianceSuggestionItem,
  CorrectionItem,
  EvidenceReferenceItem
} from '@/lib/api';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2'];

export default function AiSuggestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDprId = searchParams.get('dpr') || searchParams.get('id') || '';

  // State
  const [dashboardData, setDashboardData] = useState<SuggestionsDashboardData | null>(null);
  const [selectedDprId, setSelectedDprId] = useState<string>(initialDprId);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveSuggestionsData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'insights' | 'risks' | 'compliance' | 'corrections' | 'improvements' | 'analytics' | 'evidence' | 'scores'>('recommendations');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  // 1. Fetch dashboard overview on mount
  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const data = await fetchSuggestionsDashboard();
      setDashboardData(data);
      if (data && data.projects.length > 0 && !selectedDprId) {
        setSelectedDprId(data.projects[0].dpr_id);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, [selectedDprId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // 2. Fetch comprehensive data whenever selected DPR changes
  const loadDprSuggestions = useCallback(async (dprId: string) => {
    if (!dprId) return;
    setLoadingDeep(true);
    try {
      const data = await fetchComprehensiveSuggestions(dprId);
      setComprehensiveData(data);
    } catch (err) {
      console.error('Failed to load DPR suggestions:', err);
    } finally {
      setLoadingDeep(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDprId) {
      loadDprSuggestions(selectedDprId);
    }
  }, [selectedDprId, loadDprSuggestions]);

  // Toggle Actionable Checklist Items
  const toggleAction = (key: string) => {
    setCheckedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered Recommendations
  const filteredRecommendations = useMemo(() => {
    if (!comprehensiveData?.recommendations) return [];
    return comprehensiveData.recommendations.filter(rec => {
      const matchesSearch =
        searchQuery === '' ||
        rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.description && rec.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        rec.guideline_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.suggested_action.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === 'all' || rec.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === 'all' || rec.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesPriority && matchesCategory;
    });
  }, [comprehensiveData, searchQuery, priorityFilter, categoryFilter]);

  // Safe helper for alerts list
  const criticalAlertsList = useMemo(() => {
    if (!comprehensiveData?.insights?.critical_alerts) return [];
    const raw = comprehensiveData.insights.critical_alerts as any;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') {
      const list: Array<{ type: string; title: string; severity: string; dpr_page: number; description: string; mandatory_action: string }> = [];
      Object.entries(raw).forEach(([k, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach((item: string, idx: number) => {
            list.push({
              type: k.replace(/_/g, ' ').toUpperCase(),
              title: item,
              severity: 'Critical',
              dpr_page: (idx + 1) * 6,
              description: item,
              mandatory_action: 'Resolve prior to executive administrative sanction'
            });
          });
        }
      });
      return list;
    }
    return [];
  }, [comprehensiveData]);

  // Safe helper for opportunities list
  const topOpportunitiesList = useMemo(() => {
    if (!comprehensiveData?.insights?.top_opportunities) return [];
    const raw = comprehensiveData.insights.top_opportunities as any;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') {
      const list: Array<{ title: string; area: string; estimated_savings: string; impact: string; details: string }> = [];
      if (Array.isArray(raw.cost_savings)) {
        raw.cost_savings.forEach((c: any) => {
          list.push({
            title: c.title,
            area: 'Cost Savings',
            estimated_savings: c.savings_amount || '₹— Cr',
            impact: c.impact || 'High',
            details: c.description || c.steps || ''
          });
        });
      }
      if (Array.isArray(raw.timeline_improvements)) {
        raw.timeline_improvements.forEach((t: any) => {
          list.push({
            title: t.title,
            area: 'Timeline Optimization',
            estimated_savings: t.time_saved || '— Months',
            impact: t.impact || 'High',
            details: t.description || t.steps || ''
          });
        });
      }
      if (Array.isArray(raw.resource_optimization)) {
        raw.resource_optimization.forEach((r: any) => {
          list.push({
            title: r.title,
            area: 'Resource Optimization',
            estimated_savings: r.benefit || 'Efficiency Gain',
            impact: r.impact || 'High',
            details: r.description || r.steps || ''
          });
        });
      }
      if (Array.isArray(raw.quality_improvements)) {
        raw.quality_improvements.forEach((q: any) => {
          list.push({
            title: q.title,
            area: 'Quality QA/QC',
            estimated_savings: q.benefit || 'Zero Non-Conformance',
            impact: q.impact || 'High',
            details: q.description || q.steps || ''
          });
        });
      }
      return list;
    }
    return [];
  }, [comprehensiveData]);

  // CSV Export
  const handleExportCsv = () => {
    if (!comprehensiveData) return;
    const headers = ['ID', 'Title', 'Category', 'Priority', 'Impact', 'Confidence (%)', 'Page Numbers', 'Section', 'Guideline', 'Action'];
    const rows = (comprehensiveData.recommendations || []).map(r => [
      `"${r.id}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.priority.toUpperCase()}"`,
      `"${r.impact}"`,
      r.confidence_score,
      `"${(r.dpr_page_numbers || []).join(', ')}"`,
      `"${(r.dpr_section_name || '').replace(/"/g, '""')}"`,
      `"${(r.guideline_reference || '').replace(/"/g, '""')}"`,
      `"${(r.suggested_action || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AI_Suggestions_${comprehensiveData.dpr_id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Dialog
  const handlePrint = () => {
    window.print();
  };

  const currentProject = dashboardData?.projects.find(p => p.dpr_id === selectedDprId);

  return (
    <>
      <Topbar
        title="AI Insights & Recommendations Center"
        subtitle="Intelligent, evidence-backed DPR suggestions grounded in OCR, RAG retrieval, and Karnataka PWD Guidelines"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.back()}
              className="topbar-btn"
              title="Go Back"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              onClick={handleExportCsv}
              disabled={!comprehensiveData}
              className="topbar-btn"
              title="Download Excel / CSV"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="topbar-btn primary"
              title="Print / Save PDF"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={15} /> Print / Export PDF
            </button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── 1. TOP SELECTOR & SUMMARY HEADER ── */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '20px 24px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 400px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Active DPR Inspection
                </span>
                {comprehensiveData?.status && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: comprehensiveData.status === 'APPROVED' ? 'rgba(22,163,74,0.12)' : comprehensiveData.status === 'REJECTED' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)',
                    color: comprehensiveData.status === 'APPROVED' ? 'var(--accent-green)' : comprehensiveData.status === 'REJECTED' ? 'var(--accent-red)' : 'var(--accent-amber)'
                  }}>
                    {comprehensiveData.status}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {comprehensiveData?.project_title || 'Select a Project DPR'}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                <span>ID: <strong>{selectedDprId ? selectedDprId.slice(0, 12) : '—'}</strong></span>
                <span>Sector: <strong>{comprehensiveData?.sector || 'Roads & Bridges'}</strong></span>
                <span>District: <strong>{comprehensiveData?.district || 'Karnataka'}</strong></span>
                <span>Cost: <strong>₹{comprehensiveData?.estimated_cost_cr || '—'} Cr</strong></span>
              </div>
            </div>
          </div>

          {/* DPR Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Switch DPR:
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedDprId}
                onChange={(e) => setSelectedDprId(e.target.value)}
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 8,
                  padding: '10px 36px 10px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  minWidth: 260,
                  appearance: 'none',
                  outline: 'none'
                }}
              >
                {dashboardData?.projects.map(p => (
                  <option key={p.dpr_id} value={p.dpr_id}>
                    {p.title.length > 36 ? p.title.slice(0, 36) + '...' : p.title} ({p.district || p.sector})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>

            <button
              onClick={() => {
                if (selectedDprId) loadDprSuggestions(selectedDprId);
                loadDashboard();
              }}
              className="topbar-btn"
              title="Refresh DPR Analysis"
            >
              <RefreshCw size={14} style={{ animation: loadingDeep ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* ── 2. AI SCORES SCORECARD (9 Core Scores) ── */}
        {comprehensiveData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12
          }}>
            {[
              { label: 'Overall AI Score', val: comprehensiveData.scores.overall_ai_score, weight: '100%', color: comprehensiveData.scores.color, icon: <Sparkles size={16} /> },
              { label: 'DPR Quality', val: comprehensiveData.scores.dpr_quality_score, weight: '25%', color: '#3b82f6', icon: <Award size={16} /> },
              { label: 'Compliance', val: comprehensiveData.scores.compliance_score, weight: '25%', color: '#16a34a', icon: <CheckCircle2 size={16} /> },
              { label: 'Risk Level', val: comprehensiveData.scores.risk_score, weight: '20%', color: comprehensiveData.scores.risk_score > 50 ? '#dc2626' : '#d97706', icon: <AlertTriangle size={16} /> },
              { label: 'Technical Score', val: comprehensiveData.scores.technical_score, weight: '15%', color: '#2563eb', icon: <Layers size={16} /> },
              { label: 'Financial Score', val: comprehensiveData.scores.financial_score, weight: '15%', color: '#0891b2', icon: <DollarSign size={16} /> },
              { label: 'Documentation', val: comprehensiveData.scores.documentation_score, weight: '10%', color: '#9333ea', icon: <FileText size={16} /> },
              { label: 'Approval Readiness', val: comprehensiveData.scores.approval_readiness_score, weight: '30%', color: '#16a34a', icon: <TrendingUp size={16} /> },
              { label: 'AI Confidence', val: comprehensiveData.scores.confidence_score, weight: 'Reliability', color: '#6366f1', icon: <Zap size={16} /> },
            ].map((scoreItem, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  padding: '14px 16px',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {scoreItem.label}
                  </span>
                  <div style={{ color: scoreItem.color }}>{scoreItem.icon}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: scoreItem.color }}>
                    {scoreItem.val}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--bg-primary)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, scoreItem.val))}%`, height: '100%', background: scoreItem.color, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Weight: {scoreItem.weight}</span>
                  <span style={{ fontWeight: 600, color: scoreItem.color }}>
                    {scoreItem.val >= 80 ? 'Optimal' : scoreItem.val >= 60 ? 'Moderate' : 'Action Req.'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 3. NAVIGATION TABS ── */}
        <div style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 2,
          overflowX: 'auto'
        }}>
          {[
            { id: 'recommendations', label: 'AI Recommendations', count: comprehensiveData?.total_recommendations || 0, icon: <Sparkles size={15} /> },
            { id: 'insights', label: 'Key Findings & Alerts', count: criticalAlertsList.length, icon: <AlertCircle size={15} /> },
            { id: 'risks', label: 'Risk-Based Suggestions', count: comprehensiveData?.risk_suggestions.length || 0, icon: <AlertTriangle size={15} /> },
            { id: 'compliance', label: 'Compliance Audit', count: comprehensiveData?.compliance_suggestions.length || 0, icon: <CheckCircle2 size={15} /> },
            { id: 'corrections', label: 'Corrections Required', count: comprehensiveData?.corrections_required.length || 0, icon: <XCircle size={15} /> },
            { id: 'improvements', label: 'Value Improvements', icon: <TrendingUp size={15} /> },
            { id: 'analytics', label: 'Visual Analytics', icon: <BarChart3 size={15} /> },
            { id: 'evidence', label: 'Evidence Matrix', count: comprehensiveData?.evidence_references.length || 0, icon: <BookOpen size={15} /> },
            { id: 'scores', label: 'Score Explainability', icon: <HelpCircle size={15} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: '8px 8px 0 0',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  borderBottom: isActive ? '2px solid var(--accent-blue)' : 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 99,
                    background: isActive ? 'var(--accent-blue)' : 'var(--bg-primary)',
                    color: isActive ? '#fff' : 'var(--text-muted)'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 4. TAB CONTENTS ── */}

        {/* TAB 1: AI RECOMMENDATIONS (Evidence-backed cards) */}
        {activeTab === 'recommendations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filter Toolbar */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              padding: '14px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 300px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search recommendations, pages, guidelines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      borderRadius: 8,
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: 13
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="financial">Financial</option>
                    <option value="environmental">Environmental</option>
                    <option value="compliance">Compliance</option>
                    <option value="safety">Safety</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recommendations List */}
            {filteredRecommendations.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                borderRadius: 12,
                border: '1px solid var(--border)'
              }}>
                <Sparkles size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  No matching recommendations found
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Try adjusting your search query or filters to inspect other AI suggestions.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredRecommendations.map((rec) => {
                  const priorityColor =
                    rec.priority === 'critical' ? '#dc2626' : rec.priority === 'high' ? '#ea580c' : rec.priority === 'medium' ? '#d97706' : '#16a34a';

                  return (
                    <div
                      key={rec.id}
                      style={{
                        background: 'var(--bg-card)',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        borderLeft: `4px solid ${priorityColor}`,
                        padding: '22px 24px',
                        boxShadow: 'var(--card-shadow)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: `${priorityColor}15`,
                              color: priorityColor,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}>
                              {rec.priority} Priority
                            </span>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: 'var(--bg-primary)',
                              color: 'var(--text-secondary)'
                            }}>
                              {rec.category}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                              {rec.id}
                            </span>
                          </div>
                          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {rec.title}
                          </h3>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>AI Confidence</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-blue)' }}>
                            {rec.confidence_score}%
                          </div>
                        </div>
                      </div>

                      {/* Reason & Explanation */}
                      <div style={{
                        background: 'var(--bg-primary)',
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: '1px solid var(--border-light)',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                          ⚡ Core Reason & Context:
                        </div>
                        {rec.reason}
                        {rec.description && (
                          <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12.5 }}>
                            {rec.description}
                          </div>
                        )}
                      </div>

                      {/* Citations Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 12,
                        padding: '12px 14px',
                        background: 'var(--bg-card-hover)',
                        borderRadius: 8,
                        fontSize: 12
                      }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>DPR Citation: </span>
                          <strong style={{ color: 'var(--accent-blue)' }}>
                            Page(s) {(rec.dpr_page_numbers || []).join(', ')}
                          </strong>
                          <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{rec.dpr_section_name}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Standard Reference: </span>
                          <strong style={{ color: 'var(--text-primary)' }}>{rec.guideline_reference}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Expected Impact: </span>
                          <strong style={{ color: priorityColor }}>{rec.impact} Impact</strong>
                        </div>
                      </div>

                      {/* Suggested Action & Actionable Checklist */}
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                          Recommended Action & Steps:
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                          {rec.suggested_action}
                        </p>

                        {rec.actionable_steps && rec.actionable_steps.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                            {rec.actionable_steps.map((step, sIdx) => {
                              const checkKey = `${rec.id}-step-${sIdx}`;
                              const isChecked = !!checkedActions[checkKey];
                              return (
                                <div
                                  key={sIdx}
                                  onClick={() => toggleAction(checkKey)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 10,
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    background: isChecked ? 'rgba(22,163,74,0.08)' : 'var(--bg-primary)',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease'
                                  }}
                                >
                                  {isChecked ? (
                                    <CheckSquare size={16} style={{ color: 'var(--accent-green)', marginTop: 2, flexShrink: 0 }} />
                                  ) : (
                                    <Square size={16} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                                  )}
                                  <span style={{
                                    fontSize: 12.5,
                                    color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                                    textDecoration: isChecked ? 'line-through' : 'none',
                                    lineHeight: 1.4
                                  }}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI INSIGHTS & KEY FINDINGS */}
        {activeTab === 'insights' && comprehensiveData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Critical Alerts Banner */}
            {criticalAlertsList.length > 0 && (
              <div style={{
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={20} style={{ color: 'var(--accent-red)' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-red)', margin: 0 }}>
                    Critical Alerts Requiring Immediate Attention ({criticalAlertsList.length})
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                  {criticalAlertsList.map((alert, aIdx) => (
                    <div
                      key={aIdx}
                      style={{
                        background: 'var(--bg-card)',
                        borderRadius: 8,
                        border: '1px solid rgba(220,38,38,0.2)',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                          {alert.type} • Page {alert.dpr_page}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(220,38,38,0.12)', color: 'var(--accent-red)' }}>
                          {alert.severity}
                        </span>
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {alert.title}
                      </h4>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {alert.description}
                      </p>
                      <div style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 600, borderTop: '1px dashed rgba(220,38,38,0.2)', paddingTop: 6 }}>
                        Action: {alert.mandatory_action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Findings: Observations, Strengths, Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Strengths */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: '20px 22px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-green)' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Identified Strengths
                  </h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(comprehensiveData.insights?.key_findings?.strengths || []).map((str, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses / Gaps */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: '20px 22px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <XCircle size={18} style={{ color: 'var(--accent-amber)' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Identified Weaknesses & Vulnerabilities
                  </h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(comprehensiveData.insights?.key_findings?.weaknesses || []).map((weak, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {weak}
                    </li>
                  ))}
                </ul>
              </div>

              {/* General Observations */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: '20px 22px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Info size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Engineering Observations
                  </h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(comprehensiveData.insights?.key_findings?.observations || []).map((obs, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Opportunities (Cost savings in ₹ Cr) */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              padding: '20px 24px',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingUp size={20} style={{ color: 'var(--accent-green)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Top Value Engineering & Cost Optimization Opportunities
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                {topOpportunitiesList.map((opp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-primary)',
                      borderRadius: 10,
                      border: '1px solid var(--border-light)',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 10
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                          {opp.area}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-green)' }}>
                          {opp.estimated_savings}
                        </span>
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                        {opp.title}
                      </h4>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {opp.details}
                      </p>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                      Expected Impact: <span style={{ color: 'var(--text-primary)' }}>{opp.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RISK-BASED SUGGESTIONS */}
        {activeTab === 'risks' && comprehensiveData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              padding: '14px 18px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
              <span>
                Risk-based suggestions identify high-vulnerability factors across budget, geotechnical, flood, and contractor execution dimensions with targeted mitigation plans.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
              {comprehensiveData.risk_suggestions.map((risk, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    padding: '20px 22px',
                    boxShadow: 'var(--card-shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(217,119,6,0.12)',
                        color: 'var(--accent-amber)',
                        textTransform: 'uppercase'
                      }}>
                        {risk.risk_category} Risk
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: risk.probability_pct > 60 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        Prob: {risk.probability_pct}%
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                      {risk.title}
                    </h4>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                      {risk.description}
                    </p>

                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: 8,
                      padding: '12px 14px',
                      fontSize: 12.5,
                      color: 'var(--text-primary)'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 4 }}>
                        🛡️ Recommended Mitigation Strategy:
                      </div>
                      {risk.mitigation_strategy}
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--text-muted)'
                  }}>
                    <span>DPR Page: <strong>{risk.dpr_page_reference}</strong></span>
                    <span>Guideline: <strong>{risk.guideline_reference}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: COMPLIANCE SUGGESTIONS */}
        {activeTab === 'compliance' && comprehensiveData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--card-shadow)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Standard / Code</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Requirement</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Audit Finding</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Corrective Action</th>
                  </tr>
                </thead>
                <tbody>
                  {comprehensiveData.compliance_suggestions.map((comp, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <strong style={{ color: 'var(--accent-blue)' }}>{comp.guideline_code}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{comp.guideline_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{comp.statutory_reference}</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        {comp.requirement_description}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {comp.current_finding}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 99,
                          background: comp.compliance_status === 'Compliant' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                          color: comp.compliance_status === 'Compliant' ? 'var(--accent-green)' : 'var(--accent-red)',
                          whiteSpace: 'nowrap'
                        }}>
                          {comp.compliance_status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {comp.corrective_action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CORRECTIONS REQUIRED (Categorized) */}
        {activeTab === 'corrections' && comprehensiveData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              {comprehensiveData.corrections_required.map((corr, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    padding: '18px 20px',
                    boxShadow: 'var(--card-shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'var(--bg-primary)',
                        color: 'var(--accent-blue)'
                      }}>
                        {corr.category}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: corr.severity === 'Critical' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)',
                        color: corr.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)'
                      }}>
                        {corr.severity}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                      {corr.description}
                    </p>

                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: 6,
                      padding: '10px 12px',
                      fontSize: 12,
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        Resolution Steps:
                      </div>
                      {corr.resolution_steps}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    DPR Reference: <strong>Page {corr.page_number}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: IMPROVEMENT SUGGESTIONS */}
        {activeTab === 'improvements' && comprehensiveData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              {/* Technical Improvements */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-blue)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} /> Technical & Structural Improvements
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comprehensiveData.improvement_suggestions.technical_improvements.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', fontSize: 12.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{item.recommendation}</p>
                      <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>Benefit: {item.benefit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget & Cost Optimization */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-green)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={16} /> Budget & Rate Optimization
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comprehensiveData.improvement_suggestions.budget_optimization.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', fontSize: 12.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{item.recommendation}</p>
                      <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>Cost Impact: {item.cost_impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline & Schedule Optimization */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-amber)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} /> Timeline & Critical Path Optimization
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comprehensiveData.improvement_suggestions.timeline_optimization.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', fontSize: 12.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{item.recommendation}</p>
                      <div style={{ fontSize: 11, color: 'var(--accent-amber)', fontWeight: 600 }}>Time Saved: {item.time_saved}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sustainability & Green Enhancements */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0891b2', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} /> Sustainability & Environmental Enhancements
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comprehensiveData.improvement_suggestions.sustainability_enhancements.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', fontSize: 12.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{item.recommendation}</p>
                      <div style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>Rating: {item.green_rating}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: VISUAL ANALYTICS (Charts) */}
        {activeTab === 'analytics' && comprehensiveData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            {/* Risk Distribution Chart */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                Multi-Factor Risk Breakdown
              </h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={comprehensiveData.analytics.risk_distribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {comprehensiveData.analytics.risk_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quality Dimensions Radar Chart */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                7-Dimension DPR Quality Radar
              </h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={comprehensiveData.analytics.quality_radar}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="DPR Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Compliance Adherence Bar Chart */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                Statutory Guidelines Adherence (%)
              </h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comprehensiveData.analytics.compliance_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="score" fill="#16a34a" radius={[4, 4, 0, 0]} name="Actual Score" />
                    <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target Bench" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Approval Readiness Progression */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                Workflow Approval Readiness Trajectory
              </h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comprehensiveData.analytics.readiness_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="stage" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="readiness" stroke="#2563eb" fillOpacity={1} fill="url(#readinessGrad)" name="Readiness Index" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: EVIDENCE & REFERENCES MATRIX */}
        {activeTab === 'evidence' && comprehensiveData && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Page & Section</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>OCR Extracted Excerpt</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>RAG Knowledge Context</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Guideline Reference</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Suggested Action</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveData.evidence_references.map((ev, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <strong style={{ color: 'var(--accent-blue)' }}>Page {ev.dpr_page_number}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ev.section_name}</div>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: 280 }}>
                      &ldquo;{ev.ocr_source_excerpt}&rdquo;
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-primary)', maxWidth: 280 }}>
                      {ev.rag_retrieval_context}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>{ev.guideline_reference}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                      {ev.suggested_action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 9: SCORE EXPLAINABILITY BREAKDOWN (Google PAIR) */}
        {activeTab === 'scores' && comprehensiveData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {Object.entries(comprehensiveData.score_explanations).map(([key, item]) => (
              <div
                key={key}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  padding: '18px 20px',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>
                      {item.score}/100
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 8 }}>
                    Grade: {item.grade} (Weight: {item.weight_pct}%)
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{
                  background: 'var(--bg-primary)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--accent-blue)',
                  border: '1px solid var(--border-light)'
                }}>
                  Formula: {item.formula}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 5. DIRECTORY OVERVIEW CARDS (All DPRs Overview) ── */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                All DPR Projects — AI Suggestions Summary
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Select any project card below to instantly inspect its explainable AI recommendations and risk mitigations.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
              Showing {dashboardData?.projects.length || 0} DPRs
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {dashboardData?.projects.map((proj) => {
              const isSelected = proj.dpr_id === selectedDprId;
              const overallScore = proj.scores?.overall_ai_score || 70;
              const qualityScore = proj.scores?.dpr_quality_score || 70;
              const complianceScore = proj.scores?.compliance_score || 70;

              return (
                <div
                  key={proj.dpr_id}
                  onClick={() => {
                    setSelectedDprId(proj.dpr_id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                    padding: '18px 20px',
                    boxShadow: isSelected ? '0 4px 16px rgba(37,99,235,0.18)' : 'var(--card-shadow)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                        {proj.sector || 'Roads'} • {proj.district || 'Karnataka'}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: proj.status === 'APPROVED' ? 'rgba(22,163,74,0.12)' : proj.status === 'REJECTED' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)',
                        color: proj.status === 'APPROVED' ? 'var(--accent-green)' : proj.status === 'REJECTED' ? 'var(--accent-red)' : 'var(--accent-amber)'
                      }}>
                        {proj.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                      {proj.title}
                    </h3>

                    {/* Scores Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      <div>AI Score: <strong style={{ color: overallScore >= 80 ? 'var(--accent-green)' : overallScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{overallScore}</strong></div>
                      <div>Quality: <strong>{qualityScore}</strong></div>
                      <div>Compliance: <strong>{complianceScore}</strong></div>
                    </div>

                    {/* Critical Alert Preview if any */}
                    {proj.critical_alerts && proj.critical_alerts.length > 0 && (
                      <div style={{
                        background: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 11.5,
                        color: 'var(--accent-red)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {proj.critical_alerts[0].title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{proj.total_recommendations}</strong> Recommendations ({proj.critical_count} Critical)
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isSelected ? 'Currently Viewing' : 'Inspect'} <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
