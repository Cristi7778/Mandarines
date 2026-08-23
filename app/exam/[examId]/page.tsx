'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { getExamProgress, saveExamProgress, getUserProgress, saveUserProgress } from '@/lib/db';
import { addXp, updateStreak, xpToNextLevel } from '@/lib/xp';
import { getExamById } from '@/lib/data/exams';
import type { ExamProgress, UserProgress } from '@/lib/types';

// ── Data ─────────────────────────────────────────────────────────────────────

type TF  = '✓' | '✗';
type L3  = 'A' | 'B' | 'C';
type L6  = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const AUD = (n: number) => `/hsk1/audio/item${String(n).padStart(2, '0')}.mp3`;
const IMG = (p: string) => `/hsk1/images/${p}`;

// Listening Part 1 — audio + single image, ✓/✗
const L1_QS = [
  { num: 1,  audio: AUD(1),  image: IMG('l1_q1.jpg'),  desc: 'man on phone',                   answer: '✓' as TF },
  { num: 2,  audio: AUD(2),  image: IMG('l1_q2.jpg'),  desc: 'mother and daughter',             answer: '✗' as TF },
  { num: 3,  audio: AUD(3),  image: IMG('l1_q3.jpg'),  desc: 'woman riding bicycle',            answer: '✗' as TF },
  { num: 4,  audio: AUD(4),  image: IMG('l1_q4.jpg'),  desc: 'woman drinking milk',             answer: '✗' as TF },
  { num: 5,  audio: AUD(5),  image: IMG('l1_q5.jpg'),  desc: 'couple sharing umbrella in rain', answer: '✓' as TF },
];

// Listening Part 2 — audio + 3 picture options A/B/C
const L2_QS = [
  { num: 6,  audio: AUD(6),  opts: { A: { img: IMG('l2_q6_a.jpg'),  desc: 'woman in winter coat' },       B: { img: IMG('l2_q6_b.jpg'),  desc: 'woman standing casually' },        C: { img: IMG('l2_q6_c.jpg'),  desc: 'man in shirt and tie' } },            answer: 'A' as L3 },
  { num: 7,  audio: AUD(7),  opts: { A: { img: IMG('l2_q7_a.jpg'),  desc: 'clock ~10:10' },               B: { img: IMG('l2_q7_b.jpg'),  desc: 'clock ~1:15' },                    C: { img: IMG('l2_q7_c.jpg'),  desc: 'clock ~8:20' } },                      answer: 'A' as L3 },
  { num: 8,  audio: AUD(8),  opts: { A: { img: IMG('l2_q8_a.jpg'),  desc: 'two men shaking hands' },      B: { img: IMG('l2_q8_b.jpg'),  desc: 'woman with man behind her' },      C: { img: IMG('l2_q8_c.jpg'),  desc: 'woman with people behind her' } },     answer: 'C' as L3 },
  { num: 9,  audio: AUD(9),  opts: { A: { img: IMG('l2_q9_a.jpg'),  desc: 'boy reading' },                B: { img: IMG('l2_q9_b.jpg'),  desc: 'baby laughing' },                  C: { img: IMG('l2_q9_c.jpg'),  desc: 'bride' } },                            answer: 'A' as L3 },
  { num: 10, audio: AUD(10), opts: { A: { img: IMG('l2_q10_a.jpg'), desc: 'European cathedral' },         B: { img: IMG('l2_q10_b.jpg'), desc: 'Sydney Opera House' },             C: { img: IMG('l2_q10_c.jpg'), desc: 'Great Wall of China' } },             answer: 'C' as L3 },
];

