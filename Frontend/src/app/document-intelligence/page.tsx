// TOPLINE
'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { DocumentIntelligenceView } from '@/components/dpr/DocumentIntelligenceView';

export default function DocumentIntelligenceUniversalPage() {
  const { user, isLoaded, isLoggedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoaded) {
      if (!isLoggedIn) {
        router.replace('/auth/login');
      } else {
        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        if (user.role === 'admin') {
          router.replace(`/admin/document-intelligence${query}`);
        } else {
          router.replace(`/user/document-intelligence${query}`);
        }
      }
    }
  }, [isLoaded, isLoggedIn, user.role, router, searchParams]);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirecting to Document Intelligence &amp; RAG Engine...</div>
      </div>
    </div>
  );
}
