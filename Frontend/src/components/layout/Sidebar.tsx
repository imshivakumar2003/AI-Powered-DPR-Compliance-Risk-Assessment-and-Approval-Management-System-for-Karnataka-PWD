// TOPLINE
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import {
  LayoutDashboard, FileText, Upload, BarChart3, Map,
  Settings, Users, ShieldAlert, CheckCircle, LogOut,
  Lightbulb, BookOpen, ClipboardList, Send, Eye, Sparkles, ClipboardCheck,
} from 'lucide-react';

// ── Nav per role ──
const ADMIN_NAV = [
  {
    section: 'Main',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/queue', label: 'DPR Queue', icon: FileText, badge: '42', badgeColor: 'amber' },
      { href: '/dpr/upload', label: 'Upload DPR', icon: Upload, badge: null },
      { href: '/dpr-guide', label: 'DPR Guide', icon: BookOpen, badge: 'New', badgeColor: 'green' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
      { href: '/ai-suggestions', label: 'AI Suggestions', icon: Sparkles, badge: null },
      { href: '/recommendations', label: 'Recommendations', icon: Lightbulb, badge: '10', badgeColor: 'amber' },
      { href: '/risk-map', label: 'Risk Map', icon: Map, badge: null },
      { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert, badge: '18', badgeColor: 'red' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { href: '/approvals', label: 'Approvals', icon: CheckCircle, badge: '7', badgeColor: 'amber' },
      { href: '/users', label: 'User Management', icon: Users, badge: null },
      { href: '/settings', label: 'Settings', icon: Settings, badge: null },
    ],
  },
];

const REVIEWER_NAV = [
  {
    section: 'My State',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/queue', label: 'DPRs for Review', icon: FileText, badge: null },
      { href: '/approvals', label: 'My Approvals', icon: CheckCircle, badge: '3', badgeColor: 'amber' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
      { href: '/ai-suggestions', label: 'AI Suggestions', icon: Sparkles, badge: null },
      { href: '/recommendations', label: 'Recommendations', icon: Lightbulb, badge: null },
      { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert, badge: null },
    ],
  },
  {
    section: 'Reference',
    items: [
      { href: '/dpr-guide', label: 'DPR Guide', icon: BookOpen, badge: null },
      { href: '/settings', label: 'Settings', icon: Settings, badge: null },
    ],
  },
];

const SUBMITTER_NAV = [
  {
    section: 'Dashboard',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/upload', label: 'Upload DPR', icon: Send, badge: null },
      { href: '/dpr/queue', label: 'My DPRs', icon: ClipboardList, badge: null },
      { href: '/application-status', label: 'Application Status', icon: ClipboardCheck, badge: null },
    ],
  },
  {
    section: 'Reference',
    items: [
      { href: '/dpr-guide', label: 'DPR Guide', icon: BookOpen, badge: 'New', badgeColor: 'green' },
      { href: '/recommendations', label: 'AI Suggestions', icon: Lightbulb, badge: null },
      { href: '/settings', label: 'Settings', icon: Settings, badge: null },
    ],
  },
];

const VIEWER_NAV = [
  {
    section: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/queue', label: 'DPR Queue', icon: Eye, badge: null },
    ],
  },
  {
    section: 'Insights',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
      { href: '/risk-map', label: 'Risk Map', icon: Map, badge: null },
    ],
  },
];

function getNav(role: string) {
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const navItems = getNav(user.role);
  const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS['viewer'];
  const initials = user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

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
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                  <Icon className="sidebar-item-icon" size={17} />
                  {item.label}
                  {item.badge && (
                    <span className={`sidebar-badge ${item.badgeColor === 'red' ? 'red' : ''}`}>
                      {item.badge}
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
          <div onClick={logout} title="Logout" style={{ marginLeft: 'auto', flexShrink: 0, cursor: 'pointer', padding: 4 }}>
            <LogOut size={15} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
