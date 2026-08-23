// TOPLINE
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { fetchDashboardStats, DashboardStats } from '@/lib/api';
import { ViewerDashboard } from '@/components/dashboard/ViewerDashboard';

export default function ViewerDashboardPage() {
  const { user, isLoaded, isLoggedIn } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoaded, isLoggedIn, router]);

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Viewer dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(() => loadData(false), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!isLoaded || !isLoggedIn || loading || !stats) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#06b6d4', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading Viewer Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner identifying Viewer Dashboard */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0.6) 100%)',
        border: '1px solid rgba(6,182,212,0.3)', borderRadius: 12, padding: '16px 24px', margin: '20px 24px 0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 4, background: '#06b6d4', color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
            Public & Monitoring Portal
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', marginTop: 4 }}>Viewer Dashboard</h2>
        </div>
      </div>

      <ViewerDashboard
        stats={stats}
        user={user}
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
