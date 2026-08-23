'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { saveExamProgress, getUserProgress, saveUserProgress } from '@/lib/db';
import { addXp, updateStreak } from '@/lib/xp';
import { getExamById } from '@/lib/data/exams';
import type { UserProgress } from '@/lib/types';

// ── Data ─────────────────────────────────────────────────────────────────────

type TF = '✓' | '✗';
type L3 = 'A' | 'B' | 'C';
type L6 = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const AUD = (n: number) => `/hsk1/audio/item${String(n).padStart(2, '0')}.mp3`;
const IMG = (p: string) => `/hsk1/images/${p}`;

const L1_QS = [
  { num: 1,  audio: AUD(1),  image: IMG('l1_q1.jpg'),  desc: 'man on phone',                   answer: '✓' as TF },
  { num: 2,  audio: AUD(2),  image: IMG('l1_q2.jpg'),  desc: 'mother and daughter',             answer: '✗' as TF },
  { num: 3,  audio: AUD(3),  image: IMG('l1_q3.jpg'),  desc: 'woman riding bicycle',            answer: '✗' as TF },
  { num: 4,  audio: AUD(4),  image: IMG('l1_q4.jpg'),  desc: 'woman drinking milk',             answer: '✗' as TF },
  { num: 5,  audio: AUD(5),  image: IMG('l1_q5.jpg'),  desc: 'couple sharing umbrella in rain', answer: '✓' as TF },
];

const L2_QS = [
  { num: 6,  audio: AUD(6),  opts: { A: { img: IMG('l2_q6_a.jpg'),  desc: 'woman in winter coat' },      B: { img: IMG('l2_q6_b.jpg'),  desc: 'woman standing casually' },       C: { img: IMG('l2_q6_c.jpg'),  desc: 'man in shirt and tie' } },           answer: 'A' as L3 },
  { num: 7,  audio: AUD(7),  opts: { A: { img: IMG('l2_q7_a.jpg'),  desc: 'clock ~10:10' },              B: { img: IMG('l2_q7_b.jpg'),  desc: 'clock ~1:15' },                   C: { img: IMG('l2_q7_c.jpg'),  desc: 'clock ~8:20' } },                     answer: 'A' as L3 },
  { num: 8,  audio: AUD(8),  opts: { A: { img: IMG('l2_q8_a.jpg'),  desc: 'two men shaking hands' },     B: { img: IMG('l2_q8_b.jpg'),  desc: 'woman with man behind her' },     C: { img: IMG('l2_q8_c.jpg'),  desc: 'woman with people behind her' } },    answer: 'C' as L3 },
  { num: 9,  audio: AUD(9),  opts: { A: { img: IMG('l2_q9_a.jpg'),  desc: 'boy reading' },               B: { img: IMG('l2_q9_b.jpg'),  desc: 'baby laughing' },                 C: { img: IMG('l2_q9_c.jpg'),  desc: 'bride' } },                           answer: 'A' as L3 },
  { num: 10, audio: AUD(10), opts: { A: { img: IMG('l2_q10_a.jpg'), desc: 'European cathedral' },        B: { img: IMG('l2_q10_b.jpg'), desc: 'Sydney Opera House' },            C: { img: IMG('l2_q10_c.jpg'), desc: 'Great Wall of China' } },            answer: 'C' as L3 },
];

const L3_BANK: Record<L6, { img: string; desc: string }> = {
  A: { img: IMG('l3_a.jpg'), desc: 'couple at door with child (apartment 102)' },
  B: { img: IMG('l3_b.jpg'), desc: 'hands opening empty wallet' },
  C: { img: IMG('l3_c.jpg'), desc: 'man and woman shaking hands (business)' },
  D: { img: IMG('l3_d.jpg'), desc: 'cat sitting on chair' },
  E: { img: IMG('l3_e.jpg'), desc: 'man and woman reading together' },
  F: { img: IMG('l3_f.jpg'), desc: 'kids waving from car window' },
};
const L3_QS = [
  { num: 11, audio: AUD(11), answer: 'D' as L6 },
  { num: 12, audio: AUD(12), answer: 'B' as L6 },
  { num: 13, audio: AUD(13), answer: 'A' as L6 },
  { num: 14, audio: AUD(14), answer: 'E' as L6 },
  { num: 15, audio: AUD(15), answer: 'F' as L6 },
];

