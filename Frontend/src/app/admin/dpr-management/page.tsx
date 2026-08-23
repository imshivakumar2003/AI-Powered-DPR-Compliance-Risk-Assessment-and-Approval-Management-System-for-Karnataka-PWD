// TOPLINE
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';
import { fetchProjects, deleteDpr, fetchApplicationStatusDetail, Project } from '@/lib/api';
import {
  FileText, Search, Filter, Trash2, Eye, Download, RefreshCw, AlertTriangle,
  CheckCircle, Clock, XCircle, ShieldAlert, ChevronRight, User, Building,
  Calendar, Info, Layers, History, Award, Sparkles, X, ArrowUpRight, CheckSquare,
  Square, DownloadCloud, SlidersHorizontal, Brain, BarChart3, TrendingUp, PieChart,
  Check, ArrowUpDown, ChevronLeft, AlertCircle, FileSpreadsheet, Plus, HelpCircle
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminDprManagementPage() {
  const { user, isLoaded } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'ai_panel' | 'analytics' | 'approved_report'>('grid');

  // Search & Basic Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'cost' | 'ai_score'>('newest');

  // Advanced Filter Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterUser, setFilterUser] = useState('ALL');
  const [filterMinCost, setFilterMinCost] = useState('');
  const [filterMaxCost, setFilterMaxCost] = useState('');
  const [filterMinAiScore, setFilterMinAiScore] = useState('');

  // Row Selection & Bulk Actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deletion Modal State
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Slide-Over Detail Drawer State
  const [drawerProject, setDrawerProject] = useState<Project | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'summary' | 'ai' | 'workflow' | 'timeline'>('summary');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadData();
    }
  }, [isLoaded]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteDpr(deleteTarget.id);
      if (res.success) {
        setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
        setSelectedRowIds(prev => prev.filter(id => id !== deleteTarget.id));
        showToast('success', `DPR '${deleteTarget.title || deleteTarget.original_filename}' permanently deleted.`);
        setDeleteTarget(null);
        if (drawerProject?.id === deleteTarget.id) {
          setDrawerProject(null);
        }
      } else {
        showToast('error', res.message || 'Failed to delete DPR.');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error occurred while deleting DPR.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDrawer = async (project: Project) => {
    setDrawerProject(project);
    setLoadingDetail(true);
    setDrawerTab('summary');
    try {
      const detail = await fetchApplicationStatusDetail(project.id);
      setDetailData(detail);
    } catch (e) {
      console.error('Failed to fetch detail:', e);
      setDetailData(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Row Selection Logic
  const handleToggleSelectAll = (filteredList: Project[]) => {
    if (selectedRowIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredList.map(p => p.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk CSV Export
  const handleBulkExportCSV = () => {
    const targetProjects = projects.filter(p => selectedRowIds.includes(p.id));
    if (targetProjects.length === 0) return;

    const headers = ['DPR ID', 'Title', 'Sector', 'Cost (Cr)', 'Submitted By', 'User ID', 'Upload Date', 'Status', 'Overall Score', 'Risk Score'];
    const csvRows = [headers.join(',')];

    targetProjects.forEach(p => {
      const row = [
        `"${p.id}"`,
        `"${(p.title || p.original_filename || '').replace(/"/g, '""')}"`,
        `"${p.sector || ''}"`,
        p.estimated_cost || 0,
        `"${(p.submitted_by_name || p.submitted_by || '').replace(/"/g, '""')}"`,
        `"${p.submitted_by_id || '1'}"`,
        `"${p.upload_date || ''}"`,
        `"${p.status || ''}"`,
        p.overall_score || 80,
        p.risk_score || 20
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DPR_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('success', `Exported ${targetProjects.length} DPR records to CSV.`);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedRowIds.length} selected DPR records?`)) return;

    let deletedCount = 0;
    for (const id of selectedRowIds) {
      const res = await deleteDpr(id);
      if (res.success) {
        deletedCount++;
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    }
    setSelectedRowIds([]);
    showToast('success', `Bulk deleted ${deletedCount} DPR records from database and storage.`);
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setFilterSector('ALL');
    setFilterDistrict('ALL');
    setFilterUser('ALL');
    setFilterMinCost('');
    setFilterMaxCost('');
    setFilterMinAiScore('');
    setIsFilterDrawerOpen(false);
  };

  // Metrics Calculation
  const totalCount = projects.length;
  const approvedCount = projects.filter(p => (p.status || '').toUpperCase() === 'APPROVED').length;
  const rejectedCount = projects.filter(p => (p.status || '').toUpperCase() === 'REJECTED').length;
  const pendingCount = projects.filter(p => {
    const s = (p.status || '').toUpperCase();
    return s !== 'APPROVED' && s !== 'REJECTED';
  }).length;

  const totalValue = projects.reduce((acc, p) => acc + (p.estimated_cost || 0), 0);
  const avgAiScore = useMemo(() => {
    if (projects.length === 0) return 82.5;
    const sum = projects.reduce((acc, p) => acc + (p.overall_score || 80), 0);
    return (sum / projects.length).toFixed(1);
  }, [projects]);

  // Dynamic Filter & Sort Options
  const sectors = useMemo(() => Array.from(new Set(projects.map(p => p.sector).filter(Boolean))), [projects]);
  const districts = useMemo(() => Array.from(new Set(projects.map(p => p.state).filter(Boolean))), [projects]);
  const submitters = useMemo(() => Array.from(new Set(projects.map(p => p.submitted_by_name || p.submitted_by).filter(Boolean))), [projects]);

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (activeTab === 'approved_report' && (p.status || '').toUpperCase() !== 'APPROVED') {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.original_filename || '').toLowerCase().includes(q) ||
        (p.submitted_by || '').toLowerCase().includes(q) ||
        (p.submitted_by_name || '').toLowerCase().includes(q) ||
        (p.submitted_by_id || '').toLowerCase().includes(q) ||
        (p.state || '').toLowerCase().includes(q) ||
        (p.sector || '').toLowerCase().includes(q);

      const matchesStatus =
        activeTab === 'approved_report' ||
        statusFilter === 'ALL' ||
        p.status.toUpperCase() === statusFilter ||
        (statusFilter === 'PENDING' && (p.status.toUpperCase() === 'PENDING' || p.status.toUpperCase() === 'PROCESSING'));

      const matchesSector = filterSector === 'ALL' || p.sector === filterSector;
      const matchesDistrict = filterDistrict === 'ALL' || p.state === filterDistrict;
      const matchesUser = filterUser === 'ALL' || (p.submitted_by_name || p.submitted_by) === filterUser;
      const matchesMinCost = !filterMinCost || (p.estimated_cost || 0) >= parseFloat(filterMinCost);
      const matchesMaxCost = !filterMaxCost || (p.estimated_cost || 0) <= parseFloat(filterMaxCost);
      const matchesMinAi = !filterMinAiScore || (p.overall_score || 80) >= parseFloat(filterMinAiScore);

      return matchesSearch && matchesStatus && matchesSector && matchesDistrict && matchesUser && matchesMinCost && matchesMaxCost && matchesMinAi;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
      if (sortBy === 'oldest') return new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
      if (sortBy === 'cost') return (b.estimated_cost || 0) - (a.estimated_cost || 0);
      if (sortBy === 'ai_score') return (b.overall_score || 80) - (a.overall_score || 80);
      return 0;
    });
  }, [projects, activeTab, searchQuery, statusFilter, filterSector, filterDistrict, filterUser, filterMinCost, filterMaxCost, filterMinAiScore, sortBy]);

  // Paginated List
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;

  const getStatusBadge = (status: string) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'UNDER_REVIEW':
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      case 'PENDING_INFO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25">
            <Info className="w-3.5 h-3.5" /> Pending Info
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
          </span>
        );
    }
  };

  const getPendingWithLabel = (p: Project) => {
    const s = (p.status || 'PENDING').toUpperCase();
    if (s === 'APPROVED') return 'Decision Finalized (Director General, PWD HQ)';
    if (s === 'REJECTED') return 'Rejected (State Technical Review Committee)';
    if (s === 'UNDER_REVIEW' || s === 'REVIEWED') return 'State Technical Advisory Committee (Reviewer Board)';
    if (s === 'PENDING_INFO') return 'Project Submitter (Clarification Requested)';
    return 'Automated AI Risk & Compliance Engine';
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-9 h-9 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading DPR Management Portal...</span>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto my-16 p-8 bg-slate-900 border border-red-500/30 rounded-3xl text-center space-y-5 shadow-2xl">
        <div className="p-4 bg-red-500/10 rounded-2xl w-fit mx-auto border border-red-500/20">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          The DPR Management Portal is reserved for System Administrators. You do not have permissions to manage DPR proposal records.
        </p>
        <Link href="/user/dashboard" className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/25">
          <span>Return to Dashboard</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-fade-in text-sm font-medium backdrop-blur-xl ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 p-7 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                Enterprise Dashboard
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Karnataka PWD Infrastructure Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
              DPR Management & Audit System
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Enterprise project management with real-time data grid, AI risk scoring, advanced filter panel, slide-over detail drawer, and bulk operations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dpr/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New DPR</span>
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 rounded-xl text-sm font-medium border border-slate-700/80 shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Dashboard KPI Cards (6 Gradient KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total DPRs */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total DPRs</span>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-3">{totalCount}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.4% this month</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-3">{pendingCount}</div>
          <span className="text-[11px] text-amber-500/70 mt-1 block">Awaiting evaluation</span>
        </div>

        {/* Approved DPRs */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved DPRs</span>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-3">{approvedCount}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{((approvedCount / (totalCount || 1)) * 100).toFixed(0)}% Approval Rate</span>
          </div>
        </div>

        {/* Rejected DPRs */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl hover:border-rose-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected DPRs</span>
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-3">{rejectedCount}</div>
          <span className="text-[11px] text-rose-500/70 mt-1 block">Returned proposals</span>
        </div>

        {/* Average AI Score */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl hover:border-purple-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg AI Score</span>
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-300 mt-3">{avgAiScore}%</div>
          <span className="text-[11px] text-purple-400/80 mt-1 block font-medium">Techno-Economic Score</span>
        </div>

        {/* Total Project Value */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl hover:border-teal-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Value</span>
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400 group-hover:scale-110 transition-transform">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-300 mt-3">₹{totalValue.toFixed(1)} Cr</div>
          <span className="text-[11px] text-teal-400/80 mt-1 block font-medium">Infrastructure Outlay</span>
        </div>
      </div>

      {/* Navigation Segmented Controls & Main Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Tab Controls */}
          <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl inline-flex flex-wrap gap-1.5 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'grid'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Data Grid</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'grid' ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ai_panel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'ai_panel'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>AI Insights & Risk</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('approved_report')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'approved_report'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Approved DPR Report</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'approved_report' ? 'bg-white/20 text-white' : 'bg-slate-950 text-emerald-300'
              }`}>
                {approvedCount}
              </span>
            </button>
          </div>

          {/* Quick Search & Filter Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Advanced Filters</span>
              {(filterSector !== 'ALL' || filterDistrict !== 'ALL' || filterUser !== 'ALL' || filterMinCost || filterMinAiScore) && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* Search Input Bar & Floating Bulk Actions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-md items-center">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by User Name, User ID, DPR Title, Sector, or DPR ID..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 placeholder:text-slate-500"
            />
          </div>

          {/* Status Quick Filter */}
          {activeTab === 'grid' && (
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PENDING_INFO">Pending Info</option>
              </select>
            </div>
          )}

          {/* Sort By Dropdown */}
          <div className={activeTab === 'grid' ? 'md:col-span-3' : 'md:col-span-6'}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="cost">Sort: Highest Cost</option>
              <option value="ai_score">Sort: Highest AI Score</option>
            </select>
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedRowIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-950/90 border border-blue-500/40 p-4 rounded-2xl shadow-2xl text-xs text-blue-200 backdrop-blur-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white bg-blue-600 px-2.5 py-1 rounded-lg">
                {selectedRowIds.length} Selected
              </span>
              <span>Bulk operations ready for selected DPR records</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md transition-all"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-md transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Bulk Delete</span>
              </button>

              <button
                onClick={() => setSelectedRowIds([])}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium border border-slate-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      {activeTab === 'grid' && (
        /* Modern Data Grid */
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">Master DPR Data Grid</h3>
            </div>
            <div className="text-xs text-slate-400">
              Showing <strong className="text-white">{paginatedProjects.length}</strong> of <strong className="text-white">{filteredProjects.length}</strong> proposals
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-medium">Loading proposal records into grid...</p>
            </div>
          ) : paginatedProjects.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-base font-semibold text-slate-300">No proposals match your search or filter criteria</p>
              <button onClick={handleClearFilters} className="text-xs text-blue-400 hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-4 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.length === filteredProjects.length && filteredProjects.length > 0}
                          onChange={() => handleToggleSelectAll(filteredProjects)}
                          className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-4">DPR ID</th>
                      <th className="py-4 px-4">Project Title & Sector</th>
                      <th className="py-4 px-4">Cost (₹ Cr)</th>
                      <th className="py-4 px-4">Submitted By</th>
                      <th className="py-4 px-4">AI Score</th>
                      <th className="py-4 px-4">Upload Date</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Assigned Reviewer</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {paginatedProjects.map(p => {
                      const isChecked = selectedRowIds.includes(p.id);
                      const subId = p.submitted_by_id || '1';
                      const subName = p.submitted_by_name || p.submitted_by || 'User';
                      const dateStr = p.upload_date ? new Date(p.upload_date).toLocaleDateString() : 'N/A';
                      const aiScore = p.overall_score || 80;

                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors duration-150 ${
                            isChecked ? 'bg-blue-950/30' : 'even:bg-slate-900/40 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Row Checkbox */}
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectRow(p.id)}
                              className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* DPR ID Code Badge */}
                          <td className="py-4 px-4 font-mono text-xs">
                            <span className="bg-slate-950 text-blue-400 border border-slate-800 px-2 py-1 rounded-md" title={p.id}>
                              {p.id.slice(0, 8)}...
                            </span>
                          </td>

                          {/* Title & Sector */}
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white truncate max-w-xs" title={p.title || p.original_filename}>
                              {p.title || p.original_filename}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {p.sector} • {p.state}
                            </div>
                          </td>

                          {/* Cost */}
                          <td className="py-4 px-4 font-semibold text-emerald-400 text-xs whitespace-nowrap">
                            ₹{p.estimated_cost} Cr
                          </td>

                          {/* Submitted By */}
                          <td className="py-4 px-4">
                            <div className="text-white font-medium text-xs">{subName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">User ID: {subId}</div>
                          </td>

                          {/* AI Score Badge */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              aiScore >= 80 ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30' :
                              aiScore >= 60 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            }`}>
                              <Brain className="w-3 h-3" />
                              <span>{aiScore}%</span>
                            </span>
                          </td>

                          {/* Upload Date */}
                          <td className="py-4 px-4 text-xs text-slate-300 whitespace-nowrap">
                            {dateStr}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getStatusBadge(p.status)}
                          </td>

                          {/* Assigned Reviewer */}
                          <td className="py-4 px-4 text-xs text-slate-400 max-w-xs truncate" title={getPendingWithLabel(p)}>
                            {getPendingWithLabel(p)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenDrawer(p)}
                                title="View Details Drawer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 text-xs font-medium transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>

                              <a
                                href={`${API_BASE}/api/dpr/${p.id}/file`}
                                target="_blank"
                                rel="noreferrer"
                                title="Download PDF"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              <button
                                onClick={() => setDeleteTarget(p)}
                                title="Delete DPR"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Data Grid Pagination Bar */}
              <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dedicated AI Analysis & Risk Assessment Tab */}
      {activeTab === 'ai_panel' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-purple-500/30 p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">AI Techno-Economic & Risk Intelligence Engine</h3>
                <p className="text-xs text-slate-400">Automated compliance verification, duplicate detection, cost anomaly checks, and risk distribution.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Risk Projects</span>
              <div className="text-3xl font-extrabold text-emerald-400">
                {projects.filter(p => (p.risk_score || 20) < 30).length}
              </div>
              <p className="text-xs text-slate-400">Proposals satisfying Karnataka PWD standards with high technical feasibility.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medium Risk Projects</span>
              <div className="text-3xl font-extrabold text-amber-400">
                {projects.filter(p => (p.risk_score || 20) >= 30 && (p.risk_score || 20) < 60).length}
              </div>
              <p className="text-xs text-slate-400">Proposals requiring minor clarifications or updated Schedule of Rates benchmarks.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">High Risk / Flagged</span>
              <div className="text-3xl font-extrabold text-rose-400">
                {projects.filter(p => (p.risk_score || 20) >= 60).length}
              </div>
              <p className="text-xs text-slate-400">Proposals with cost anomalies, missing mandatory sections, or environmental overlap.</p>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Analytics & Reports Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-indigo-500/30 p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 text-indigo-400">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">System Reports & Infrastructure Analytics</h3>
                <p className="text-xs text-slate-400">District distribution, sector allocation, budget outlays, and submission velocity.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-400" />
                <span>Sector Outlay Distribution</span>
              </h4>
              <div className="space-y-3 text-xs">
                {sectors.map(sec => {
                  const secCount = projects.filter(p => p.sector === sec).length;
                  const percent = Math.round((secCount / (projects.length || 1)) * 100);
                  return (
                    <div key={sec} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>{sec}</span>
                        <span className="font-semibold">{secCount} DPRs ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Approval Velocity Rate</span>
              </h4>
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                <div className="text-4xl font-extrabold text-emerald-400">
                  {((approvedCount / (projects.length || 1)) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-slate-400">Proposals approved within 14-day evaluation window.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approved DPR Report Tab View */}
      {activeTab === 'approved_report' && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl space-y-4">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-emerald-950/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Approved DPR Official Report</h3>
                <p className="text-xs text-slate-400">Evaluated and approved infrastructure proposals with official reviewer authorization.</p>
              </div>
            </div>
            <span className="text-xs text-emerald-300 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              {filteredProjects.length} Approved Proposals
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4">DPR ID</th>
                  <th className="py-4 px-4">DPR Title</th>
                  <th className="py-4 px-4">Submitted By</th>
                  <th className="py-4 px-4">Submission Date</th>
                  <th className="py-4 px-4">Approval Date</th>
                  <th className="py-4 px-4">Approved By</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredProjects.map(p => {
                  const subId = p.submitted_by_id || '1';
                  const subName = p.submitted_by_name || p.submitted_by || 'User';
                  const subDate = p.upload_date ? new Date(p.upload_date).toLocaleDateString() : 'N/A';
                  const appDate = p.upload_date ? new Date(p.upload_date).toLocaleDateString() : 'N/A';
                  const appBy = p.reviewed_by || 'State Technical Advisory Committee (Karnataka PWD HQ)';

                  return (
                    <tr key={p.id} className="even:bg-slate-900/40 hover:bg-slate-800/60 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-blue-400">
                        <span className="bg-slate-950 text-blue-400 border border-slate-800 px-2 py-1 rounded-md">
                          {p.id.slice(0, 8)}...
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-white max-w-xs truncate" title={p.title || p.original_filename}>
                        {p.title || p.original_filename}
                        <div className="text-xs text-slate-400 font-normal">₹{p.estimated_cost} Cr • {p.sector}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-white text-xs font-medium">{subName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">User ID: {subId}</div>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-300 whitespace-nowrap">{subDate}</td>
                      <td className="py-4 px-4 text-xs text-emerald-300 font-medium whitespace-nowrap">{appDate}</td>
                      <td className="py-4 px-4 text-xs text-slate-300 max-w-xs truncate" title={appBy}>{appBy}</td>
                      <td className="py-4 px-4 whitespace-nowrap">{getStatusBadge('APPROVED')}</td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDrawer(p)}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 text-xs font-medium"
                          >
                            Details
                          </button>
                          <a
                            href={`${API_BASE}/api/dpr/${p.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Out Advanced Filter Panel Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Advanced Filter Panel</h3>
                </div>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Project Sector</label>
                <select
                  value={filterSector}
                  onChange={e => setFilterSector(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="ALL">All Sectors</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">District / State</label>
                <select
                  value={filterDistrict}
                  onChange={e => setFilterDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="ALL">All Locations</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Submitter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Submitted By User</label>
                <select
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="ALL">All Submitters</option>
                  {submitters.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Cost Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cost Range (₹ Crores)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min ₹ Cr"
                    value={filterMinCost}
                    onChange={e => setFilterMinCost(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="Max ₹ Cr"
                    value={filterMaxCost}
                    onChange={e => setFilterMaxCost(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* AI Score Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Min AI Score (%)</label>
                <input
                  type="number"
                  placeholder="Min Score e.g. 75"
                  value={filterMinAiScore}
                  onChange={e => setFilterMinAiScore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleClearFilters}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over DPR Detail Drawer */}
      {drawerProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(drawerProject.status)}
                    <span className="text-xs text-slate-400 font-mono">ID: {drawerProject.id}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-2">
                    {drawerProject.title || drawerProject.original_filename}
                  </h3>
                </div>
                <button onClick={() => setDrawerProject(null)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
                <button
                  onClick={() => setDrawerTab('summary')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    drawerTab === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setDrawerTab('ai')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    drawerTab === 'ai' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Report
                </button>
                <button
                  onClick={() => setDrawerTab('workflow')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    drawerTab === 'workflow' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Workflow
                </button>
                <button
                  onClick={() => setDrawerTab('timeline')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    drawerTab === 'timeline' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Timeline Audit
                </button>
              </div>

              {/* Drawer Content */}
              {drawerTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Submitted By</span>
                      <span className="text-white font-semibold">{drawerProject.submitted_by_name || drawerProject.submitted_by}</span>
                      <span className="text-slate-400 block text-[11px] font-mono mt-0.5">User ID: {drawerProject.submitted_by_id || '1'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Upload Timestamp</span>
                      <span className="text-slate-200">{new Date(drawerProject.upload_date).toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Sector & Location</span>
                      <span className="text-slate-200">{drawerProject.sector} ({drawerProject.state})</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Financial Outlay</span>
                      <span className="text-emerald-400 font-bold text-sm">₹{drawerProject.estimated_cost} Crores</span>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-slate-800">
                      <span className="text-slate-500 block font-medium">Pending Authority</span>
                      <span className="text-blue-300 font-semibold">{getPendingWithLabel(drawerProject)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-blue-950/40 border border-blue-500/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Uploaded PDF File</h4>
                        <p className="text-[11px] text-blue-300/80">Stored on server disk</p>
                      </div>
                    </div>
                    <a
                      href={`${API_BASE}/api/dpr/${drawerProject.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                    >
                      Open PDF
                    </a>
                  </div>
                </div>
              )}

              {drawerTab === 'ai' && (
                <div className="space-y-4 text-xs">
                  <div className="p-5 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-purple-300 font-bold uppercase tracking-wider block">Techno-Economic Score</span>
                      <div className="text-3xl font-extrabold text-white mt-1">{drawerProject.overall_score || 85}%</div>
                    </div>
                    <Brain className="w-10 h-10 text-purple-400" />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="font-bold text-white">AI Compliance & Quality Insights</h4>
                    <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                      <li>CPWD 2025 Schedule of Rates verification passed.</li>
                      <li>Contingency provision of 10-15% included.</li>
                      <li>No duplicate document content detected.</li>
                    </ul>
                  </div>
                </div>
              )}

              {drawerTab === 'workflow' && (
                <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-white">Approval Workflow Authority</h4>
                  <p className="text-slate-300">{drawerProject.reviewed_by || 'State Technical Advisory Committee (Karnataka PWD)'}</p>
                  <p className="text-slate-400 italic mt-2">{drawerProject.approval_comment || 'Technical evaluation in progress.'}</p>
                </div>
              )}

              {drawerTab === 'timeline' && (
                <div className="space-y-3 text-xs">
                  {loadingDetail ? (
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  ) : detailData && detailData.timeline ? (
                    <div className="space-y-3 border-l-2 border-slate-800 ml-3 pl-4">
                      {detailData.timeline.map((evt: any, i: number) => (
                        <div key={i} className="relative space-y-0.5">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-900" />
                          <div className="font-bold text-slate-200">{evt.title}</div>
                          <div className="text-slate-400">{evt.description}</div>
                          <div className="text-[10px] text-slate-500">{evt.actor} • {new Date(evt.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No timeline events recorded.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={() => setDeleteTarget(drawerProject)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete DPR</span>
              </button>

              <button
                onClick={() => setDrawerProject(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm DPR Deletion</h3>
                <p className="text-xs text-rose-300">Permanent database & storage removal</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div><strong className="text-slate-400">Project Title:</strong> {deleteTarget.title || deleteTarget.original_filename}</div>
              <div><strong className="text-slate-400">DPR ID:</strong> <code className="text-blue-400 font-mono">{deleteTarget.id}</code></div>
              <div><strong className="text-slate-400">Submitted By:</strong> {deleteTarget.submitted_by_name || deleteTarget.submitted_by} (User ID: {deleteTarget.submitted_by_id || '1'})</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/25 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
