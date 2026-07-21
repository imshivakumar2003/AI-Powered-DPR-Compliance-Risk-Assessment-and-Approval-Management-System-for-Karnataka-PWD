// TOPLINE
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { fetchRiskAlerts, RiskAlert } from '@/lib/api';
import Link from 'next/link';
import {
  ShieldAlert, Search, Filter, RefreshCw, ChevronDown, ChevronUp, Eye,
  AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso.slice(0, 16); }
}

function levelBadge(level: string) {
  const cfg: Record<string, { bg: string; color: string }> = {
    High:   { bg: 'rgba(239,68,68,0.14)',  color: '#ef4444' },
    Medium: { bg: 'rgba(245,158,11,0.14)', color: '#f59e0b' },
    Low:    { bg: 'rgba(34,197,94,0.14)',  color: '#22c55e' },
  };
  const c = cfg[level] || cfg.Medium;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
      padding: '3px 9px', borderRadius: 5, background: c.bg, color: c.color }}>{level} Risk</span>
  );
}

function statusBadge(status: string) {
  const isPending = status === 'Pending';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', padding: '3px 9px', borderRadius: 5,
      background: isPending ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
      color: isPending ? '#f59e0b' : '#22c55e' }}>
      {isPending ? <Clock size={10} /> : <CheckCircle size={10} />}
      {status}
    </span>
  );
}

const TYPE_CONFIG: Record<string, { color: string; emoji: string }> = {
  Budget:        { color: '#f59e0b', emoji: '💰' },
  Environmental: { color: '#22c55e', emoji: '🌿' },
  Legal:         { color: '#ef4444', emoji: '⚖️' },
  Technical:     { color: '#3b82f6', emoji: '🔧' },
  Compliance:    { color: '#8b5cf6', emoji: '📋' },
  Duplicate:     { color: '#f43f5e', emoji: '🔁' },
  Verification:  { color: '#06b6d4', emoji: '🔍' },
};

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: RiskAlert }) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[alert.type] || { color: '#3b82f6', emoji: '⚠️' };

  return (
    <div className="card" style={{ overflow: 'hidden', transition: 'box-shadow 0.2s', marginBottom: 14 }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
        cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(e => !e)}>

        {/* Left color stripe */}
        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: tc.color, flexShrink: 0, minHeight: 44 }} />

        {/* Icon */}
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tc.color}16`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {tc.emoji}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {alert.title}
            </span>
            {levelBadge(alert.level)}
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700,
              background: `${tc.color}16`, color: tc.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {alert.type}
            </span>
            {statusBadge(alert.status)}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>
            {alert.description}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              🗺️ <strong style={{ color: 'var(--text-secondary)' }}>{alert.district}</strong>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              🏗️ <span style={{ color: 'var(--text-secondary)' }}>{alert.sector}</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ⚡ Risk score: <strong style={{
                color: alert.risk_score > 70 ? '#ef4444' : alert.risk_score > 40 ? '#f59e0b' : '#22c55e'
              }}>{alert.risk_score}/100</strong>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              🪪 <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)' }}>{alert.id}</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {fmtDate(alert.created_at)}</span>
          </div>
        </div>

        {/* Expand toggle */}
        <div style={{ color: 'var(--text-muted)', flexShrink: 0, paddingTop: 4 }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(45,55,72,0.5)' }}>
          {/* DPR info */}
          <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.1)',
            borderBottom: '1px solid rgba(45,55,72,0.3)',
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📄 DPR:</span>
            <Link href={`/dpr/${alert.dpr_id}`}
              style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent-blue-light)', textDecoration: 'none' }}>
              {alert.dpr_name}
            </Link>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700,
              background: alert.dpr_status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : alert.dpr_status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              color: alert.dpr_status === 'APPROVED' ? '#22c55e' : alert.dpr_status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
              {alert.dpr_status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* AI Recommendation */}
            <div style={{ padding: '16px 20px', borderRight: '1px solid rgba(45,55,72,0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase',
                letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                🤖 AI Recommendation
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8,
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {alert.recommendation}
                </div>
              </div>
            </div>

            {/* Mitigation Action */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase',
                letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                🛡️ Suggested Mitigation Action
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8,
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {alert.mitigation}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(45,55,72,0.3)',
            display: 'flex', gap: 8 }}>
            <Link href={`/dpr/${alert.dpr_id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px',
                borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue-light)',
                fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Eye size={13} /> View DPR
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Risk Alerts Page ────────────────────────────────────────────────────

