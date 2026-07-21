'use client';
import { useRouter } from 'next/navigation';

interface DPR {
  id: string;
  title: string;
  state: string;
  sector: string;
  cost: string;
  status: string;
  riskLevel: string;
  qualityScore: number;
  submittedDate: string;
  submittedBy: string;
}

interface DprTableProps {
  dprs: DPR[];
}

const statusClass: Record<string, string> = {
  Pending: 'badge-pending',
  Review: 'badge-review',
  Approved: 'badge-approved',
  Rejected: 'badge-rejected',
  Processing: 'badge-processing',
};

const riskClass: Record<string, string> = {
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

function ScorePill({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, minWidth: 60 }}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${score}%`, background: color }}
          />
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 28, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  );
}

export function DprTable({ dprs }: DprTableProps) {
  const router = useRouter();
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>DPR ID</th>
            <th>Project</th>
            <th>State</th>
            <th>Sector</th>
            <th>Cost</th>
            <th>Quality</th>
            <th>Risk</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {dprs.map((dpr) => (
            <tr key={dpr.id} onClick={() => router.push(`/dpr/${dpr.id}`)}>
              <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-blue-light)' }}>
                {dpr.id}
              </td>
              <td style={{ maxWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {dpr.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dpr.submittedBy}</div>
              </td>
              <td>{dpr.state}</td>
              <td>
                <span className="badge badge-processing" style={{ fontSize: 10 }}>{dpr.sector}</span>
              </td>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dpr.cost}</td>
              <td style={{ minWidth: 120 }}>
                <ScorePill score={dpr.qualityScore} />
              </td>
              <td>
                <span className={`badge ${riskClass[dpr.riskLevel]}`}>{dpr.riskLevel}</span>
              </td>
              <td>
                <span className={`badge ${statusClass[dpr.status]}`}>{dpr.status}</span>
              </td>
              <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {dpr.submittedDate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
