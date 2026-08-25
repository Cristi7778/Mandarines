'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { saveExamProgress, getUserProgress, saveUserProgress } from '@/lib/db';
import { addXp, updateStreak } from '@/lib/xp';
import { getExamById } from '@/lib/data/exams';
import type { UserProgress } from '@/lib/types';

// ── Data ─────────────────────────────────────────────────────────────────────

const EXAM_ID = 'exam-hsk2-h20901';

type TF  = '✓' | '✗';
type Opt3 = 'A' | 'B' | 'C';

const AUD = (n: number) => `/hsk2/audio/item${String(n).padStart(2, '0')}.mp3`;
const IMG = (p: string) => `/hsk2/images/${p}`;

// L1: Q1-10, audio + image, ✓/✗
const L1_QS = [
  { num: 1,  audio: AUD(1),  image: IMG('l1_q1.jpg'),  desc: 'laptop',                          answer: '✗' as TF },
  { num: 2,  audio: AUD(2),  image: IMG('l1_q2.jpg'),  desc: 'woman upset, man giving flowers', answer: '✓' as TF },
  { num: 3,  audio: AUD(3),  image: IMG('l1_q3.jpg'),  desc: 'woman drinking from cup',         answer: '✗' as TF },
  { num: 4,  audio: AUD(4),  image: IMG('l1_q4.jpg'),  desc: 'necktie',                         answer: '✗' as TF },
  { num: 5,  audio: AUD(5),  image: IMG('l1_q5.jpg'),  desc: 'carton of eggs',                  answer: '✓' as TF },
  { num: 6,  audio: AUD(6),  image: IMG('l1_q6.jpg'),  desc: 'woman doing laundry',             answer: '✓' as TF },
  { num: 7,  audio: AUD(7),  image: IMG('l1_q7.jpg'),  desc: 'cup of tea/soup',                 answer: '✗' as TF },
  { num: 8,  audio: AUD(8),  image: IMG('l1_q8.jpg'),  desc: 'man walking with child holding leg', answer: '✓' as TF },
  { num: 9,  audio: AUD(9),  image: IMG('l1_q9.jpg'),  desc: 'dog (German shepherd)',           answer: '✗' as TF },
  { num: 10, audio: AUD(10), image: IMG('l1_q10.jpg'), desc: 'woman behind stack of papers',    answer: '✓' as TF },
];

// L2a: Q11-15, matching, audio → picture bank A-F
const L2A_BANK: Record<string, { img: string; desc: string }> = {
  A: { img: IMG('l2a_a.jpg'), desc: 'hands exchanging a bouquet of roses' },
  B: { img: IMG('l2a_b.jpg'), desc: 'row of dark suits/jackets on hangers' },
  C: { img: IMG('l2a_c.jpg'), desc: 'boy raising hand in classroom' },
  D: { img: IMG('l2a_d.jpg'), desc: 'woman playing soccer' },
  E: { img: IMG('l2a_e.jpg'), desc: 'bowl of rice with chopsticks' },
  F: { img: IMG('l2a_f.jpg'), desc: 'group of young people cheering' },
};
const L2A_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const L2A_QS = [
  { num: 11, audio: AUD(11), answer: 'F' },
  { num: 12, audio: AUD(12), answer: 'A' },
  { num: 13, audio: AUD(13), answer: 'C' },
  { num: 14, audio: AUD(14), answer: 'E' },
  { num: 15, audio: AUD(15), answer: 'B' },
];

// L2b: Q16-20, matching, audio → picture bank A-E
const L2B_BANK: Record<string, { img: string; desc: string }> = {
  A: { img: IMG('l2b_a.jpg'), desc: 'hand adjusting a wristwatch' },
  B: { img: IMG('l2b_b.jpg'), desc: 'woman on two phones at once' },
  C: { img: IMG('l2b_c.jpg'), desc: 'woman with globe (teacher)' },
  D: { img: IMG('l2b_d.jpg'), desc: 'hands exchanging an envelope/ticket' },
  E: { img: IMG('l2b_e.jpg'), desc: 'woman holding two shoes' },
};
const L2B_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const L2B_QS = [
  { num: 16, audio: AUD(16), answer: 'B' },
  { num: 17, audio: AUD(17), answer: 'E' },
  { num: 18, audio: AUD(18), answer: 'C' },
  { num: 19, audio: AUD(19), answer: 'A' },
  { num: 20, audio: AUD(20), answer: 'D' },
];

