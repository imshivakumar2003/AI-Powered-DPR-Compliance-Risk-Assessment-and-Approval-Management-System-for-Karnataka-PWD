'use client';
import { Topbar } from '@/components/layout/Topbar';
import { DprTable } from '@/components/dashboard/DprTable';
import { recentDprs } from '@/lib/mockData';
import { Filter, Download, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function DprQueuePage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterSector, setFilterSector] = useState('All');

  const filtered = recentDprs.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.state.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    const matchRisk = filterRisk === 'All' || d.riskLevel === filterRisk;
    const matchSector = filterSector === 'All' || d.sector === filterSector;
    return matchSearch && matchStatus && matchRisk && matchSector;
  });

  const counts = {
    All: recentDprs.length,
    Pending: recentDprs.filter((d) => d.status === 'Pending').length,
    Review: recentDprs.filter((d) => d.status === 'Review').length,
    Approved: recentDprs.filter((d) => d.status === 'Approved').length,
    Rejected: recentDprs.filter((d) => d.status === 'Rejected').length,
    Processing: recentDprs.filter((d) => d.status === 'Processing').length,
  };

  return (
    <>
      <Topbar
        title="DPR Queue"
        subtitle="All incoming Detailed Project Reports across NE states"
        actions={
          <Link href="/dpr/upload" className="topbar-btn primary">
            + Upload DPR
          </Link>
        }
      />
      <div className="page-content fade-in">
        {/* Tab bar */}
        <div className="tab-bar">
          {Object.entries(counts).map(([status, count]) => (
            <div
              key={status}
              className={`tab-item ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
              <span style={{
                marginLeft: 6,
                background: filterStatus === status ? 'rgba(33,150,243,0.2)' : 'var(--bg-secondary)',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
              }}>
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              className="input-field"
              style={{ paddingLeft: 32 }}
              placeholder="Search by project title, ID, or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field" style={{ width: 140 }} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
            <option value="All">All Risks</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
          <select className="select-field" style={{ width: 150 }} value={filterSector} onChange={e => setFilterSector(e.target.value)}>
            <option value="All">All Sectors</option>
            <option value="Roads">Roads</option>
            <option value="Power">Power</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Tourism">Tourism</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Urban">Urban</option>
            <option value="Telecom">Telecom</option>
          </select>
          <button className="btn btn-secondary">
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {filtered.length} DPR{filtered.length !== 1 ? 's' : ''} found
              </div>
              <div className="card-subtitle">Click any row to view detailed AI assessment</div>
            </div>
          </div>
          {filtered.length > 0 ? (
            <DprTable dprs={filtered} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                No DPRs match your filters
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Try adjusting your search or filter criteria
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
