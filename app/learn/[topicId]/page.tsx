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
import { loadModel, recognizeChar } from '@/lib/char-recognition';

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

// Visual display order → DB step numbers.
// step 8 = Listen (new); step 4 = Speak (ComingSoon); steps 1-3,5-7 unchanged.
const STEP_SEQUENCE = [1, 2, 3, 8, 4, 5, 6, 7] as const;
const STEP_LABELS   = ['Teach', 'Pinyin', 'Chars', 'Listen', 'Speak', 'Stroke', 'Writing', 'Mixed'];

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function StepNav({
  current,
  progress,
  onNavigate,
}: {
  current: number;
  progress: TopicProgress;
  onNavigate: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      {STEP_SEQUENCE.map((dbStep, i) => {
        const label = STEP_LABELS[i]!;
        const key = `step${dbStep}Complete` as keyof TopicProgress;
        const done  = !!progress[key];
        const step  = dbStep;
        const active = step === current;
        return (
          <button
            key={dbStep}
            onClick={() => onNavigate(dbStep)}
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
            <span className={`text-xs ${active ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
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
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="text-5xl font-bold chinese-text text-gray-900 leading-none">{item.chineseChar}</div>
              <button
                onClick={() => speak(item.chineseChar)}
                className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-base transition-colors"
                title="Play pronunciation"
              >🔊</button>
            </div>
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

// ─── Step 4: Speaking practice ───────────────────────────────────────────────

type SpeakResult = 'correct' | 'wrong-tone' | 'incorrect';

function stripToneMarks(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[12345]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function SpeakingStep({ items, onComplete }: { items: Item[]; onComplete: (score: number, total: number) => void }) {
  const SAMPLE = Math.min(4, items.length);
  const [queue] = useState<Item[]>(() => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, SAMPLE);
  });
  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<SpeakResult | null>(null);
  const [recognized, setRecognized] = useState('');
  const scoreRef = useRef(0);
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as Record<string, unknown>;
    return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
  });

  const item = queue[idx];

  // Build base-pinyin lookup from all items so we can detect tone variants
  const basePinyinMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const it of items) {
      for (const ch of it.chineseChar) {
        map[ch] = stripToneMarks(it.pinyin);
      }
    }
    return map;
  }, [items]);

  function classify(text: string, expected: Item): SpeakResult {
    const clean = text.replace(/\s/g, '');
    if (clean === expected.chineseChar) return 'correct';
    const expectedBase = stripToneMarks(expected.pinyin);
    for (const ch of clean) {
      if (basePinyinMap[ch] === expectedBase) return 'wrong-tone';
    }
    return 'incorrect';
  }

  function startListening() {
    type SR = { lang: string; interimResults: boolean; maxAlternatives: number; onresult: ((e: { results: { length: number; [i: number]: { transcript: string }[] } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start(): void };
    const w = window as unknown as Record<string, unknown>;
    const SRClass = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => SR) | undefined;
    if (!SRClass) return;
    const rec = new SRClass();
    rec.lang = 'zh-CN';
    rec.interimResults = false;
    rec.maxAlternatives = 5;

    setListening(true);
    setResult(null);
    setRecognized('');

    rec.onresult = (e) => {
      // Check all alternatives for a correct / wrong-tone match
      let best: SpeakResult = 'incorrect';
      let bestText = (e.results[0][0] as { transcript: string }).transcript;
      for (let i = 0; i < e.results[0].length; i++) {
        const txt = (e.results[0][i] as { transcript: string }).transcript;
        const r = classify(txt, item);
        if (r === 'correct') { best = 'correct'; bestText = txt; break; }
        if (r === 'wrong-tone' && best === 'incorrect') { best = 'wrong-tone'; bestText = txt; }
      }
      setRecognized(bestText);
      setResult(best);
      if (best === 'correct') scoreRef.current += 1;
      setListening(false);
      // Play correct pronunciation
      const u = new SpeechSynthesisUtterance(item.chineseChar);
      u.lang = 'zh-CN'; u.rate = 0.85;
      window.speechSynthesis.speak(u);
    };

    rec.onerror = () => { setListening(false); setResult('incorrect'); };
    rec.onend   = () => { setListening(false); };
    rec.start();
  }

  function handleNext() {
    if (idx + 1 >= queue.length) {
      onComplete(scoreRef.current, queue.length);
    } else {
      setIdx(i => i + 1);
      setResult(null);
      setRecognized('');
    }
  }

  if (!supported) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-5xl">🎙️</div>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Speech recognition is not supported in this browser. Try Chrome or Edge.
        </p>
      </div>
    );
  }

  const resultConfig = {
    correct:    { color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200', icon: '✅', label: 'Correct!' },
    'wrong-tone': { color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200', icon: '🎵', label: 'Right word, check your tone' },
    incorrect:  { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',   icon: '❌', label: 'Incorrect' },
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 text-center">
        {idx + 1} / {queue.length} — Say the Chinese word aloud
      </p>

      {/* Prompt card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-2">
        <p className="text-gray-500 text-sm uppercase tracking-wide">Say</p>
        <p className="text-3xl font-bold text-gray-800">{item.englishMeaning}</p>
        <p className="text-orange-500 text-lg">{item.pinyin}</p>
      </div>

      {/* Speak button / result */}
      {!result ? (
        <button
          onClick={startListening}
          disabled={listening}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-3 ${
            listening
              ? 'bg-orange-100 text-orange-600 cursor-not-allowed animate-pulse'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {listening ? '🎙️ Listening…' : '🎙️ Tap to speak'}
        </button>
      ) : (
        <div className={`rounded-2xl border p-6 text-center space-y-3 ${resultConfig[result].bg} ${resultConfig[result].border}`}>
          <p className={`text-5xl font-bold ${resultConfig[result].color}`}>{item.chineseChar}</p>
          <p className={`font-semibold text-lg ${resultConfig[result].color}`}>
            {resultConfig[result].icon} {resultConfig[result].label}
          </p>
          {recognized && recognized !== item.chineseChar && (
            <p className="text-gray-500 text-sm">You said: <span className="font-medium text-gray-700">{recognized}</span></p>
          )}
          <p className="text-gray-600 text-sm">{item.pinyin} — {item.englishMeaning}</p>
          <button
            onClick={handleNext}
            className="mt-2 bg-white border border-gray-300 text-gray-700 font-semibold px-8 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {idx + 1 >= queue.length ? 'Finish' : 'Next →'}
          </button>
        </div>
      )}
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

// ─── Step 6: Writing Practice ────────────────────────────────────────────────

function WritingStep({
  items,
  onComplete,
}: {
  items: Item[];
  onComplete: (score: number, total: number) => void;
}) {
  // Prefer single-char items for clean prompts; fall back to first char of multi-char.
  const sampleItems = useMemo(() => {
    const single = items.filter(it => it.chineseChar.length === 1);
    const pool = single.length >= 4 ? single : items;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(4, pool.length));
  }, [items]);

  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null); // null = self-assess mode
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const scoreRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const total = sampleItems.length;
  const item = sampleItems[idx]!;
  const expectedChar = item.chineseChar[0]!;

  useEffect(() => {
    loadModel().then(ok => setModelReady(ok));
  }, []);

  // Set up drawing events once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function pos(e: MouseEvent | TouchEvent) {
      // canvas is non-null here (guarded above), but TS widens inside closures
      const el = canvas!;
      const r = el.getBoundingClientRect();
      const sx = el.width / r.width;
      const sy = el.height / r.height;
      if ('touches' in e && e.touches.length > 0) {
        const t = e.touches[0]!;
        return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
      }
      const me = e as MouseEvent;
      return { x: (me.clientX - r.left) * sx, y: (me.clientY - r.top) * sy };
    }
    function down(e: MouseEvent | TouchEvent) {
      isDrawingRef.current = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      e.preventDefault();
    }
    function move(e: MouseEvent | TouchEvent) {
      if (!isDrawingRef.current) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      e.preventDefault();
    }
    function up() { isDrawingRef.current = false; }

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', up);
    canvas.addEventListener('mouseleave', up);
    canvas.addEventListener('touchstart', down, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', up);
    return () => {
      canvas.removeEventListener('mousedown', down);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', up);
      canvas.removeEventListener('mouseleave', up);
      canvas.removeEventListener('touchstart', down);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', up);
    };
  }, []);

  // Clear canvas and reset state on new question
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSubmitted(false);
    setCorrect(null);
    setSnapshot(null);
  }, [idx]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    if (modelReady) {
      setLoading(true);
      const result = await recognizeChar(canvas, expectedChar);
      setCorrect(result.correct);
      if (result.correct) scoreRef.current += 1;
      setLoading(false);
    } else {
      setSnapshot(canvas.toDataURL());
      setCorrect(null);
    }
    setSubmitted(true);
  }

  function handleAdvance(got?: boolean) {
    if (got !== undefined) {
      if (got) scoreRef.current += 1;
    }
    if (idx + 1 >= total) onComplete(scoreRef.current, total);
    else setIdx(i => i + 1);
  }

  // Enter to advance when result is auto-determined (model path)
  const skipRef = useRef(false);
  useEffect(() => {
    if (!submitted || correct === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      if (skipRef.current) { skipRef.current = false; return; }
      handleAdvance();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitted, correct, idx]);

  const multiChar = item.chineseChar.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${(idx / total) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{idx + 1} / {total}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {multiChar ? 'Write the first character of' : 'Write the character for'}
        </p>
        <p className="text-xl font-semibold text-gray-800">{item.englishMeaning}</p>
        <p className="text-lg text-orange-500">{item.pinyin}</p>
      </div>

      <div className="flex justify-center">
        <div className={`rounded-2xl border-2 ${submitted ? 'border-gray-200 opacity-70' : 'border-dashed border-gray-300'} overflow-hidden bg-white`}>
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="touch-none block"
          />
        </div>
      </div>

      {!submitted ? (
        <div className="flex gap-3">
          <button
            onClick={clearCanvas}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 text-base"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 text-base"
          >
            {loading ? 'Checking…' : 'Submit'}
          </button>
        </div>
      ) : correct !== null ? (
        // Model result
        <div className="space-y-3">
          <div className={`rounded-xl p-4 flex items-center gap-4 ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <span className="text-2xl">{correct ? '✅' : '❌'}</span>
            <div>
              <p className={`font-semibold ${correct ? 'text-green-700' : 'text-red-700'}`}>
                {correct ? 'Correct!' : 'Not quite'}
              </p>
              <p className="text-sm text-gray-500">
                Answer: <span className="text-2xl chinese-text font-bold text-gray-800">{expectedChar}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => handleAdvance()}
            className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 text-base"
          >
            {idx + 1 >= total ? 'Finish' : 'Next →'}
          </button>
        </div>
      ) : (
        // Self-assess fallback (no model)
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 text-center">Compare your drawing</p>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Yours</p>
                {snapshot && (
                  <img src={snapshot} width={100} height={100} className="rounded-lg border border-gray-200 block" alt="your drawing" />
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Answer</p>
                <div className="w-[100px] h-[100px] rounded-lg border border-gray-200 bg-white flex items-center justify-center">
                  <span className="text-6xl chinese-text">{expectedChar}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-center text-gray-500">Were you close?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAdvance(false)}
              className="flex-1 border-2 border-red-300 text-red-600 font-semibold py-4 rounded-xl hover:bg-red-50 text-base"
            >
              Missed it
            </button>
            <button
              onClick={() => handleAdvance(true)}
              className="flex-1 border-2 border-green-400 text-green-700 font-semibold py-4 rounded-xl hover:bg-green-50 text-base"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 8 (visual 4): Listening ───────────────────────────────────────────

function ListeningStep({
  items,
  onComplete,
}: {
  items: Item[];
  onComplete: (score: number, total: number) => void;
}) {
  const questions = useMemo(() => {
    return [...items].sort(() => Math.random() - 0.5).slice(0, 6);
  }, [items]);

  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const scoreRef = useRef(0);
  const skipRef  = useRef(false);

  const q     = questions[idx]!;
  const total = questions.length;

  // Build 5 options: correct + 4 distractors (unique meanings)
  const options = useMemo(() => {
    const correct     = q.englishMeaning;
    const pool        = items.filter(i => i.id !== q.id && i.englishMeaning !== correct);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 4).map(i => i.englishMeaning);
    return [...distractors, correct].sort(() => Math.random() - 0.5);
  }, [q, items]);

  // Auto-play on new question
  useEffect(() => {
    speak(q.chineseChar);
    return () => { window.speechSynthesis?.cancel(); };
  }, [idx]);

  // Reset per-question state
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [idx]);

  // Enter to advance
  useEffect(() => {
    if (!submitted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      if (skipRef.current) { skipRef.current = false; return; }
      handleNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitted, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(option: string) {
    if (submitted) return;
    skipRef.current = true;
    setSelected(option);
    setSubmitted(true);
    if (option === q.englishMeaning) scoreRef.current++;
  }

  function handleNext() {
    if (idx + 1 >= total) onComplete(scoreRef.current, total);
    else setIdx(i => i + 1);
  }

  const isCorrect = selected === q.englishMeaning;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${(idx / total) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{idx + 1} / {total}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">What do you hear?</p>
        <button
          onClick={() => speak(q.chineseChar)}
          className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
        >
          <span className="text-4xl">🔊</span>
        </button>
        <p className="text-xs text-gray-400">Tap to replay</p>
      </div>

      <div className="grid gap-2">
        {options.map(option => {
          const optCorrect  = option === q.englishMeaning;
          const optSelected = option === selected;
          let cls = 'w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-base transition-colors ';
          if (!submitted) {
            cls += 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50';
          } else if (optCorrect) {
            cls += 'border-green-500 bg-green-50 text-green-800';
          } else if (optSelected) {
            cls += 'border-red-400 bg-red-50 text-red-700';
          } else {
            cls += 'border-gray-100 bg-gray-50 text-gray-400';
          }
          return (
            <button key={option} onClick={() => handleSelect(option)} className={cls}>
              {option}
              {submitted && optCorrect  && <span className="float-right">✓</span>}
              {submitted && optSelected && !optCorrect && <span className="float-right">✗</span>}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
              <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? 'Correct!' : 'Not quite'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              <span className="chinese-text text-lg font-bold text-gray-800">{q.chineseChar}</span>
              {' · '}{q.pinyin}{' · '}{q.englishMeaning}
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
      const firstIncomplete = STEP_SEQUENCE.findIndex(
        dbStep => !p[`step${dbStep}Complete` as keyof typeof p]
      );
      if (firstIncomplete !== -1) setStep(STEP_SEQUENCE[firstIncomplete]!);
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
    if (s === 8) updated.step8Complete = true;
    return updated;
  }

  function nextInSequence(current: number): number {
    const idx = STEP_SEQUENCE.indexOf(current as typeof STEP_SEQUENCE[number]);
    return STEP_SEQUENCE[idx + 1] ?? current;
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
    setStep(s => nextInSequence(s));
  }

  function handleRetry() {
    setStepResult(null);
    if (step === 2 || step === 3) startDrill(step);
    // other steps re-render their own component on stepResult clear
  }

  async function handleSpeakComplete(score: number, total: number) {
    if (!progress) return;
    const xp = xpForStep(4, score, total);
    const autoComplete = score === total;
    const alreadyComplete = !!progress.step4Complete;
    if (!alreadyComplete) await awardXp(xp);
    if (autoComplete) {
      const updated = markStepComplete(4, progress);
      await saveTopicProgress(updated);
      setProgress(updated);
    }
    setStepResult({ score, total, xpEarned: xp, autoComplete });
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

  async function handleStep6Complete(score: number, total: number) {
    if (!progress) return;
    const xp = xpForStep(6, score, total);
    const autoComplete = score === total;
    const alreadyComplete = !!progress.step6Complete;
    if (!alreadyComplete) await awardXp(xp);
    if (autoComplete) {
      const updated = markStepComplete(6, progress);
      await saveTopicProgress(updated);
      setProgress(updated);
    }
    setStepResult({ score, total, xpEarned: xp, autoComplete });
  }

  async function handleListenComplete(score: number, total: number) {
    if (!progress) return;
    const xp = xpForStep(8, score, total);
    const autoComplete = score === total;
    const alreadyComplete = !!progress.step8Complete;
    if (!alreadyComplete) await awardXp(xp);
    if (autoComplete) {
      const updated = markStepComplete(8, progress);
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
        <div className="w-full px-6 py-3 grid grid-cols-3 items-center">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-lg font-semibold">
            ← Home
          </Link>
          <h1 className="font-bold text-gray-800 text-xl truncate text-center">{topic.name}</h1>
          {userProgress && xpInfo && (
            <div className="flex items-center gap-2 text-base justify-end">
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
              {step === 8 && (
                <ListeningStep items={topic.items} onComplete={handleListenComplete} />
              )}
              {step === 4 && (
                <SpeakingStep items={topic.items} onComplete={handleSpeakComplete} />
              )}
              {step === 5 && (
                <HanziWriterStep items={topic.items} onComplete={handleWritingComplete} />
              )}
              {step === 6 && (
                <WritingStep items={topic.items} onComplete={handleStep6Complete} />
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