// L3: Q21-30, sequential, audio → A/B/C text MCQ
const L3_QS = [
  { num: 21, audio: AUD(21), opts: { A: '牛奶 (niúnǎi)',             B: '苹果 (píngguǒ)',              C: '西瓜 (xīguā)' },          answer: 'C' as Opt3 },
  { num: 22, audio: AUD(22), opts: { A: '一次 (yí cì)',              B: '两次 (liǎng cì)',             C: '9次 (jiǔ cì)' },           answer: 'B' as Opt3 },
  { num: 23, audio: AUD(23), opts: { A: '学校 (xuéxiào)',            B: '公司 (gōngsī)',               C: '哥哥家 (gēge jiā)' },      answer: 'A' as Opt3 },
  { num: 24, audio: AUD(24), opts: { A: '想喝水 (xiǎng hē shuǐ)',   B: '生病了 (shēngbìng le)',       C: '不睡了 (bú shuì le)' },    answer: 'C' as Opt3 },
  { num: 25, audio: AUD(25), opts: { A: '儿子 (érzi)',               B: '妈妈 (māma)',                 C: '丈夫 (zhàngfu)' },         answer: 'A' as Opt3 },
  { num: 26, audio: AUD(26), opts: { A: '太晚了 (tài wǎn le)',       B: '小张不在 (Xiǎo Zhāng bú zài)', C: '不认识路 (bú rènshi lù)' }, answer: 'A' as Opt3 },
  { num: 27, audio: AUD(27), opts: { A: '两块钱 (liǎng kuài qián)', B: '三块钱 (sān kuài qián)',      C: '4块钱 (sì kuài qián)' },   answer: 'B' as Opt3 },
  { num: 28, audio: AUD(28), opts: { A: '晴天 (qíngtiān)',           B: '阴天 (yīntiān)',              C: '下雨了 (xiàyǔ le)' },      answer: 'B' as Opt3 },
  { num: 29, audio: AUD(29), opts: { A: '茶 (chá)',                  B: '菜 (cài)',                    C: '水果 (shuǐguǒ)' },         answer: 'C' as Opt3 },
  { num: 30, audio: AUD(30), opts: { A: '唱歌 (chànggē)',            B: '跳舞 (tiàowǔ)',               C: '上课 (shàngkè)' },         answer: 'C' as Opt3 },
];

// L4: Q31-35, sequential, audio → A/B/C text MCQ (longer dialogues)
const L4_QS = [
  { num: 31, audio: AUD(31), opts: { A: '说得好 (shuō de hǎo)',   B: '写得好 (xiě de hǎo)',   C: '不会写 (bú huì xiě)' },          answer: 'A' as Opt3 },
  { num: 32, audio: AUD(32), opts: { A: '太高了 (tài gāo le)',    B: '太贵了 (tài guì le)',   C: '颜色不好 (yánsè bù hǎo)' },     answer: 'A' as Opt3 },
  { num: 33, audio: AUD(33), opts: { A: '200多 (èrbǎi duō)',      B: '2000多 (liǎngqiān duō)', C: '3000多 (sānqiān duō)' },        answer: 'B' as Opt3 },
  { num: 34, audio: AUD(34), opts: { A: '学校 (xuéxiào)',          B: '医院 (yīyuàn)',          C: '饭店 (fàndiàn)' },              answer: 'B' as Opt3 },
  { num: 35, audio: AUD(35), opts: { A: '13号 (shísān hào)',       B: '14号 (shísì hào)',       C: '15号 (shíwǔ hào)' },            answer: 'C' as Opt3 },
];

