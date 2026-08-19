'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TOPICS, { topicsByStation, STATIONS } from '@/lib/data/topics';
import { lessonsByStation } from '@/lib/data/lessons';
import { getAllTopicProgress, getAllLessonProgress, getUserProgress } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { xpToNextLevel } from '@/lib/xp';
import { useUser } from '@/hooks/useUser';
import type { Lesson, TopicProgress, UserProgress } from '@/lib/types';

const STATION_EMOJI: Record<string, string> = {
  Foundation: '',
  'HSK 1':    '🍊',
  'HSK 2':    '🍊🍊',
  'HSK 3':    '🍊🍊🍊',
  'HSK 4':    '🍊🍊🍊🍊',
};

const STATION_COLORS: Record<string, string> = {
  Foundation: 'bg-indigo-600',
  'HSK 1':    'bg-[#b83c91]',
  'HSK 2':    'bg-[#b83c91]',
  'HSK 3':    'bg-[#b83c91]',
  'HSK 4':    'bg-[#b83c91]',
};

const STATION_BORDER: Record<string, string> = {
  Foundation: 'border-indigo-100',
  'HSK 1':    'border-[#f3d0ea]',
  'HSK 2':    'border-[#f3d0ea]',
  'HSK 3':    'border-[#f3d0ea]',
  'HSK 4':    'border-[#f3d0ea]',
};

function stepsComplete(p: TopicProgress): number {
  return [
    p.step1Complete, p.step2Complete, p.step3Complete,
    p.step4Complete, p.step5Complete, p.step6Complete, p.step7Complete,
  ].filter(Boolean).length;
}

function StepDots({ progress }: { progress: TopicProgress }) {
  const steps = [
    progress.step1Complete, progress.step2Complete, progress.step3Complete,
    progress.step4Complete, progress.step5Complete, progress.step6Complete, progress.step7Complete,
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
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    getAllTopicProgress().then(setTopicProgress);
    getAllLessonProgress().then(setLessonProgress);
    getUserProgress().then(setUserProgress);
  }, [user, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  const byStation = topicsByStation();
  const lessonsByStationMap = lessonsByStation();
  const xpInfo = userProgress ? xpToNextLevel(userProgress.totalXp) : null;

  if (user === undefined || user === null) {
    return (
      <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-pulse">🍊</div>
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf0d7]">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-6 py-3 grid grid-cols-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍊</span>
            <span className="text-2xl font-bold text-gray-800">Mandarines</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            {userProgress && (
              <div className="flex items-center gap-2 text-base">
                <span className="font-bold text-amber-600">Lv {userProgress.level}</span>
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
              <span className="text-base font-medium text-orange-500">🔥 {userProgress.streakCount}</span>
            )}
            <Link
              href="/recap"
              className="bg-orange-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Recap
            </Link>
          </div>
          <div className="flex items-center gap-5 justify-end">
            <Link href="/settings" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors font-medium text-base">
              <span className="text-lg">⚙︎</span>
              <span>Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-base text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Journey */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        {STATIONS.map(station => {
          const topics = byStation[station] ?? [];
          const lessons = lessonsByStationMap[station] ?? [];
          const completedTopics = topics.filter(t => {
            const p = topicProgress[t.id];
            return p && stepsComplete(p) === 7;
          }).length;
          const completedLessons = lessons.filter(l => lessonProgress[l.id]).length;
          const totalItems = topics.length + lessons.length;
          const completedItems = completedTopics + completedLessons;

          type Row =
            | { kind: 'topic'; seq: number; data: (typeof topics)[0] }
            | { kind: 'lesson'; seq: number; data: Lesson };
          const rows: Row[] = [
            ...topics.map(t => ({ kind: 'topic' as const, seq: t.sequenceOrder, data: t })),
            ...lessons.map(l => ({ kind: 'lesson' as const, seq: l.sequenceOrder, data: l })),
          ].sort((a, b) => a.seq - b.seq);

          return (
            <section key={station}>
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl text-white font-bold text-lg ${STATION_COLORS[station]}`}>
                <span>{station}{STATION_EMOJI[station] ? <span className="ml-2">{STATION_EMOJI[station]}</span> : null}</span>
                <span className="text-xs font-normal opacity-80">
                  {completedItems}/{totalItems} complete
                </span>
              </div>
              <div className={`border rounded-b-xl overflow-hidden divide-y divide-gray-100 ${STATION_BORDER[station]}`}>
                {rows.map(row => {
                  if (row.kind === 'lesson') {
                    const lesson = row.data;
                    const isComplete = !!lessonProgress[lesson.id];
                    return (
                      <div key={lesson.id} className="bg-white px-4 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400 shrink-0">{lesson.sequenceOrder}.</span>
                            <span className="text-base">📖</span>
                            <span className={`font-medium text-base ${isComplete ? 'text-green-700' : 'text-gray-800'}`}>
                              {lesson.name}
                            </span>
                            {isComplete && <span className="text-green-500 text-xs shrink-0">✓</span>}
                          </div>
                          {!isComplete && lesson.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{lesson.description}</p>
                          )}
                        </div>
                        <Link
                          href={`/lesson/${lesson.id}`}
                          className={`shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors ${
                            isComplete
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isComplete ? 'Review' : 'Read'}
                        </Link>
                      </div>
                    );
                  }

                  const topic = row.data;
                  const p = topicProgress[topic.id];
                  const done = p ? stepsComplete(p) : 0;
                  const hasItems = topic.items.length > 0;
                  const isComplete = done === 7;
                  const inProgress = done > 0 && done < 6;

                  return (
                    <div key={topic.id} className="bg-white px-4 py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400 shrink-0">{topic.sequenceOrder}.</span>
                          <span className={`font-medium text-base ${isComplete ? 'text-green-700' : 'text-gray-800'}`}>
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
                          className={`shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors ${
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
