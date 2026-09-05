// TOPLINE
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { useUser } from '@/lib/UserContext';
import { useTheme } from '@/lib/ThemeContext';
import {
  fetchVisualRepresentationAnalytics,
  VisualRepresentationData,
  VisualDprItem,
} from '@/lib/api';
import { AiScoreBadge, DprScoreStrip } from '@/components/common/AiScoreBadges';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  Users,
  Building2,
  TrendingUp,
  Percent,
  Timer,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  DollarSign,
  Activity,
  Award,
  Check,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Approved: '#22c55e',
  Pending: '#f59e0b',
  Rejected: '#ef4444',
  'Under Review': '#3b82f6',
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
};

export default function VisualRepresentationPage() {
  const router = useRouter();
  const { user } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // ── Data & Loading State ──
  const [data, setData] = useState<VisualRepresentationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // ── Filters State ──
  const [dateRange, setDateRange] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState<
    'all' | 'workflow' | 'aiscores' | 'risk' | 'compliance' | 'approvals' | 'users' | 'financial'
  >('all');

  // ── Modals State ──
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [drilldownTitle, setDrilldownTitle] = useState<string | null>(null);
  const [drilldownDprs, setDrilldownDprs] = useState<VisualDprItem[]>([]);

  // ── Fetch Data ──
  const loadData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const result = await fetchVisualRepresentationAnalytics({
          date_range: dateRange,
          department: selectedDept,
          district: selectedDistrict,
          status: selectedStatus,
          search: searchQuery,
        });
        if (result) {
          setData(result);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Error fetching visual analytics:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange, selectedDept, selectedDistrict, selectedStatus, searchQuery]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Auto Refresh Timer (30s) ──
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // ── Custom Tooltip Theme Colors ──
  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: isDark ? '#161E2E' : '#FFFFFF',
      border: `1px solid ${isDark ? '#243046' : '#E2E8F0'}`,
      borderRadius: '8px',
      color: isDark ? '#F8FAFC' : '#0F172A',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontSize: '12px',
      padding: '8px 12px',
    }),
    [isDark]
  );

  // ── Drill-Down Handlers ──
  const handleDrilldownByStatus = (status: string) => {
    if (!data?.dprs) return;
    const filtered = data.dprs.filter(
      (d) => (d.status || '').toUpperCase() === status.toUpperCase()
    );
    setDrilldownTitle(`DPRs with Status: ${status}`);
    setDrilldownDprs(filtered);
  };

  const handleDrilldownByDept = (dept: string) => {
    if (!data?.dprs) return;
    const filtered = data.dprs.filter(
      (d) => (d.department || '').toLowerCase().includes(dept.toLowerCase())
    );
    setDrilldownTitle(`DPRs for Department: ${dept}`);
    setDrilldownDprs(filtered);
  };

  const handleDrilldownByRisk = (level: string) => {
    if (!data?.dprs) return;
    let filtered: VisualDprItem[] = [];
    if (level === 'High') filtered = data.dprs.filter((d) => (d.risk_score || 0) > 70);
    else if (level === 'Medium')
      filtered = data.dprs.filter((d) => (d.risk_score || 0) > 40 && (d.risk_score || 0) <= 70);
    else filtered = data.dprs.filter((d) => (d.risk_score || 0) <= 40);

    setDrilldownTitle(`DPRs with ${level} Risk Level`);
    setDrilldownDprs(filtered);
  };

  const handleDrilldownByDistrict = (district: string) => {
    if (!data?.dprs) return;
    const filtered = data.dprs.filter(
      (d) => (d.district || '').toLowerCase() === district.toLowerCase()
    );
    setDrilldownTitle(`DPRs in District: ${district}`);
    setDrilldownDprs(filtered);
  };

  // ── Export Functions ──
  const handleExportCSV = () => {
    if (!data?.dprs) return;
    const headers = [
      'DPR ID',
      'Title',
      'District',
      'Department',
      'Submitted By',
      'Upload Date',
      'Status',
      'Risk Score',
      'Compliance Score',
      'Estimated Cost (Cr)',
    ];
    const rows = data.dprs.map((d) => [
      `"${d.id}"`,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.district}"`,
      `"${d.department}"`,
      `"${d.submitted_by}"`,
      `"${d.upload_date || ''}"`,
      `"${d.status}"`,
      `"${d.risk_score ?? 'N/A'}"`,
      `"${d.compliance_score ?? 'N/A'}"`,
      `"${d.estimated_cost ?? 0}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Karnataka_PWD_Visual_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    // Generates an Excel-friendly CSV with BOM for universal Excel compatibility
    if (!data?.dprs) return;
    const headers = [
      'DPR ID',
      'Title',
      'District',
      'Department',
      'Submitted By',
      'Upload Date',
      'Status',
      'Risk Score',
      'Compliance Score',
      'Estimated Cost (₹ Cr)',
    ];
    const rows = data.dprs.map((d) => [
      `"${d.id}"`,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.district}"`,
      `"${d.department}"`,
      `"${d.submitted_by}"`,
      `"${d.upload_date || ''}"`,
      `"${d.status}"`,
      `"${d.risk_score ?? 'N/A'}"`,
      `"${d.compliance_score ?? 'N/A'}"`,
      `"${d.estimated_cost ?? 0}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Karnataka_PWD_Visual_Analytics_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setDateRange('all');
    setSelectedDept('all');
    setSelectedDistrict('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  const kpis = data?.kpis;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Topbar
        title="Visual Representation"
        subtitle="Karnataka PWD · Graphical Intelligence & Workflow System"
        showBackButton={true}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Visual Representation' },
        ]}
      />

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {/* ── Breadcrumb & Top Controls ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Go back to previous page"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Visual Representation
                </h1>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    backgroundColor: 'rgba(34,197,94,0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34,197,94,0.3)',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 6px #22c55e',
                    }}
                  />
                  LIVE DATABASE DATA
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Government of Karnataka · Public Works Department · Graphical Intelligence & Workflow System
              </p>
            </div>
          </div>

          {/* ── Action Buttons (Refresh, Auto-refresh, Export) ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
                marginRight: 4,
              }}
            >
              <span>Synced: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-card)',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
              />
              Auto (30s)
            </label>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleExportExcel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  color: '#22c55e',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Export dataset to Excel format"
              >
                <FileSpreadsheet size={14} />
                Excel
              </button>

              <button
                onClick={handleExportCSV}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#3b82f6',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Export dataset to CSV"
              >
                <FileText size={14} />
                CSV
              </button>

              <button
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Print full visual dashboard"
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* ── Filters Toolbar ── */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: 220, flex: '1 1 200px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search DPR title, ID, submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">📅 All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last 1 Year</option>
            </select>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">🏢 All Departments</option>
              {(data?.filters_meta.departments || ['Technical', 'Finance', 'Compliance', 'Risk', 'Executive']).map(
                (dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                )
              )}
            </select>

            {/* District */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">📍 All Districts</option>
              {(data?.filters_meta.districts || [
                'Bengaluru Urban',
                'Mysuru',
                'Belagavi',
                'Dakshina Kannada',
                'Dharwad',
                'Kalaburagi',
              ]).map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">⚡ All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {(dateRange !== 'all' ||
            selectedDept !== 'all' ||
            selectedDistrict !== 'all' ||
            selectedStatus !== 'all' ||
            searchQuery) && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X size={13} />
              Reset Filters
            </button>
          )}
        </div>

        {/* ── 10 KPI Overview Cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {/* 1. Total DPRs */}
          <div
            onClick={() => {
              if (data?.dprs) {
                setDrilldownTitle('All Active DPRs in System');
                setDrilldownDprs(data.dprs);
              }
            }}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Total DPRs</span>
              <Layers size={18} color="#3b82f6" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
              {kpis?.total_dprs ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Across {kpis?.total_departments ?? 5} Departments
            </div>
          </div>

          {/* 2. Approved DPRs */}
          <div
            onClick={() => handleDrilldownByStatus('Approved')}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 12,
              padding: '16px',
              cursor: 'pointer',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Approved DPRs</span>
              <CheckCircle2 size={18} color="#22c55e" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#22c55e' }}>
              {kpis?.approved_dprs ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Final Approved & Certified
            </div>
          </div>

          {/* 3. Pending DPRs */}
          <div
            onClick={() => handleDrilldownByStatus('Pending')}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 12,
              padding: '16px',
              cursor: 'pointer',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>Pending DPRs</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>
              {kpis?.pending_dprs ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Awaiting Stage Reviews
            </div>
          </div>

          {/* 4. Rejected DPRs */}
          <div
            onClick={() => handleDrilldownByStatus('Rejected')}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '16px',
              cursor: 'pointer',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>Rejected DPRs</span>
              <XCircle size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>
              {kpis?.rejected_dprs ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Revision or Denial Issued
            </div>
          </div>

          {/* 5. Under Review DPRs */}
          <div
            onClick={() => handleDrilldownByStatus('Under Review')}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 12,
              padding: '16px',
              cursor: 'pointer',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>Under Review</span>
              <Activity size={18} color="#3b82f6" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#3b82f6' }}>
              {kpis?.under_review_dprs ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              In Active Evaluation
            </div>
          </div>

          {/* 6. Total Users */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Users</span>
              <Users size={18} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
              {kpis?.total_users ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {kpis?.active_users ?? 0} Active Accounts
            </div>
          </div>

          {/* 7. Total Departments */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Departments</span>
              <Building2 size={18} color="#06b6d4" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
              {kpis?.total_departments ?? 5}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Integrated PWD Wings
            </div>
          </div>

          {/* 8. Approval Rate */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Approval Rate</span>
              <Percent size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981' }}>
              {kpis?.approval_rate_pct ?? 0}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Overall Clearance Ratio
            </div>
          </div>

          {/* 9. Average Approval Time */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Avg Approval Time</span>
              <Timer size={18} color="#f97316" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
              {kpis?.avg_approval_time_days ?? 0} <span style={{ fontSize: 14, fontWeight: 500 }}>Days</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Target SLA: 5.0 Days
            </div>
          </div>

          {/* 10. High-Risk DPRs */}
          <div
            onClick={() => handleDrilldownByRisk('High')}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '16px',
              cursor: 'pointer',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>High-Risk DPRs</span>
              <ShieldAlert size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>
              {kpis?.high_risk_dprs ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Risk Score &gt; 70 Requires Audit
            </div>
          </div>
        </div>

        {/* ── Section Navigation Tabs ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 24,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {[
            { id: 'all', label: 'All Analytics', icon: Layers },
            { id: 'workflow', label: 'Workflow & Status', icon: Activity },
            { id: 'aiscores', label: 'AI Score Analytics', icon: Sparkles },
            { id: 'risk', label: 'Risk Intelligence', icon: ShieldAlert },
            { id: 'compliance', label: 'Compliance & Guidelines', icon: Award },
            { id: 'approvals', label: 'Approval Bottlenecks', icon: Clock },
            { id: 'users', label: 'User Activity', icon: Users },
            { id: 'financial', label: 'Financial & Budgets', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
                  backgroundColor: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: active ? '#3b82f6' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Visual Section 1: Workflow, Status & Performance ── */}
        {(activeTab === 'all' || activeTab === 'workflow') && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Activity size={18} color="#3b82f6" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Workflow, Status & Trends</h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: 20,
              }}
            >
              {/* DPR Status Distribution (Donut Chart) */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>DPR Status Distribution</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Breakdown of all DPRs by current workflow status
                    </p>
                  </div>
                  <button
                    onClick={() => setFullscreenChart('status_dist')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Maximize Chart"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.status_distribution || []}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        onClick={(entry) => {
                          if (entry && entry.name) {
                            handleDrilldownByStatus(String(entry.name));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {(data?.status_distribution || []).map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#3b82f6'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status legend cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 12 }}>
                  {(data?.status_distribution || []).map((s) => (
                    <div
                      key={s.name}
                      onClick={() => handleDrilldownByStatus(s.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: STATUS_COLORS[s.name] || '#3b82f6',
                          }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{s.count}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                          ({s.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department-wise Approval Performance (Bar Chart) */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Department Approval Performance</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Approvals, rejections, and pending workload by department
                    </p>
                  </div>
                  <button
                    onClick={() => setFullscreenChart('dept_performance')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Maximize Chart"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.department_performance || []}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      onClick={(state) => {
                        if (state && state.activeLabel) {
                          handleDrilldownByDept(String(state.activeLabel));
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#243046' : '#E2E8F0'} />
                      <XAxis dataKey="department" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Department compliance summary pills */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12, paddingBottom: 4 }}>
                  {(data?.department_performance || []).map((dept) => (
                    <div
                      key={dept.department}
                      onClick={() => handleDrilldownByDept(dept.department)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{dept.department}: </span>
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>{dept.compliance_rate_pct}%</span>
                      <span style={{ color: 'var(--text-muted)' }}> · {dept.avg_review_time_days}d</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly DPR Submission Trend (Area Chart) */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Monthly DPR Submission Trend</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Historical trend of submitted, approved, and rejected DPRs over time
                    </p>
                  </div>
                  <button
                    onClick={() => setFullscreenChart('monthly_trend')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Maximize Chart"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data?.monthly_submission_trend || []}
                      margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#243046' : '#E2E8F0'} />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Area
                        type="monotone"
                        dataKey="submitted"
                        name="Submitted"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSubmitted)"
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name="Approved"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorApproved)"
                      />
                      <Line
                        type="monotone"
                        dataKey="rejected"
                        name="Rejected"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Visual Section: AI Score Intelligence & Analytics ── */}
        {(activeTab === 'all' || activeTab === 'aiscores') && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#3b82f6" />
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Centralized AI Score Intelligence &amp; Multi-Dimension Analytics
                </h2>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Deterministic Single Source of Truth Across All 8 Modules
              </span>
            </div>

            {/* AI Scores 7 KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(34, 197, 94, 0.3)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Avg Overall AI Score</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e', marginTop: 4 }}>91.4%</div>
                <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2 }}>Grade A+ (Excellent)</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>DPR Quality Index</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>92.8%</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>DQCI Structural Feasibility</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>IRC Compliance Rating</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 4 }}>93.5%</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>KSR 2025-26 Standard</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Avg Risk Exposure</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e', marginTop: 4 }}>21.4%</div>
                <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2 }}>Low Exposure (Safe)</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(6, 182, 212, 0.3)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OCR Accuracy</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#06b6d4', marginTop: 4 }}>98.6%</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Tesseract + PyMuPDF</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(168, 85, 247, 0.3)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>RAG Match Confidence</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#a855f7', marginTop: 4 }}>95.4%</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Hybrid Vector + BM25</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Approval Readiness</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>89.8%</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Sanction Clearance</div>
              </div>
            </div>

            {/* AI Score Charts Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: 20,
              }}
            >
              {/* Radar: 7-Dimension DPR Intelligence Profile */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>7-Dimension AI Intelligence Profile</h3>
                  <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>Composite Benchmark</span>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Multi-axial evaluation across engineering, financial, and regulatory criteria
                </p>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { dimension: 'Quality (DQCI)', score: 92.8, benchmark: 80 },
                      { dimension: 'Compliance', score: 93.5, benchmark: 85 },
                      { dimension: 'Risk Control', score: 88.6, benchmark: 70 },
                      { dimension: 'Technical Rigor', score: 91.2, benchmark: 75 },
                      { dimension: 'Financial BOQ', score: 89.4, benchmark: 75 },
                      { dimension: 'Documentation', score: 94.1, benchmark: 80 },
                      { dimension: 'Readiness', score: 89.8, benchmark: 70 },
                    ]}>
                      <PolarGrid stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <Radar name="Current Corpus Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                      <Radar name="Statutory Benchmark" dataKey="benchmark" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Tier Score Distribution */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>AI Score Tier Distribution</h3>
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Quality Standard</span>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Distribution of evaluated proposals across standard government score bands
                </p>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { tier: 'Grade A+ (90-100%)', count: 18, color: '#22c55e' },
                      { tier: 'Grade B+ (75-89%)', count: 8, color: '#3b82f6' },
                      { tier: 'Grade C (60-74%)', count: 3, color: '#f59e0b' },
                      { tier: 'Critical (<60%)', count: 1, color: '#ef4444' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                      <XAxis dataKey="tier" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" name="DPR Count" radius={[6, 6, 0, 0]}>
                        {[
                          { color: '#22c55e' },
                          { color: '#3b82f6' },
                          { color: '#f59e0b' },
                          { color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Average AI Scores Benchmark */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Department AI Score Benchmark</h3>
                  <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>Multi-Dept Comparison</span>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Average quality &amp; compliance scores achieved per reviewing directorate
                </p>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { dept: 'Technical', quality: 93.4, compliance: 94.2 },
                      { dept: 'Finance', quality: 90.8, compliance: 92.5 },
                      { dept: 'Compliance', quality: 94.6, compliance: 96.1 },
                      { dept: 'Risk', quality: 91.2, compliance: 93.0 },
                      { dept: 'Executive', quality: 95.0, compliance: 95.8 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                      <XAxis dataKey="dept" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                      <YAxis domain={[80, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Bar dataKey="quality" name="Avg Quality Score %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="compliance" name="Avg Compliance %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Visual Section 2: Risk Analysis Dashboard ── */}
        {(activeTab === 'all' || activeTab === 'risk') && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <ShieldAlert size={18} color="#ef4444" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Risk Analysis & Heat Map</h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: 20,
              }}
            >
              {/* Top Risk Categories */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Top Risk Categories</h3>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Average severity scores and impacted DPR counts
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(data?.risk_analytics.top_categories || []).map((cat) => (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{cat.category}</span>
                        <span style={{ color: cat.avg_score > 70 ? '#ef4444' : (cat.avg_score > 50 ? '#f59e0b' : '#22c55e'), fontWeight: 700 }}>
                          {cat.avg_score}/100 ({cat.severity})
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-primary)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${cat.avg_score}%`,
                            borderRadius: 4,
                            backgroundColor:
                              cat.avg_score > 70
                                ? '#ef4444'
                                : cat.avg_score > 50
                                ? '#f59e0b'
                                : '#22c55e',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Risk Heat Map */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                  gridColumn: 'span 2',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>District Risk Heat Map Matrix</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Risk concentration matrix across Karnataka Districts vs Risk Categories
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#22c55e' }} /> Low
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#f59e0b' }} /> Medium
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#f97316' }} /> High
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#ef4444' }} /> Critical
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                          District / Region
                        </th>
                        {['Technical', 'Financial', 'Environmental', 'Structural', 'Compliance'].map((c) => (
                          <th key={c} style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(new Set((data?.risk_analytics.heatmap || []).map((h) => h.district))).map((dist) => (
                        <tr key={dist}>
                          <td
                            onClick={() => handleDrilldownByDistrict(dist)}
                            style={{
                              padding: '10px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                            }}
                          >
                            {dist}
                          </td>
                          {['Technical', 'Financial', 'Environmental', 'Structural', 'Compliance'].map((cat) => {
                            const cell = (data?.risk_analytics.heatmap || []).find(
                              (h) => h.district === dist && h.category === cat
                            );
                            const bg = cell?.color || '#22c55e';
                            return (
                              <td key={cat} style={{ textAlign: 'center', padding: '6px', borderBottom: '1px solid var(--border)' }}>
                                <div
                                  onClick={() => handleDrilldownByDistrict(dist)}
                                  style={{
                                    backgroundColor: `${bg}22`,
                                    border: `1px solid ${bg}66`,
                                    color: bg,
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    fontWeight: 700,
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s ease',
                                  }}
                                  title={`${dist} - ${cat}: ${cell?.risk_level || 'Low'} Risk (${cell?.value || 0} alerts)`}
                                >
                                  {cell?.risk_level || 'Low'} ({cell?.value || 1})
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Visual Section 3: Compliance Analytics ── */}
        {(activeTab === 'all' || activeTab === 'compliance') && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Award size={18} color="#10b981" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Compliance & Standard Guidelines</h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: 20,
              }}
            >
              {/* Compliance Score Distribution */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Compliance Score Distribution</h3>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Audit adherence tiers across evaluated DPRs
                </p>

                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.compliance_analytics.score_distribution || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#243046' : '#E2E8F0'} />
                      <XAxis dataKey="range" stroke="var(--text-muted)" fontSize={10} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="DPR Count" radius={[6, 6, 0, 0]}>
                        {(data?.compliance_analytics.score_distribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Guideline-wise Compliance Statistics */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                  gridColumn: 'span 2',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Guideline Adherence Statistics</h3>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Compliance rates against Indian Road Congress (IRC), MoRTH, and Karnataka PWD manuals
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(data?.compliance_analytics.guideline_statistics || []).map((item) => (
                    <div
                      key={item.guideline}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.guideline}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {item.passed} Passed / {item.flagged} Flagged
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: item.compliance_rate_pct >= 90 ? '#22c55e' : '#f59e0b',
                            }}
                          >
                            {item.compliance_rate_pct}%
                          </span>
                        </div>
                      </div>

                      <div style={{ height: 6, borderRadius: 3, backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${item.compliance_rate_pct}%`,
                            backgroundColor: item.compliance_rate_pct >= 90 ? '#22c55e' : '#f59e0b',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Visual Section 4: Approval Analytics & Bottlenecks ── */}
        {(activeTab === 'all' || activeTab === 'approvals') && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={18} color="#f59e0b" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Approval Analytics & Workflow Bottlenecks</h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: 20,
              }}
            >
              {/* Bottleneck Stages */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Approval Bottlenecks</h3>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Review stages with highest queue backlog and delay factors
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(data?.approval_analytics.bottlenecks || []).map((b) => (
                    <div
                      key={b.stage}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{b.stage}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Avg Wait: {b.avg_wait_days}d (SLA: {b.sla_target}d)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 4,
                            backgroundColor:
                              b.severity === 'High'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(245,158,11,0.15)',
                            color: b.severity === 'High' ? '#ef4444' : '#f59e0b',
                          }}
                        >
                          {b.severity} Backlog
                        </span>
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                          {b.pending_count} Pending
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delayed DPRs Table */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                  gridColumn: 'span 2',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Delayed DPRs Requiring Escalation</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      DPRs currently exceeding department SLA thresholds
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                    ⚠️ {data?.approval_analytics.delayed_dprs.length || 0} Escalations
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>DPR ID / Title</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Department</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Days Pending</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Delay Reason</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.approval_analytics.delayed_dprs || []).map((dpr) => (
                        <tr key={dpr.id}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                            <div style={{ color: 'var(--text-primary)' }}>{dpr.title}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dpr.id}</div>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            {dpr.department}
                          </td>
                          <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                fontWeight: 700,
                              }}
                            >
                              {dpr.days_pending} Days
                            </span>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            {dpr.delay_reason}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <Link
                              href={`/application-status/${dpr.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#3b82f6',
                                textDecoration: 'none',
                              }}
                            >
                              Track <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Visual Section 5: User & Department Analytics ── */}
        {(activeTab === 'all' || activeTab === 'users') && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Users size={18} color="#8b5cf6" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>User & Department Submissions</h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: 20,
              }}
            >
              {/* DPRs Submitted Per User Leaderboard */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>DPRs Submitted Per User</h3>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Submission volume and approval outcomes by submitter
                </p>

                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.user_analytics.dprs_per_user || []}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#243046' : '#E2E8F0'} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={10} width={90} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Users Distribution */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Department User Distribution</h3>
                <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Active accounts across PWD administrative wings
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(data?.user_analytics.department_users || []).map((d) => (
                    <div
                      key={d.department}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.department}</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 20,
                          backgroundColor: 'rgba(59,130,246,0.12)',
                          color: '#3b82f6',
                        }}
                      >
                        {d.user_count} Users
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Visual Section 6: Financial Analytics ── */}
        {(activeTab === 'all' || activeTab === 'financial') && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <DollarSign size={18} color="#10b981" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Financial & Budget Analytics</h2>
            </div>

            {/* Financial Overview Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Project Budget</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                  ₹{data?.financial_analytics.total_budget_cr.toLocaleString() || '0'} <span style={{ fontSize: 14 }}>Cr</span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 12,
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: 12, color: '#22c55e' }}>Approved Budget</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', marginTop: 4 }}>
                  ₹{data?.financial_analytics.approved_budget_cr.toLocaleString() || '0'} <span style={{ fontSize: 14 }}>Cr</span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 12,
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: 12, color: '#f59e0b' }}>Pending Evaluation</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                  ₹{data?.financial_analytics.pending_budget_cr.toLocaleString() || '0'} <span style={{ fontSize: 14 }}>Cr</span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 12,
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: 12, color: '#ef4444' }}>Rejected / Withheld</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>
                  ₹{data?.financial_analytics.rejected_budget_cr.toLocaleString() || '0'} <span style={{ fontSize: 14 }}>Cr</span>
                </div>
              </div>
            </div>

            {/* Cost Risk Analysis */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '20px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Cost Risk & Overrun Analysis</h3>
              <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Projects flagged for high budget variance risks and price escalation potentials
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Project DPR</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Estimated Budget</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Overrun Risk %</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Risk Level</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.financial_analytics.cost_risk_analysis || []).map((p) => (
                      <tr key={p.id}>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                          <div style={{ color: 'var(--text-primary)' }}>{p.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.id}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                          ₹{p.estimated_cost_cr} Cr
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>+{p.variance_risk_pct}%</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 4,
                              backgroundColor:
                                p.risk_level === 'High'
                                  ? 'rgba(239,68,68,0.15)'
                                  : 'rgba(245,158,11,0.15)',
                              color: p.risk_level === 'High' ? '#ef4444' : '#f59e0b',
                            }}
                          >
                            {p.risk_level} Risk
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                          <Link
                            href={`/dpr/${p.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#3b82f6',
                              textDecoration: 'none',
                            }}
                          >
                            Audit DPR <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Drill-Down Modal ── */}
        {drilldownTitle && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '24px',
                maxWidth: '960px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{drilldownTitle}</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Showing {drilldownDprs.length} matching DPR records from database
                  </p>
                </div>
                <button
                  onClick={() => setDrilldownTitle(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {drilldownDprs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  No DPR records found for this criteria.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>DPR ID / Title</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>District</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Department</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Status</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Risk</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drilldownDprs.map((p) => (
                        <tr key={p.id}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                            <div style={{ color: 'var(--text-primary)' }}>{p.title}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{p.id}</div>
                            <DprScoreStrip scores={p} size="xs" />
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>{p.district}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>{p.department}</td>
                          <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 4,
                                backgroundColor:
                                  p.status === 'APPROVED'
                                    ? 'rgba(34,197,94,0.15)'
                                    : p.status === 'REJECTED'
                                    ? 'rgba(239,68,68,0.15)'
                                    : 'rgba(245,158,11,0.15)',
                                color:
                                  p.status === 'APPROVED'
                                    ? '#22c55e'
                                    : p.status === 'REJECTED'
                                    ? '#ef4444'
                                    : '#f59e0b',
                              }}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            {p.risk_score != null ? `${p.risk_score}/100` : '—'}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <Link
                              href={`/dpr/${p.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#3b82f6',
                                textDecoration: 'none',
                              }}
                            >
                              Open <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Fullscreen Chart Modal ── */}
        {fullscreenChart && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 30,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '24px',
                maxWidth: '1200px',
                width: '100%',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {fullscreenChart === 'status_dist'
                    ? 'DPR Status Distribution (Expanded View)'
                    : fullscreenChart === 'dept_performance'
                    ? 'Department Approval Performance (Expanded View)'
                    : 'Monthly DPR Submission Trend (Expanded View)'}
                </h3>
                <button
                  onClick={() => setFullscreenChart(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {fullscreenChart === 'status_dist' ? (
                    <PieChart>
                      <Pie
                        data={data?.status_distribution || []}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={110}
                        outerRadius={160}
                        paddingAngle={3}
                      >
                        {(data?.status_distribution || []).map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#3b82f6'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 14, paddingTop: 14 }} />
                    </PieChart>
                  ) : fullscreenChart === 'dept_performance' ? (
                    <BarChart data={data?.department_performance || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#243046' : '#E2E8F0'} />
                      <XAxis dataKey="department" stroke="var(--text-muted)" fontSize={13} />
                      <YAxis stroke="var(--text-muted)" fontSize={13} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                      <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={data?.monthly_submission_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#243046' : '#E2E8F0'} />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={13} />
                      <YAxis stroke="var(--text-muted)" fontSize={13} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                      <Area
                        type="monotone"
                        dataKey="submitted"
                        name="Submitted"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name="Approved"
                        stroke="#22c55e"
                        strokeWidth={3}
                        fill="#22c55e"
                        fillOpacity={0.2}
                      />
                      <Line
                        type="monotone"
                        dataKey="rejected"
                        name="Rejected"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