// R1: Q36-40, matching, sentence → picture bank A-F
const R1_BANK: Record<string, { img: string; desc: string }> = {
  A: { img: IMG('r1_a.jpg'), desc: 'cat watching a fish in a bowl' },
  B: { img: IMG('r1_b.jpg'), desc: 'woman in winter coat looking up' },
  C: { img: IMG('r1_c.jpg'), desc: 'woman doing a high kick (dance/gymnastics)' },
  D: { img: IMG('r1_d.jpg'), desc: 'man shooting a basketball' },
  E: { img: IMG('r1_e.jpg'), desc: 'woman using nasal spray' },
  F: { img: IMG('r1_f.jpg'), desc: 'business handshake, two men and a woman' },
};
const R1_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const R1_QS = [
  { num: 36, zh: '给您介绍一下，这是我们公司的李先生。', pinyin: 'Gěi nín jièshào yíxià, zhè shì wǒmen gōngsī de Lǐ xiānsheng.', answer: 'F' },
  { num: 37, zh: '看书时间长了，眼睛得休息休息。',       pinyin: 'Kàn shū shíjiān cháng le, yǎnjing děi xiūxi xiūxi.',           answer: 'E' },
  { num: 38, zh: '那是我孩子，她爱跳舞。',               pinyin: 'Nà shì wǒ háizi, tā ài tiàowǔ.',                               answer: 'C' },
  { num: 39, zh: '今天下雪了，天气很冷。',               pinyin: 'Jīntiān xià xuě le, tiānqì hěn lěng.',                         answer: 'B' },
  { num: 40, zh: '因为我不会游泳，所以，小鱼，你好！', pinyin: 'Yīnwèi wǒ bú huì yóuyǒng, suǒyǐ, xiǎoyú, nǐ hǎo!',          answer: 'A' },
];

// R2: Q41-45, matching, fill blank from word bank A-F
const R2_BANK: Record<string, string> = {
  A: '完 (wán)',
  B: '进 (jìn)',
  C: '过 (guo)',
  D: '千 (qiān)',
  E: '贵 (guì)',
  F: '自行车 (zìxíngchē)',
};
const R2_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const R2_QS = [
  { num: 41, zh: '这个船非常大，可以坐几___人。',                                         pinyin: 'Zhège chuán fēicháng dà, kěyǐ zuò jǐ ___ rén.',                                        answer: 'D' },
  { num: 42, zh: '请___，这就是我的房间。',                                                pinyin: 'Qǐng ___, zhè jiù shì wǒ de fángjiān.',                                                 answer: 'B' },
  { num: 43, zh: '昨天的考试题太多，我没有做___。',                                        pinyin: 'Zuótiān de kǎoshì tí tài duō, wǒ méiyǒu zuò ___.',                                     answer: 'A' },
  { num: 44, zh: '我没去___中国，我希望今年能去中国旅游。',                                pinyin: 'Wǒ méi qù ___ Zhōngguó, wǒ xīwàng jīnnián néng qù Zhōngguó lǚyóu.',                   answer: 'C' },
  { num: 45, zh: '女：对不起，我不能和你一起去买___了。 男：没关系，我知道你很忙。',      pinyin: 'Duìbuqǐ, wǒ bùnéng hé nǐ yìqǐ qù mǎi ___ le. / Méi guānxi, wǒ zhīdào nǐ hěn máng.', answer: 'F' },
];

