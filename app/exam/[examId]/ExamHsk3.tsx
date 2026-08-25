'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { saveExamProgress, getUserProgress, saveUserProgress } from '@/lib/db';
import { addXp, updateStreak } from '@/lib/xp';
import { getExamById } from '@/lib/data/exams';
import { loadModel, recognizeChar } from '@/lib/char-recognition';
import type { UserProgress } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const EXAM_ID    = 'exam-hsk3-h31001';
const TOTAL_Q    = 80;
const MAX_SCORE  = 300;
const PASS_SCORE = 180;

const AUD = (n: number) => `/hsk3/audio/item${String(n).padStart(2, '0')}.mp3`;

type TF   = '✓' | '✗';
type Opt3 = 'A' | 'B' | 'C';

// ── Picture / text banks ──────────────────────────────────────────────────────

const L1A_BANK: Record<string, string> = {
  A: 'man leaning over woman at laptop',
  B: 'man standing with briefcase, looking at watch',
  C: 'woman sitting surrounded by shoes, tired',
  D: 'woman on the phone at reception desk',
  E: 'man riding a bicycle in suit',
  F: 'female doctor writing on clipboard',
};
const L1A_LETTERS = ['A','B','C','D','E','F'];

const L1B_BANK: Record<string, string> = {
  A: 'hiker / backpacker with lots of gear',
  B: 'young couple with baby on couch',
  C: 'mother helping son with homework',
  D: 'couple cooking together',
  E: 'man and woman relaxing on couch',
};
const L1B_LETTERS = ['A','B','C','D','E'];

const R1A_BANK: Record<string, string> = {
  A: '太好了！需要我帮忙吗？',
  B: '今天把我饿坏了，还有什么吃的吗？',
  C: '你最好再检查一下，看还有没有问题。',
  D: '没问题，你就放心吧。',
  E: '当然。我们先坐公共汽车，然后换地铁。',
  F: '这条裤子你花了多少钱？',
};
const R1A_LETTERS = ['A','B','C','D','E','F'];

const R1B_BANK: Record<string, string> = {
  A: '银行马上就要关门了。',
  B: '那是我叔叔的儿子，一岁多了。',
  C: '把菜单儿给我，我们喝杯绿茶吧？',
  D: '我的几个同事周末想去北京玩儿，但他们都不会开车。',
  E: '昨天的雨下得非常大，我没带伞。',
};
const R1B_LETTERS = ['A','B','C','D','E'];

const R2A_BANK: Record<string, string> = { A:'其实', B:'感冒', C:'附近', D:'舒服', E:'声音', F:'把' };
const R2A_LETTERS = ['A','B','C','D','E','F'];

const R2B_BANK: Record<string, string> = { A:'刻', B:'一直', C:'节', D:'爱好', E:'被', F:'打扫' };
const R2B_LETTERS = ['A','B','C','D','E','F'];

// ── Question data ─────────────────────────────────────────────────────────────

const L1A_QS = [
  { num:1,  audio:AUD(1),  answer:'B' },
  { num:2,  audio:AUD(2),  answer:'C' },
  { num:3,  audio:AUD(3),  answer:'E' },
  { num:4,  audio:AUD(4),  answer:'F' },
  { num:5,  audio:AUD(5),  answer:'A' },
];
const L1B_QS = [
  { num:6,  audio:AUD(6),  answer:'B' },
  { num:7,  audio:AUD(7),  answer:'C' },
  { num:8,  audio:AUD(8),  answer:'A' },
  { num:9,  audio:AUD(9),  answer:'D' },
  { num:10, audio:AUD(10), answer:'E' },
];

const L2_QS: { num:number; audio:string; passage:string; statement:string; answer:TF }[] = [
  { num:11, audio:AUD(11), passage:'我以前以为北京话就是普通话，到北京两年后，我才发现不是这样的。',                                                                                                                                                                                                                                statement:'★ 北京话和普通话是相同的。',    answer:'✗' },
  { num:12, audio:AUD(12), passage:'你明天到办公室找我，我在七零七；如果我不在，你就上八楼，到八零三会议室找我，我可能在那儿开会。',                                                                                                                                                  statement:'★ 会议室在8层。',              answer:'✓' },
  { num:13, audio:AUD(13), passage:'我已经从图书馆出来了，那几本书都还了，你们等我一会儿，我很快就到。',                                                                                                                                                                            statement:'★ 他已经到了。',               answer:'✗' },
  { num:14, audio:AUD(14), passage:'这辆车现在能卖十万块钱吧，我两年前买的时候花了二十多万。',                                                                                                                                                                                      statement:'★ 这是辆旧车。',               answer:'✓' },
  { num:15, audio:AUD(15), passage:'有些人不喜欢吃蛋糕，是因为太甜了；有些人不喜欢吃蛋糕，是因为害怕长胖。但小孩子看见蛋糕是不会客气的，他们认为蛋糕越甜越好吃。',                                                                                                              statement:'★ 小孩子爱吃蛋糕。',           answer:'✓' },
  { num:16, audio:AUD(16), passage:'我这次来北京，只能住三天，所以我只能选择一两个最有名的地方去看看，以后有机会再去别的地方。',                                                                                                                                                    statement:'★ 他在北京玩了很多地方。',     answer:'✗' },
  { num:17, audio:AUD(17), passage:'每次坐火车前，周明都会去超市买一些东西，除了面包、水果，他还要买一些报纸。',                                                                                                                                                                    statement:'★ 周明坐火车时喜欢看报纸。',   answer:'✓' },
  { num:18, audio:AUD(18), passage:'他有很多爱好，唱歌、画画儿、踢足球、玩儿音乐，什么都会，而且水平也都特别高。',                                                                                                                                                                  statement:'★ 他喜欢音乐，也喜欢运动。',   answer:'✓' },
  { num:19, audio:AUD(19), passage:'她每天到办公室的第一件事就是打开电脑，看电子邮件，然后才开始别的工作。',                                                                                                                                                                        statement:'★ 她对自己的工作没兴趣。',     answer:'✗' },
  { num:20, audio:AUD(20), passage:'您先看看这种颜色的怎么样？这种手机很便宜，只要两千多块钱。它还可以照相，现在卖得很不错。',                                                                                                                                                      statement:'★ 他们在买空调。',             answer:'✗' },
];

