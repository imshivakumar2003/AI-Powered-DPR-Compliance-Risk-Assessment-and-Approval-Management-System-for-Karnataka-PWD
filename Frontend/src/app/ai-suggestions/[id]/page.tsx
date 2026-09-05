// TOPLINE
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Layers,
  Zap,
  Info,
  DollarSign,
  Calendar,
  CheckSquare,
  Square,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Send,
  Eye,
  Check
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
  Area
} from 'recharts';
import {
  fetchComprehensiveSuggestions,
  ComprehensiveSuggestionsData,
  getUserHeaders
} from '@/lib/api';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CommentItem {
  id: string;
  author_role: string;
  author_name: string;
  text: string;
  created_at: string;
  category?: string;
}

export default function DprAiSuggestionsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dprId = (params?.id as string) || '';

  const [data, setData] = useState<ComprehensiveSuggestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'insights' | 'risks' | 'compliance' | 'corrections' | 'improvements' | 'analytics' | 'evidence' | 'scores' | 'comments'>('recommendations');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  // Comments / Discussion
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load Comprehensive Data
  const loadData = useCallback(async () => {
    if (!dprId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchComprehensiveSuggestions(dprId);
      if (!res) throw new Error('DPR suggestions could not be loaded');
      setData(res);

      // Load comments
      try {
        const cRes = await fetch(`${API_BASE}/api/dpr/${dprId}/comments`, { headers: getUserHeaders() });
        if (cRes.ok) {
          const cData = await cRes.json();
          setComments(Array.isArray(cData) ? cData : []);
        }
      } catch (cErr) {
        console.warn('Could not fetch comments:', cErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [dprId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Checklist toggle
  const toggleAction = (key: string) => {
    setCheckedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    if (!data?.recommendations) return [];
    return data.recommendations.filter(rec => {
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
  }, [data, searchQuery, priorityFilter, categoryFilter]);

  // Safe helper for alerts list
  const criticalAlertsList = useMemo(() => {
    if (!data?.insights?.critical_alerts) return [];
    const raw = data.insights.critical_alerts as any;
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
  }, [data]);

  // Safe helper for opportunities list
  const topOpportunitiesList = useMemo(() => {
    if (!data?.insights?.top_opportunities) return [];
    const raw = data.insights.top_opportunities as any;
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
  }, [data]);

  // Export CSV
  const handleExportCsv = () => {
    if (!data) return;
    const headers = ['ID', 'Title', 'Category', 'Priority', 'Impact', 'Confidence (%)', 'Page Numbers', 'Section', 'Guideline', 'Action'];
    const rows = (data.recommendations || []).map(r => [
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
    link.setAttribute('download', `AI_Suggestions_${data.dpr_id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !dprId) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE}/api/dpr/${dprId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({ text: newComment.trim() })
      });
      if (res.ok) {
        setNewComment('');
        const updated = await fetch(`${API_BASE}/api/dpr/${dprId}/comments`, { headers: getUserHeaders() });
        if (updated.ok) setComments(await updated.json());
      }
    } catch (e) {
      console.error('Failed to post comment', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar title="AI Suggestions & Recommendations" subtitle="Analyzing DPR intelligence..." />
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Loading AI Insights & Suggestions Engine...</div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Topbar title="AI Suggestions" subtitle="DPR Not Found" />
        <div style={{ padding: 60, textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--accent-red)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Failed to load suggestions</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error || 'Project data could not be retrieved.'}</p>
          <Link href="/ai-suggestions" className="topbar-btn primary" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Back to AI Suggestions Directory
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="AI Insights & Recommendations Center"
        subtitle={`Intelligent engineering recommendations for DPR: ${data.project_title}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/ai-suggestions" className="topbar-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> All DPRs
            </Link>
            <Link href={`/dpr/${data.dpr_id}`} className="topbar-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={15} /> View Full DPR
            </Link>
            <button onClick={handleExportCsv} className="topbar-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={() => window.print()} className="topbar-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={15} /> Print / Export PDF
            </button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── 1. HEADER CARD ── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}>
              <Sparkles size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  AI Analysis Grounded in KPWD SoR & IRC Standards
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: data.status === 'APPROVED' ? 'rgba(22,163,74,0.12)' : data.status === 'REJECTED' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)',
                  color: data.status === 'APPROVED' ? 'var(--accent-green)' : data.status === 'REJECTED' ? 'var(--accent-red)' : 'var(--accent-amber)'
                }}>
                  {data.status}
                </span>
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {data.project_title}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 14 }}>
                <span>DPR ID: <strong>{data.dpr_id.slice(0, 12)}</strong></span>
                <span>Sector: <strong>{data.sector}</strong></span>
                <span>District: <strong>{data.district}</strong></span>
                <span>Est. Cost: <strong>₹{data.estimated_cost_cr} Cr</strong></span>
                <span>Pages: <strong>{data.total_pages}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href={`/approvals?dpr_id=${data.dpr_id}`}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: 'var(--accent-green)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(22,163,74,0.25)'
              }}
            >
              <Shield size={16} /> Approvals Workflow
            </Link>
            <button
              onClick={() => loadData()}
              className="topbar-btn"
              title="Refresh analysis"
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* ── 2. AI SCORES SCORECARD ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12
        }}>
          {[
            { label: 'Overall AI Score', val: data.scores.overall_ai_score, weight: '100%', color: data.scores.color, icon: <Sparkles size={16} /> },
            { label: 'DPR Quality', val: data.scores.dpr_quality_score, weight: '25%', color: '#3b82f6', icon: <Award size={16} /> },
            { label: 'Compliance', val: data.scores.compliance_score, weight: '25%', color: '#16a34a', icon: <CheckCircle2 size={16} /> },
            { label: 'Risk Level', val: data.scores.risk_score, weight: '20%', color: data.scores.risk_score > 50 ? '#dc2626' : '#d97706', icon: <AlertTriangle size={16} /> },
            { label: 'Technical Score', val: data.scores.technical_score, weight: '15%', color: '#2563eb', icon: <Layers size={16} /> },
            { label: 'Financial Score', val: data.scores.financial_score, weight: '15%', color: '#0891b2', icon: <DollarSign size={16} /> },
            { label: 'Documentation', val: data.scores.documentation_score, weight: '10%', color: '#9333ea', icon: <FileText size={16} /> },
            { label: 'Approval Readiness', val: data.scores.approval_readiness_score, weight: '30%', color: '#16a34a', icon: <TrendingUp size={16} /> },
            { label: 'AI Confidence', val: data.scores.confidence_score, weight: 'Reliability', color: '#6366f1', icon: <Zap size={16} /> },
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
                justifyContent: 'space-between'
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

        {/* ── 3. TABS NAVIGATION ── */}
        <div style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 2,
          overflowX: 'auto'
        }}>
          {[
            { id: 'recommendations', label: 'AI Recommendations', count: data.total_recommendations, icon: <Sparkles size={15} /> },
            { id: 'insights', label: 'Key Findings & Alerts', count: criticalAlertsList.length, icon: <AlertCircle size={15} /> },
            { id: 'risks', label: 'Risk Suggestions', count: data.risk_suggestions.length, icon: <AlertTriangle size={15} /> },
            { id: 'compliance', label: 'Compliance Audit', count: data.compliance_suggestions.length, icon: <CheckCircle2 size={15} /> },
            { id: 'corrections', label: 'Corrections Required', count: data.corrections_required.length, icon: <XCircle size={15} /> },
            { id: 'improvements', label: 'Value Improvements', icon: <TrendingUp size={15} /> },
            { id: 'analytics', label: 'Visual Analytics', icon: <BarChart3 size={15} /> },
            { id: 'evidence', label: 'Evidence Matrix', count: data.evidence_references.length, icon: <BookOpen size={15} /> },
            { id: 'scores', label: 'Score Explainability', icon: <HelpCircle size={15} /> },
            { id: 'comments', label: 'Team Review Notes', count: comments.length, icon: <MessageSquare size={15} /> },
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
                  whiteSpace: 'nowrap'
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

        {/* TAB 1: RECOMMENDATIONS */}
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

            {/* List */}
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
                            textTransform: 'uppercase'
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
                                  cursor: 'pointer'
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
                                  textDecoration: isChecked ? 'line-through' : 'none'
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
          </div>
        )}

        {/* TAB 2: INSIGHTS & ALERTS */}
        {activeTab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-green)' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Identified Strengths</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(data.insights?.key_findings?.strengths || []).map((str, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{str}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <XCircle size={18} style={{ color: 'var(--accent-amber)' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Identified Weaknesses</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(data.insights?.key_findings?.weaknesses || []).map((weak, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{weak}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Info size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Engineering Observations</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(data.insights?.key_findings?.observations || []).map((obs, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{obs}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 24px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingUp size={20} style={{ color: 'var(--accent-green)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Top Value Engineering & Cost Optimization Opportunities
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                {topOpportunitiesList.map((opp, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-light)', padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>{opp.area}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-green)' }}>{opp.estimated_savings}</span>
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{opp.title}</h4>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{opp.details}</p>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Expected Impact: <span style={{ color: 'var(--text-primary)' }}>{opp.impact}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RISKS */}
        {activeTab === 'risks' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {data.risk_suggestions.map((risk, idx) => (
              <div key={idx} style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(217,119,6,0.12)', color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
                      {risk.risk_category} Risk
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: risk.probability_pct > 60 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                      Prob: {risk.probability_pct}%
                    </span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{risk.title}</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>{risk.description}</p>
                  <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 4 }}>🛡️ Recommended Mitigation Strategy:</div>
                    {risk.mitigation_strategy}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>DPR Page: <strong>{risk.dpr_page_reference}</strong></span>
                  <span>Guideline: <strong>{risk.guideline_reference}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
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
                {data.compliance_suggestions.map((comp, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <strong style={{ color: 'var(--accent-blue)' }}>{comp.guideline_code}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{comp.guideline_name}</div>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>{comp.requirement_description}</td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-primary)', fontWeight: 500 }}>{comp.current_finding}</td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: comp.compliance_status === 'Compliant' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)', color: comp.compliance_status === 'Compliant' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {comp.compliance_status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>{comp.corrective_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: CORRECTIONS */}
        {activeTab === 'corrections' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {data.corrections_required.map((corr, idx) => (
              <div key={idx} style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-primary)', color: 'var(--accent-blue)' }}>{corr.category}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: corr.severity === 'Critical' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)', color: corr.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)' }}>{corr.severity}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>{corr.description}</p>
                  <div style={{ background: 'var(--bg-primary)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Resolution Steps:</div>
                    {corr.resolution_steps}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  DPR Reference: <strong>Page {corr.page_number}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: IMPROVEMENTS */}
        {activeTab === 'improvements' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-blue)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={16} /> Technical Improvements</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.improvement_suggestions.technical_improvements.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', fontSize: 12.5 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                    <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{item.recommendation}</p>
                    <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>Benefit: {item.benefit}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-green)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={16} /> Budget Optimization</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.improvement_suggestions.budget_optimization.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', fontSize: 12.5 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                    <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{item.recommendation}</p>
                    <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>Cost Impact: {item.cost_impact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Multi-Factor Risk Breakdown</h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.analytics.risk_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                      {data.analytics.risk_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>7-Dimension Quality Radar</h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.analytics.quality_radar}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="DPR Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: EVIDENCE MATRIX */}
        {activeTab === 'evidence' && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
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
                {data.evidence_references.map((ev, idx) => (
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

        {/* TAB 9: SCORE EXPLAINABILITY */}
        {activeTab === 'scores' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {Object.entries(data.score_explanations).map(([key, item]) => (
              <div key={key} style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.score}/100</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 8 }}>Grade: {item.grade} (Weight: {item.weight_pct}%)</div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>{item.description}</p>
                </div>
                <div style={{ background: 'var(--bg-primary)', borderRadius: 6, padding: '8px 10px', fontSize: 11, fontFamily: 'monospace', color: 'var(--accent-blue)', border: '1px solid var(--border-light)' }}>
                  Formula: {item.formula}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 10: COMMENTS & TEAM NOTES */}
        {activeTab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 24px', boxShadow: 'var(--card-shadow)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Add Department Review Note</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Record your observations, compliance review notes, or mitigation instructions for this DPR..."
                  rows={3}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    resize: 'vertical'
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                  className="topbar-btn primary"
                  style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={14} /> Post Note
                </button>
              </div>
            </div>

            {comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{c.author_name} ({c.author_role})</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.created_at}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