export default function RiskAlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch]         = useState('');
  const [levelFilter, setLevel]     = useState('');
  const [distFilter, setDistrict]   = useState('');
  const [typeFilter, setType]       = useState('');
  const [statusFilter, setStatus]   = useState('');

  const load = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const data = await fetchRiskAlerts();
      setAlerts(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const districts  = useMemo(() => [...new Set(alerts.map(a => a.district))].sort(), [alerts]);
  const alertTypes = useMemo(() => [...new Set(alerts.map(a => a.type))].sort(), [alerts]);

  const filtered = useMemo(() => alerts.filter(a => {
    if (levelFilter && a.level !== levelFilter)   return false;
    if (distFilter  && a.district !== distFilter) return false;
    if (typeFilter  && a.type !== typeFilter)      return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.dpr_name.toLowerCase().includes(q)
          || a.district.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    }
    return true;
  }), [alerts, levelFilter, distFilter, typeFilter, statusFilter, search]);

  const pending  = alerts.filter(a => a.status === 'Pending');
  const high     = alerts.filter(a => a.level === 'High');
  const resolved = alerts.filter(a => a.status === 'Resolved');

  if (loading) {
    return (
      <>
        <Topbar title="Risk Alerts" subtitle="Loading dynamic AI risk alerts…" />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border)',
              borderTopColor: '#ef4444', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Generating risk alerts from DPR database…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Risk Alerts"
        subtitle={`Dynamic AI risk alerts · ${pending.length} pending · ${high.length} critical`}
        actions={
          <button onClick={() => load(true)} disabled={refreshing} className="topbar-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />
      <div className="page-content fade-in">

        {/* ── Summary Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Alerts', value: alerts.length,  color: '#3b82f6' },
            { label: 'Pending',      value: pending.length, color: '#f59e0b' },
            { label: 'High Risk',    value: high.length,    color: '#ef4444' },
            { label: 'Resolved',     value: resolved.length,color: '#22c55e' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: k.color, fontFamily: 'var(--font-display)' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* ── Info Banner ── */}
        {alerts.length > 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{pending.length} active risk alert(s)</strong> require
              immediate admin attention. {high.length} critical (High Risk) alerts detected across {districts.length} district(s).
              Alerts are dynamically generated by analyzing each DPR&apos;s content and risk profile.
              Expand any alert to view AI recommendations and suggested mitigation actions.
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input placeholder="Search by title, DPR name, district…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7,
                  color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {[
              { label: 'Risk Level', value: levelFilter, setter: setLevel,    opts: ['High', 'Medium', 'Low'] },
              { label: 'District',   value: distFilter,  setter: setDistrict, opts: districts },
              { label: 'Alert Type', value: typeFilter,  setter: setType,     opts: alertTypes },
              { label: 'Status',     value: statusFilter, setter: setStatus,  opts: ['Pending', 'Resolved'] },
            ].map(f => (
              <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
                style={{ padding: '7px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
                <option value="">{f.label}: All</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            {(search || levelFilter || distFilter || typeFilter || statusFilter) && (
              <button onClick={() => { setSearch(''); setLevel(''); setDistrict(''); setType(''); setStatus(''); }}
                style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                ✕ Clear Filters
              </button>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {filtered.length} of {alerts.length} alerts
            </span>
          </div>
        </div>

        {/* ── Alert List ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <ShieldAlert size={50} style={{ margin: '0 auto 18px', opacity: 0.2 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {alerts.length === 0 ? 'No risk alerts found' : 'No alerts match your filters'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto' }}>
              {alerts.length === 0
                ? 'Upload DPRs to automatically generate AI risk alerts based on document content.'
                : 'Try adjusting or clearing your filters to see more results.'}
            </div>
          </div>
        ) : (
          filtered.map(alert => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </>
  );
}