const L3_QS: { num:number; audio:string; question:string; opts:Record<Opt3,string>; answer:Opt3 }[] = [
  { num:21, audio:AUD(21), question:'男的怎么了？',          opts:{A:'迟到了',B:'生病了',C:'生气了'},      answer:'B' },
  { num:22, audio:AUD(22), question:'他们最可能在哪里？',    opts:{A:'教室',B:'机场',C:'宾馆'},            answer:'C' },
  { num:23, audio:AUD(23), question:'关于大熊猫，可以知道什么？', opts:{A:'有两只',B:'爱跳舞',C:'是新来的'}, answer:'C' },
  { num:24, audio:AUD(24), question:'今年下了几次雪了？',    opts:{A:'一次',B:'两次',C:'三次'},            answer:'C' },
  { num:25, audio:AUD(25), question:'女的要去哪儿？',        opts:{A:'商店',B:'书店',C:'学校东门'},        answer:'B' },
  { num:26, audio:AUD(26), question:'女的是教什么的？',      opts:{A:'汉语',B:'历史',C:'数学'},            answer:'C' },
  { num:27, audio:AUD(27), question:'男的主要是什么意思？',  opts:{A:'喜欢看球赛',B:'喜欢打篮球',C:'喜欢参加比赛'}, answer:'A' },
  { num:28, audio:AUD(28), question:'女的希望怎么样？',      opts:{A:'买个新的',B:'买个贵的',C:'先借一个'}, answer:'A' },
  { num:29, audio:AUD(29), question:'他们做什么了？',        opts:{A:'上网',B:'爬山',C:'游泳'},            answer:'B' },
  { num:30, audio:AUD(30), question:'他们打算在哪儿见面？',  opts:{A:'国外',B:'飞机上',C:'老地方'},        answer:'C' },
];

const L4_QS: { num:number; audio:string; question:string; opts:Record<Opt3,string>; answer:Opt3 }[] = [
  { num:31, audio:AUD(31), question:'他们在说什么？',               opts:{A:'习惯',B:'天气',C:'文化'},              answer:'B' },
  { num:32, audio:AUD(32), question:'说话人最可能是什么关系？',     opts:{A:'夫妻',B:'妈妈和儿子',C:'爸爸和女儿'},   answer:'B' },
  { num:33, audio:AUD(33), question:'那个行李箱是什么样的？',       opts:{A:'很矮',B:'很大',C:'黄色的'},            answer:'B' },
  { num:34, audio:AUD(34), question:'明天天气怎么样？',             opts:{A:'多云',B:'很热',C:'更冷'},              answer:'C' },
  { num:35, audio:AUD(35), question:'那个女孩儿是谁的孩子？',       opts:{A:'邻居的',B:'客人的',C:'校长的'},        answer:'A' },
  { num:36, audio:AUD(36), question:'天"短"了表示什么意思？',       opts:{A:'夏天来了',B:'月亮出来了',C:'天黑得早了'}, answer:'C' },
  { num:37, audio:AUD(37), question:'关于表演，下面哪个是对的？',   opts:{A:'在二层',B:'影响不大',C:'已经结束了'},  answer:'A' },
  { num:38, audio:AUD(38), question:'女的希望男的怎么样？',         opts:{A:'不要离开',B:'给她写信',C:'有更好的成绩'}, answer:'C' },
  { num:39, audio:AUD(39), question:'护照是在哪儿找到的？',         opts:{A:'衬衫里',B:'洗手间',C:'椅子上'},        answer:'A' },
  { num:40, audio:AUD(40), question:'男的刚才为什么没接电话？',     opts:{A:'在洗澡',B:'在睡觉',C:'在看新闻'},      answer:'A' },
];

const R1A_QS = [
  { num:41, prompt:'我的作业早就完成了。',                     answer:'C' },
  { num:42, prompt:'你先来个苹果，我去给你做碗面条儿。',       answer:'B' },
  { num:43, prompt:'我终于有了自己的大房子了，明天就可以搬家了。', answer:'A' },
  { num:44, prompt:'这几天我不在家，小狗就请你帮我照顾了。',   answer:'D' },
  { num:45, prompt:'姐姐给我买的，我也不太清楚。',             answer:'F' },
];

