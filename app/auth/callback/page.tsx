'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        router.replace('/');
      });
    } else {
      // Implicit flow — session already handled by Supabase client on load
      supabase.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? '/' : '/auth');
      });
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-pulse">🍊</div>
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