// Listening Part 3 — audio dialogue + picture bank A–F
const L3_BANK: Record<L6, { img: string; desc: string }> = {
  A: { img: IMG('l3_a.jpg'), desc: 'couple at door with child (apartment 102)' },
  B: { img: IMG('l3_b.jpg'), desc: 'hands opening empty wallet' },
  C: { img: IMG('l3_c.jpg'), desc: 'man and woman shaking hands (business)' },
  D: { img: IMG('l3_d.jpg'), desc: 'cat sitting on chair' },
  E: { img: IMG('l3_e.jpg'), desc: 'man and woman reading together' },
  F: { img: IMG('l3_f.jpg'), desc: 'kids waving from car window' },
};
const L3_QS = [
  { num: 11, audio: AUD(11), zh: '男：你看见我的小猫了吗？ 女：在那儿，在椅子上。',  answer: 'D' as L6 },
  { num: 12, audio: AUD(12), zh: '女：我们中午去买，好吗？ 男：你看，我没钱了。',    answer: 'B' as L6 },
  { num: 13, audio: AUD(13), zh: '男：你住在哪儿？ 女：我和妈妈都住在一零二。',      answer: 'A' as L6 },
  { num: 14, audio: AUD(14), zh: '女：这个汉字怎么读？ 男：对不起，我不会。',        answer: 'E' as L6 },
  { num: 15, audio: AUD(15), zh: '男：谢谢你们！ 女：不客气。再见。',                answer: 'F' as L6 },
];

// Listening Part 4 — audio passage + text MCQ
const L4_QS = [
  { num: 16, audio: AUD(16), passage: '我的电脑在他的桌子上。',         question: '那是谁的电脑？',       opts: { A: '他的 (tā de)', B: '我的 (wǒ de)', C: '同学的 (tóngxué de)' } as Record<L3,string>, answer: 'B' as L3 },
  { num: 17, audio: AUD(17), passage: '今天星期四，我们明天去看电影。', question: '我们什么时候去看电影？', opts: { A: '星期三 (xīngqīsān)', B: '星期五 (xīngqīwǔ)', C: '星期六 (xīngqīliù)' } as Record<L3,string>, answer: 'B' as L3 },
  { num: 18, audio: AUD(18), passage: '他是老师，他有50个学生。',       question: '他有多少个学生？',      opts: { A: '5', B: '15', C: '50' } as Record<L3,string>, answer: 'C' as L3 },
  { num: 19, audio: AUD(19), passage: '小姐，你好，你这儿有杯子吗？',   question: '他想买什么？',          opts: { A: '茶 (chá)', B: '苹果 (píngguǒ)', C: '杯子 (bēizi)' } as Record<L3,string>, answer: 'C' as L3 },
  { num: 20, audio: AUD(20), passage: '这是你的朋友吗？很漂亮。',       question: '朋友怎么样？',          opts: { A: '爱学习 (ài xuéxí)', B: '很漂亮 (hěn piàoliang)', C: '想回家 (xiǎng huí jiā)' } as Record<L3,string>, answer: 'B' as L3 },
];

// Reading Part 1 — word + single image, ✓/✗
const R1_QS = [
  { num: 21, word: '写', pinyin: 'xiě',  image: IMG('r1_q21.jpg'), desc: 'boy writing at desk',    answer: '✓' as TF },
  { num: 22, word: '听', pinyin: 'tīng', image: IMG('r1_q22.jpg'), desc: 'woman with headphones',  answer: '✓' as TF },
  { num: 23, word: '菜', pinyin: 'cài',  image: IMG('r1_q23.jpg'), desc: 'cup of tea',             answer: '✗' as TF },
  { num: 24, word: '他', pinyin: 'tā',   image: IMG('r1_q24.jpg'), desc: 'smiling woman',          answer: '✗' as TF },
  { num: 25, word: '狗', pinyin: 'gǒu',  image: IMG('r1_q25.jpg'), desc: 'dog',                    answer: '✓' as TF },
];

