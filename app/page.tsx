'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TOPICS, { topicsByStation, STATIONS } from '@/lib/data/topics';
import { getAllTopicProgress, getUserProgress } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { xpToNextLevel } from '@/lib/xp';
import { useUser } from '@/hooks/useUser';
import type { TopicProgress, UserProgress } from '@/lib/types';

const STATION_COLORS: Record<string, string> = {
  Foundation: 'bg-indigo-600',
  'HSK 1':    'bg-emerald-600',
  'HSK 2':    'bg-blue-600',
  'HSK 3':    'bg-purple-600',
  'HSK 4':    'bg-rose-600',
};

const STATION_BORDER: Record<string, string> = {
  Foundation: 'border-indigo-100',
  'HSK 1':    'border-emerald-100',
  'HSK 2':    'border-blue-100',
  'HSK 3':    'border-purple-100',
  'HSK 4':    'border-rose-100',
};

function stepsComplete(p: TopicProgress): number {
  return [
    p.step1Complete, p.step2Complete, p.step3Complete,
    p.step4Complete, p.step5Complete, p.step6Complete,
  ].filter(Boolean).length;
}

function StepDots({ progress }: { progress: TopicProgress }) {
  const steps = [
    progress.step1Complete, progress.step2Complete, progress.step3Complete,
    progress.step4Complete, progress.step5Complete, progress.step6Complete,
  ];
  return (
    <div className="flex gap-1 mt-1">
      {steps.map((done, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const user = useUser();

  const [topicProgress, setTopicProgress] = useState<Record<string, TopicProgress>>({});
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    getAllTopicProgress().then(setTopicProgress);
    getUserProgress().then(setUserProgress);
  }, [user, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  const byStation = topicsByStation();
  const xpInfo = userProgress ? xpToNextLevel(userProgress.totalXp) : null;

  // Loading state
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl chinese-text text-red-600 font-bold animate-pulse">汉字</div>
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f4]">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600 chinese-text">汉字</span>
            <span className="text-lg font-semibold text-gray-800">Journey</span>
          </div>
          <div className="flex items-center gap-4">
            {userProgress && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-amber-600">Lv {userProgress.level}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: `${xpInfo?.percent ?? 0}%` }}
                  />
                </div>
                <span className="text-gray-500">{userProgress.totalXp} XP</span>
              </div>
            )}
            {userProgress && userProgress.streakCount > 0 && (
              <span className="text-sm font-medium text-orange-500">🔥 {userProgress.streakCount}</span>
            )}
            <Link
              href="/recap"
              className="bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              Recap
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Journey */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        {STATIONS.map(station => {
          const topics = byStation[station];
          const completedCount = topics.filter(t => {
            const p = topicProgress[t.id];
            return p && stepsComplete(p) === 6;
          }).length;

          return (
            <section key={station}>
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl text-white font-semibold ${STATION_COLORS[station]}`}>
                <span>{station}</span>
                <span className="text-xs font-normal opacity-80">
                  {completedCount}/{topics.length} complete
                </span>
              </div>
              <div className={`border rounded-b-xl overflow-hidden divide-y divide-gray-100 ${STATION_BORDER[station]}`}>
                {topics.map(topic => {
                  const p = topicProgress[topic.id];
                  const done = p ? stepsComplete(p) : 0;
                  const hasItems = topic.items.length > 0;
                  const isComplete = done === 6;
                  const inProgress = done > 0 && done < 6;

                  return (
                    <div key={topic.id} className="bg-white px-4 py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400 shrink-0">{topic.sequenceOrder}.</span>
                          <span className={`font-medium text-sm ${isComplete ? 'text-green-700' : 'text-gray-800'}`}>
                            {topic.name}
                          </span>
                          {isComplete && <span className="text-green-500 text-xs shrink-0">✓</span>}
                        </div>
                        {p && <StepDots progress={p} />}
                        {!p && topic.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{topic.description}</p>
                        )}
                      </div>
                      {hasItems ? (
                        <Link
                          href={`/learn/${topic.id}`}
                          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            isComplete
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : inProgress
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isComplete ? 'Review' : inProgress ? 'Continue' : 'Start'}
                        </Link>
                      ) : (
                        <span className="shrink-0 text-xs text-gray-300 px-3">Coming soon</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        {user?.email} ·{' '}
        {TOPICS.filter(t => t.items.length > 0).reduce((n, t) => n + t.items.length, 0)} vocabulary items
      </footer>
    </div>
  );
}