const R1B_QS = [
  { num:46, prompt:'这个小孩儿胖胖的，真可爱。',               answer:'B' },
  { num:47, prompt:'我哥是司机，我问问他，看他有没有时间。',   answer:'D' },
  { num:48, prompt:'你怎么又生病了？',                         answer:'E' },
  { num:49, prompt:'没关系，我明天去也可以。',                 answer:'A' },
  { num:50, prompt:'好的，我也有些渴了。',                     answer:'C' },
];

const R2A_QS = [
  { num:51, sentence:'电影马上就要开始了，（　）手机关了吧。',                             answer:'F' },
  { num:52, sentence:'他很高，这张桌子太低，坐着很不（　）。',                             answer:'D' },
  { num:53, sentence:'您可以选择火车站（　）的宾馆，住那儿会更方便。',                     answer:'C' },
  { num:54, sentence:'天气冷，你多穿点儿衣服，小心（　）。',                               answer:'B' },
  { num:55, sentence:'对一个女人来说，漂亮、聪明都很重要，但（　）更重要的是快乐。',       answer:'A' },
];

const R2B_QS = [
  { num:56, sentence:'A：请问，现在是十一点吗？ B：现在十一点十五了，您的表慢了一（　）。',             answer:'A' },
  { num:57, sentence:'A：最近怎么（　）没看见他？ B：他去旅游了，可能这个周末才能回来。',             answer:'B' },
  { num:58, sentence:'A：牛奶呢？ B：一定是（　）猫喝了。',                                            answer:'E' },
  { num:59, sentence:'A：你家的厨房真干净！ B：当然了，为了欢迎你，我已经（　）了两个多小时了。',     answer:'F' },
  { num:60, sentence:'A：买这么多鲜花，今天是谁的生日啊？ B：今天是9月10日，教师（　）！这是为老师准备的。', answer:'C' },
];

const R3_QS: { num:number; passage:string; question:string; opts:Record<Opt3,string>; answer:Opt3 }[] = [
  { num:61, passage:'人们常说：今天工作不努力，明天努力找工作。',                                                                                                                   question:'★ 这句话的意思主要是：',    opts:{A:'要努力工作',B:'明天会更好',C:'时间过得太快'},        answer:'A' },
  { num:62, passage:'请大家把黑板上的这些词写在本子上，回家后用这些词语写一个小故事，别忘了，最少写100字。',                                                                       question:'★ 说话人最可能是做什么的？', opts:{A:'老师',B:'学生',C:'经理'},                           answer:'A' },
  { num:63, passage:'我对这儿很满意，虽然没有花园，但是离河边很近，那里有草地，有大树，还有鸟；虽然冬天天气很冷，但是空气新鲜，而且房间里一点儿也不冷。',                           question:'★ 使他觉得满意的是：',       opts:{A:'没有花园',B:'房间很大',C:'离河很近'},               answer:'C' },
  { num:64, passage:'昨天晚上睡得太晚，今天起床时已经8点多了，我刷了牙，洗了脸，就出来了，差点儿忘了关门。到了公司，会议已经开始了。没办法，我只能站在外面等休息时间。',             question:'★ 他今天早上：',             opts:{A:'没复习',B:'迟到了',C:'忘了关门'},                   answer:'B' },
  { num:65, passage:'我去年春节去过一次上海，今年再去的时候，发现那里的变化非常大。经过那条街道时，我几乎不认识了。',                                                               question:'★ 根据这段话，可以知道：',   opts:{A:'现在是春节',B:'上海变化很大',C:'上海人很热情'},     answer:'B' },
  { num:66, passage:'世界真的很小，我昨天才发现，你给小张介绍的男朋友是我妻子以前的同事。',                                                                                         question:'★ 小张的男朋友是我妻子：',   opts:{A:'以前的同事',B:'以前的丈夫',C:'以前的男朋友'},       answer:'A' },
  { num:67, passage:'下班后，在路上遇到一个老同学。好久没见面，我们就在公司旁边那个咖啡馆里坐了坐，一边喝咖啡一边说了些过去的事，所以回来晚了。',                                   question:'★ 根据这段话，可以知道：',   opts:{A:'他回到家了',B:'他正在喝咖啡',C:'咖啡馆在公园旁边'}, answer:'A' },
  { num:68, passage:'小刘是一位小学老师，教三年级的数学，他虽然很年轻，但是课讲得很好，同学们都很喜欢他。',                                                                           question:'★ 学生为什么喜欢刘老师？',   opts:{A:'很年轻',B:'课讲得好',C:'对学生要求高'},             answer:'B' },
  { num:69, passage:'今天12号了，晚上陈阿姨要来家里，家里有菜，有鱼，还有些羊肉，但是没有水果了，你去买些香蕉、葡萄吧，再买个西瓜？',                                               question:'★ 家里需要买什么？',         opts:{A:'鸡蛋',B:'水果',C:'果汁'},                           answer:'B' },
  { num:70, passage:'有人问我长得像谁，这个问题不太好回答。家里人一般觉得我的鼻子和耳朵像我爸爸，眼睛像我妈妈。',                                                                     question:'★ 关于他，下面哪个是对的？', opts:{A:'头发很长',B:'不像妈妈',C:'鼻子像爸爸'},             answer:'C' },
];

