'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTopicById } from '@/lib/data/topics';
import { comparePinyin, toToneMarks } from '@/lib/pinyin';
import {
  getTopicProgress,
  saveTopicProgress,
  getUserProgress,
  saveUserProgress,
  saveItemProgress,
  getItemProgress,
} from '@/lib/db';
import { addXp, updateStreak, xpForStep, xpToNextLevel } from '@/lib/xp';
import { useUser } from '@/hooks/useUser';
import type { DrillQuestion, DrillResult, Item, TopicProgress, UserProgress } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function buildDrillQuestions(items: Item[], types: Array<'pinyin-from-english' | 'pinyin-from-char'>): DrillQuestion[] {
  const qs: DrillQuestion[] = [];
  for (const item of items) {
    for (const type of types) {
      qs.push({ type, item });
    }
  }
  // shuffle
  for (let i = qs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [qs[i], qs[j]] = [qs[j]!, qs[i]!];
  }
  return qs;
}

// ─── Step nav ───────────────────────────────────────────────────────────────

const STEP_LABELS = ['Teach', 'Pinyin', 'Chars', 'Speak', 'Stroke', 'Writing', 'Mixed'];

function StepNav({
  current,
  progress,
  onNavigate,
}: {
  current: number;
  progress: TopicProgress;
  onNavigate: (step: number) => void;
}) {
  const dones = [
    progress.step1Complete, progress.step2Complete, progress.step3Complete,
    progress.step4Complete, progress.step5Complete, progress.step6Complete, progress.step7Complete,
  ];
  return (
    <div className="flex items-center justify-between px-1">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const done = dones[i];
        const active = step === current;
        return (
          <button
            key={step}
            onClick={() => onNavigate(step)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
              done
                ? 'bg-green-500 border-green-500 text-white'
                : active
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-white border-gray-300 text-gray-400 group-hover:border-gray-400'
            }`}>
              {done ? '✓' : step}
            </div>
            <span className={`text-sm ${active ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 1: Explanation ─────────────────────────────────────────────────────

function ExplanationStep({
  items,
  onComplete,
}: {
  items: Item[];
  onComplete: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Enter') onComplete(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onComplete]);

  return (
    <div className="space-y-4">
      <p className="text-base text-gray-500">Read through each word, then continue when ready.</p>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-center">
            <div className="text-5xl font-bold chinese-text text-gray-900 leading-none shrink-0">{item.chineseChar}</div>
            <div className="min-w-0">
              <div className="text-lg font-medium text-orange-500">{item.pinyin}</div>
              <div className="text-base font-medium text-gray-800 mt-0.5">{item.englishMeaning}</div>
              <div className="text-base text-gray-500 mt-1 chinese-text">
                {item.examplePrefix}
                <span className="text-orange-500 font-semibold">{item.chineseChar}</span>
                {item.exampleSuffix}
              </div>
              <div className="text-sm text-gray-400 italic mt-0.5">{item.exampleEnglish}</div>
              {item.notes && (
                <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1.5">
                  💡 {item.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors text-base"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Inline Drill ────────────────────────────────────────────────────────────

function InlineDrill({
  questions,
  onComplete,
}: {
  questions: DrillQuestion[];
  onComplete: (results: DrillResult[]) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [results, setResults] = useState<DrillResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Set true on submit so the advance listener skips the very keydown that triggered it
  const skipAdvanceRef = useRef(false);

  const q = questions[idx]!;
  const total = questions.length;
  const pct = Math.round((idx / total) * 100);

  useEffect(() => {
    if (!submitted) inputRef.current?.focus();
  }, [idx, submitted]);

  useEffect(() => {
    if (!submitted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      if (skipAdvanceRef.current) { skipAdvanceRef.current = false; return; }
      handleNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitted, idx]);

  function handleSubmit() {
    if (!input.trim()) return;
    skipAdvanceRef.current = true;
    const isCorrect = comparePinyin(input, q.item.pinyin);
    setCorrect(isCorrect);
    setSubmitted(true);
    setResults(prev => [...prev, { question: q, userAnswer: input.trim(), correct: isCorrect }]);
  }

  function handleNext() {
    if (idx + 1 >= total) {
      onComplete([...results]);
    } else {
      setIdx(i => i + 1);
      setInput('');
      setSubmitted(false);
      setCorrect(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !submitted) handleSubmit();
  }

  const { item, type } = q;
  const converted = input ? toToneMarks(input) : '';

  return (
    <div className="space-y-4">
      {/* progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{idx + 1}/{total}</span>
      </div>

      {/* question */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        {type === 'pinyin-from-english' ? (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pinyin drill</p>
            <p className="text-base text-gray-600 italic">{item.exampleEnglish}</p>
            <p className="text-2xl chinese-text text-gray-800 font-medium leading-relaxed">
              {item.examplePrefix}
              <span className="inline-block border-b-2 border-dashed border-orange-400 min-w-[3rem] mx-1 text-center text-orange-400">
                {submitted ? <span className="text-red-600">{item.chineseChar}</span> : '?'}
              </span>
              {item.exampleSuffix}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Character → Pinyin</p>
            <p className="text-2xl chinese-text text-gray-800 font-medium leading-relaxed">
              {item.examplePrefix}
              <span className="inline-block bg-orange-50 border border-orange-300 rounded px-1.5 mx-1 text-orange-700 font-bold">
                {item.chineseChar}
              </span>
              {item.exampleSuffix}
            </p>
            <p className="text-base text-gray-400 italic">{item.exampleEnglish}</p>
          </>
        )}
      </div>

      {/* input */}
      {!submitted ? (
        <div className="space-y-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type pinyin, e.g. ni3 hao3"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          {converted && (
            <p className="text-base text-gray-500 px-1">
              → <span className="text-orange-500 font-medium">{converted}</span>
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 text-base"
          >
            Check
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className={`rounded-xl p-4 ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{correct ? '✅' : '❌'}</span>
              <span className={`font-semibold ${correct ? 'text-green-700' : 'text-red-700'}`}>
                {correct ? 'Correct!' : 'Not quite'}
              </span>
            </div>
            {!correct && (
              <p className="text-sm text-gray-600">
                Correct: <span className="font-semibold text-red-700">{item.pinyin}</span>{' '}
                · You typed: <span className="font-medium text-gray-500">{toToneMarks(results[results.length - 1]?.userAnswer ?? '')}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {item.chineseChar} · {item.englishMeaning}
            </p>
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors text-base"
          >
            {idx + 1 >= total ? 'Finish' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step complete screen ────────────────────────────────────────────────────

function StepResultScreen({
  step,
  score,
  total,
  xpEarned,
  autoComplete,
  onMarkComplete,
  onNext,
  onRetry,
}: {
  step: number;
  score: number;
  total: number;
  xpEarned: number;
  autoComplete: boolean;
  onMarkComplete: () => void;
  onNext: () => void;
  onRetry: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Enter') onNext(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);

  const pct = Math.round((score / total) * 100);
  return (
    <div className="space-y-4 text-center">
      <div className="text-6xl">{pct === 100 ? '🎉' : pct >= 70 ? '👍' : '💪'}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{score}/{total} correct</p>
        <p className="text-gray-500">{pct}%</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 inline-block">
        <span className="text-amber-700 font-semibold">+{xpEarned} XP</span>
      </div>
      {autoComplete ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-green-700 font-semibold">Step {step} complete!</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-amber-700 text-sm">Score 100% to auto-complete, or mark done manually.</p>
          <button onClick={onMarkComplete} className="mt-2 text-sm underline text-amber-700">
            Mark step complete anyway
          </button>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 text-base">
          Retry
        </button>
        <button onClick={onNext} className="flex-1 bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 text-base">
          Next Step →
        </button>
      </div>
    </div>
  );
}

// ─── Coming soon placeholder ─────────────────────────────────────────────────

function ComingSoonStep({ step, label, onSkip }: { step: number; label: string; onSkip: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Enter') onSkip(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  return (
    <div className="text-center py-12 space-y-4">
      <div className="text-5xl">{step === 4 ? '🎙️' : '✏️'}</div>
      <p className="text-xl font-semibold text-gray-800">Step {step}: {label}</p>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">
        {step === 4
          ? 'Speaking practice with pronunciation scoring is coming in a future update.'
          : 'Character writing and stroke-order practice is coming in a future update.'}
      </p>
      <button
        onClick={onSkip}
        className="bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
      >
        Skip for now →
      </button>
    </div>
  );
}

// ─── Step 5: Stroke-order writing (hanzi-writer) ─────────────────────────────

function WriterCanvas({
  char,
  phase,
  onQuizDone,
}: {
  char: string;
  phase: 'watch' | 'quiz';
  onQuizDone: (mistakes: number) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let cancelled = false;

    import('hanzi-writer').then(({ default: HanziWriter }) => {
      if (cancelled || !divRef.current) return;
      const writer = (HanziWriter as any).create(divRef.current, char, {
        width: 220,
        height: 220,
        padding: 5,
        showOutline: true,
        strokeColor: '#ea580c',
        outlineColor: '#d1d5db',
        drawingColor: '#1f2937',
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 300,
        charDataLoader: (c: string, onLoad: (d: unknown) => void) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${c}.json`)
            .then(r => r.json())
            .then(onLoad)
            .catch(() => onLoad(null));
        },
      });

      if (phase === 'watch') {
        writer.animateCharacter();
      } else {
        writer.quiz({
          leniency: 1,
          onComplete: (summary: { totalMistakes: number }) => {
            if (!cancelled) onQuizDone(summary.totalMistakes);
          },
        });
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={divRef} style={{ width: 220, height: 220 }} />;
}

function HanziWriterStep({
  items,
  onComplete,
}: {
  items: Item[];
  onComplete: (score: number, total: number) => void;
}) {
  const chars = useMemo(() =>
    items.flatMap(item =>
      [...item.chineseChar].map((c, ci) => ({
        char: c,
        word: item.chineseChar,
        pinyin: item.pinyin,
        meaning: item.englishMeaning,
        isFirst: ci === 0,
      }))
    ), [items]);

  const total = chars.length;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'watch' | 'quiz' | 'result'>('watch');
  const [currentMistakes, setCurrentMistakes] = useState(0);
  const scoreRef = useRef(0);

  const current = chars[idx];

  function handleQuizDone(mistakes: number) {
    setCurrentMistakes(mistakes);
    if (mistakes < 3) scoreRef.current += 1;
    setPhase('result');
  }

  function handleNext() {
    if (idx + 1 >= total) {
      onComplete(scoreRef.current, total);
    } else {
      setIdx(i => i + 1);
      setPhase('watch');
      setCurrentMistakes(0);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      if (phase === 'result') handleNext();
      else if (phase === 'watch') setPhase('quiz');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, idx]);

  if (!current) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${(idx / total) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{idx + 1}/{total}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{current.meaning}</p>
        <p className="text-3xl chinese-text font-bold text-gray-800">{current.word}</p>
        <p className="text-base text-orange-500">{current.pinyin}</p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
          <WriterCanvas
            key={`${idx}-${phase === 'quiz' ? 'quiz' : 'watch'}`}
            char={current.char}
            phase={phase === 'quiz' ? 'quiz' : 'watch'}
            onQuizDone={handleQuizDone}
          />
        </div>
      </div>

      {phase === 'watch' && (
        <div className="space-y-2">
          <p className="text-center text-sm text-gray-500">Watch the stroke order, then try it yourself</p>
          <button
            onClick={() => setPhase('quiz')}
            className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 text-base"
          >
            Try it yourself →
          </button>
        </div>
      )}
      {phase === 'quiz' && (
        <div className="text-center space-y-1">
          <p className="text-sm text-gray-500">Draw each stroke in the correct order</p>
          <p className="text-xs text-gray-400">Follow the grey outline</p>
        </div>
      )}
      {phase === 'result' && (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 text-center ${currentMistakes < 3 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`font-semibold text-lg ${currentMistakes < 3 ? 'text-green-700' : 'text-amber-700'}`}>
              {currentMistakes === 0
                ? '✅ Perfect!'
                : currentMistakes < 3
                ? `👍 ${currentMistakes} mistake${currentMistakes !== 1 ? 's' : ''}`
                : `💪 ${currentMistakes} mistakes — keep practicing`}
            </p>
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 text-base"
          >
            {idx + 1 >= total ? 'Finish' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 7: Mixed Practice ──────────────────────────────────────────────────

type MixedQ =
  | { kind: 'pinyin'; q: DrillQuestion }
  | { kind: 'stroke'; item: Item; char: string };

function MixedPracticeStep({
  items,
  onComplete,
}: {
  items: Item[];
  onComplete: (score: number, total: number) => void;
}) {
  // Sample 4 items independently per exercise type so different words are tested each way
  const questions = useMemo<MixedQ[]>(() => {
    function sample(n: number) { return [...items].sort(() => Math.random() - 0.5).slice(0, n); }
    const qs: MixedQ[] = [
      ...sample(4).map(item => ({ kind: 'pinyin' as const, q: { type: 'pinyin-from-english' as const, item } })),
      ...sample(4).map(item => ({ kind: 'pinyin' as const, q: { type: 'pinyin-from-char' as const, item } })),
      ...sample(4).map(item => ({ kind: 'stroke' as const, item, char: item.chineseChar[0]! })),
    ];
    return qs.sort(() => Math.random() - 0.5);
  }, [items]);

  const [idx, setIdx] = useState(0);
  const scoreRef = useRef(0);

  // Drill question state
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [drillCorrect, setDrillCorrect] = useState(false);

  // Stroke question state
  const [strokePhase, setStrokePhase] = useState<'watch' | 'quiz' | 'result'>('watch');
  const [strokeMistakes, setStrokeMistakes] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const total = questions.length;
  const current = questions[idx]!;
  const currentDrill = current.kind === 'pinyin' ? current : null;
  const currentStroke = current.kind === 'stroke' ? current : null;

  // Reset per-question state when moving to a new question
  useEffect(() => {
    setInput('');
    setSubmitted(false);
    setDrillCorrect(false);
    setStrokePhase('watch');
    setStrokeMistakes(0);
  }, [idx]);

  // Focus input when a drill question appears
  useEffect(() => {
    if (currentDrill && !submitted) inputRef.current?.focus();
  }, [idx, submitted, currentDrill]);

  // Enter key: stroke watch phase → start quiz
  useEffect(() => {
    if (!currentStroke || strokePhase !== 'watch') return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Enter') setStrokePhase('quiz'); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentStroke, strokePhase]);

  function advance(correct: boolean) {
    if (correct) scoreRef.current += 1;
    if (idx + 1 >= total) {
      onComplete(scoreRef.current, total);
    } else {
      setIdx(i => i + 1);
    }
  }

  const skipDrillAdvanceRef = useRef(false);

  useEffect(() => {
    if (!submitted || !currentDrill) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      if (skipDrillAdvanceRef.current) { skipDrillAdvanceRef.current = false; return; }
      advance(drillCorrect);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitted, idx, drillCorrect]);

  function handleDrillSubmit() {
    if (!input.trim() || !currentDrill) return;
    skipDrillAdvanceRef.current = true;
    const isCorrect = comparePinyin(input, currentDrill.q.item.pinyin);
    setDrillCorrect(isCorrect);
    setSubmitted(true);
  }

  const converted = input ? toToneMarks(input) : '';

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${(idx / total) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{idx + 1} / {total}</span>
      </div>

      {/* Drill question (pinyin / char recognition) */}
      {currentDrill && (() => {
        const { item, type } = currentDrill.q;
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              {type === 'pinyin-from-english' ? (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pinyin</p>
                  <p className="text-base text-gray-600 italic">{item.exampleEnglish}</p>
                  <p className="text-2xl chinese-text text-gray-800 font-medium leading-relaxed">
                    {item.examplePrefix}
                    <span className="inline-block border-b-2 border-dashed border-orange-400 min-w-[3rem] mx-1 text-center text-orange-400">
                      {submitted ? <span className="text-red-600">{item.chineseChar}</span> : '?'}
                    </span>
                    {item.exampleSuffix}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Character → Pinyin</p>
                  <p className="text-2xl chinese-text text-gray-800 font-medium leading-relaxed">
                    {item.examplePrefix}
                    <span className="inline-block bg-orange-50 border border-orange-300 rounded px-1.5 mx-1 text-orange-700 font-bold">
                      {item.chineseChar}
                    </span>
                    {item.exampleSuffix}
                  </p>
                  <p className="text-base text-gray-400 italic">{item.exampleEnglish}</p>
                </>
              )}
            </div>
            {!submitted ? (
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleDrillSubmit(); }}
                  placeholder="Type pinyin, e.g. ni3 hao3"
                  className="w-full border border-gray-300 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                {converted && (
                  <p className="text-base text-gray-500 px-1">→ <span className="text-orange-500 font-medium">{converted}</span></p>
                )}
                <button
                  onClick={handleDrillSubmit}
                  disabled={!input.trim()}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 text-base"
                >
                  Check
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`rounded-xl p-4 ${drillCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{drillCorrect ? '✅' : '❌'}</span>
                    <span className={`font-semibold ${drillCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {drillCorrect ? 'Correct!' : 'Not quite'}
                    </span>
                  </div>
                  {!drillCorrect && (
                    <p className="text-sm text-gray-600">
                      Correct: <span className="font-semibold text-red-700">{item.pinyin}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{item.chineseChar} · {item.englishMeaning}</p>
                </div>
                <button
                  onClick={() => advance(drillCorrect)}
                  className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 text-base"
                >
                  {idx + 1 >= total ? 'Finish' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Stroke order question */}
      {currentStroke && (() => {
        const { item, char } = currentStroke;
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stroke Order</p>
              <p className="text-3xl chinese-text font-bold text-gray-800">{item.chineseChar}</p>
              <p className="text-base text-orange-500">{item.pinyin}</p>
              <p className="text-sm text-gray-500">{item.englishMeaning}</p>
            </div>
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
                <WriterCanvas
                  key={`${idx}-${strokePhase}`}
                  char={char}
                  phase={strokePhase === 'quiz' ? 'quiz' : 'watch'}
                  onQuizDone={(mistakes) => { setStrokeMistakes(mistakes); setStrokePhase('result'); }}
                />
              </div>
            </div>
            {strokePhase === 'watch' && (
              <div className="space-y-2">
                <p className="text-center text-sm text-gray-500">Watch the stroke order, then try it yourself</p>
                <button
                  onClick={() => setStrokePhase('quiz')}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 text-base"
                >
                  Try it yourself →
                </button>
              </div>
            )}
            {strokePhase === 'quiz' && (
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">Draw each stroke in the correct order</p>
                <p className="text-xs text-gray-400">Follow the grey outline</p>
              </div>
            )}
            {strokePhase === 'result' && (
              <div className="space-y-3">
                <div className={`rounded-xl p-4 text-center ${strokeMistakes < 3 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`font-semibold text-lg ${strokeMistakes < 3 ? 'text-green-700' : 'text-amber-700'}`}>
                    {strokeMistakes === 0 ? '✅ Perfect!' : strokeMistakes < 3 ? `👍 ${strokeMistakes} mistake${strokeMistakes !== 1 ? 's' : ''}` : `💪 ${strokeMistakes} mistakes`}
                  </p>
                </div>
                <button
                  autoFocus
                  onClick={() => advance(strokeMistakes < 3)}
                  className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 text-base"
                >
                  {idx + 1 >= total ? 'Finish' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

type DrillingState = { drilling: false } | { drilling: true; questions: DrillQuestion[] };

export default function LearnPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const topic = getTopicById(topicId);
  const router = useRouter();
  const user = useUser();

  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [drilling, setDrilling] = useState<DrillingState>({ drilling: false });
  const [stepResult, setStepResult] = useState<{ score: number; total: number; xpEarned: number; autoComplete: boolean } | null>(null);

  // Stable ref so the Enter-key listener can always call the latest handler
  // without being re-registered on every render (fixes Rules-of-Hooks ordering).
  const enterKeyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    function onKey(e: KeyboardEvent) { enterKeyRef.current(e); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // mount/unmount only — must stay before any early returns

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    async function load() {
      const p = await getTopicProgress(topicId);
      setProgress(p);
      setUserProgress(await getUserProgress());
      const steps = [p.step1Complete, p.step2Complete, p.step3Complete, p.step4Complete, p.step5Complete, p.step6Complete, p.step7Complete];
      const firstIncomplete = steps.findIndex(s => !s);
      if (firstIncomplete !== -1) setStep(firstIncomplete + 1);
    }
    load();
  }, [user, topicId, router]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center">
        <div className="text-4xl chinese-text text-red-600 font-bold animate-pulse">🍊</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-500">Topic not found.</p>
          <Link href="/" className="text-orange-500 underline">Back to home</Link>
        </div>
      </div>
    );
  }

  function markStepComplete(s: number, p: TopicProgress): TopicProgress {
    const updated = { ...p };
    if (s === 1) updated.step1Complete = true;
    if (s === 2) updated.step2Complete = true;
    if (s === 3) updated.step3Complete = true;
    if (s === 4) updated.step4Complete = true;
    if (s === 5) updated.step5Complete = true;
    if (s === 6) updated.step6Complete = true;
    if (s === 7) updated.step7Complete = true;
    return updated;
  }

  async function awardXp(xp: number) {
    if (!userProgress) return;
    const updated = updateStreak(addXp(userProgress, xp));
    await saveUserProgress(updated);
    setUserProgress(updated);
  }

  async function handleStep1Complete() {
    if (!progress) return;
    const updated = markStepComplete(1, progress);
    await saveTopicProgress(updated);
    setProgress(updated);
    if (!progress.step1Complete) await awardXp(xpForStep(1, 1, 1));
    setStep(2);
  }

  function startDrill(targetStep: number) {
    if (!topic) return;
    let qs: DrillQuestion[];
    if (targetStep === 2) {
      qs = buildDrillQuestions(topic.items, ['pinyin-from-english']);
    } else if (targetStep === 3) {
      qs = buildDrillQuestions(topic.items, ['pinyin-from-char']);
    } else {
      qs = buildDrillQuestions(topic.items, ['pinyin-from-english', 'pinyin-from-char']);
    }
    setDrilling({ drilling: true, questions: qs });
    setStepResult(null);
  }

  async function handleDrillComplete(results: DrillResult[]) {
    if (!progress) return;
    const score = results.filter(r => r.correct).length;
    const total = results.length;
    const xp = xpForStep(step, score, total);
    const autoComplete = score === total;

    // save item progress (parallel)
    await Promise.all(
      results.map(async r => {
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

    const stepKey = `step${step}Complete` as keyof TopicProgress;
    const alreadyComplete = !!progress[stepKey];
    if (!alreadyComplete) await awardXp(xp);

    if (autoComplete) {
      const updated = markStepComplete(step, progress);
      await saveTopicProgress(updated);
      setProgress(updated);
    }

    setDrilling({ drilling: false });
    setStepResult({ score, total, xpEarned: xp, autoComplete });
  }

  async function handleMarkComplete() {
    if (!progress) return;
    const updated = markStepComplete(step, progress);
    await saveTopicProgress(updated);
    setProgress(updated);
    setStepResult(prev => prev ? { ...prev, autoComplete: true } : prev);
  }

  function handleNextStep() {
    setStepResult(null);
    setStep(s => Math.min(s + 1, 7));
  }

  function handleRetry() {
    setStepResult(null);
    startDrill(step);
  }

  async function handleSkipComingSoon() {
    if (!progress) return;
    const updated = markStepComplete(step, progress);
    await saveTopicProgress(updated);
    setProgress(updated);
    setStep(s => Math.min(s + 1, 7));
  }

  async function handleWritingComplete(score: number, total: number) {
    if (!progress) return;
    const xp = xpForStep(5, score, total);
    const autoComplete = score === total;
    const alreadyComplete = !!progress.step5Complete;
    if (!alreadyComplete) await awardXp(xp);
    if (autoComplete) {
      const updated = markStepComplete(5, progress);
      await saveTopicProgress(updated);
      setProgress(updated);
    }
    setStepResult({ score, total, xpEarned: xp, autoComplete });
  }

  async function handleMixedComplete(score: number, total: number) {
    if (!progress) return;
    const xp = xpForStep(7, score, total);
    const autoComplete = score === total;
    const alreadyComplete = !!progress.step7Complete;
    if (!alreadyComplete) await awardXp(xp);
    if (autoComplete) {
      const updated = markStepComplete(7, progress);
      await saveTopicProgress(updated);
      setProgress(updated);
    }
    setStepResult({ score, total, xpEarned: xp, autoComplete });
  }

  const xpInfo = userProgress ? xpToNextLevel(userProgress.totalXp) : null;

  // Update the ref with fresh closures each render — no hook needed.
  // Steps 6 (Writing/ComingSoon) and 7 (Mixed) handle Enter internally.
  enterKeyRef.current = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (stepResult || drilling.drilling) return;
    if (step === 2 || step === 3) {
      if (progress?.['step' + step + 'Complete' as keyof TopicProgress]) handleNextStep();
      else startDrill(step);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
      {/* header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-2 py-3 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-lg font-semibold shrink-0 pl-1">
            ← Home
          </Link>
          <h1 className="font-bold text-gray-800 text-xl truncate flex-1">{topic.name}</h1>
          {userProgress && xpInfo && (
            <div className="flex items-center gap-2 text-base shrink-0">
              <span className="text-amber-600 font-bold">Lv {userProgress.level}</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${xpInfo.percent}%` }} />
              </div>
              <span className="text-gray-500 font-medium">{userProgress.totalXp} XP</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* step nav */}
        {progress && (
          <StepNav
            current={step}
            progress={progress}
            onNavigate={s => {
              setDrilling({ drilling: false });
              setStepResult(null);
              setStep(s);
            }}
          />
        )}

        {/* content */}
        <div className="bg-[#fcf0d7]">
          {/* Step result screen */}
          {stepResult && (
            <StepResultScreen
              step={step}
              score={stepResult.score}
              total={stepResult.total}
              xpEarned={stepResult.xpEarned}
              autoComplete={stepResult.autoComplete}
              onMarkComplete={handleMarkComplete}
              onNext={handleNextStep}
              onRetry={handleRetry}
            />
          )}

          {/* Active drill */}
          {!stepResult && drilling.drilling && (
            <InlineDrill questions={drilling.questions} onComplete={handleDrillComplete} />
          )}

          {/* Step display (not drilling, no result) */}
          {!stepResult && !drilling.drilling && (
            <>
              {step === 1 && (
                <ExplanationStep items={topic.items} onComplete={handleStep1Complete} />
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Step 2: Pinyin Drill</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      You'll see an English sentence and a Chinese sentence with the target word blanked.
                      Type the pinyin (use tone numbers: ni3 hao3).
                    </p>
                  </div>
                  {progress?.step2Complete && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm font-medium">
                      ✓ Step complete — review or skip to next
                    </div>
                  )}
                  <button
                    onClick={() => startDrill(2)}
                    className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    {progress?.step2Complete ? 'Practice again' : 'Start drill'} ({topic.items.length} words)
                  </button>
                  {progress?.step2Complete && (
                    <button onClick={handleNextStep} className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50">
                      Next Step →
                    </button>
                  )}
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Step 3: Character Recognition</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      You'll see the Chinese character highlighted in a sentence. Type its pinyin.
                    </p>
                  </div>
                  {progress?.step3Complete && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm font-medium">
                      ✓ Step complete — review or skip to next
                    </div>
                  )}
                  <button
                    onClick={() => startDrill(3)}
                    className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    {progress?.step3Complete ? 'Practice again' : 'Start drill'} ({topic.items.length} words)
                  </button>
                  {progress?.step3Complete && (
                    <button onClick={handleNextStep} className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50">
                      Next Step →
                    </button>
                  )}
                </div>
              )}
              {step === 4 && (
                <ComingSoonStep step={4} label="Speaking Practice" onSkip={handleSkipComingSoon} />
              )}
              {step === 5 && (
                <HanziWriterStep items={topic.items} onComplete={handleWritingComplete} />
              )}
              {step === 6 && (
                <ComingSoonStep step={6} label="Writing Practice" onSkip={handleSkipComingSoon} />
              )}
              {step === 7 && (
                <MixedPracticeStep items={topic.items} onComplete={handleMixedComplete} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
