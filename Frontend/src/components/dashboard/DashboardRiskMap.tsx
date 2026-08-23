// TOPLINE
'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchProjects, Project, getUserHeaders } from '@/lib/api';
import Link from 'next/link';
import {
  Map, MapPin, ShieldAlert, AlertTriangle, CheckCircle, Search,
  Filter, Layers, ArrowUpRight, Info, Eye, RefreshCw, BarChart3
} from 'lucide-react';

const KARNATAKA_DISTRICT_COORDS: Record<string, { top: string; left: string }> = {
  'Bidar':            { top: '8%',  left: '84%' },
  'Kalaburagi':       { top: '16%', left: '76%' },
  'Vijayapura':       { top: '15%', left: '48%' },
  'Belagavi':         { top: '22%', left: '25%' },
  'Bagalkot':         { top: '22%', left: '45%' },
  'Yadgir':           { top: '25%', left: '80%' },
  'Raichur':          { top: '30%', left: '70%' },
  'Uttara Kannada':   { top: '38%', left: '18%' },
  'Dharwad':          { top: '34%', left: '32%' },
  'Gadag':            { top: '35%', left: '44%' },
  'Koppal':           { top: '36%', left: '58%' },
  'Ballari':          { top: '40%', left: '72%' },
  'Vijayanagara':     { top: '44%', left: '60%' },
  'Haveri':           { top: '45%', left: '36%' },
  'Shivamogga':       { top: '54%', left: '30%' },
  'Davanagere':       { top: '50%', left: '48%' },
  'Chitradurga':      { top: '52%', left: '62%' },
  'Udupi':            { top: '65%', left: '16%' },
  'Chikkamagaluru':   { top: '62%', left: '34%' },
  'Tumakuru':         { top: '64%', left: '60%' },
  'Chikkaballapur':   { top: '62%', left: '78%' },
  'Kolar':            { top: '68%', left: '86%' },
  'Dakshina Kannada': { top: '74%', left: '20%' },
  'Hassan':           { top: '72%', left: '40%' },
  'Bengaluru Rural':  { top: '72%', left: '78%' },
  'Bengaluru Urban':  { top: '76%', left: '72%' },
  'Kodagu':           { top: '80%', left: '30%' },
  'Mandya':           { top: '80%', left: '52%' },
  'Ramanagara':       { top: '79%', left: '66%' },
  'Mysuru':           { top: '86%', left: '48%' },
  'Mysore':           { top: '86%', left: '48%' },
  'Chamarajanagar':   { top: '91%', left: '58%' },
};

type RiskTier = 'low' | 'medium' | 'high' | 'critical';