const L4_QS = [
  { num: 16, audio: AUD(16), opts: { A: '他的 (tā de)',         B: '我的 (wǒ de)',           C: '同学的 (tóngxué de)' }     as Record<L3,string>, answer: 'B' as L3 },
  { num: 17, audio: AUD(17), opts: { A: '星期三 (xīngqīsān)',   B: '星期五 (xīngqīwǔ)',      C: '星期六 (xīngqīliù)' }     as Record<L3,string>, answer: 'B' as L3 },
  { num: 18, audio: AUD(18), opts: { A: '5',                    B: '15',                     C: '50' }                      as Record<L3,string>, answer: 'C' as L3 },
  { num: 19, audio: AUD(19), opts: { A: '茶 (chá)',             B: '苹果 (píngguǒ)',         C: '杯子 (bēizi)' }            as Record<L3,string>, answer: 'C' as L3 },
  { num: 20, audio: AUD(20), opts: { A: '爱学习 (ài xuéxí)',    B: '很漂亮 (hěn piàoliang)', C: '想回家 (xiǎng huí jiā)' } as Record<L3,string>, answer: 'B' as L3 },
];

const R1_QS = [
  { num: 21, word: '写', pinyin: 'xiě',  image: IMG('r1_q21.jpg'), desc: 'boy writing at desk',   answer: '✓' as TF },
  { num: 22, word: '听', pinyin: 'tīng', image: IMG('r1_q22.jpg'), desc: 'woman with headphones', answer: '✓' as TF },
  { num: 23, word: '菜', pinyin: 'cài',  image: IMG('r1_q23.jpg'), desc: 'cup of tea',            answer: '✗' as TF },
  { num: 24, word: '他', pinyin: 'tā',   image: IMG('r1_q24.jpg'), desc: 'smiling woman',         answer: '✗' as TF },
  { num: 25, word: '狗', pinyin: 'gǒu',  image: IMG('r1_q25.jpg'), desc: 'dog',                   answer: '✓' as TF },
];

const R2_BANK: Record<L6, { img: string; desc: string }> = {
  A: { img: IMG('r2_a.jpg'), desc: 'hands giving a wrapped gift' },
  B: { img: IMG('r2_b.jpg'), desc: 'woman lying down on phone' },
  C: { img: IMG('r2_c.jpg'), desc: 'woman holding fruit basket' },
  D: { img: IMG('r2_d.jpg'), desc: 'man offering food from a bowl' },
  E: { img: IMG('r2_e.jpg'), desc: 'woman reading a book' },
  F: { img: IMG('r2_f.jpg'), desc: 'two women shopping for clothes' },
};
const R2_QS = [
  { num: 26, zh: '你好，我能吃一块儿吗？',       pinyin: 'Nǐ hǎo, wǒ néng chī yí kuàir ma?',           answer: 'D' as L6 },
  { num: 27, zh: '她们在买衣服呢。',             pinyin: 'Tāmen zài mǎi yīfu ne.',                      answer: 'F' as L6 },
  { num: 28, zh: '天气太热了，多吃些水果。',     pinyin: 'Tiānqì tài rè le, duō chī xiē shuǐguǒ.',      answer: 'C' as L6 },
  { num: 29, zh: '来，我们看看里面是什么东西。', pinyin: 'Lái, wǒmen kànkan lǐmiàn shì shénme dōngxi.', answer: 'A' as L6 },
  { num: 30, zh: '喂，你睡觉了吗？',             pinyin: 'Wéi, nǐ shuìjiào le ma?',                     answer: 'B' as L6 },
];