// Reading Part 2 — sentence text + picture bank A–F
const R2_BANK: Record<L6, { img: string; desc: string }> = {
  A: { img: IMG('r2_a.jpg'), desc: 'hands giving a wrapped gift' },
  B: { img: IMG('r2_b.jpg'), desc: 'woman lying down on phone' },
  C: { img: IMG('r2_c.jpg'), desc: 'woman holding fruit basket' },
  D: { img: IMG('r2_d.jpg'), desc: 'man offering food from a bowl' },
  E: { img: IMG('r2_e.jpg'), desc: 'woman reading a book' },
  F: { img: IMG('r2_f.jpg'), desc: 'two women shopping for clothes' },
};
const R2_QS = [
  { num: 26, zh: '你好，我能吃一块儿吗？',           pinyin: 'Nǐ hǎo, wǒ néng chī yí kuàir ma?',              answer: 'D' as L6 },
  { num: 27, zh: '她们在买衣服呢。',                 pinyin: 'Tāmen zài mǎi yīfu ne.',                         answer: 'F' as L6 },
  { num: 28, zh: '天气太热了，多吃些水果。',         pinyin: 'Tiānqì tài rè le, duō chī xiē shuǐguǒ.',         answer: 'C' as L6 },
  { num: 29, zh: '来，我们看看里面是什么东西。',     pinyin: 'Lái, wǒmen kànkan lǐmiàn shì shénme dōngxi.',    answer: 'A' as L6 },
  { num: 30, zh: '喂，你睡觉了吗？',                 pinyin: 'Wéi, nǐ shuìjiào le ma?',                        answer: 'B' as L6 },
];

// Reading Part 3 — text prompt → match response A–F
const R3_RESP: Record<L6, string> = {
  A: '医院。(Yīyuàn.)',
  B: '下雨了。(Xià yǔ le.)',
  C: '我不认识她。(Wǒ bú rènshi tā.)',
  D: '7岁。(Qī suì.)',
  E: '下个月。(Xià ge yuè.)',
  F: '好的，谢谢！(Hǎo de, xièxie!)',
};
const R3_QS = [
  { num: 31, zh: '那个人是谁？',             pinyin: "Nàge rén shì shéi?",            answer: 'C' as L6 },
  { num: 32, zh: '他女儿多大了？',            pinyin: "Tā nǚ'ér duō dà le?",           answer: 'D' as L6 },
  { num: 33, zh: '你的同学在哪儿工作？',      pinyin: 'Nǐ de tóngxué zài nǎr gōngzuò?', answer: 'A' as L6 },
  { num: 34, zh: '昨天上午天气怎么样？',      pinyin: 'Zuótiān shàngwǔ tiānqì zěnmeyàng?', answer: 'B' as L6 },
  { num: 35, zh: '爸爸什么时候来北京呢？',    pinyin: 'Bàba shénme shíhou lái Běijīng ne?', answer: 'E' as L6 },
];

// Reading Part 4 — fill blank from word bank A–F
const R4_BANK: Record<L6, string> = {
  A: '坐 (zuò)',
  B: '前面 (qiánmiàn)',
  C: '没关系 (méi guānxi)',
  D: '名字 (míngzi)',
  E: '汉语 (Hànyǔ)',
  F: '月 (yuè)',
};
const R4_QS = [
  { num: 36, zh: '昨天是8___19日。',                                   answer: 'F' as L6 },
  { num: 37, zh: '那个饭馆儿在火车站___。',                             answer: 'B' as L6 },
  { num: 38, zh: '你会说___吗？',                                       answer: 'E' as L6 },
  { num: 39, zh: '男：你好！王先生在吗？ 女：在，请___，我去叫他。',    answer: 'A' as L6 },
  { num: 40, zh: '女：对不起，我不会做饭。 男：___，我会。',            answer: 'C' as L6 },
];

const ALL_QS = [...L1_QS, ...L2_QS, ...L3_QS, ...L4_QS, ...R1_QS, ...R2_QS, ...R3_QS, ...R4_QS];

