// TOPLINE
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { MainDashboardView } from '@/components/dashboard/MainDashboardView';

export default function AdminDashboardPage() {
  const { user, isLoaded, isLoggedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (!isLoggedIn) {
        router.replace('/auth/login');
      } else if (user.role !== 'admin') {
        if (user.role === 'viewer') router.replace('/viewer/dashboard');
        else router.replace('/user/dashboard');
      }
    }
  }, [isLoaded, isLoggedIn, user, router]);

  if (!isLoaded || !isLoggedIn || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#ef4444', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading Admin Dashboard...</div>
        </div>
      </div>
    );
  }

  return <MainDashboardView dashboardTitle="Admin Dashboard" />;
}
