'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Upload, BarChart3, Map,
  Settings, Users, Bell, ShieldAlert, CheckCircle, LogOut
} from 'lucide-react';

const navItems = [
  {
    section: 'Main',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      { href: '/dpr/queue', label: 'DPR Queue', icon: FileText, badge: '42', badgeColor: 'amber' },
      { href: '/dpr/upload', label: 'Upload DPR', icon: Upload, badge: null },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">M</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">DPR·AI</span>
          <span className="sidebar-logo-subtitle">MDoNER Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
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
          <div className="user-avatar">RS</div>
          <div className="user-info">
            <div className="user-name">Rajiv Sharma</div>
            <div className="user-role">MDoNER Director</div>
          </div>
          <LogOut size={15} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