// R3: Q46-50, sequential, read passage → judge ★ statement ✓/✗
const R3_QS = [
  {
    num: 46,
    passage: '我上午去外面买了个新手机，九百多块钱，很便宜。',
    passagePinyin: 'Wǒ shàngwǔ qù wàimiàn mǎile ge xīn shǒujī, jiǔbǎi duō kuài qián, hěn piányi.',
    statement: '★ 那个手机不到一千元。',
    statementPinyin: 'Nàge shǒujī bú dào yìqiān yuán.',
    answer: '✓' as TF,
  },
  {
    num: 47,
    passage: '时间过得真快，我来北京10年了。我女儿已经5岁多了，都开始学习写汉字了。',
    passagePinyin: "Shíjiān guò de zhēn kuài, wǒ lái Běijīng shí nián le. Wǒ nǚ'ér yǐjīng wǔ suì duō le, dōu kāishǐ xuéxí xiě Hànzì le.",
    statement: '★ 我有两个孩子。',
    statementPinyin: 'Wǒ yǒu liǎng ge háizi.',
    answer: '✗' as TF,
  },
  {
    num: 48,
    passage: '今天是7月12日，再有三天就是我爸爸的生日了。我想送他一个电脑。',
    passagePinyin: "Jīntiān shì qī yuè shí'èr rì, zài yǒu sān tiān jiù shì wǒ bàba de shēngrì le. Wǒ xiǎng sòng tā yí ge diànnǎo.",
    statement: '★ 7月15日是我的生日。',
    statementPinyin: 'Qī yuè shíwǔ rì shì wǒ de shēngrì.',
    answer: '✗' as TF,
  },
  {
    num: 49,
    passage: '喂，姐，我的飞机是十点零七的，再有20分钟我就到机场了。我们下午见。',
    passagePinyin: 'Wéi, jiě, wǒ de fēijī shì shí diǎn líng qī de, zài yǒu èrshí fēnzhōng wǒ jiù dào jīchǎng le. Wǒmen xiàwǔ jiàn.',
    statement: '★ 我在去机场的路上。',
    statementPinyin: 'Wǒ zài qù jīchǎng de lù shang.',
    answer: '✓' as TF,
  },
  {
    num: 50,
    passage: '昨天和朋友们在外面玩儿了一个晚上，很累，但是很高兴。',
    passagePinyin: 'Zuótiān hé péngyoumen zài wàimiàn wánrle yí ge wǎnshang, hěn lèi, dànshì hěn gāoxìng.',
    statement: '★ 昨天玩儿得不高兴。',
    statementPinyin: 'Zuótiān wánr de bù gāoxìng.',
    answer: '✗' as TF,
  },
];

// R4a: Q51-55, matching, prompt → response bank A-F
const R4A_BANK: Record<string, string> = {
  A: '它不认识你。 (Tā bú rènshi nǐ.)',
  B: '很近，从这儿坐出租车，六七分钟就到了。 (Hěn jìn, cóng zhèr zuò chūzūchē, liù-qī fēnzhōng jiù dào le.)',
  C: '她三年的时间里，写了4本书。 (Tā sān nián de shíjiān lǐ, xiěle sì běn shū.)',
  D: '你比他大一岁。 (Nǐ bǐ tā dà yí suì.)',
  E: '他在哪儿呢？你看见他了吗？ (Tā zài nǎr ne? Nǐ kànjiàn tā le ma?)',
  F: '小刘叫我一起去跑步。 (Xiǎo Liú jiào wǒ yìqǐ qù pǎobù.)',
};
const R4A_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const R4A_QS = [
  { num: 51, zh: '我们要向您学习！',           pinyin: 'Wǒmen yào xiàng nín xuéxí!',               answer: 'C' },
  { num: 52, zh: '火车站离这儿远吗？',          pinyin: 'Huǒchēzhàn lí zhèr yuǎn ma?',              answer: 'B' },
  { num: 53, zh: '已经快8点了，你还出去做什么？', pinyin: 'Yǐjīng kuài bā diǎn le, nǐ hái chūqù zuò shénme?', answer: 'F' },
  { num: 54, zh: '小狗怎么了？为什么不吃东西？', pinyin: 'Xiǎogǒu zěnme le? Wèishénme bù chī dōngxi?', answer: 'A' },
  { num: 55, zh: '但是，你知道，你没有他高。',  pinyin: 'Dànshì, nǐ zhīdào, nǐ méiyǒu tā gāo.',   answer: 'D' },
];

