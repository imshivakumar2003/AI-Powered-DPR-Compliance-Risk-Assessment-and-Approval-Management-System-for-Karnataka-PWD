// TOPLINE

'use client';
import Link from 'next/link';
import { Bell, Search, RefreshCw } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{title}</span>
        {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
      </div>
      <div className="topbar-right">
        <button className="topbar-btn">
          <Search size={14} />
          Search DPRs...
        </button>
        <div style={{ position: 'relative' }}>
          <button className="topbar-btn">
            <Bell size={14} />
          </button>
          <span className="notif-dot" />
        </div>
        <button className="topbar-btn">
          <RefreshCw size={14} />
        </button>
        {actions}
      </div>
    </div>
  );
}