const W1_QS: { num:number; words:string[]; answer:string }[] = [
  { num:71, words:['弟弟','笑了','高兴地'],                      answer:'弟弟高兴地笑了。' },
  { num:72, words:['简单','上午的考试','比较'],                  answer:'上午的考试比较简单。' },
  { num:73, words:['越来越好','变得','这个城市的环境','了'],      answer:'这个城市的环境变得越来越好了。' },
  { num:74, words:['送给他','那位','医生','一个礼物'],            answer:'那位医生送给他一个礼物。' },
  { num:75, words:['其他班的成绩','有','也','很大','提高'],       answer:'其他班的成绩也有很大提高。' },
];

const W2_QS: { num:number; sentence:string; hint:string; answer:string }[] = [
  { num:76, sentence:'医院离这儿很远，我们坐（　）租车去吧。',           hint:'chū',  answer:'出' },
  { num:77, sentence:'一（　）是10角，一角是10分。',                     hint:'yuán', answer:'元' },
  { num:78, sentence:'我不认识他，你知道他姓什么、（　）什么吗？',       hint:'jiào', answer:'叫' },
  { num:79, sentence:'（　）间穿红裙子的一定是他妹妹。',                 hint:'Zhōng',answer:'中' },
  { num:80, sentence:'我已经饱了，不想吃（　）饭了。',                   hint:'mǐ',   answer:'米' },
];

// ── PARTS ─────────────────────────────────────────────────────────────────────

type Part = { label:string; section:string; questions:{ num:number; answer:string }[] };

const PARTS: Part[] = [
  { label:'Listening · Part 1 (1)', section:'L1A', questions:L1A_QS },
  { label:'Listening · Part 1 (2)', section:'L1B', questions:L1B_QS },
  { label:'Listening · Part 2',     section:'L2',  questions:L2_QS  },
  { label:'Listening · Part 3',     section:'L3',  questions:L3_QS  },
  { label:'Listening · Part 4',     section:'L4',  questions:L4_QS  },
  { label:'Reading · Part 1 (1)',   section:'R1A', questions:R1A_QS },
  { label:'Reading · Part 1 (2)',   section:'R1B', questions:R1B_QS },
  { label:'Reading · Part 2 (1)',   section:'R2A', questions:R2A_QS },
  { label:'Reading · Part 2 (2)',   section:'R2B', questions:R2B_QS },
  { label:'Reading · Part 3',       section:'R3',  questions:R3_QS  },
  { label:'Writing · Part 1',       section:'W1',  questions:W1_QS  },
  { label:'Writing · Part 2',       section:'W2',  questions:W2_QS  },
];

const MATCHING_SECTIONS = new Set(['L1A','L1B','R1A','R1B','R2A','R2B']);

const ALL_QS: { num:number; answer:string }[] = PARTS.flatMap(p => p.questions);

// ── Helper components ─────────────────────────────────────────────────────────

function AudioBtn({ src, autoPlay }: { src:string; autoPlay?:boolean }) {
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
  letters:string[]; selected:string|null; correctAnswer:string; confirmed:boolean; onSelect:(v:string)=>void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {letters.map(opt => {
        let cls = 'w-9 h-9 rounded-lg text-sm font-bold border-2 transition-colors ';
        if (confirmed) {
          if (opt === correctAnswer) cls += 'border-green-400 bg-green-100 text-green-700';
          else if (opt === selected) cls += 'border-red-400 bg-red-100 text-red-600';
          else                       cls += 'border-gray-100 bg-white text-gray-300';
        } else {
          cls += opt === selected
            ? 'border-orange-400 bg-orange-100 text-orange-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300';
        }
        return <button key={opt} className={cls} disabled={confirmed} onClick={() => onSelect(opt)}>{opt}</button>;
      })}
    </div>
  );
}

function TextBank({ bank, letters, confirmed, selected }: {
  bank:Record<string,string>; letters:string[]; confirmed:boolean; selected:Record<number,string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {letters.map(letter => {
        const usedBy = Object.entries(selected).filter(([,v]) => v === letter);
        return (
          <div key={letter} className={`flex gap-2 items-start rounded-xl border px-3 py-2 text-sm ${
            confirmed && usedBy.length > 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
          }`}>
            <span className="font-bold text-gray-500 shrink-0">{letter}.</span>
            <span className="text-gray-700 chinese-text leading-snug">{bank[letter]}</span>
          </div>
        );
      })}
    </div>
  );
}

