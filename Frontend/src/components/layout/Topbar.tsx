// TOPLINE

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import {
  fetchGlobalNotifications, markAllNotificationsRead, markSingleNotificationRead,
  GlobalNotification
} from '@/lib/api';
import {
  Bell, Search, RefreshCw, CheckCircle, XCircle, Clock,
  FileText, Brain, MessageSquare, ShieldAlert, Check, CheckCheck,
  ChevronRight, Sparkles, Filter, Plus, Upload, Moon, Sun, User,
  ArrowLeft
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
    return <FileText size={14} color="#3b82f6" />;
  }
  if (evt.includes('ai') || evt.includes('assessment')) {
    return <Brain size={14} color="#8b5cf6" />;
  }
  if (msg.includes('approved')) {
    return <CheckCircle size={14} color="#22c55e" />;
  }
  if (msg.includes('rejected')) {
    return <XCircle size={14} color="#ef4444" />;
  }
  if (evt.includes('comment') || evt.includes('reply')) {
    return <MessageSquare size={14} color="#f59e0b" />;
  }
  if (evt.includes('risk') || msg.includes('risk')) {
    return <ShieldAlert size={14} color="#ef4444" />;
  }
  return <Clock size={14} color="#06b6d4" />;
}

export function Topbar({ title, subtitle, actions, showBackButton = true, backUrl, breadcrumbs: customBreadcrumbs }: TopbarProps) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname() || '';

  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  return (
    <div className="topbar sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      <div className="topbar-left flex items-center gap-3">
        {/* Universal Back Button */}
        {showBackButton && !isHomeDashboard && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Return to previous page (Preserves filters &amp; state)"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div>
          {/* Breadcrumbs Navigation */}
          {breadcrumbs.length > 1 && (
            <nav className="flex items-center gap-1 text-[10.5px] text-slate-400 font-medium mb-0.5 flex-wrap">
              {breadcrumbs.map((bc, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-blue-400 transition-colors">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-slate-300 font-semibold">{bc.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <span className="topbar-title text-lg font-extrabold text-white tracking-tight">{title}</span>
          </div>
          {subtitle && <span className="topbar-subtitle text-xs text-slate-400 block">{subtitle}</span>}
        </div>
      </div>

      <div className="topbar-right flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Global search DPRs, Users..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearchKeyDown}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 placeholder:text-slate-500"
          />
        </div>

        {/* Quick Action (+ Upload DPR) */}
        <Link
          href="/dpr/upload"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload DPR</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          title="Toggle Theme"
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* ── Interactive Notification Center Bell ── */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="topbar-btn"
            style={{
              position: 'relative',
              background: isOpen ? 'rgba(6,182,212,0.15)' : undefined,
              borderColor: isOpen ? 'rgba(6,182,212,0.3)' : undefined,
              color: isOpen ? '#22d3ee' : undefined,
            }}
            title="Notifications Center"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: 8,
                background: '#ef4444', color: 'white',
                fontSize: 9.5, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', border: '2px solid #0f172a',
                boxShadow: '0 0 8px rgba(239,68,68,0.6)'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* ── Dropdown Panel ── */}
          {isOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 10,
              width: 360, maxHeight: 480, borderRadius: 14,
              background: '#0f172a', border: '1px solid rgba(6,182,212,0.25)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)', zIndex: 9999,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              backdropFilter: 'blur(16px)',
              animation: 'fadeIn 0.15s ease'
            }}>
              {/* Dropdown Header */}
              <div style={{
                padding: '12px 16px', background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.1))',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={15} color="#22d3ee" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#22d3ee', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: filter === 'all' ? 'rgba(6,182,212,0.2)' : 'transparent',
                    color: filter === 'all' ? '#22d3ee' : 'var(--text-muted)'
                  }}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: filter === 'unread' ? 'rgba(6,182,212,0.2)' : 'transparent',
                    color: filter === 'unread' ? '#22d3ee' : 'var(--text-muted)'
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
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: n.is_read ? 'transparent' : 'rgba(6,182,212,0.06)',
                        cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(6,182,212,0.06)')}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
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
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', flexShrink: 0, marginTop: 6 }} />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <Link
                  href="/application-status"
                  onClick={() => setIsOpen(false)}
                  style={{ fontSize: 11, color: '#22d3ee', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  View All Application Statuses <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button className="topbar-btn" onClick={loadNotifs} title="Refresh Notifications">
          <RefreshCw size={14} />
        </button>

        {actions}
      </div>
    </div>
  );
}
