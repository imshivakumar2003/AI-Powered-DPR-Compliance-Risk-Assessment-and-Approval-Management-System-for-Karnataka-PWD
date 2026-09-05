// TOPLINE
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { useTheme } from '@/lib/ThemeContext';
import {
  fetchDashboardStats, fetchRiskAlerts, fetchRecommendations, fetchProjects
} from '@/lib/api';
import {
  LayoutDashboard, FileText, Upload, BarChart3, Map,
  Settings, Users, ShieldAlert, CheckCircle, LogOut,
  Lightbulb, BookOpen, ClipboardList, Send, Eye, Sparkles, ClipboardCheck, FolderKanban,
  Brain, Clock, Bot, Sun, Moon, AreaChart, PieChart
} from 'lucide-react';

// ── Nav per role ──
const ADMIN_NAV = [
  {
    section: 'Core Management',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/admin/dpr-management', label: 'DPR Management', icon: FolderKanban, badge: 'All', badgeColor: 'blue' },
      { href: '/admin/document-intelligence', label: 'Document Intelligence & RAG Engine', icon: Brain, badge: 'RAG', badgeColor: 'blue' },
      { href: '/admin/ai-chatbot', label: 'AI Chatbot', icon: Bot, badge: 'AI', badgeColor: 'blue' },
      { href: '/application-status', label: 'Application Status', icon: ClipboardCheck, badge: 'app_status', badgeColor: 'blue' },
      { href: '/approvals', label: 'My Approvals', icon: CheckCircle, badge: 'approvals', badgeColor: 'green' },
      { href: '/admin/visual-representation', label: 'Visual Representation', icon: AreaChart, badge: 'Live', badgeColor: 'blue' },
      { href: '/analytics', label: 'Reports', icon: BarChart3, badge: null },
      { href: '/settings', label: 'Settings', icon: Settings, badge: null },
    ],
  },
  {
    section: 'Tools & Reference',
    items: [
      { href: '/dpr/queue', label: 'Pending Reviews', icon: Clock, badge: 'queue', badgeColor: 'amber' },
      { href: '/dpr/upload', label: 'Upload DPR', icon: Upload, badge: null },
      { href: '/ai-suggestions', label: 'AI Analysis', icon: Sparkles, badge: 'AI', badgeColor: 'blue' },
      { href: '/recommendations', label: 'Recommendations', icon: Lightbulb, badge: 'recs', badgeColor: 'amber' },
      { href: '/risk-map', label: 'Risk Map', icon: Map, badge: null },
      { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert, badge: 'alerts', badgeColor: 'red' },
      { href: '/users', label: 'Users & Roles', icon: Users, badge: null },
      { href: '/admin/templates', label: 'DPR Templates', icon: FileText, badge: 'New', badgeColor: 'green' },
    ],
  },
];

