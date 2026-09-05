// TOPLINE
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { AiChatbotView } from '@/components/chat/AiChatbotView';

export default function AdminAiChatbotPage() {
  const { user, isLoaded, isLoggedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (!isLoggedIn) {
        router.replace('/auth/login');
      } else if (user.role !== 'admin') {
        router.replace('/user/ai-chatbot');
      }
    }
  }, [isLoaded, isLoggedIn, user, router]);

  if (!isLoaded || !isLoggedIn || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#ef4444', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading Admin DPR AI Chatbot...</div>
        </div>
      </div>
    );
  }

  return <AiChatbotView moduleType="admin" title="Admin DPR AI Chatbot" />;
}
