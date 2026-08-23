// TOPLINE
'use client';

import { Suspense } from 'react';
import { UserTemplatesView } from '@/components/dashboard/UserTemplatesView';

function UserTemplatesFallback() {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      Loading DPR templates library…
    </div>
  );
}

export default function UserTemplatesPage() {
  return (
    <Suspense fallback={<UserTemplatesFallback />}>
      <UserTemplatesView />
    </Suspense>
  );
}