const PARTS = [
  { label: 'Listening · Part 1', section: 'L1', questions: L1_QS },
  { label: 'Listening · Part 2', section: 'L2', questions: L2_QS },
  { label: 'Listening · Part 3', section: 'L3', questions: L3_QS },
  { label: 'Listening · Part 4', section: 'L4', questions: L4_QS },
  { label: 'Reading · Part 1',   section: 'R1', questions: R1_QS },
  { label: 'Reading · Part 2',   section: 'R2', questions: R2_QS },
  { label: 'Reading · Part 3',   section: 'R3', questions: R3_QS },
  { label: 'Reading · Part 4',   section: 'R4', questions: R4_QS },
] as const;

// ── Helper components ─────────────────────────────────────────────────────────

function ImgOrDesc({ src, desc, className }: { src: string; desc: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`bg-gray-100 border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-3 text-center text-xs text-gray-500 leading-snug ${className ?? ''}`}>
        {desc}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={desc}
      className={`object-contain rounded-xl ${className ?? ''}`}
      onError={() => setFailed(true)}
    />
  );
}

function AudioBtn({ src, autoPlay }: { src: string; autoPlay?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (autoPlay && ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <>
      <audio ref={ref} src={src} />
      <button
        onClick={() => { if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); } }}
        className="w-14 h-14 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-2xl shrink-0 transition-colors"
        title="Play audio"
      >
        🔊
      </button>
    </>
  );
}

// ── Option button ─────────────────────────────────────────────────────────────

function OptBtn({
  label, selected, correct, confirmed, onClick,
}: {
  label: React.ReactNode;
  selected: boolean;
  correct: boolean;
  confirmed: boolean;
  onClick: () => void;
}) {
  let cls = 'border-2 rounded-xl p-3 text-left transition-colors font-medium text-base w-full ';
  if (confirmed) {
    if (correct)   cls += 'border-green-400 bg-green-50 text-green-800';
    else if (selected) cls += 'border-red-400 bg-red-50 text-red-700';
    else           cls += 'border-gray-200 bg-white text-gray-400';
  } else {
    cls += selected
      ? 'border-orange-400 bg-orange-50 text-orange-800'
      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300';
  }
  return <button className={cls} onClick={onClick} disabled={confirmed}>{label}</button>;
}

// ── Results screen ────────────────────────────────────────────────────────────

