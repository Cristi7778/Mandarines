'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TOPICS, { STATIONS } from '@/lib/data/topics';

type Skill = 'pinyin' | 'character';

const SKILL_LABELS: Record<Skill, string> = {
  pinyin: 'Pinyin',
  character: 'Character',
};
const SKILL_DESC: Record<Skill, string> = {
  pinyin: 'Type pinyin from an English prompt',
  character: 'Type pinyin from the displayed character',
};

const COUNTS = [10, 20, 30] as const;

const topicsWithItems = TOPICS.filter(t => t.items.length > 0);

export default function RecapPage() {
  const router = useRouter();

  const [skills, setSkills] = useState<Set<Skill>>(new Set<Skill>(['pinyin']));
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set<string>());
  const [count, setCount] = useState<number>(10);

  function toggleSkill(s: Skill) {
    setSkills(prev => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size > 1) next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  }

  function toggleTopic(id: string) {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedTopics(new Set(topicsWithItems.map(t => t.id)));
  }

  function clearAll() {
    setSelectedTopics(new Set());
  }

  function startDrill() {
    if (selectedTopics.size === 0 || skills.size === 0) return;
    const params = new URLSearchParams({
      topics: [...selectedTopics].join(','),
      skills: [...skills].join(','),
      count: String(count),
    });
    router.push(`/drill?${params.toString()}`);
  }

  const canStart = selectedTopics.size > 0 && skills.size > 0;

  return (
    <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Home</Link>
          <h1 className="font-semibold text-gray-800">Recap Builder</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Skills */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Skill to practice</h2>
          <div className="flex flex-col gap-2">
            {(Object.keys(SKILL_LABELS) as Skill[]).map(s => (
              <button
                key={s}
                onClick={() => toggleSkill(s)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  skills.has(s)
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  skills.has(s) ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                }`}>
                  {skills.has(s) && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800">{SKILL_LABELS[s]}</p>
                  <p className="text-xs text-gray-500">{SKILL_DESC[s]}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Question count */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Number of questions</h2>
          <div className="flex gap-2">
            {COUNTS.map(c => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${
                  count === c
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Topics */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Topics</h2>
            <div className="flex gap-3 text-xs">
              <button onClick={selectAll} className="text-orange-500 underline">All</button>
              <button onClick={clearAll} className="text-gray-400 underline">None</button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {selectedTopics.size} of {topicsWithItems.length} selected
          </p>
          <div className="space-y-4">
            {STATIONS.map(station => {
              const stationTopics = topicsWithItems.filter(t => t.station === station);
              if (stationTopics.length === 0) return null;
              return (
                <div key={station}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{station}</p>
                  <div className="space-y-1">
                    {stationTopics.map(t => (
                      <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selectedTopics.has(t.id) ? 'border-orange-500 bg-orange-500' : 'border-gray-300 group-hover:border-gray-400'
                          }`}
                          onClick={() => toggleTopic(t.id)}
                        >
                          {selectedTopics.has(t.id) && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="min-w-0" onClick={() => toggleTopic(t.id)}>
                          <span className="text-sm text-gray-700">{t.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({t.items.length})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <button
          onClick={startDrill}
          disabled={!canStart}
          className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-base"
        >
          Start Recap Drill
        </button>
      </main>
    </div>
  );
}