function getRiskTier(score: number | null | undefined): RiskTier {
  if (score == null) return 'low';
  if (score >= 86) return 'critical';
  if (score >= 61) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

const TIER_CFG: Record<RiskTier, { label: string; color: string; bg: string; border: string }> = {
  low:      { label: 'Low Risk',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)' },
  medium:   { label: 'Medium Risk',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  high:     { label: 'High Risk',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  critical: { label: 'Critical Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
};

export function DashboardRiskMap() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Interactive Filters
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRiskTier, setFilterRiskTier] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const loadRiskData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const data = await fetchProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching risk map data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRiskData();
    const interval = setInterval(() => loadRiskData(false), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Filtered project list
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filterDepartment && (p.sector || '') !== filterDepartment) return false;
      if (filterStatus && (p.status || '') !== filterStatus) return false;
      if (filterRiskTier) {
        const tier = getRiskTier(p.risk_score);
        if (tier !== filterRiskTier) return false;
      }
      if (searchQ) {
        const q = searchQ.toLowerCase();
        const matchTitle = (p.title || p.original_filename || '').toLowerCase().includes(q);
        const matchState = (p.state || '').toLowerCase().includes(q);
        const matchId = (p.id || '').toLowerCase().includes(q);
        if (!matchTitle && !matchState && !matchId) return false;
      }
      if (selectedDistrict) {
        const dist = (p.state || p.district || '').toLowerCase();
        if (!dist.includes(selectedDistrict.toLowerCase())) return false;
      }
      return true;
    });
  }, [projects, filterDepartment, filterStatus, filterRiskTier, searchQ, selectedDistrict]);

  // Risk Distribution Counts
  const counts = useMemo(() => {
    let low = 0, medium = 0, high = 0, critical = 0;
    filteredProjects.forEach(p => {
      const tier = getRiskTier(p.risk_score);
      if (tier === 'critical') critical++;
      else if (tier === 'high') high++;
      else if (tier === 'medium') medium++;
      else low++;
    });
    return { low, medium, high, critical, total: filteredProjects.length };
  }, [filteredProjects]);

  // Department / Sector Risk Breakdown
  const departmentExposure = useMemo(() => {
    const deptMap: Record<string, { total: number; totalRisk: number; critical: number; high: number }> = {};
    filteredProjects.forEach(p => {
      const dept = p.sector || 'General Infrastructure';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, totalRisk: 0, critical: 0, high: 0 };
      deptMap[dept].total += 1;
      const risk = p.risk_score ?? 35;
      deptMap[dept].totalRisk += risk;
      const tier = getRiskTier(risk);
      if (tier === 'critical') deptMap[dept].critical += 1;
      if (tier === 'high') deptMap[dept].high += 1;
    });

    return Object.entries(deptMap).map(([dept, data]) => {
      const avgRisk = Math.round(data.totalRisk / data.total);
      const tier = getRiskTier(avgRisk);
      return {
        dept,
        total: data.total,
        avgRisk,
        tier,
        criticalCount: data.critical,
        highCount: data.high,
      };
    }).sort((a, b) => b.avgRisk - a.avgRisk);
  }, [filteredProjects]);

  // Unique departments for dropdown
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => { if (p.sector) set.add(p.sector); });
    return Array.from(set);
  }, [projects]);

  // District Risk Mapping
  const districtRiskData = useMemo(() => {
    const map: Record<string, { count: number; avgRisk: number; tier: RiskTier }> = {};
    Object.keys(KARNATAKA_DISTRICT_COORDS).forEach(d => {
      const dProjects = projects.filter(p => (p.state || p.district || '').toLowerCase().includes(d.toLowerCase()));
      if (dProjects.length > 0) {
        const avg = Math.round(dProjects.reduce((sum, p) => sum + (p.risk_score || 30), 0) / dProjects.length);
        map[d] = { count: dProjects.length, avgRisk: avg, tier: getRiskTier(avg) };
      } else {
        map[d] = { count: 0, avgRisk: 20, tier: 'low' };
      }
    });
    return map;
  }, [projects]);

  if (loading) {
    return (
      <div className="card" style={{ padding: 24, marginBottom: 24, textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#ef4444', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading Dynamic Risk Map & Department Exposure...</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 24, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Map size={20} color="#ef4444" />
            <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              State & Department Risk Map Analysis
            </h3>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', textTransform: 'uppercase' }}>
              Real-Time Sync
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Geographical risk heatmap & department risk exposure matrix calculated dynamically from active DPR records.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => loadRiskData(true)}
            className="topbar-btn"
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
            {refreshing ? 'Refreshing…' : 'Sync Risk Data'}
          </button>
          <Link href="/risk-map" className="topbar-btn primary" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            Full Map View <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10,
        padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: 20
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search title, ID, area..."
            className="search-input"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ paddingLeft: 28, width: '100%', fontSize: 11 }}
          />
        </div>

        {/* Filter Department */}
        <select
          value={filterDepartment}
          onChange={e => setFilterDepartment(e.target.value)}
          className="select-input"
          style={{ fontSize: 11, width: '100%' }}
        >
          <option value="">All Departments / Sectors</option>
          {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Filter Status */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="select-input"
          style={{ fontSize: 11, width: '100%' }}
        >
          <option value="">All DPR Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="UNDER_REVIEW">Under Review</option>
        </select>

        {/* Filter Risk Level */}
        <select
          value={filterRiskTier}
          onChange={e => setFilterRiskTier(e.target.value)}
          className="select-input"
          style={{ fontSize: 11, width: '100%' }}
        >
          <option value="">All Risk Levels</option>
          <option value="low">Low Risk (0-30)</option>
          <option value="medium">Medium Risk (31-60)</option>
          <option value="high">High Risk (61-85)</option>
          <option value="critical">Critical Risk (86-100)</option>
        </select>

        {/* Clear Filters button */}
        {(filterDepartment || filterStatus || filterRiskTier || searchQ || selectedDistrict) && (
          <button
            onClick={() => { setFilterDepartment(''); setFilterStatus(''); setFilterRiskTier(''); setSearchQ(''); setSelectedDistrict(null); }}
            style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 4 Risk Category Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {(['low', 'medium', 'high', 'critical'] as RiskTier[]).map(tier => {
          const cfg = TIER_CFG[tier];
          const count = counts[tier];
          const isActive = filterRiskTier === tier;
          return (
            <div
              key={tier}
              onClick={() => setFilterRiskTier(isActive ? '' : tier)}
              style={{
                padding: '12px 14px', borderRadius: 8, background: cfg.bg, border: `1px solid ${isActive ? cfg.color : cfg.border}`,
                cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isActive ? `0 0 12px ${cfg.color}40` : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: cfg.color, color: 'white' }}>
                  {tier === 'low' ? '0-30' : tier === 'medium' ? '31-60' : tier === 'high' ? '61-85' : '86-100'}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
                {count} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>proposals</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Heatmap Grid & Department Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        
        {/* Visual Map Canvas */}
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, position: 'relative', minHeight: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#ef4444" /> Karnataka Geographical District Risk Map
            </span>
            {selectedDistrict && (
              <span style={{ fontSize: 11, color: '#38bdf8', cursor: 'pointer' }} onClick={() => setSelectedDistrict(null)}>
                Showing: <strong>{selectedDistrict}</strong> (Click to reset)
              </span>
            )}
          </div>

          <div style={{ position: 'relative', width: '100%', height: 260, background: 'radial-gradient(circle at 50% 50%, rgba(30,58,138,0.2) 0%, rgba(15,23,42,0.8) 100%)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            
            {/* District Pins */}
            {Object.entries(KARNATAKA_DISTRICT_COORDS).map(([dist, pos]) => {
              const info = districtRiskData[dist] || { count: 0, avgRisk: 20, tier: 'low' };
              const cfg = TIER_CFG[info.tier];
              const isSelected = selectedDistrict === dist;

              return (
                <div
                  key={dist}
                  onClick={() => setSelectedDistrict(isSelected ? null : dist)}
                  title={`${dist}: ${info.count} DPRs (Avg Risk: ${info.avgRisk})`}
                  style={{
                    position: 'absolute', top: pos.top, left: pos.left,
                    transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: isSelected ? 10 : 2
                  }}
                >
                  <div style={{
                    width: isSelected ? 18 : 12, height: isSelected ? 18 : 12, borderRadius: '50%',
                    background: cfg.color, border: '2px solid white',
                    boxShadow: `0 0 10px ${cfg.color}`,
                    transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {info.count > 0 && <span style={{ fontSize: 7, fontWeight: 900, color: 'black' }}>{info.count}</span>}
                  </div>
                  <div style={{
                    fontSize: 8.5, fontWeight: 700, color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                    whiteSpace: 'nowrap', textShadow: '0 1px 3px black', marginTop: 1, textAlign: 'center'
                  }}>
                    {dist}
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Department / Sector Risk Exposure Matrix */}
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={14} color="#f59e0b" /> Department Risk Exposure Matrix
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 260 }}>
            {departmentExposure.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                No department risk exposure records found matching your filters.
              </div>
            ) : departmentExposure.map(d => {
              const cfg = TIER_CFG[d.tier];
              return (
                <div key={d.dept} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{d.dept}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label} ({d.avgRisk})
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Proposals: <strong>{d.total}</strong></span>
                    {d.criticalCount > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>Critical: {d.criticalCount}</span>}
                    {d.highCount > 0 && <span style={{ color: '#f97316', fontWeight: 700 }}>High: {d.highCount}</span>}
                  </div>

                  {/* Progress Risk Bar */}
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${d.avgRisk}%`, height: '100%', background: cfg.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
