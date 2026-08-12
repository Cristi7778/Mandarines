'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { resetAllProgress } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';

export default function SettingsPage() {
  const router = useRouter();
  const user = useUser();
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleReset() {
    setResetting(true);
    await resetAllProgress();
    setResetting(false);
    setResetDone(true);
    setConfirmReset(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  return (
    <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-base">← Home</Link>
          <h1 className="text-lg font-bold text-gray-800">Settings</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Appearance */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Appearance</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Dark mode</p>
              <p className="text-sm text-gray-500">Synced to your account</p>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</p>
          </div>
          {user && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>
          )}
          <div className="px-5 py-4">
            <button
              onClick={handleSignOut}
              className="text-base text-red-500 hover:text-red-700 font-medium"
            >
              Sign out
            </button>
          </div>
        </section>

        {/* Progress */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Progress</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {resetDone ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <p className="text-green-700 font-medium">Progress reset. Starting fresh! 🍊</p>
                <Link href="/" className="text-sm text-green-600 underline mt-1 block">Go to home</Link>
              </div>
            ) : !confirmReset ? (
              <>
                <p className="text-sm text-gray-500">Wipes all XP, levels, streaks, and topic progress. This cannot be undone.</p>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="text-base text-red-500 hover:text-red-700 font-medium"
                >
                  Reset all progress
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-base font-semibold text-gray-800">Are you sure? This cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {resetting ? 'Resetting…' : 'Yes, reset everything'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