const R3_RESP: Record<L6, string> = {
  A: '医院。(Yīyuàn.)',
  B: '下雨了。(Xià yǔ le.)',
  C: '我不认识她。(Wǒ bú rènshi tā.)',
  D: '7岁。(Qī suì.)',
  E: '下个月。(Xià ge yuè.)',
  F: '好的，谢谢！(Hǎo de, xièxie!)',
};
const R3_QS = [
  { num: 31, zh: '那个人是谁？',          pinyin: "Nàge rén shì shéi?",               answer: 'C' as L6 },
  { num: 32, zh: '他女儿多大了？',         pinyin: "Tā nǚ'ér duō dà le?",              answer: 'D' as L6 },
  { num: 33, zh: '你的同学在哪儿工作？',   pinyin: 'Nǐ de tóngxué zài nǎr gōngzuò?',  answer: 'A' as L6 },
  { num: 34, zh: '昨天上午天气怎么样？',   pinyin: 'Zuótiān shàngwǔ tiānqì zěnmeyàng?', answer: 'B' as L6 },
  { num: 35, zh: '爸爸什么时候来北京呢？', pinyin: 'Bàba shénme shíhou lái Běijīng ne?', answer: 'E' as L6 },
];

const R4_BANK: Record<L6, string> = {
  A: '坐 (zuò)',
  B: '前面 (qiánmiàn)',
  C: '没关系 (méi guānxi)',
  D: '名字 (míngzi)',
  E: '汉语 (Hànyǔ)',
  F: '月 (yuè)',
};
const R4_QS = [
  { num: 36, zh: '昨天是8___19日。',                                 answer: 'F' as L6 },
  { num: 37, zh: '那个饭馆儿在火车站___。',                           answer: 'B' as L6 },
  { num: 38, zh: '你会说___吗？',                                     answer: 'E' as L6 },
  { num: 39, zh: '男：你好！王先生在吗？ 女：在，请___，我去叫他。', answer: 'A' as L6 },
  { num: 40, zh: '女：对不起，我不会做饭。 男：___，我会。',         answer: 'C' as L6 },
];

const ALL_QS = [...L1_QS, ...L2_QS, ...L3_QS, ...L4_QS, ...R1_QS, ...R2_QS, ...R3_QS, ...R4_QS];

type Part = { label: string; section: string; questions: { num: number; answer: string }[] };
const PARTS: Part[] = [
  { label: 'Listening · Part 1', section: 'L1', questions: L1_QS },
  { label: 'Listening · Part 2', section: 'L2', questions: L2_QS },
  { label: 'Listening · Part 3', section: 'L3', questions: L3_QS },
  { label: 'Listening · Part 4', section: 'L4', questions: L4_QS },
  { label: 'Reading · Part 1',   section: 'R1', questions: R1_QS },
  { label: 'Reading · Part 2',   section: 'R2', questions: R2_QS },
  { label: 'Reading · Part 3',   section: 'R3', questions: R3_QS },
  { label: 'Reading · Part 4',   section: 'R4', questions: R4_QS },
];

const MATCHING_SECTIONS = new Set(['L3', 'R2', 'R3', 'R4']);
const POINTS_PER_Q = 5;
const MAX_SCORE    = ALL_QS.length * POINTS_PER_Q; // 200
const PASS_SCORE   = 120;
const L6_LETTERS: L6[] = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ImgOrDesc({ src, desc, className }: { src: string; desc: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`bg-gray-100 border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-2 text-center text-xs text-gray-500 leading-snug ${className ?? ''}`}>
        {desc}
      </div>
    );
  }
  return <img src={src} alt={desc} className={`object-contain rounded-xl ${className ?? ''}`} onError={() => setFailed(true)} />;
}

function AudioBtn({ src, autoPlay }: { src: string; autoPlay?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (autoPlay && ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  return (
    <>
      <audio ref={ref} src={src} />
      <button
        onClick={() => { if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); } }}
        className="w-12 h-12 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-xl shrink-0 transition-colors"
      >🔊</button>
    </>
  );
}

