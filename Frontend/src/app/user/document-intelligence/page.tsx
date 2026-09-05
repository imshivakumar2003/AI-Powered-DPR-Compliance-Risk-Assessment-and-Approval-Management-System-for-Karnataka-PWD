// TOPLINE
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { DocumentIntelligenceView } from '@/components/dpr/DocumentIntelligenceView';

export default function UserDocumentIntelligencePage() {
  const { user, isLoaded, isLoggedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoaded, isLoggedIn, router]);

  if (!isLoaded || !isLoggedIn) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#22c55e', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading Document Intelligence &amp; RAG Engine...</div>
        </div>
      </div>
    );
  }

  return <DocumentIntelligenceView moduleType="user" title="Document Intelligence & RAG Engine" />;
}
