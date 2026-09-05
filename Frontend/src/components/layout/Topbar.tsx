// TOPLINE

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { useTheme } from '@/lib/ThemeContext';
import {
  fetchGlobalNotifications, markAllNotificationsRead, markSingleNotificationRead,
  GlobalNotification
} from '@/lib/api';
import {
  Bell, Search, RefreshCw, CheckCircle, XCircle, Clock,
  FileText, Brain, MessageSquare, ShieldAlert, Check, CheckCheck,
  ChevronRight, Sparkles, Filter, Plus, Upload, Moon, Sun, Monitor, User,
  ArrowLeft, LogOut, Settings, ChevronDown
} from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  breadcrumbs?: BreadcrumbItem[];
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return iso.slice(0, 10);
  }
}

function notifIcon(eventType: string, message: string) {
  const evt = (eventType || '').toLowerCase();
  const msg = (message || '').toLowerCase();

  if (evt.includes('upload') || evt.includes('file')) {
    return <FileText size={14} color="var(--accent-blue)" />;
  }
  if (evt.includes('ai') || evt.includes('assessment')) {
    return <Brain size={14} color="var(--accent-purple)" />;
  }
  if (msg.includes('approved')) {
    return <CheckCircle size={14} color="var(--accent-green)" />;
  }
  if (msg.includes('rejected')) {
    return <XCircle size={14} color="var(--accent-red)" />;
  }
  if (evt.includes('comment') || evt.includes('reply')) {
    return <MessageSquare size={14} color="var(--accent-amber)" />;
  }
  if (evt.includes('risk') || msg.includes('risk')) {
    return <ShieldAlert size={14} color="var(--accent-red)" />;
  }
  return <Clock size={14} color="var(--accent-cyan)" />;
}