// R4b: Q56-60, matching, prompt → response bank A-E
const R4B_BANK: Record<string, string> = {
  A: '他是我弟弟的中学同学。 (Tā shì wǒ dìdi de zhōngxué tóngxué.)',
  B: '谢谢您给我们的帮助！ (Xièxie nín gěi wǒmen de bāngzhù!)',
  C: '他现在每天工作10个小时，星期六也不休息。 (Tā xiànzài měitiān gōngzuò shí ge xiǎoshí, xīngqīliù yě bù xiūxi.)',
  D: '你们听懂我说的话了吗？ (Nǐmen tīngdǒng wǒ shuō de huà le ma?)',
  E: '等一下。你怎么回来这么晚？ (Děng yíxià. Nǐ zěnme huílai zhème wǎn?)',
};
const R4B_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const R4B_QS = [
  { num: 56, zh: '大家好！我姓王，是新来的汉语老师。',     pinyin: 'Dàjiā hǎo! Wǒ xìng Wáng, shì xīn lái de Hànyǔ lǎoshī.', answer: 'D' },
  { num: 57, zh: '这个月真的非常忙。',                    pinyin: 'Zhège yuè zhēn de fēicháng máng.',                           answer: 'C' },
  { num: 58, zh: '开门，快开门。',                        pinyin: 'Kāimén, kuài kāimén.',                                       answer: 'E' },
  { num: 59, zh: '她笑着对我说："不客气。"',              pinyin: 'Tā xiàozhe duì wǒ shuō: "bú kèqi."',                        answer: 'B' },
  { num: 60, zh: '我的天！你们认识？这怎么可能？',         pinyin: 'Wǒ de tiān! Nǐmen rènshi? Zhè zěnme kěnéng?',               answer: 'A' },
];

const ALL_QS: { num: number; answer: string }[] = [
  ...L1_QS, ...L2A_QS, ...L2B_QS, ...L3_QS, ...L4_QS,
  ...R1_QS, ...R2_QS, ...R3_QS, ...R4A_QS, ...R4B_QS,
];
const TOTAL_Q    = ALL_QS.length; // 60
const MAX_SCORE  = 200;
const PASS_SCORE = 120;

type Part = { label: string; section: string; questions: { num: number; answer: string }[] };
const PARTS: Part[] = [
  { label: 'Listening · Part 1',    section: 'L1',  questions: L1_QS  },
  { label: 'Listening · Part 2 (1)',section: 'L2A', questions: L2A_QS },
  { label: 'Listening · Part 2 (2)',section: 'L2B', questions: L2B_QS },
  { label: 'Listening · Part 3',    section: 'L3',  questions: L3_QS  },
  { label: 'Listening · Part 4',    section: 'L4',  questions: L4_QS  },
  { label: 'Reading · Part 1',      section: 'R1',  questions: R1_QS  },
  { label: 'Reading · Part 2',      section: 'R2',  questions: R2_QS  },
  { label: 'Reading · Part 3',      section: 'R3',  questions: R3_QS  },
  { label: 'Reading · Part 4 (1)',  section: 'R4A', questions: R4A_QS },
  { label: 'Reading · Part 4 (2)',  section: 'R4B', questions: R4B_QS },
];
const MATCHING_SECTIONS = new Set(['L2A', 'L2B', 'R1', 'R2', 'R4A', 'R4B']);

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

function LetterPicker({ letters, selected, correctAnswer, confirmed, onSelect }: {
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
          if (opt === correctAnswer)  cls += 'border-green-400 bg-green-100 text-green-700';
          else if (opt === selected)  cls += 'border-red-400 bg-red-100 text-red-600';
          else                        cls += 'border-gray-100 bg-white text-gray-300';
        } else {
          cls += opt === selected
            ? 'border-orange-400 bg-orange-100 text-orange-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50';
        }
        return <button key={opt} className={cls} disabled={confirmed} onClick={() => onSelect(opt)}>{opt}</button>;
      })}
    </div>
  );
}