// Letter picker row used in both sequential and matching questions
function LetterPicker({
  letters, selected, correctAnswer, confirmed, onSelect,
}: {
  letters: string[];
  selected: string | null;
  correctAnswer: string;
  confirmed: boolean;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {letters.map(opt => {
        let cls = 'w-9 h-9 rounded-lg text-sm font-bold border-2 transition-colors ';
        if (confirmed) {
          if (opt === correctAnswer)    cls += 'border-green-400 bg-green-100 text-green-700';
          else if (opt === selected)    cls += 'border-red-400 bg-red-100 text-red-600';
          else                          cls += 'border-gray-100 bg-white text-gray-300';
        } else {
          cls += opt === selected
            ? 'border-orange-400 bg-orange-100 text-orange-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50';
        }
        return (
          <button key={opt} className={cls} disabled={confirmed} onClick={() => onSelect(opt)}>{opt}</button>
        );
      })}
    </div>
  );
}

// Shared picture bank grid (for L3 and R2)
function PictureBank({ bank, confirmed, selected }: {
  bank: Record<L6, { img: string; desc: string }>;
  confirmed: boolean;
  selected: Record<number, string>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {L6_LETTERS.map(letter => {
        const opt = bank[letter];
        const usedBy = Object.entries(selected).filter(([, v]) => v === letter);
        return (
          <div key={letter} className="relative">
            <ImgOrDesc src={opt.img} desc={opt.desc} className="w-full h-[72px]" />
            <span className={`absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded ${
              confirmed && usedBy.length > 0 ? 'bg-orange-500 text-white' : 'bg-black/60 text-white'
            }`}>{letter}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Results screen ────────────────────────────────────────────────────────────

function ResultsScreen({ answers, xpEarned }: { answers: Record<number, string>; xpEarned: number }) {
  const correct = ALL_QS.filter(q => answers[q.num] === q.answer).length;
  const points  = correct * POINTS_PER_Q;
  const passed  = points >= PASS_SCORE;

  const partScores = PARTS.map(p => ({
    label:  p.label,
    points: p.questions.filter(q => answers[q.num] === q.answer).length * POINTS_PER_Q,
    max:    p.questions.length * POINTS_PER_Q,
  }));
  const listeningPts = partScores.slice(0, 4).reduce((n, p) => n + p.points, 0);
  const readingPts   = partScores.slice(4).reduce((n, p) => n + p.points, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
        <p className="text-5xl font-bold text-gray-800">{points}<span className="text-2xl text-gray-400 font-normal"> / {MAX_SCORE}</span></p>
        <p className={`text-base font-semibold ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? (points >= 180 ? '🏆 Excellent!' : '✅ Pass') : '❌ Not passed — 120 required'}
        </p>
        <p className="text-sm text-amber-600 font-semibold">+{xpEarned} XP</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">Listening</span>
          <span className="text-sm font-semibold text-gray-700">{listeningPts} / 100</span>
        </div>
        {partScores.slice(0, 4).map(p => (
          <div key={p.label} className="px-4 py-2.5 flex items-center justify-between pl-8">
            <span className="text-sm text-gray-500">{p.label}</span>
            <span className={`text-sm font-medium ${p.points === p.max ? 'text-green-600' : p.points >= 15 ? 'text-amber-600' : 'text-red-500'}`}>{p.points} / {p.max}</span>
          </div>
        ))}
        <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">Reading</span>
          <span className="text-sm font-semibold text-gray-700">{readingPts} / 100</span>
        </div>
        {partScores.slice(4).map(p => (
          <div key={p.label} className="px-4 py-2.5 flex items-center justify-between pl-8">
            <span className="text-sm text-gray-500">{p.label}</span>
            <span className={`text-sm font-medium ${p.points === p.max ? 'text-green-600' : p.points >= 15 ? 'text-amber-600' : 'text-red-500'}`}>{p.points} / {p.max}</span>
          </div>
        ))}
      </div>
      <Link href="/" className="block w-full bg-orange-500 text-white font-semibold py-4 rounded-xl text-center hover:bg-orange-600 transition-colors">
        Back to home
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const user = useUser();
  const exam = getExamById(examId);

  // Sequential-part state
  const [partIdx, setPartIdx]     = useState(0);
  const [qIdx, setQIdx]           = useState(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Matching-part state
  const [matchAnswers, setMatchAnswers]     = useState<Record<number, string>>({});
  const [matchConfirmed, setMatchConfirmed] = useState(false);

  // Shared
  const [answers, setAnswers]           = useState<Record<number, string>>({});
  const [done, setDone]                 = useState(false);
  const [xpEarned, setXpEarned]         = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    getUserProgress().then(setUserProgress);
  }, [user, router]);

  // Reset per-part state whenever the part changes
  useEffect(() => {
    setQIdx(0);
    setSelected(null);
    setConfirmed(false);
    setMatchAnswers({});
    setMatchConfirmed(false);
  }, [partIdx]);

  if (user === undefined) {
    return <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center"><div className="text-4xl animate-pulse">🍊</div></div>;
  }
  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Exam not found. <Link href="/" className="text-orange-500 underline">Back to home</Link></p></div>;
  }

  const part      = PARTS[partIdx]!;
  const isMatching = MATCHING_SECTIONS.has(part.section);
  const partQs    = part.questions;
  const totalQ    = ALL_QS.length;

  // Progress: count answers committed + in-progress matching picks
  const committedCount = Object.keys(answers).length;
  const inProgressCount = isMatching ? Object.keys(matchAnswers).length : (confirmed ? qIdx + 1 : qIdx);
  const pct = Math.round(((committedCount + inProgressCount) / totalQ) * 100);

  // ── finish exam ──

  async function finishExam(finalAnswers: Record<number, string>) {
    const score  = ALL_QS.filter(x => finalAnswers[x.num] === x.answer).length;
    const points = score * POINTS_PER_Q;
    setXpEarned(points);
    setAnswers(finalAnswers);
    setDone(true);
    await saveExamProgress({ examId, score: points, total: MAX_SCORE, completedAt: new Date().toISOString() });
    if (userProgress) {
      const updated = updateStreak(addXp(userProgress, points));
      await saveUserProgress(updated);
    }
  }

  // ── sequential handlers ──

  function handleSelect(val: string) { if (!confirmed) setSelected(val); }

  function handleConfirm() {
    if (!selected) return;
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [partQs[qIdx]!.num]: selected }));
  }

  async function handleNext() {
    setSelected(null);
    setConfirmed(false);
    if (qIdx + 1 < partQs.length) { setQIdx(qIdx + 1); return; }
    if (partIdx + 1 < PARTS.length) { setPartIdx(partIdx + 1); return; }
    await finishExam({ ...answers });
  }

  // ── matching handlers ──

  function handleMatchPick(num: number, letter: string) {
    if (matchConfirmed) return;
    setMatchAnswers(prev => ({ ...prev, [num]: letter }));
  }

  async function handleMatchCheck() { setMatchConfirmed(true); }

  async function handleMatchContinue() {
    const newAnswers = { ...answers, ...matchAnswers };
    if (partIdx + 1 < PARTS.length) {
      setAnswers(newAnswers);
      setPartIdx(partIdx + 1);
    } else {
      await finishExam(newAnswers);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="w-full px-6 py-3 flex items-center justify-center">
            <h1 className="font-bold text-gray-800 text-xl">{exam.name} · Results</h1>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
          <ResultsScreen answers={answers} xpEarned={xpEarned} />
        </main>
      </div>
    );
  }

  const q         = partQs[qIdx]!;
  const isCorrect = selected === q.answer;
  const section   = part.section;
  const matchAllFilled = partQs.length > 0 && partQs.every(pq => matchAnswers[pq.num] !== undefined);

  return (
    <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-6 py-3 grid grid-cols-3 items-center">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-lg font-semibold">← Home</Link>
          <h1 className="font-bold text-gray-800 text-base truncate text-center">{exam.name}</h1>
          <div />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 shrink-0">{committedCount + inProgressCount} / {totalQ}</span>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{part.label}{!isMatching && ` · Q${q.num}`}</p>
        </div>

        {/* ── L1: audio + image, ✓/✗ ── */}
        {section === 'L1' && (() => {
          const lq = L1_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen. Does it match the picture?</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
                <ImgOrDesc src={lq.image} desc={lq.desc} className="w-full h-48" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['✓', '✗'] as TF[]).map(v => {
                  let cls = 'border-2 rounded-xl p-4 text-center text-2xl transition-colors ';
                  if (confirmed) cls += v === lq.answer ? 'border-green-400 bg-green-50' : v === selected ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white';
                  else cls += v === selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300';
                  return <button key={v} className={cls} disabled={confirmed} onClick={() => handleSelect(v)}>{v}</button>;
                })}
              </div>
            </div>
          );
        })()}

        {/* ── L2: audio + 3 picture options ── */}
        {section === 'L2' && (() => {
          const lq = L2_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen, then choose the matching picture.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
              <div className="grid grid-cols-3 gap-3">
                {(['A', 'B', 'C'] as L3[]).map(letter => {
                  const opt = lq.opts[letter];
                  let cls = 'rounded-xl border-2 p-2 transition-colors ';
                  if (confirmed) cls += letter === lq.answer ? 'border-green-400 bg-green-50' : letter === selected ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white opacity-50';
                  else cls += letter === selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300';
                  return (
                    <button key={letter} className={cls} disabled={confirmed} onClick={() => handleSelect(letter)}>
                      <ImgOrDesc src={opt.img} desc={opt.desc} className="w-full h-24" />
                      <p className="text-center text-xs font-bold text-gray-500 mt-1">{letter}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── L3: all 5 at once — audio → picture bank ── */}
        {section === 'L3' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Listen to each dialogue and pick the matching picture (A–F).</p>
            <PictureBank bank={L3_BANK} confirmed={matchConfirmed} selected={matchAnswers} />
            <div className="space-y-2">
              {L3_QS.map(lq => (
                <div key={lq.num} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 shrink-0 w-5">{lq.num}.</span>
                  <AudioBtn src={lq.audio} />
                  <div className="flex-1">
                    <LetterPicker
                      letters={L6_LETTERS}
                      selected={matchAnswers[lq.num] ?? null}
                      correctAnswer={lq.answer}
                      confirmed={matchConfirmed}
                      onSelect={v => handleMatchPick(lq.num, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── L4: audio only + text MCQ ── */}
        {section === 'L4' && (() => {
          const lq = L4_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen, then choose the correct answer.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
              <div className="space-y-2">
                {(['A', 'B', 'C'] as L3[]).map(letter => {
                  let cls = 'border-2 rounded-xl p-3 text-left transition-colors font-medium text-base w-full ';
                  if (confirmed) cls += letter === lq.answer ? 'border-green-400 bg-green-50 text-green-800' : letter === selected ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-400';
                  else cls += letter === selected ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300';
                  return (
                    <button key={letter} className={cls} disabled={confirmed} onClick={() => handleSelect(letter)}>
                      <span className="font-bold text-gray-400 mr-2">{letter}.</span>{lq.opts[letter]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── R1: word + image, ✓/✗ ── */}
        {section === 'R1' && (() => {
          const rq = R1_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Does the word match the picture?</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="text-center">
                  <span className="text-4xl chinese-text font-bold text-gray-800">{rq.word}</span>
                  <span className="text-base text-orange-500 ml-2">{rq.pinyin}</span>
                </div>
                <ImgOrDesc src={rq.image} desc={rq.desc} className="w-full h-48" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['✓', '✗'] as TF[]).map(v => {
                  let cls = 'border-2 rounded-xl p-4 text-center text-2xl transition-colors ';
                  if (confirmed) cls += v === rq.answer ? 'border-green-400 bg-green-50' : v === selected ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white';
                  else cls += v === selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300';
                  return <button key={v} className={cls} disabled={confirmed} onClick={() => handleSelect(v)}>{v}</button>;
                })}
              </div>
            </div>
          );
        })()}

        {/* ── R2: all 5 at once — sentence → picture bank ── */}
        {section === 'R2' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Match each sentence to the correct picture (A–F).</p>
            <PictureBank bank={R2_BANK} confirmed={matchConfirmed} selected={matchAnswers} />
            <div className="space-y-2">
              {R2_QS.map(rq => (
                <div key={rq.num} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-5">{rq.num}.</span>
                    <div>
                      <p className="chinese-text text-base text-gray-800">{rq.zh}</p>
                      <p className="text-xs text-gray-400">{rq.pinyin}</p>
                    </div>
                  </div>
                  <div className="pl-7">
                    <LetterPicker
                      letters={L6_LETTERS}
                      selected={matchAnswers[rq.num] ?? null}
                      correctAnswer={rq.answer}
                      confirmed={matchConfirmed}
                      onSelect={v => handleMatchPick(rq.num, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── R3: all 5 at once — prompt → response bank ── */}
        {section === 'R3' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Match each question to the correct response (A–F).</p>
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Responses</p>
              {L6_LETTERS.map(letter => (
                <div key={letter} className="flex gap-2 text-sm text-gray-600">
                  <span className="font-bold text-gray-400 shrink-0">{letter}.</span>
                  <span>{R3_RESP[letter]}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {R3_QS.map(rq => (
                <div key={rq.num} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-5">{rq.num}.</span>
                    <div>
                      <p className="chinese-text text-base text-gray-800">{rq.zh}</p>
                      <p className="text-xs text-gray-400">{rq.pinyin}</p>
                    </div>
                  </div>
                  <div className="pl-7">
                    <LetterPicker
                      letters={L6_LETTERS}
                      selected={matchAnswers[rq.num] ?? null}
                      correctAnswer={rq.answer}
                      confirmed={matchConfirmed}
                      onSelect={v => handleMatchPick(rq.num, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── R4: all 5 at once — fill blank from word bank ── */}
        {section === 'R4' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Choose the correct word to fill each blank (A–F).</p>
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Word bank</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {L6_LETTERS.map(letter => (
                  <div key={letter} className="flex gap-2 text-sm text-gray-600">
                    <span className="font-bold text-gray-400 shrink-0">{letter}.</span>
                    <span>{R4_BANK[letter]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {R4_QS.map(rq => (
                <div key={rq.num} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-5">{rq.num}.</span>
                    <p className="chinese-text text-base text-gray-800 leading-relaxed">{rq.zh}</p>
                  </div>
                  <div className="pl-7">
                    <LetterPicker
                      letters={L6_LETTERS}
                      selected={matchAnswers[rq.num] ?? null}
                      correctAnswer={rq.answer}
                      confirmed={matchConfirmed}
                      onSelect={v => handleMatchPick(rq.num, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}

        {/* Sequential: check then next */}
        {!isMatching && !confirmed && selected && (
          <button onClick={handleConfirm} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors">
            Check answer
          </button>
        )}
        {!isMatching && confirmed && (
          <>
            <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${q.answer}`}
              </p>
            </div>
            <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
              {committedCount + qIdx + 1 >= totalQ ? 'See results' : 'Next →'}
            </button>
          </>
        )}

        {/* Matching: check all then continue */}
        {isMatching && !matchConfirmed && (
          <button
            onClick={handleMatchCheck}
            disabled={!matchAllFilled}
            className={`w-full font-semibold py-4 rounded-xl transition-colors ${matchAllFilled ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Check answers
          </button>
        )}
        {isMatching && matchConfirmed && (
          <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
            {partIdx + 1 >= PARTS.length ? 'See results' : 'Continue →'}
          </button>
        )}
      </main>
    </div>
  );
}