const REVIEWER_NAV = [
  {
    section: 'My State',
    items: [
      { href: '/user/dashboard', label: 'User Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/queue', label: 'DPRs for Review', icon: FileText, badge: 'queue', badgeColor: 'amber' },
      { href: '/approvals', label: 'My Approvals', icon: CheckCircle, badge: 'approvals', badgeColor: 'amber' },
      { href: '/admin/visual-representation', label: 'Visual Representation', icon: AreaChart, badge: 'Live', badgeColor: 'blue' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/user/ai-chatbot', label: 'AI Chatbot', icon: Bot, badge: 'AI', badgeColor: 'blue' },
      { href: '/user/document-intelligence', label: 'Document Intelligence & RAG', icon: Brain, badge: 'RAG', badgeColor: 'blue' },
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
      { href: '/ai-suggestions', label: 'AI Suggestions', icon: Sparkles, badge: null },
      { href: '/recommendations', label: 'Recommendations', icon: Lightbulb, badge: 'recs', badgeColor: 'amber' },
      { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert, badge: 'alerts', badgeColor: 'red' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { href: '/user/templates', label: 'DPR Templates', icon: FileText, badge: 'Templates', badgeColor: 'green' },
      { href: '/dpr-guide', label: 'DPR Guide', icon: BookOpen, badge: null },
      { href: '/settings', label: 'Settings', icon: Settings, badge: null },
    ],
  },
];

const SUBMITTER_NAV = [
  {
    section: 'Dashboard',
    items: [
      { href: '/user/dashboard', label: 'User Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/user/ai-chatbot', label: 'AI Chatbot', icon: Bot, badge: 'AI', badgeColor: 'blue' },
      { href: '/user/document-intelligence', label: 'Document Intelligence & RAG', icon: Brain, badge: 'RAG', badgeColor: 'blue' },
      { href: '/dpr/upload', label: 'Upload DPR', icon: Send, badge: null },
      { href: '/dpr/queue', label: 'My DPRs', icon: ClipboardList, badge: 'queue', badgeColor: 'amber' },
      { href: '/application-status', label: 'Application Status', icon: ClipboardCheck, badge: 'app_status', badgeColor: 'blue' },
      { href: '/admin/visual-representation', label: 'Visual Representation', icon: AreaChart, badge: 'Live', badgeColor: 'blue' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { href: '/user/templates', label: 'DPR Templates', icon: FileText, badge: 'Templates', badgeColor: 'green' },
      { href: '/dpr-guide', label: 'DPR Guide', icon: BookOpen, badge: 'New', badgeColor: 'green' },
      { href: '/recommendations', label: 'AI Suggestions', icon: Lightbulb, badge: 'recs', badgeColor: 'amber' },
      { href: '/settings', label: 'Settings', icon: Settings, badge: null },
    ],
  },
];

const VIEWER_NAV = [
  {
    section: 'Overview',
    items: [
      { href: '/viewer/dashboard', label: 'Viewer Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/queue', label: 'DPR Queue', icon: Eye, badge: 'queue', badgeColor: 'amber' },
      { href: '/application-status', label: 'Application Status', icon: ClipboardCheck, badge: 'app_status', badgeColor: 'blue' },
      { href: '/admin/visual-representation', label: 'Visual Representation', icon: AreaChart, badge: 'Live', badgeColor: 'blue' },
    ],
  },
  {
    section: 'Insights & Reference',
    items: [
      { href: '/user/templates', label: 'DPR Templates', icon: FileText, badge: 'Templates', badgeColor: 'green' },
      { href: '/dpr/upload', label: 'Upload DPR', icon: Upload, badge: null },
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
      { href: '/risk-map', label: 'Risk Map', icon: Map, badge: null },
    ],
  },
];

const FULL_USER_NAV = [
  {
    section: 'Main',
    items: [
      { href: '/user/dashboard', label: 'User Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/queue', label: 'DPR Queue', icon: FileText, badge: 'queue', badgeColor: 'amber' },
      { href: '/dpr/upload', label: 'Upload DPR', icon: Upload, badge: null },
      { href: '/application-status', label: 'Application Status', icon: ClipboardCheck, badge: 'app_status', badgeColor: 'blue' },
      { href: '/approvals', label: 'Approvals', icon: CheckCircle, badge: 'approvals', badgeColor: 'amber' },
      { href: '/admin/visual-representation', label: 'Visual Representation', icon: AreaChart, badge: 'Live', badgeColor: 'blue' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/user/ai-chatbot', label: 'AI Chatbot', icon: Bot, badge: 'AI', badgeColor: 'blue' },
      { href: '/user/document-intelligence', label: 'Document Intelligence & RAG', icon: Brain, badge: 'RAG', badgeColor: 'blue' },
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
      { href: '/ai-suggestions', label: 'AI Suggestions', icon: Sparkles, badge: null },
      { href: '/recommendations', label: 'Recommendations', icon: Lightbulb, badge: 'recs', badgeColor: 'amber' },
      { href: '/risk-map', label: 'Risk Map', icon: Map, badge: null },
      { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert, badge: 'alerts', badgeColor: 'red' },
    ],
  },
  {
    section: 'Insights & Reference',
    items: [
      { href: '/user/templates', label: 'DPR Templates', icon: FileText, badge: 'Templates', badgeColor: 'green' },
      { href: '/dpr-guide', label: 'DPR Guide', icon: BookOpen, badge: 'New', badgeColor: 'green' },
    ],
  },
];

function getNav(role: string, username?: string) {
  const u = (username || '').toLowerCase().trim();
  if (u === 'user' || u.includes('project requester')) {
    return FULL_USER_NAV;
  }
  if (u === 'priya_sharma' || u.includes('priya')) {
    return ADMIN_NAV;
  }
  switch (role) {
    case 'admin': return ADMIN_NAV;
    case 'state_reviewer': return REVIEWER_NAV;
    case 'submitter': return SUBMITTER_NAV;
    default: return VIEWER_NAV;
  }
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Director', color: '#ef4444' },
  state_reviewer: { label: 'State Reviewer', color: '#6366f1' },
  submitter: { label: 'DPR Submitter', color: '#22c55e' },
  viewer: { label: 'Viewer', color: '#06b6d4' },
};

interface SidebarCounts {
  queue: number;
  approvals: number;
  riskAlerts: number;
  recommendations: number;
  applicationStatus: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const { toggleTheme, resolvedTheme } = useTheme();
  const navItems = getNav(user.role, user.username);
  const isFullUser = (user.username || '').toLowerCase().trim() === 'user' || (user.displayName || '').toLowerCase().includes('project requester');
  const roleInfo = isFullUser ? { label: 'Project Requester', color: '#3b82f6' } : (ROLE_LABELS[user.role] ?? ROLE_LABELS['viewer']);
  const initials = user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const [counts, setCounts] = useState<SidebarCounts>({
    queue: 0,
    approvals: 0,
    riskAlerts: 0,
    recommendations: 0,
    applicationStatus: 0,
  });

  const loadCounts = async () => {
    try {
      const [stats, alerts, recs, projects] = await Promise.all([
        fetchDashboardStats().catch(() => null),
        fetchRiskAlerts().catch(() => []),
        fetchRecommendations().catch(() => []),
        fetchProjects().catch(() => []),
      ]);

      const pendingApprovals = projects.filter(p => p.status?.toUpperCase() === 'PENDING' || p.in_approvals).length;
      const pendingAlerts = alerts.filter(a => a.status === 'Pending').length;

      setCounts({
        queue: projects.length || stats?.total_dprs || 0,
        approvals: pendingApprovals || stats?.pending_review || 0,
        riskAlerts: pendingAlerts,
        recommendations: recs.length,
        applicationStatus: projects.length || stats?.total_dprs || 0,
      });
    } catch (e) {
      console.error('Error fetching sidebar counts:', e);
    }
  };

  useEffect(() => {
    loadCounts();
    const timer = setInterval(loadCounts, 10_000);
    return () => clearInterval(timer);
  }, []);

  const getDynamicBadge = (href: string, defaultBadge: string | null, badgeColor?: string) => {
    if (defaultBadge === 'New') return { label: 'New', color: 'green' };

    switch (href) {
      case '/dpr/queue':
        return counts.queue > 0 ? { label: String(counts.queue), color: 'amber' } : null;
      case '/approvals':
        return counts.approvals > 0 ? { label: String(counts.approvals), color: 'amber' } : null;
      case '/risk-alerts':
        return counts.riskAlerts > 0 ? { label: String(counts.riskAlerts), color: 'red' } : null;
      case '/recommendations':
        return counts.recommendations > 0 ? { label: String(counts.recommendations), color: 'amber' } : null;
      case '/application-status':
        return counts.applicationStatus > 0 ? { label: String(counts.applicationStatus), color: 'blue' } : null;
      default:
        return defaultBadge ? { label: defaultBadge, color: badgeColor } : null;
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">M</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">DPR·AI</span>
          <span className="sidebar-logo-subtitle">Karnataka PWD Portal</span>
        </div>
      </div>

      {/* Role Banner */}
      <div style={{
        margin: '0 10px 8px', padding: '6px 10px', borderRadius: 8,
        background: `${roleInfo.color}12`, border: `1px solid ${roleInfo.color}25`,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: roleInfo.color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: roleInfo.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {roleInfo.label}
        </span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon || LayoutDashboard;
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              const badgeInfo = getDynamicBadge(item.href, item.badge, item.badgeColor);

              return (
                <Link key={item.href} href={item.href} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                  <Icon className="sidebar-item-icon" size={17} />
                  {item.label}
                  {badgeInfo && (
                    <span className={`sidebar-badge ${badgeInfo.color === 'red' ? 'red' : badgeInfo.color === 'blue' ? 'blue' : ''}`}>
                      {badgeInfo.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${roleInfo.color}, ${roleInfo.color}99)` }}>
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{user.displayName}</div>
            <div className="user-role">{user.department ?? roleInfo.label}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
            <div
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{ cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
              className="hover:bg-[var(--bg-card-hover)]"
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={14} style={{ color: '#f59e0b' }} />
              ) : (
                <Moon size={14} style={{ color: '#2563eb' }} />
              )}
            </div>
            <div
              onClick={logout}
              title="Logout"
              style={{ cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
              className="hover:bg-[var(--accent-red-glow)]"
            >
              <LogOut size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