function ResultsScreen({ answers, xpEarned }: { answers: Record<number, string>; xpEarned: number }) {
  const score = ALL_QS.filter(q => answers[q.num] === q.answer).length;

  const partScores = PARTS.map(p => ({
    label: p.label,
    score: p.questions.filter(q => answers[q.num] === q.answer).length,
    total: p.questions.length,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
        <p className="text-5xl font-bold text-gray-800">{score}<span className="text-2xl text-gray-400 font-normal"> / {ALL_QS.length}</span></p>
        <p className="text-base text-gray-500">
          {score >= 36 ? '🏆 Excellent!' : score >= 28 ? '👍 Good job' : score >= 20 ? '📚 Keep studying' : '💪 Keep going'}
        </p>
        <p className="text-sm text-amber-600 font-semibold">+{xpEarned} XP</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {partScores.map(p => (
          <div key={p.label} className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">{p.label}</span>
            <span className={`text-sm font-semibold ${p.score === p.total ? 'text-green-600' : p.score >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
              {p.score} / {p.total}
            </span>
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

  const [partIdx, setPartIdx]   = useState(0);
  const [qIdx, setQIdx]         = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers]   = useState<Record<number, string>>({});
  const [done, setDone]         = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    getUserProgress().then(setUserProgress);
  }, [user, router]);

  if (user === undefined) {
    return <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center"><div className="text-4xl animate-pulse">🍊</div></div>;
  }
  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Exam not found. <Link href="/" className="text-orange-500 underline">Back to home</Link></p></div>;
  }

  const part = PARTS[partIdx]!;
  const partQs = [...part.questions] as Array<{ num: number; answer: string }>;
  const q = partQs[qIdx]!;
  const totalQ = ALL_QS.length;
  const currentAbsIdx = PARTS.slice(0, partIdx).reduce((n, p) => n + p.questions.length, 0) + qIdx;
  const pct = Math.round((currentAbsIdx / totalQ) * 100);

  function handleSelect(val: string) {
    if (confirmed) return;
    setSelected(val);
  }

  function handleConfirm() {
    if (!selected) return;
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [q.num]: selected }));
  }

  async function handleNext() {
    setSelected(null);
    setConfirmed(false);

    if (qIdx + 1 < partQs.length) {
      setQIdx(qIdx + 1);
      return;
    }
    if (partIdx + 1 < PARTS.length) {
      setPartIdx(partIdx + 1);
      setQIdx(0);
      return;
    }

    // Exam complete
    const finalAnswers = { ...answers, [q.num]: selected ?? '' };
    const score = ALL_QS.filter(x => finalAnswers[x.num] === x.answer).length;
    const xp = score * 5;
    setXpEarned(xp);
    setAnswers(finalAnswers);
    setDone(true);

    await saveExamProgress({ examId, score, total: totalQ, completedAt: new Date().toISOString() });
    if (userProgress) {
      const updated = updateStreak(addXp(userProgress, xp));
      await saveUserProgress(updated);
    }
  }

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

  const isCorrect = selected === q.answer;
  const section = part.section;

  return (
    <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-6 py-3 grid grid-cols-3 items-center">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-lg font-semibold">← Home</Link>
          <h1 className="font-bold text-gray-800 text-base truncate text-center">{exam.name}</h1>
          <div />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
        {/* Global progress */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 shrink-0">{currentAbsIdx + 1} / {totalQ}</span>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{part.label} · Q{q.num}</p>
        </div>

        {/* ── L1: audio + image, ✓/✗ ── */}
        {section === 'L1' && (() => {
          const lq = L1_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen to the audio. Does it match the picture?</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
                <div className="flex items-center justify-center">
                  <AudioBtn src={lq.audio} autoPlay />
                </div>
                <ImgOrDesc src={lq.image} desc={lq.desc} className="w-full h-48" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['✓', '✗'] as TF[]).map(v => (
                  <OptBtn key={v} label={<span className="text-2xl">{v}</span>} selected={selected === v} correct={v === lq.answer} confirmed={confirmed} onClick={() => handleSelect(v)} />
                ))}
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
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex justify-center">
                <AudioBtn src={lq.audio} autoPlay />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['A', 'B', 'C'] as L3[]).map(letter => {
                  const opt = lq.opts[letter];
                  return (
                    <button
                      key={letter}
                      onClick={() => handleSelect(letter)}
                      disabled={confirmed}
                      className={`rounded-xl border-2 p-2 transition-colors ${
                        confirmed
                          ? letter === lq.answer ? 'border-green-400 bg-green-50'
                            : letter === selected ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 bg-white opacity-50'
                          : letter === selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <ImgOrDesc src={opt.img} desc={opt.desc} className="w-full h-24" />
                      <p className="text-center text-xs font-bold text-gray-500 mt-1">{letter}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── L3: audio dialogue + picture bank A–F ── */}
        {section === 'L3' && (() => {
          const lq = L3_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen to the dialogue and pick the matching picture.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <AudioBtn src={lq.audio} autoPlay />
                  <p className="chinese-text text-base text-gray-700 leading-relaxed">{lq.zh}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(L3_BANK) as [L6, { img: string; desc: string }][]).map(([letter, opt]) => (
                  <button
                    key={letter}
                    onClick={() => handleSelect(letter)}
                    disabled={confirmed}
                    className={`rounded-xl border-2 p-2 transition-colors ${
                      confirmed
                        ? letter === lq.answer ? 'border-green-400 bg-green-50'
                          : letter === selected ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-white opacity-40'
                        : letter === selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <ImgOrDesc src={opt.img} desc={opt.desc} className="w-full h-20" />
                    <p className="text-center text-xs font-bold text-gray-500 mt-1">{letter}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── L4: audio + passage + text MCQ ── */}
        {section === 'L4' && (() => {
          const lq = L4_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen, then answer the question.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <AudioBtn src={lq.audio} autoPlay />
                  <p className="chinese-text text-lg text-gray-800">{lq.passage}</p>
                </div>
                <p className="text-sm font-semibold text-gray-600">问：{lq.question}</p>
              </div>
              <div className="space-y-2">
                {(['A', 'B', 'C'] as L3[]).map(letter => (
                  <OptBtn
                    key={letter}
                    label={<span><span className="font-bold text-gray-400 mr-2">{letter}.</span>{lq.opts[letter]}</span>}
                    selected={selected === letter}
                    correct={letter === lq.answer}
                    confirmed={confirmed}
                    onClick={() => handleSelect(letter)}
                  />
                ))}
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
                {(['✓', '✗'] as TF[]).map(v => (
                  <OptBtn key={v} label={<span className="text-2xl">{v}</span>} selected={selected === v} correct={v === rq.answer} confirmed={confirmed} onClick={() => handleSelect(v)} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── R2: sentence + picture bank A–F ── */}
        {section === 'R2' && (() => {
          const rq = R2_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Match the sentence to the correct picture.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1">
                <p className="chinese-text text-lg text-gray-800">{rq.zh}</p>
                <p className="text-sm text-gray-400">{rq.pinyin}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(R2_BANK) as [L6, { img: string; desc: string }][]).map(([letter, opt]) => (
                  <button
                    key={letter}
                    onClick={() => handleSelect(letter)}
                    disabled={confirmed}
                    className={`rounded-xl border-2 p-2 transition-colors ${
                      confirmed
                        ? letter === rq.answer ? 'border-green-400 bg-green-50'
                          : letter === selected ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-white opacity-40'
                        : letter === selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <ImgOrDesc src={opt.img} desc={opt.desc} className="w-full h-20" />
                    <p className="text-center text-xs font-bold text-gray-500 mt-1">{letter}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── R3: prompt → match response A–F ── */}
        {section === 'R3' && (() => {
          const rq = R3_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Choose the correct response.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1">
                <p className="chinese-text text-xl text-gray-800">{rq.zh}</p>
                <p className="text-sm text-gray-400">{rq.pinyin}</p>
              </div>
              <div className="space-y-2">
                {(Object.entries(R3_RESP) as [L6, string][]).map(([letter, text]) => (
                  <OptBtn
                    key={letter}
                    label={<span><span className="font-bold text-gray-400 mr-2">{letter}.</span>{text}</span>}
                    selected={selected === letter}
                    correct={letter === rq.answer}
                    confirmed={confirmed}
                    onClick={() => handleSelect(letter)}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── R4: fill in blank ── */}
        {section === 'R4' && (() => {
          const rq = R4_QS[qIdx]!;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Choose the word that fits the blank.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="chinese-text text-lg text-gray-800 leading-relaxed">{rq.zh}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(R4_BANK) as [L6, string][]).map(([letter, text]) => (
                  <OptBtn
                    key={letter}
                    label={<span><span className="font-bold text-gray-400 mr-1.5">{letter}.</span>{text}</span>}
                    selected={selected === letter}
                    correct={letter === rq.answer}
                    confirmed={confirmed}
                    onClick={() => handleSelect(letter)}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Feedback + action buttons */}
        {confirmed && (
          <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${q.answer}`}
            </p>
          </div>
        )}

        {!confirmed && selected && (
          <button
            onClick={handleConfirm}
            className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors"
          >
            Check answer
          </button>
        )}

        {confirmed && (
          <button
            onClick={handleNext}
            className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors"
          >
            {currentAbsIdx + 1 >= totalQ ? 'See results' : 'Next →'}
          </button>
        )}
      </main>
    </div>
  );
}