export function Topbar({ title, subtitle, actions, showBackButton = true, backUrl, breadcrumbs: customBreadcrumbs }: TopbarProps) {
  const { user, logout } = useUser();
  const { theme, setTheme, toggleTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname() || '';

  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadNotifs = async () => {
    try {
      const data = await fetchGlobalNotifications(user?.role || 'viewer');
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching topbar notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, [user?.role]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    setLoading(true);
    await markAllNotificationsRead(user?.role);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setLoading(false);
  };

  const handleItemClick = async (notif: GlobalNotification) => {
    if (!notif.is_read) {
      await markSingleNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
    }
    setIsOpen(false);

    if (notif.project_id) {
      router.push(`/application-status/${notif.project_id}`);
    } else {
      router.push('/application-status');
    }
  };

  const displayedNotifs = notifications.filter(n => filter === 'all' || !n.is_read);

  const handleGlobalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      router.push(`/admin/dpr-management?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  // Smart Back Navigation
  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      const defaultDashboard = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      router.push(defaultDashboard);
    }
  };

  // Auto-generate breadcrumbs if not explicitly passed
  const breadcrumbs = customBreadcrumbs || (() => {
    const crumbs: BreadcrumbItem[] = [];
    const rootHome = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    crumbs.push({ label: 'Home', href: rootHome });

    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      let accumPath = '';
      parts.forEach((p, idx) => {
        accumPath += `/${p}`;
        const isLast = idx === parts.length - 1;
        const formattedLabel = p
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        crumbs.push({
          label: formattedLabel,
          href: isLast ? undefined : accumPath
        });
      });
    }
    return crumbs;
  })();

  const isHomeDashboard = pathname === '/admin/dashboard' || pathname === '/user/dashboard' || pathname === '/';
  const initials = (user?.displayName || user?.username || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Universal Back Button */}
        {showBackButton && !isHomeDashboard && (
          <button
            onClick={handleBack}
            className="topbar-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontWeight: 600, fontSize: 12, padding: '6px 12px',
              borderRadius: 'var(--radius-md)'
            }}
            title="Return to previous page (Preserves filters & state)"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div>
          {/* Breadcrumbs Navigation */}
          {breadcrumbs.length > 1 && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2, flexWrap: 'wrap' }}>
              {breadcrumbs.map((bc, idx) => (
                <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {idx > 0 && <ChevronRight size={10} style={{ opacity: 0.5 }} />}
                  {bc.href ? (
                    <Link href={bc.href} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-blue-500">
                      {bc.label}
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{bc.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="topbar-title">{title}</span>
          </div>
          {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="topbar-right">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Global search DPRs, Users..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearchKeyDown}
            className="input-field"
            style={{
              paddingLeft: 32, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
              fontSize: 12, height: 32, borderRadius: 'var(--radius-md)'
            }}
          />
        </div>

        {/* Quick Action (+ Upload DPR) */}
        <Link
          href="/dpr/upload"
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: 12, height: 32, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Upload DPR</span>
        </Link>

        {/* ── Theme Switcher Toggle Button (Top Right) ── */}
        <button
          onClick={toggleTheme}
          title={`Current: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'} Mode. Click to switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="topbar-btn"
          style={{
            height: 32, width: 34, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            position: 'relative'
          }}
          aria-label="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={15} style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))' }} />
          ) : (
            <Moon size={15} style={{ color: '#2563eb' }} />
          )}
        </button>

        {/* ── Interactive Notification Center Bell ── */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="topbar-btn"
            style={{
              position: 'relative', height: 32, width: 34, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              background: isOpen ? 'var(--accent-blue-glow)' : undefined,
              borderColor: isOpen ? 'var(--accent-blue)' : undefined,
              color: isOpen ? 'var(--accent-blue)' : undefined,
            }}
            title="Notifications Center"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: 8,
                background: 'var(--accent-red)', color: 'white',
                fontSize: 9.5, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', border: '2px solid var(--bg-secondary)',
                boxShadow: '0 0 8px rgba(239,68,68,0.6)'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* ── Notifications Dropdown Panel ── */}
          {isOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 10,
              width: 360, maxHeight: 480, borderRadius: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              boxShadow: 'var(--dropdown-shadow)', zIndex: 9999,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              backdropFilter: 'blur(16px)',
              animation: 'fadeIn 0.15s ease'
            }}>
              {/* Dropdown Header */}
              <div style={{
                padding: '12px 16px', background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={15} color="var(--accent-blue)" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: 'var(--accent-red-glow)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div style={{ padding: '6px 12px', background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: filter === 'all' ? 'var(--accent-blue-glow)' : 'transparent',
                    color: filter === 'all' ? 'var(--accent-blue)' : 'var(--text-muted)'
                  }}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: filter === 'unread' ? 'var(--accent-blue-glow)' : 'transparent',
                    color: filter === 'unread' ? 'var(--accent-blue)' : 'var(--text-muted)'
                  }}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {displayedNotifs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                    No notifications right now.
                  </div>
                ) : (
                  displayedNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: n.is_read ? 'transparent' : 'var(--accent-blue-glow)',
                        cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--accent-blue-glow)')}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {notifIcon(n.event_type, n.message)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: n.is_read ? 500 : 700 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span>{timeAgo(n.created_at)}</span>
                          {n.district && <span>📍 {n.district}</span>}
                        </div>
                      </div>

                      {!n.is_read && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0, marginTop: 6 }} />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <Link
                  href="/application-status"
                  onClick={() => setIsOpen(false)}
                  style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  View All Application Statuses <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── User Profile & Theme Dropdown Menu ── */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="topbar-btn"
            style={{
              padding: '4px 8px', height: 32, display: 'flex', alignItems: 'center', gap: 6,
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              color: '#fff', fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {initials}
            </div>
            <span className="hidden lg:inline" style={{ fontSize: 12, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.displayName || user?.username || 'Account'}
            </span>
            <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </button>

          {isProfileOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              width: 240, borderRadius: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              boxShadow: 'var(--dropdown-shadow)', zIndex: 9999,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              animation: 'fadeIn 0.15s ease'
            }}>
              {/* User Header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.displayName || user?.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {user?.role?.replace('_', ' ')}</div>
              </div>

              {/* Theme Selector Section in Profile Menu */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                  Theme Preference
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  <button
                    onClick={() => setTheme('light')}
                    style={{
                      padding: '6px 4px', borderRadius: 8, border: `1px solid ${theme === 'light' ? 'var(--accent-blue)' : 'var(--border)'}`,
                      background: theme === 'light' ? 'var(--accent-blue-glow)' : 'var(--bg-secondary)',
                      color: theme === 'light' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer'
                    }}
                  >
                    <Sun size={13} color="#f59e0b" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    style={{
                      padding: '6px 4px', borderRadius: 8, border: `1px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--border)'}`,
                      background: theme === 'dark' ? 'var(--accent-blue-glow)' : 'var(--bg-secondary)',
                      color: theme === 'dark' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer'
                    }}
                  >
                    <Moon size={13} color="#3b82f6" />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    style={{
                      padding: '6px 4px', borderRadius: 8, border: `1px solid ${theme === 'system' ? 'var(--accent-blue)' : 'var(--border)'}`,
                      background: theme === 'system' ? 'var(--accent-blue-glow)' : 'var(--bg-secondary)',
                      color: theme === 'system' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer'
                    }}
                  >
                    <Monitor size={13} />
                    Auto
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <div style={{ padding: '6px' }}>
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none'
                  }}
                  className="hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  <Settings size={14} />
                  Settings & Appearance
                </Link>
                <button
                  onClick={() => { setIsProfileOpen(false); logout(); }}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
                  }}
                  className="hover:bg-[var(--accent-red-glow)]"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button className="topbar-btn" onClick={loadNotifs} title="Refresh Notifications" style={{ height: 32, width: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={14} />
        </button>

        {actions}
      </div>
    </div>
  );
}
