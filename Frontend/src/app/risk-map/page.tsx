// TOPLINE
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import Link from 'next/link';
import {
  ShieldAlert, MapPin, AlertTriangle, CheckCircle, RefreshCw,
  Search, Filter, Eye, Layers, ChevronRight, Info, BarChart3
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Canonical 31 Karnataka Districts with map coordinates (percentage top/left)
const KARNATAKA_DISTRICT_POSITIONS: Record<string, { top: string; left: string }> = {
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

interface DistrictAnalytic {
  district: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  under_review: number;
  avg_ai_score: number | null;
  avg_risk_score: number | null;
  avg_compliance: number | null;
  approval_rate: number;
  last_submission: string | null;
  color: string;
  has_data: boolean;
}

interface RiskAlert {
  id: string;
  title: string;
  district: string;
  riskScore: number;
  flaggedAt: string;
  category: string;
}

const DEFAULT_ALERTS: RiskAlert[] = [
  { id: '1', title: 'BOQ Unit Rates Deviation from Karnataka PWD 2025 SoR', district: 'Bengaluru Urban', riskScore: 84, flaggedAt: '2h ago', category: 'Financial' },
  { id: '2', title: 'Pending Stage-II Forest Clearance in Eco-Sensitive Zone', district: 'Uttara Kannada', riskScore: 78, flaggedAt: '4h ago', category: 'Environmental' },
  { id: '3', title: 'Uncertain Soil Bearing Capacity in Foundation Zone (SPT Needed)', district: 'Belagavi', riskScore: 72, flaggedAt: '1d ago', category: 'Technical' },
  { id: '4', title: 'Heavy Monsoon Slope Stabilization Risk & Drainage Culvert Discharge', district: 'Dakshina Kannada', riskScore: 68, flaggedAt: '1d ago', category: 'Timeline' },
  { id: '5', title: 'Pending Land Acquisition & RoW Encroachment Dispute', district: 'Kalaburagi', riskScore: 64, flaggedAt: '2d ago', category: 'Legal' },
];

function getRiskCategory(score: number | null, color: string): 'high' | 'medium' | 'low' {
  if (color === 'red' || (score !== null && score > 65)) return 'high';
  if (color === 'orange' || color === 'amber' || (score !== null && score > 35)) return 'medium';
  return 'low';
}

const RISK_COLORS: Record<string, string> = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
  gray:   '#64748b',
};

export default function RiskMapPage() {
  const [districts, setDistricts] = useState<DistrictAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HAS_DATA'>('ALL');

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/districts`);
      if (res.ok) {
        const data: DistrictAnalytic[] = await res.json();
        setDistricts(data);
      }
    } catch (e) {
      console.error('Failed to load district analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    return districts.filter(d => {
      const rCategory = getRiskCategory(d.avg_risk_score, d.color);
      if (riskFilter === 'HIGH' && rCategory !== 'high') return false;
      if (riskFilter === 'MEDIUM' && rCategory !== 'medium') return false;
      if (riskFilter === 'LOW' && rCategory !== 'low') return false;
      if (riskFilter === 'HAS_DATA' && !d.has_data) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.district.toLowerCase().includes(q);
      }
      return true;
    });
  }, [districts, riskFilter, search]);

  const activeAlerts = useMemo(() => {
    if (!selectedDistrict) return DEFAULT_ALERTS;
    const match = DEFAULT_ALERTS.filter(a => a.district.toLowerCase().includes(selectedDistrict.toLowerCase()));
    return match.length > 0 ? match : DEFAULT_ALERTS;
  }, [selectedDistrict]);

  const selectedData = useMemo(() => {
    if (!selectedDistrict) return null;
    return districts.find(d => d.district.toLowerCase() === selectedDistrict.toLowerCase()) || null;
  }, [districts, selectedDistrict]);

  const highRiskCount = districts.filter(d => getRiskCategory(d.avg_risk_score, d.color) === 'high').length;
  const totalDprs = districts.reduce((acc, d) => acc + d.total, 0);

  return (
    <>
      <Topbar
        title="Risk Map"
        subtitle="Geospatial risk distribution across all 31 districts of Karnataka"
        actions={
          <button onClick={() => loadData(true)} className="topbar-btn" disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
        }
      />

      <div className="page-content fade-in">

        {/* ── Top Summary Header Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Karnataka Districts', value: '31 Districts', color: '#06b6d4', icon: <MapPin size={18}/> },
            { label: 'Active DPR Projects', value: totalDprs, color: '#3b82f6', icon: <Layers size={18}/> },
            { label: 'High Risk Zones', value: `${highRiskCount} Districts`, color: '#ef4444', icon: <ShieldAlert size={18}/> },
            { label: 'State Coverage', value: '100% Karnataka', color: '#22c55e', icon: <CheckCircle size={18}/> },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: item.color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: item.color, fontFamily: 'var(--font-display)' }}>
                    {item.value}
                  </div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  {item.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: 18 }}>

          {/* ── Left: Interactive Karnataka Map Canvas ── */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} color="var(--accent-blue)" /> Karnataka Geospatial Risk Map
                </div>
                <div className="card-subtitle">
                  Click any district node to view detailed risk analytics & compliance
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {[
                  { label: 'High Risk', color: '#ef4444' },
                  { label: 'Medium Risk', color: '#f59e0b' },
                  { label: 'Low Risk', color: '#22c55e' },
                  { label: 'No Active DPR', color: '#64748b' },
                ].map(r => (
                  <span key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                    {r.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-body" style={{ padding: 16 }}>
              <div style={{
                position: 'relative', width: '100%', paddingTop: '78%',
                background: 'radial-gradient(ellipse at center, #0f172a 0%, #090d16 100%)',
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--border)',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
              }}>

                {/* Grid Overlay */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={`${i * 8.33}%`} x2="100%" y2={`${i * 8.33}%`} stroke="#3b82f6" strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 14 }).map((_, i) => (
                    <line key={`v${i}`} x1={`${i * 7.14}%`} y1="0" x2={`${i * 7.14}%`} y2="100%" stroke="#3b82f6" strokeWidth="0.5" />
                  ))}
                </svg>

                {/* Stylized Karnataka Outline Hint */}
                <div style={{
                  position: 'absolute', inset: '6% 12% 8% 14%',
                  border: '1.5px dashed rgba(6,182,212,0.2)',
                  borderRadius: '50% 40% 60% 40% / 40% 60% 40% 60%',
                  pointerEvents: 'none'
                }} />

                {/* Compass & Scale */}
                <div style={{ position: 'absolute', top: 12, right: 14, textAlign: 'right', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)' }}>N ⬆</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Karnataka State Bound</div>
                </div>

                {/* District Nodes for all 31 districts */}
                {Object.entries(KARNATAKA_DISTRICT_POSITIONS).map(([distName, pos]) => {
                  const distData = districts.find(d => d.district.toLowerCase() === distName.toLowerCase());
                  const rCategory = getRiskCategory(distData?.avg_risk_score ?? null, distData?.color ?? 'gray');
                  const nodeColor = distData?.has_data ? RISK_COLORS[rCategory] : RISK_COLORS.gray;
                  const isSelected = selectedDistrict?.toLowerCase() === distName.toLowerCase();
                  const count = distData?.total ?? 0;
                  const nodeSize = Math.max(26, Math.min(46, 26 + count * 4));

                  return (
                    <div key={distName}
                      onClick={() => setSelectedDistrict(isSelected ? null : distName)}
                      style={{
                        position: 'absolute',
                        top: pos.top, left: pos.left,
                        transform: 'translate(-50%, -50%)',
                        zIndex: isSelected ? 10 : 2,
                        cursor: 'pointer',
                      }}>
                      {/* Pulse aura */}
                      {distData?.has_data && (
                        <div style={{
                          position: 'absolute', inset: -6, borderRadius: '50%',
                          border: `1.5px solid ${nodeColor}`,
                          opacity: isSelected ? 0.8 : 0.35,
                          animation: isSelected ? 'pulse 1.2s infinite' : 'pulse 2.5s infinite',
                        }} />
                      )}

                      {/* Main Circle Node */}
                      <div style={{
                        width: nodeSize, height: nodeSize, borderRadius: '50%',
                        background: isSelected
                          ? `radial-gradient(circle, ${nodeColor}, ${nodeColor}88)`
                          : `radial-gradient(circle, ${nodeColor}40, ${nodeColor}15)`,
                        border: `2px solid ${nodeColor}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: isSelected ? `0 0 25px ${nodeColor}` : `0 0 10px ${nodeColor}35`,
                        transition: 'all 0.25s ease',
                        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      }}>
                        <span style={{ fontSize: count > 9 ? 9.5 : 10.5, fontWeight: 900, color: isSelected ? 'white' : nodeColor, lineHeight: 1 }}>
                          {count > 0 ? count : '•'}
                        </span>
                      </div>

                      {/* Label */}
                      <div style={{
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        marginTop: 3, whiteSpace: 'nowrap', fontSize: 9.5,
                        color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 800 : 600,
                        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                        pointerEvents: 'none'
                      }}>
                        {distName.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}

                {/* Footer Legend */}
                <div style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 10.5, color: 'var(--text-muted)' }}>
                  🗺️ <strong>Karnataka Infrastructure Risk Map</strong> · 31 Canonical Districts
                </div>
              </div>

              {/* Selected District Details Card */}
              {selectedData && (
                <div className="card" style={{ marginTop: 14, padding: '14px 18px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Selected District</span>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        📍 {selectedData.district}
                      </div>
                    </div>
                    <button onClick={() => setSelectedDistrict(null)}
                      style={{ padding: '3px 8px', borderRadius: 5, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
                      ✕ Close
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-secondary)' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Total DPRs</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#3b82f6' }}>{selectedData.total}</div>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-secondary)' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Risk Score</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: selectedData.avg_risk_score && selectedData.avg_risk_score > 60 ? '#ef4444' : '#22c55e' }}>
                        {selectedData.avg_risk_score ?? 'N/A'}
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-secondary)' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>AI Score</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#60a5fa' }}>{selectedData.avg_ai_score ?? 'N/A'}/100</div>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-secondary)' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Approval Rate</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#22c55e' }}>{selectedData.approval_rate}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Sidebar: Districts Summary List & Alerts ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* District Search & List Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 520 }}>
              <div className="card-header" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  Karnataka Districts Risk Summary
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Showing {filteredDistricts.length} of {districts.length} districts
                </div>
              </div>

              {/* Search & Filter Strip */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input placeholder="Search district…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', paddingLeft: 24, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6,
                      color: 'var(--text-primary)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as typeof riskFilter)}
                  style={{ padding: '4px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 6, color: 'var(--text-primary)', fontSize: 10.5, outline: 'none', cursor: 'pointer' }}>
                  <option value="ALL">All Risks</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Med Risk</option>
                  <option value="LOW">Low Risk</option>
                  <option value="HAS_DATA">Active DPRs</option>
                </select>
              </div>

              {/* District List Scroll */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                    Loading districts…
                  </div>
                ) : filteredDistricts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                    No districts match filter.
                  </div>
                ) : (
                  filteredDistricts.map((d) => {
                    const rCategory = getRiskCategory(d.avg_risk_score, d.color);
                    const color = RISK_COLORS[rCategory];
                    const isSelected = selectedDistrict?.toLowerCase() === d.district.toLowerCase();

                    return (
                      <div key={d.district}
                        onClick={() => setSelectedDistrict(isSelected ? null : d.district)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isSelected ? 'rgba(6,182,212,0.1)' : 'transparent',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: isSelected ? 800 : 600, color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.district}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {d.total > 0 ? `${d.total} DPR(s) · Score ${d.avg_ai_score ?? '—'}/100` : 'No active DPR'}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: `${color}18`, color, border: `1px solid ${color}30` }}>
                          {rCategory.toUpperCase()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active District Risk Alerts Card */}
            <div className="card">
              <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔴 Active Risk Alerts
                </div>
                <span className="badge badge-high" style={{ fontSize: 10 }}>{activeAlerts.length}</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {activeAlerts.map((alert) => (
                  <div key={alert.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {alert.title}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#ef4444' }}>{alert.riskScore}%</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      📍 {alert.district} · {alert.category} · {alert.flaggedAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
