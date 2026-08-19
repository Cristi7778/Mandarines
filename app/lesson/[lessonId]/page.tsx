'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLessonById } from '@/lib/data/lessons';
import { markLessonComplete, getUserProgress, saveUserProgress } from '@/lib/db';
import { addXp, updateStreak } from '@/lib/xp';
import { useUser } from '@/hooks/useUser';

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const user = useUser();
  const lesson = getLessonById(lessonId);

  const [done, setDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    if (user === null) router.replace('/auth');
  }, [user, router]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center">
        <p className="text-gray-500">Lesson not found.</p>
      </div>
    );
  }

  async function handleComplete() {
    if (!lesson) return;
    const [userProg] = await Promise.all([getUserProgress()]);
    const updated = updateStreak(addXp(userProg, lesson.xp));
    await Promise.all([
      markLessonComplete(lesson.id),
      saveUserProgress(updated),
    ]);
    setXpEarned(lesson.xp);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">📖</div>
          <h2 className="text-2xl font-bold text-gray-800">Lesson complete!</h2>
          <p className="text-gray-500">{lesson.name}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-700 font-bold text-lg">+{xpEarned} XP</span>
          </div>
          <Link
            href="/"
            className="block w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors text-base"
          >
            Back to journey
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf0d7]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{lesson.station} · Lesson</p>
            <h1 className="font-bold text-gray-800 text-base truncate">{lesson.name}</h1>
          </div>
          <span className="text-xs font-medium text-amber-600 shrink-0">+{lesson.xp} XP</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {lesson.sections.map((section, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-lg font-bold text-gray-800 mb-2">{section.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{section.body}</p>
            </div>
            {section.examples && section.examples.length > 0 && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {section.examples.map((ex, j) => (
                  <div key={j} className="px-5 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xl chinese-text font-semibold text-gray-800">{ex.chinese}</p>
                      <p className="text-sm text-orange-500 mt-0.5">{ex.pinyin}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{ex.english}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          onClick={handleComplete}
          className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors text-base"
        >
          Continue
        </button>
      </main>
    </div>
  );
}
