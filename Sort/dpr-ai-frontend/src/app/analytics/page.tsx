'use client';
import { Topbar } from '@/components/layout/Topbar';
import { TrendChart } from '@/components/charts/TrendChart';
import { SectorChart } from '@/components/charts/SectorChart';
import { trendData, sectorBreakdown, statePerformance } from '@/lib/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATE_COLORS = ['#2196f3','#10b981','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899','#ef4444'];

export default function AnalyticsPage() {
  return (
    <>
      <Topbar title="Analytics" subtitle="Historical trends and state-wise performance analysis" />
      <div className="page-content fade-in">

        {/* Row 1 */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">DPR Submission Trends</div>
                <div className="card-subtitle">Oct 2025 – Apr 2026</div>
              </div>
            </div>
            <div className="card-body"><TrendChart data={trendData} /></div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Sector Distribution</div>
                <div className="card-subtitle">524 DPRs across 7 sectors</div>
              </div>
            </div>
            <div className="card-body"><SectorChart data={sectorBreakdown} /></div>
          </div>
        </div>

        {/* State Performance Table */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">State-wise Performance</div>
              <div className="card-subtitle">DPR count, average quality score, and fund utilisation</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Total DPRs</th>
                  <th>Avg Quality Score</th>
                  <th>Quality Trend</th>
                  <th>Fund Utilisation</th>
                  <th>Utilisation Bar</th>
                </tr>
              </thead>
              <tbody>
                {statePerformance.map((s, i) => (
                  <tr key={s.state}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATE_COLORS[i], flexShrink: 0 }} />
                      {s.state}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.dprs}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.avgScore >= 78 ? 'var(--accent-green)' : s.avgScore >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                        {s.avgScore}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/100</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent-green)', fontSize: 12 }}>↑ +2.4</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: s.utilisation >= 85 ? 'var(--accent-green)' : s.utilisation >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                        {s.utilisation}%
                      </span>
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div className="progress-bar" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${s.utilisation}%`, background: STATE_COLORS[i] }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Average Score by State Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Average DPR Quality Score by State</div>
              <div className="card-subtitle">Higher scores indicate better DPR preparation capacity</div>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statePerformance} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="state" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={s => s.split(' ').pop() || s} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                  formatter={(val) => [`${val ?? ''}/100`, 'Avg Score']}
                />
                <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                  {statePerformance.map((_, i) => <Cell key={i} fill={STATE_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