function PictureBank({ bank, letters, confirmed, selected, imgHeight = 'h-[96px]' }: {
  bank: Record<string, { img: string; desc: string }>;
  letters: string[];
  confirmed: boolean;
  selected: Record<number, string>;
  imgHeight?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {letters.map(letter => {
        const opt = bank[letter]!;
        const usedBy = Object.entries(selected).filter(([, v]) => v === letter);
        return (
          <div key={letter} className="relative">
            <ImgOrDesc src={opt.img} desc={opt.desc} className={`w-full ${imgHeight}`} />
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
  const listenQs = ALL_QS.filter(q => q.num <= 35);
  const readQs   = ALL_QS.filter(q => q.num > 35);
  const listeningCorrect = listenQs.filter(q => answers[q.num] === q.answer).length;
  const readingCorrect   = readQs.filter(q => answers[q.num] === q.answer).length;
  const listeningScore   = Math.round(listeningCorrect / 35 * 100);
  const readingScore     = Math.round(readingCorrect / 25 * 100);
  const total = listeningScore + readingScore;
  const passed = total >= PASS_SCORE;

  const partBreakdown = PARTS.map(p => ({
    label:   p.label,
    correct: p.questions.filter(q => answers[q.num] === q.answer).length,
    total:   p.questions.length,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
        <p className="text-5xl font-bold text-gray-800">{total}<span className="text-2xl text-gray-400 font-normal"> / {MAX_SCORE}</span></p>
        <p className={`text-base font-semibold ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? (total >= 180 ? '🏆 Excellent!' : '✅ Pass') : '❌ Not passed — 120 required'}
        </p>
        <p className="text-sm text-amber-600 font-semibold">+{xpEarned} XP</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">Listening</span>
          <span className="text-sm font-semibold text-gray-700">{listeningScore} / 100</span>
        </div>
        {partBreakdown.slice(0, 5).map(p => (
          <div key={p.label} className="px-4 py-2.5 flex items-center justify-between pl-8">
            <span className="text-sm text-gray-500">{p.label}</span>
            <span className={`text-sm font-medium ${p.correct === p.total ? 'text-green-600' : p.correct / p.total >= 0.6 ? 'text-amber-600' : 'text-red-500'}`}>{p.correct} / {p.total}</span>
          </div>
        ))}
        <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">Reading</span>
          <span className="text-sm font-semibold text-gray-700">{readingScore} / 100</span>
        </div>
        {partBreakdown.slice(5).map(p => (
          <div key={p.label} className="px-4 py-2.5 flex items-center justify-between pl-8">
            <span className="text-sm text-gray-500">{p.label}</span>
            <span className={`text-sm font-medium ${p.correct === p.total ? 'text-green-600' : p.correct / p.total >= 0.6 ? 'text-amber-600' : 'text-red-500'}`}>{p.correct} / {p.total}</span>
          </div>
        ))}
      </div>
      <Link href="/" className="block w-full bg-orange-500 text-white font-semibold py-4 rounded-xl text-center hover:bg-orange-600 transition-colors">
        Back to home
      </Link>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ExamHsk2() {
  const router = useRouter();
  const user   = useUser();
  const exam   = getExamById(EXAM_ID);

  const [partIdx, setPartIdx]               = useState(0);
  const [qIdx, setQIdx]                     = useState(0);
  const [selected, setSelected]             = useState<string | null>(null);
  const [confirmed, setConfirmed]           = useState(false);
  const [matchAnswers, setMatchAnswers]     = useState<Record<number, string>>({});
  const [matchConfirmed, setMatchConfirmed] = useState(false);
  const [answers, setAnswers]               = useState<Record<number, string>>({});
  const [done, setDone]                     = useState(false);
  const [xpEarned, setXpEarned]             = useState(0);
  const [userProgress, setUserProgress]     = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    getUserProgress().then(setUserProgress);
  }, [user, router]);

  useEffect(() => {
    setQIdx(0); setSelected(null); setConfirmed(false);
    setMatchAnswers({}); setMatchConfirmed(false);
  }, [partIdx]);

  if (user === undefined) {
    return <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center"><div className="text-4xl animate-pulse">🍊</div></div>;
  }
  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Exam not found. <Link href="/" className="text-orange-500 underline">Back to home</Link></p></div>;
  }

  const part       = PARTS[partIdx]!;
  const isMatching = MATCHING_SECTIONS.has(part.section);
  const partQs     = part.questions;
  const committedCount  = Object.keys(answers).length;
  const inProgressCount = isMatching ? Object.keys(matchAnswers).length : (confirmed ? qIdx + 1 : qIdx);
  const pct             = Math.round(((committedCount + inProgressCount) / TOTAL_Q) * 100);

  async function finishExam(finalAnswers: Record<number, string>) {
    const listeningCorrect = ALL_QS.filter(q => q.num <= 35 && finalAnswers[q.num] === q.answer).length;
    const readingCorrect   = ALL_QS.filter(q => q.num > 35  && finalAnswers[q.num] === q.answer).length;
    const total = Math.round(listeningCorrect / 35 * 100) + Math.round(readingCorrect / 25 * 100);
    setXpEarned(total); setAnswers(finalAnswers); setDone(true);
    await saveExamProgress({ examId: EXAM_ID, score: total, total: MAX_SCORE, completedAt: new Date().toISOString() });
    if (userProgress) await saveUserProgress(updateStreak(addXp(userProgress, total)));
  }

  function handleSelect(val: string) { if (!confirmed) setSelected(val); }
  function handleConfirm() {
    if (!selected) return;
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [partQs[qIdx]!.num]: selected }));
  }
  async function handleNext() {
    setSelected(null); setConfirmed(false);
    if (qIdx + 1 < partQs.length) { setQIdx(qIdx + 1); return; }
    if (partIdx + 1 < PARTS.length) { setPartIdx(partIdx + 1); return; }
    await finishExam({ ...answers });
  }
  function handleMatchPick(num: number, letter: string) {
    if (matchConfirmed) return;
    setMatchAnswers(prev => ({ ...prev, [num]: letter }));
  }
  async function handleMatchContinue() {
    const newAnswers = { ...answers, ...matchAnswers };
    if (partIdx + 1 < PARTS.length) { setAnswers(newAnswers); setPartIdx(partIdx + 1); }
    else await finishExam(newAnswers);
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

  const q            = partQs[qIdx];
  const isCorrect    = !!q && selected === q.answer;
  const section      = part.section;
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
            <span className="text-xs text-gray-500 shrink-0">{committedCount + inProgressCount} / {TOTAL_Q}</span>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{part.label}{!isMatching && q && ` · Q${q.num}`}</p>
        </div>

        {/* ── L1: audio + image, ✓/✗ ── */}
        {section === 'L1' && (() => {
          const lq = L1_QS[qIdx];
          if (!lq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen. Does it match the picture?</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
                <ImgOrDesc src={lq.image} desc={lq.desc} className="w-full h-36" />
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

        {/* ── L2A/L2B: all 5 at once — audio → picture bank ── */}
        {(section === 'L2A' || section === 'L2B') && (() => {
          const bank    = section === 'L2A' ? L2A_BANK : L2B_BANK;
          const letters = section === 'L2A' ? L2A_LETTERS : L2B_LETTERS;
          const qs      = section === 'L2A' ? L2A_QS : L2B_QS;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen to each dialogue and pick the matching picture ({letters[0]}–{letters[letters.length - 1]}).</p>
              <PictureBank bank={bank} letters={letters} confirmed={matchConfirmed} selected={matchAnswers} imgHeight="h-[100px]" />
              <div className="space-y-2">
                {qs.map(lq => (
                  <div key={lq.num} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 shrink-0 w-5">{lq.num}.</span>
                    <AudioBtn src={lq.audio} />
                    <div className="flex-1">
                      <LetterPicker letters={letters} selected={matchAnswers[lq.num] ?? null} correctAnswer={lq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(lq.num, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── L3 / L4: sequential, audio → A/B/C text MCQ ── */}
        {(section === 'L3' || section === 'L4') && (() => {
          const qs = section === 'L3' ? L3_QS : L4_QS;
          const lq = qs[qIdx];
          if (!lq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen, then choose the correct answer.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
              <div className="space-y-2">
                {(['A', 'B', 'C'] as Opt3[]).map(letter => {
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

        {/* ── R1: all 5 at once — sentence → picture bank ── */}
        {section === 'R1' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Match each sentence to the correct picture (A–F).</p>
            <PictureBank bank={R1_BANK} letters={R1_LETTERS} confirmed={matchConfirmed} selected={matchAnswers} imgHeight="h-[96px]" />
            <div className="space-y-2">
              {R1_QS.map(rq => (
                <div key={rq.num} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-5">{rq.num}.</span>
                    <div>
                      <p className="chinese-text text-base text-gray-800">{rq.zh}</p>
                      <p className="text-xs text-gray-400">{rq.pinyin}</p>
                    </div>
                  </div>
                  <div className="pl-7">
                    <LetterPicker letters={R1_LETTERS} selected={matchAnswers[rq.num] ?? null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(rq.num, v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── R2: all 5 at once — fill blank from word bank ── */}
        {section === 'R2' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Choose the correct word to fill each blank (A–F).</p>
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Word bank</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {R2_LETTERS.map(letter => (
                  <div key={letter} className="flex gap-2 text-sm text-gray-600">
                    <span className="font-bold text-gray-400 shrink-0">{letter}.</span>
                    <span>{R2_BANK[letter]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {R2_QS.map(rq => (
                <div key={rq.num} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-5">{rq.num}.</span>
                    <p className="chinese-text text-base text-gray-800 leading-relaxed">{rq.zh}</p>
                  </div>
                  <div className="pl-7">
                    <LetterPicker letters={R2_LETTERS} selected={matchAnswers[rq.num] ?? null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(rq.num, v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── R3: sequential — read passage, judge ★ statement ✓/✗ ── */}
        {section === 'R3' && (() => {
          const rq = R3_QS[qIdx];
          if (!rq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Read the passage, then judge if the statement is correct.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="chinese-text text-base text-gray-800 leading-relaxed">{rq.passage}</p>
                <p className="text-xs text-gray-400">{rq.passagePinyin}</p>
                <div className="border-t border-gray-100 pt-3">
                  <p className="chinese-text text-base font-semibold text-gray-800">{rq.statement}</p>
                  <p className="text-xs text-gray-400">{rq.statementPinyin}</p>
                </div>
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

        {/* ── R4A/R4B: all 5 at once — prompt → response bank ── */}
        {(section === 'R4A' || section === 'R4B') && (() => {
          const bank    = section === 'R4A' ? R4A_BANK : R4B_BANK;
          const letters = section === 'R4A' ? R4A_LETTERS : R4B_LETTERS;
          const qs      = section === 'R4A' ? R4A_QS : R4B_QS;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Match each prompt to the correct response ({letters[0]}–{letters[letters.length - 1]}).</p>
              <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Responses</p>
                {letters.map(letter => (
                  <div key={letter} className="flex gap-2 text-sm text-gray-600">
                    <span className="font-bold text-gray-400 shrink-0">{letter}.</span>
                    <span>{bank[letter]}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {qs.map(rq => (
                  <div key={rq.num} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-5">{rq.num}.</span>
                      <div>
                        <p className="chinese-text text-base text-gray-800">{rq.zh}</p>
                        <p className="text-xs text-gray-400">{rq.pinyin}</p>
                      </div>
                    </div>
                    <div className="pl-7">
                      <LetterPicker letters={letters} selected={matchAnswers[rq.num] ?? null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(rq.num, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Action buttons ── */}

        {!isMatching && !confirmed && selected && (
          <button onClick={handleConfirm} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 transition-colors">
            Check answer
          </button>
        )}
        {!isMatching && confirmed && (
          <>
            <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${q?.answer}`}
              </p>
            </div>
            <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
              {committedCount + qIdx + 1 >= TOTAL_Q ? 'See results' : 'Next →'}
            </button>
          </>
        )}
        {isMatching && !matchConfirmed && (
          <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled}
            className={`w-full font-semibold py-4 rounded-xl transition-colors ${matchAllFilled ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
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