function W2DrawCard({ q, modelReady, onResult, disabled }: {
  q:{ num:number; sentence:string; hint:string; answer:string };
  modelReady:boolean;
  onResult:(correct:boolean)=>void;
  disabled:boolean;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 8;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    function pos(e: MouseEvent | TouchEvent) {
      const el = canvas!;
      const r = el.getBoundingClientRect();
      const sx = el.width / r.width; const sy = el.height / r.height;
      if ('touches' in e && e.touches.length > 0) {
        const t = e.touches[0]!;
        return { x:(t.clientX - r.left)*sx, y:(t.clientY - r.top)*sy };
      }
      const me = e as MouseEvent;
      return { x:(me.clientX - r.left)*sx, y:(me.clientY - r.top)*sy };
    }
    function down(e: MouseEvent | TouchEvent) {
      isDrawingRef.current = true;
      const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault();
    }
    function move(e: MouseEvent | TouchEvent) {
      if (!isDrawingRef.current) return;
      const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault();
    }
    function up() { isDrawingRef.current = false; }

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', up);
    canvas.addEventListener('mouseleave', up);
    canvas.addEventListener('touchstart', down, { passive:false });
    canvas.addEventListener('touchmove', move, { passive:false });
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

  function clearCanvas() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function handleSubmit() {
    const canvas = canvasRef.current; if (!canvas || loading) return;
    setLoading(true);
    const result = await recognizeChar(canvas, q.answer);
    setLoading(false);
    onResult(result.correct);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className={`rounded-2xl border-2 ${disabled ? 'border-gray-200 opacity-70' : 'border-dashed border-gray-300'} overflow-hidden bg-white`}>
          <canvas ref={canvasRef} width={280} height={280} className="touch-none block" />
        </div>
      </div>
      {!disabled && (
        <div className="flex gap-3">
          <button onClick={clearCanvas} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50">Clear</button>
          <button onClick={handleSubmit} disabled={loading || !modelReady} className="flex-1 bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40">
            {loading ? 'Checking…' : modelReady ? 'Submit' : 'Loading…'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function ResultsScreen({ answers, xpEarned }: { answers:Record<number,string>; xpEarned:number }) {
  const listenQs  = ALL_QS.filter(q => q.num <= 40);
  const readQs    = ALL_QS.filter(q => q.num > 40 && q.num <= 70);
  const writeQs   = ALL_QS.filter(q => q.num > 70);
  const lCorrect  = listenQs.filter(q => answers[q.num] === q.answer).length;
  const rCorrect  = readQs.filter(q => answers[q.num] === q.answer).length;
  const wCorrect  = writeQs.filter(q => answers[q.num] === q.answer).length;
  const lScore    = Math.round(lCorrect / 40 * 100);
  const rScore    = Math.round(rCorrect / 30 * 100);
  const wScore    = Math.round(wCorrect / 10 * 100);
  const total     = lScore + rScore + wScore;
  const passed    = total >= PASS_SCORE;

  const breakdown = PARTS.map(p => ({
    label:   p.label,
    correct: p.questions.filter(q => answers[q.num] === q.answer).length,
    total:   p.questions.length,
  }));

  const sections = [
    { title:'Listening', score:lScore, rows:breakdown.slice(0, 5) },
    { title:'Reading',   score:rScore, rows:breakdown.slice(5, 10) },
    { title:'Writing',   score:wScore, rows:breakdown.slice(10) },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
        <p className="text-5xl font-bold text-gray-800">{total}<span className="text-2xl text-gray-400 font-normal"> / {MAX_SCORE}</span></p>
        <p className={`text-base font-semibold ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? (total >= 240 ? '🏆 Excellent!' : '✅ Pass') : '❌ Not passed — 180 required'}
        </p>
        <p className="text-sm text-amber-600 font-semibold">+{xpEarned} XP</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {sections.map(sec => (
          <div key={sec.title}>
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">{sec.title}</span>
              <span className="text-sm font-semibold text-gray-700">{sec.score} / 100</span>
            </div>
            {sec.rows.map(p => (
              <div key={p.label} className="px-4 py-2.5 flex items-center justify-between pl-8">
                <span className="text-sm text-gray-500">{p.label}</span>
                <span className={`text-sm font-medium ${p.correct === p.total ? 'text-green-600' : p.correct/p.total >= 0.6 ? 'text-amber-600' : 'text-red-500'}`}>{p.correct} / {p.total}</span>
              </div>
            ))}
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

export default function ExamHsk3() {
  const router = useRouter();
  const user   = useUser();
  const exam   = getExamById(EXAM_ID);

  const [partIdx,       setPartIdx]       = useState(0);
  const [qIdx,          setQIdx]          = useState(0);
  const [selected,      setSelected]      = useState<string | null>(null);
  const [confirmed,     setConfirmed]     = useState(false);
  const [matchAnswers,  setMatchAnswers]  = useState<Record<number,string>>({});
  const [matchConfirmed,setMatchConfirmed]= useState(false);
  const [answers,       setAnswers]       = useState<Record<number,string>>({});
  const [done,          setDone]          = useState(false);
  const [xpEarned,      setXpEarned]     = useState(0);
  const [userProgress,  setUserProgress]  = useState<UserProgress | null>(null);

  // W1 state
  const [w1BankIdxs, setW1BankIdxs] = useState<number[]>([]);
  const [w1TrayIdxs, setW1TrayIdxs] = useState<number[]>([]);

  // W2 state
  const [w2ModelReady, setW2ModelReady] = useState(false);
  const [w2Correct,    setW2Correct]    = useState<boolean | null>(null);

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    getUserProgress().then(setUserProgress);
    loadModel().then(ok => setW2ModelReady(ok));
  }, [user, router]);

  useEffect(() => {
    setQIdx(0); setSelected(null); setConfirmed(false);
    setMatchAnswers({}); setMatchConfirmed(false);
    setW2Correct(null);
  }, [partIdx]);

  useEffect(() => {
    setSelected(null); setConfirmed(false);
    setW2Correct(null);
    const part = PARTS[partIdx];
    if (part?.section === 'W1') {
      const wq = W1_QS[qIdx];
      if (wq) {
        const shuffled = [...wq.words.map((_, i) => i)].sort(() => Math.random() - 0.5);
        setW1BankIdxs(shuffled);
        setW1TrayIdxs([]);
      }
    }
  }, [qIdx, partIdx]);

  if (user === undefined) {
    return <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center"><div className="text-4xl animate-pulse">🍊</div></div>;
  }
  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Exam not found. <Link href="/" className="text-orange-500 underline">Back to home</Link></p></div>;
  }

  const part        = PARTS[partIdx]!;
  const isMatching  = MATCHING_SECTIONS.has(part.section);
  const partQs      = part.questions;
  const committedCount  = Object.keys(answers).length;
  const inProgressCount = isMatching
    ? Object.keys(matchAnswers).length
    : (confirmed ? qIdx + 1 : qIdx);
  const pct = Math.round(((committedCount + inProgressCount) / TOTAL_Q) * 100);

  async function finishExam(finalAnswers: Record<number,string>) {
    const lCorrect = ALL_QS.filter(q => q.num <= 40        && finalAnswers[q.num] === q.answer).length;
    const rCorrect = ALL_QS.filter(q => q.num > 40 && q.num <= 70 && finalAnswers[q.num] === q.answer).length;
    const wCorrect = ALL_QS.filter(q => q.num > 70         && finalAnswers[q.num] === q.answer).length;
    const total = Math.round(lCorrect/40*100) + Math.round(rCorrect/30*100) + Math.round(wCorrect/10*100);
    setXpEarned(total); setAnswers(finalAnswers); setDone(true);
    await saveExamProgress({ examId:EXAM_ID, score:total, total:MAX_SCORE, completedAt:new Date().toISOString() });
    if (userProgress) await saveUserProgress(updateStreak(addXp(userProgress, total)));
  }

  function handleSelect(val: string) { if (!confirmed) setSelected(val); }

  function handleConfirm() {
    if (!selected) return;
    const q = partQs[qIdx]; if (!q) return;
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [q.num]: selected }));
  }

  async function handleNext() {
    setSelected(null); setConfirmed(false); setW2Correct(null);
    if (qIdx + 1 < partQs.length) { setQIdx(qIdx + 1); return; }
    if (partIdx + 1 < PARTS.length) { setQIdx(0); setPartIdx(partIdx + 1); return; }
    await finishExam({ ...answers });
  }

  function handleMatchPick(num: number, letter: string) {
    if (matchConfirmed) return;
    setMatchAnswers(prev => ({ ...prev, [num]: letter }));
  }

  async function handleMatchContinue() {
    const newAnswers = { ...answers, ...matchAnswers };
    if (partIdx + 1 < PARTS.length) { setAnswers(newAnswers); setQIdx(0); setPartIdx(partIdx + 1); }
    else await finishExam(newAnswers);
  }

  // W1 helpers
  function w1PickFromBank(idx: number) {
    setW1BankIdxs(prev => prev.filter(i => i !== idx));
    setW1TrayIdxs(prev => [...prev, idx]);
  }
  function w1ReturnToBank(idx: number) {
    setW1TrayIdxs(prev => prev.filter(i => i !== idx));
    setW1BankIdxs(prev => [...prev, idx]);
  }
  function w1HandleCheck() {
    const wq = W1_QS[qIdx]; if (!wq) return;
    const assembled = w1TrayIdxs.map(i => wq.words[i]).join('') + '。';
    const correct = assembled === wq.answer;
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [wq.num]: correct ? wq.answer : assembled }));
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

  const q          = partQs[qIdx];
  const isCorrect  = !!q && selected === q.answer;
  const section    = part.section;
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
              <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width:`${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 shrink-0">{committedCount + inProgressCount} / {TOTAL_Q}</span>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {part.label}{!isMatching && section !== 'W1' && section !== 'W2' && q && ` · Q${q.num}`}
            {section === 'W1' && q && ` · Q${q.num}`}
            {section === 'W2' && q && ` · Q${q.num}`}
          </p>
        </div>

        {/* ── L1A: matching — audio → text picture bank A-F ── */}
        {section === 'L1A' && (() => {
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen and match each item to a picture (A–F).</p>
              <TextBank bank={L1A_BANK} letters={L1A_LETTERS} confirmed={matchConfirmed} selected={matchAnswers} />
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {L1A_QS.map(lq => (
                  <div key={lq.num} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500 w-6 shrink-0">Q{lq.num}</span>
                    <AudioBtn src={lq.audio} />
                    <LetterPicker letters={L1A_LETTERS} selected={matchAnswers[lq.num] ?? null} correctAnswer={lq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(lq.num, v)} />
                  </div>
                ))}
              </div>
              {!matchConfirmed && (
                <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                  Check answers
                </button>
              )}
              {matchConfirmed && (
                <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
                  Continue →
                </button>
              )}
            </div>
          );
        })()}

        {/* ── L1B: matching — audio → text picture bank A-E ── */}
        {section === 'L1B' && (() => {
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen and match each item to a picture (A–E).</p>
              <TextBank bank={L1B_BANK} letters={L1B_LETTERS} confirmed={matchConfirmed} selected={matchAnswers} />
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {L1B_QS.map(lq => (
                  <div key={lq.num} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500 w-6 shrink-0">Q{lq.num}</span>
                    <AudioBtn src={lq.audio} />
                    <LetterPicker letters={L1B_LETTERS} selected={matchAnswers[lq.num] ?? null} correctAnswer={lq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(lq.num, v)} />
                  </div>
                ))}
              </div>
              {!matchConfirmed && (
                <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                  Check answers
                </button>
              )}
              {matchConfirmed && (
                <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
                  Continue →
                </button>
              )}
            </div>
          );
        })()}

        {/* ── L2: sequential — audio → ✓/✗ ── */}
        {section === 'L2' && (() => {
          const lq = L2_QS[qIdx];
          if (!lq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen, then judge if the ★ statement is correct.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
                <p className="text-base chinese-text text-gray-700 leading-relaxed">{lq.passage}</p>
                <p className="text-base chinese-text font-semibold text-gray-800">{lq.statement}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['✓','✗'] as TF[]).map(v => {
                  let cls = 'border-2 rounded-xl p-4 text-center text-2xl transition-colors ';
                  if (confirmed) cls += v === lq.answer ? 'border-green-400 bg-green-50' : v === selected ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white';
                  else cls += v === selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300';
                  return <button key={v} className={cls} disabled={confirmed} onClick={() => handleSelect(v)}>{v}</button>;
                })}
              </div>
            </div>
          );
        })()}

        {/* ── L3 / L4: sequential — audio → A/B/C ── */}
        {(section === 'L3' || section === 'L4') && (() => {
          const qs = section === 'L3' ? L3_QS : L4_QS;
          const lq = qs[qIdx];
          if (!lq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen, then choose the correct answer.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                <div className="flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
                <p className="text-sm text-gray-600 text-center">{lq.question}</p>
              </div>
              <div className="space-y-2">
                {(['A','B','C'] as Opt3[]).map(letter => {
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

        {/* ── R1A: matching — prompt → response bank A-F ── */}
        {section === 'R1A' && (() => {
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Match each sentence to the correct response (A–F).</p>
              <TextBank bank={R1A_BANK} letters={R1A_LETTERS} confirmed={matchConfirmed} selected={matchAnswers} />
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {R1A_QS.map(rq => (
                  <div key={rq.num} className="px-4 py-3 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-gray-500 shrink-0">Q{rq.num}</span>
                      <p className="text-base chinese-text text-gray-800 flex-1">{rq.prompt}</p>
                    </div>
                    <LetterPicker letters={R1A_LETTERS} selected={matchAnswers[rq.num] ?? null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(rq.num, v)} />
                  </div>
                ))}
              </div>
              {!matchConfirmed && (
                <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                  Check answers
                </button>
              )}
              {matchConfirmed && (
                <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
                  Continue →
                </button>
              )}
            </div>
          );
        })()}

        {/* ── R1B: matching — prompt → response bank A-E ── */}
        {section === 'R1B' && (() => {
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Match each sentence to the correct response (A–E).</p>
              <TextBank bank={R1B_BANK} letters={R1B_LETTERS} confirmed={matchConfirmed} selected={matchAnswers} />
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {R1B_QS.map(rq => (
                  <div key={rq.num} className="px-4 py-3 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-gray-500 shrink-0">Q{rq.num}</span>
                      <p className="text-base chinese-text text-gray-800 flex-1">{rq.prompt}</p>
                    </div>
                    <LetterPicker letters={R1B_LETTERS} selected={matchAnswers[rq.num] ?? null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(rq.num, v)} />
                  </div>
                ))}
              </div>
              {!matchConfirmed && (
                <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                  Check answers
                </button>
              )}
              {matchConfirmed && (
                <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
                  Continue →
                </button>
              )}
            </div>
          );
        })()}

        {/* ── R2A: matching — fill blank, word bank A-F ── */}
        {section === 'R2A' && (() => {
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Fill each blank using a word from the bank (A–F).</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {R2A_LETTERS.map(letter => (
                    <div key={letter} className="flex gap-1.5 items-center text-sm">
                      <span className="font-bold text-gray-400">{letter}.</span>
                      <span className="chinese-text text-gray-700">{R2A_BANK[letter]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {R2A_QS.map(rq => (
                  <div key={rq.num} className="px-4 py-3 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-gray-500 shrink-0">Q{rq.num}</span>
                      <p className="text-base chinese-text text-gray-800 flex-1 leading-relaxed">{rq.sentence}</p>
                    </div>
                    <LetterPicker letters={R2A_LETTERS} selected={matchAnswers[rq.num] ?? null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(rq.num, v)} />
                  </div>
                ))}
              </div>
              {!matchConfirmed && (
                <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                  Check answers
                </button>
              )}
              {matchConfirmed && (
                <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
                  Continue →
                </button>
              )}
            </div>
          );
        })()}

        {/* ── R2B: matching — fill blank, word bank A-F ── */}
        {section === 'R2B' && (() => {
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Fill each blank using a word from the bank (A–F).</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {R2B_LETTERS.map(letter => (
                    <div key={letter} className="flex gap-1.5 items-center text-sm">
                      <span className="font-bold text-gray-400">{letter}.</span>
                      <span className="chinese-text text-gray-700">{R2B_BANK[letter]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {R2B_QS.map(rq => (
                  <div key={rq.num} className="px-4 py-3 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-gray-500 shrink-0">Q{rq.num}</span>
                      <p className="text-base chinese-text text-gray-800 flex-1 leading-relaxed">{rq.sentence}</p>
                    </div>
                    <LetterPicker letters={R2B_LETTERS} selected={matchAnswers[rq.num] ?? null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v => handleMatchPick(rq.num, v)} />
                  </div>
                ))}
              </div>
              {!matchConfirmed && (
                <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                  Check answers
                </button>
              )}
              {matchConfirmed && (
                <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
                  Continue →
                </button>
              )}
            </div>
          );
        })()}

        {/* ── R3: sequential — passage → A/B/C ── */}
        {section === 'R3' && (() => {
          const rq = R3_QS[qIdx];
          if (!rq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Read the passage, then answer the question.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                <p className="text-base chinese-text text-gray-700 leading-relaxed">{rq.passage}</p>
                <p className="text-sm font-semibold text-gray-600">{rq.question}</p>
              </div>
              <div className="space-y-2">
                {(['A','B','C'] as Opt3[]).map(letter => {
                  let cls = 'border-2 rounded-xl p-3 text-left transition-colors font-medium text-base w-full ';
                  if (confirmed) cls += letter === rq.answer ? 'border-green-400 bg-green-50 text-green-800' : letter === selected ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-400';
                  else cls += letter === selected ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300';
                  return (
                    <button key={letter} className={cls} disabled={confirmed} onClick={() => handleSelect(letter)}>
                      <span className="font-bold text-gray-400 mr-2">{letter}.</span>
                      <span className="chinese-text">{rq.opts[letter]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── W1: tap-to-build word order ── */}
        {section === 'W1' && (() => {
          const wq = W1_QS[qIdx];
          if (!wq) return null;
          const assembled = w1TrayIdxs.map(i => wq.words[i]).join('') + '。';
          const isW1Correct = confirmed && assembled === wq.answer;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Tap words to build the correct sentence.</p>

              {/* Word bank */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Word bank</p>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {w1BankIdxs.map(idx => (
                    <button
                      key={idx}
                      onClick={() => !confirmed && w1PickFromBank(idx)}
                      disabled={confirmed}
                      className="px-3 py-1.5 bg-orange-50 border-2 border-orange-200 rounded-lg text-base chinese-text text-orange-800 font-medium hover:bg-orange-100 disabled:opacity-60 transition-colors"
                    >
                      {wq.words[idx]}
                    </button>
                  ))}
                  {w1BankIdxs.length === 0 && !confirmed && (
                    <span className="text-xs text-gray-400 italic">All words placed</span>
                  )}
                </div>
              </div>

              {/* Sentence tray */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Your sentence</p>
                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                  {w1TrayIdxs.map((idx, pos) => (
                    <button
                      key={`${idx}-${pos}`}
                      onClick={() => !confirmed && w1ReturnToBank(idx)}
                      disabled={confirmed}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-base chinese-text font-medium hover:bg-gray-700 disabled:opacity-80 transition-colors"
                    >
                      {wq.words[idx]}
                    </button>
                  ))}
                  {w1TrayIdxs.length > 0 && (
                    <span className="text-base chinese-text text-gray-400">。</span>
                  )}
                  {w1TrayIdxs.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Tap words above to add them here</span>
                  )}
                </div>
              </div>

              {/* Feedback after check */}
              {confirmed && (
                <div className={`rounded-xl p-4 ${isW1Correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${isW1Correct ? 'text-green-700' : 'text-red-700'}`}>
                    {isW1Correct ? '✅ Correct!' : '❌ Incorrect'}
                  </p>
                  {!isW1Correct && (
                    <p className="text-sm text-gray-600 mt-1 chinese-text">Answer: <span className="font-semibold text-gray-800">{wq.answer}</span></p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── W2: draw the missing character ── */}
        {section === 'W2' && (() => {
          const wq = W2_QS[qIdx];
          if (!wq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Draw the missing character in the blank.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 text-center">
                <p className="text-base chinese-text text-gray-800 leading-relaxed">{wq.sentence}</p>
                <p className="text-orange-500 font-medium">Pinyin hint: <span className="font-bold">{wq.hint}</span></p>
              </div>
              <W2DrawCard
                key={wq.num}
                q={wq}
                modelReady={w2ModelReady}
                disabled={confirmed}
                onResult={(correct) => {
                  setW2Correct(correct);
                  setConfirmed(true);
                  setAnswers(prev => ({ ...prev, [wq.num]: correct ? wq.answer : '' }));
                }}
              />
              {confirmed && w2Correct !== null && (
                <div className={`rounded-xl p-4 flex items-center gap-4 ${w2Correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className="text-2xl">{w2Correct ? '✅' : '❌'}</span>
                  <div>
                    <p className={`font-semibold ${w2Correct ? 'text-green-700' : 'text-red-700'}`}>
                      {w2Correct ? 'Correct!' : 'Not quite'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Answer: <span className="text-2xl chinese-text font-bold text-gray-800">{wq.answer}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Sequential: Confirm / Next buttons ── */}
        {!isMatching && (
          <>
            {!confirmed && section !== 'W1' && section !== 'W2' && (
              <button onClick={handleConfirm} disabled={!selected}
                className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                Check answer
              </button>
            )}
            {section === 'W1' && !confirmed && (
              <button onClick={w1HandleCheck} disabled={w1TrayIdxs.length === 0}
                className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">
                Check answer
              </button>
            )}
            {confirmed && (
              <>
                {section !== 'W1' && section !== 'W2' && (
                  <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${q?.answer}`}
                    </p>
                  </div>
                )}
                <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">
                  {committedCount + qIdx + 1 >= TOTAL_Q ? 'See results' : 'Next →'}
                </button>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
