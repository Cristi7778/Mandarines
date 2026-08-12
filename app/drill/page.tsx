'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTopicById } from '@/lib/data/topics';
import { comparePinyin, toToneMarks } from '@/lib/pinyin';
import {
  getItemProgress,
  getUserProgress,
  saveItemProgress,
  saveUserProgress,
  storePendingDrill,
} from '@/lib/db';
import { useUser } from '@/hooks/useUser';
import { addXp, updateStreak, xpForRecap } from '@/lib/xp';
import type { DrillQuestion, DrillResult } from '@/lib/types';

function buildQuestions(
  topicIds: string[],
  skills: Array<'pinyin' | 'character'>,
  count: number
): DrillQuestion[] {
  const all: DrillQuestion[] = [];
  for (const id of topicIds) {
    const topic = getTopicById(id);
    if (!topic) continue;
    for (const item of topic.items) {
      for (const skill of skills) {
        all.push({
          type: skill === 'pinyin' ? 'pinyin-from-english' : 'pinyin-from-char',
          item,
        });
      }
    }
  }
  // shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return all.slice(0, count);
}

function DrillContent() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useUser();

  const topicIds = (params.get('topics') ?? '').split(',').filter(Boolean);
  const skillsRaw = (params.get('skills') ?? 'pinyin').split(',').filter(Boolean) as Array<'pinyin' | 'character'>;
  const count = Math.min(parseInt(params.get('count') ?? '10', 10), 100);

  const [questions] = useState<DrillQuestion[]>(() => buildQuestions(topicIds, skillsRaw, count));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [results, setResults] = useState<DrillResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user === null) router.replace('/auth');
  }, [user, router]);

  useEffect(() => {
    if (!submitted) inputRef.current?.focus();
  }, [idx, submitted]);

  if (user === undefined) {
    return <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center"><div className="text-4xl chinese-text text-red-600 font-bold animate-pulse">🍊</div></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="space-y-3">
          <p className="text-gray-600">No questions available. Select topics with content.</p>
          <button onClick={() => router.push('/recap')} className="text-red-600 underline text-sm">
            Back to Recap Builder
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx]!;
  const total = questions.length;
  const pct = Math.round((idx / total) * 100);
  const converted = input ? toToneMarks(input) : '';

  function handleSubmit() {
    if (!input.trim()) return;
    const isCorrect = comparePinyin(input, q.item.pinyin);
    setCorrect(isCorrect);
    setSubmitted(true);
    setResults(prev => [...prev, { question: q, userAnswer: input.trim(), correct: isCorrect }]);
  }

  async function handleNext() {
    if (idx + 1 >= total) {
      const allResults = [...results];
      const score = allResults.filter(r => r.correct).length;
      const xp = xpForRecap(score, total);

      // save item progress (parallel)
      await Promise.all(
        allResults.map(async r => {
          const skillType = r.question.type === 'pinyin-from-english' ? 'pinyin' : ('character' as const);
          const prev = await getItemProgress(r.question.item.id, skillType);
          const last5 = prev?.last5Results ?? [];
          const updated = [...last5, r.correct ? 'correct' : 'incorrect'].slice(-5) as typeof last5;
          await saveItemProgress({
            itemId: r.question.item.id,
            skillType,
            last5Results: updated,
            itemContentVersionSeen: r.question.item.contentVersion,
          });
        })
      );

      // award XP
      const up = await getUserProgress();
      await saveUserProgress(updateStreak(addXp(up, xp)));

      storePendingDrill(allResults, { xpEarned: xp, score, total, mode: 'recap' });
      router.push('/results');
      return;
    }
    setIdx(i => i + 1);
    setInput('');
    setSubmitted(false);
    setCorrect(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (!submitted) handleSubmit();
      else handleNext();
    }
  }

  const { item, type } = q;

  return (
    <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/recap')} className="text-gray-500 hover:text-gray-700 text-sm">
            ✕ Quit
          </button>
          <div className="flex-1 mx-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-sm text-gray-500 shrink-0">{idx + 1}/{total}</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-5">
        {/* Question card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
          {type === 'pinyin-from-english' ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pinyin drill</p>
              <p className="text-base text-gray-600 italic">{item.exampleEnglish}</p>
              <p className="text-2xl chinese-text text-gray-800 font-medium leading-relaxed">
                {item.examplePrefix}
                <span className="inline-block border-b-2 border-dashed border-orange-400 min-w-[3rem] mx-1 px-2 text-center text-orange-400">
                  {submitted ? <span className="text-red-600 font-bold">{item.chineseChar}</span> : '?'}
                </span>
                {item.exampleSuffix}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Character → Pinyin</p>
              <p className="text-2xl chinese-text text-gray-800 font-medium leading-relaxed">
                {item.examplePrefix}
                <span className="inline-block bg-orange-50 border border-orange-300 rounded-lg px-2 py-0.5 mx-1 text-orange-700 font-bold">
                  {item.chineseChar}
                </span>
                {item.exampleSuffix}
              </p>
              <p className="text-sm text-gray-400 italic">{item.exampleEnglish}</p>
            </>
          )}
        </div>

        {/* Input / Feedback */}
        {!submitted ? (
          <div className="space-y-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type pinyin with tone numbers, e.g. ni3 hao3"
              className="w-full border border-gray-300 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            {converted && (
              <p className="text-sm text-gray-500 px-1">
                → <span className="text-red-600 font-medium">{converted}</span>
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 text-base"
            >
              Check
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-xl p-5 ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{correct ? '✅' : '❌'}</span>
                <span className={`font-semibold text-lg ${correct ? 'text-green-700' : 'text-red-700'}`}>
                  {correct ? 'Correct!' : 'Not quite'}
                </span>
              </div>
              {!correct && (
                <p className="text-sm text-gray-700 mb-1">
                  Correct answer:{' '}
                  <span className="font-bold text-red-700">{item.pinyin}</span>{' '}
                  <span className="chinese-text font-bold text-gray-800 ml-1">{item.chineseChar}</span>
                </p>
              )}
              <p className="text-sm text-gray-500">
                {item.englishMeaning}
              </p>
            </div>
            <button
              onClick={handleNext}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors text-base"
            >
              {idx + 1 >= total ? 'See Results' : 'Next →'}
            </button>
          </div>
        )}

        {/* running score */}
        <div className="text-center text-xs text-gray-400">
          {results.filter(r => r.correct).length} correct so far
        </div>
      </main>
    </div>
  );
}

export default function DrillPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>}>
      <DrillContent />
    </Suspense>
  );
}
