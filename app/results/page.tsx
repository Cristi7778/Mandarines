'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clearPendingDrill, getPendingDrill } from '@/lib/storage';
import type { DrillResult, PendingDrillMeta } from '@/lib/types';

export default function ResultsPage() {
  const [results, setResults] = useState<DrillResult[]>([]);
  const [meta, setMeta] = useState<PendingDrillMeta | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const { results: r, meta: m } = getPendingDrill();
    setResults(r);
    setMeta(m);
    clearPendingDrill();
  }, []);

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="space-y-3">
          <p className="text-gray-500">No results to show.</p>
          <Link href="/" className="text-red-600 underline text-sm">Go home</Link>
        </div>
      </div>
    );
  }

  const pct = meta.total === 0 ? 0 : Math.round((meta.score / meta.total) * 100);
  const wrong = results.filter(r => !r.correct);

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-500 text-sm">← Home</Link>
          <h1 className="font-semibold text-gray-800">Results</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm space-y-3">
          <div className="text-5xl">{pct === 100 ? '🎉' : pct >= 70 ? '👍' : '💪'}</div>
          <p className="text-4xl font-bold text-gray-900">{pct}%</p>
          <p className="text-gray-500">{meta.score} / {meta.total} correct</p>
          <div className="w-full bg-gray-100 rounded-full h-3 mt-2">
            <div
              className="h-3 rounded-full transition-all bg-gradient-to-r from-red-500 to-amber-400"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="inline-block bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mt-2">
            <span className="text-amber-700 font-bold">+{meta.xpEarned} XP</span>
          </div>
        </div>

        {/* Wrong items review */}
        {wrong.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Review ({wrong.length} missed)</h2>
              {wrong.length > 3 && (
                <button onClick={() => setShowAll(v => !v)} className="text-xs text-red-600 underline">
                  {showAll ? 'Show less' : 'Show all'}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showAll ? wrong : wrong.slice(0, 3)).map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50 rounded-xl px-3 py-2.5">
                  <span className="text-lg shrink-0">❌</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl chinese-text font-bold text-gray-800">{r.question.item.chineseChar}</span>
                      <span className="text-sm text-red-600 font-semibold">{r.question.item.pinyin}</span>
                      <span className="text-sm text-gray-500">{r.question.item.englishMeaning}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">You typed: {r.userAnswer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfect score */}
        {wrong.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-green-700 font-semibold">Perfect score! Outstanding work.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/recap"
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors text-center text-base"
          >
            New Recap Drill
          </Link>
          <Link
            href="/"
            className="w-full border border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            Back to Journey Map
          </Link>
        </div>
      </main>
    </div>
  );
}
