import type { Lesson } from '@/lib/types';

const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    name: 'Basic sentence patterns',
    station: 'HSK 1',
    sequenceOrder: 17,
    description: 'SVO word order, 是-sentences, 吗-questions, and 不 negation.',
    xp: 30,
    sections: [
      {
        title: 'SVO word order',
        body: 'Mandarin follows Subject → Verb → Object order, just like English. The subject comes first, then the action, then what the action is done to.',
        examples: [
          { chinese: '我吃饭。', pinyin: 'Wǒ chī fàn.', english: 'I eat rice.' },
          { chinese: '她喝水。', pinyin: 'Tā hē shuǐ.', english: 'She drinks water.' },
          { chinese: '他们学中文。', pinyin: 'Tāmen xué Zhōngwén.', english: 'They study Chinese.' },
        ],
      },
      {
        title: '是-sentences (to be)',
        body: '是 (shì) means "to be" and is used to link a subject to a noun or identity. Unlike English, 是 is not used before adjectives — adjectives act as their own predicates.',
        examples: [
          { chinese: '我是学生。', pinyin: 'Wǒ shì xuésheng.', english: 'I am a student.' },
          { chinese: '她是老师。', pinyin: 'Tā shì lǎoshī.', english: 'She is a teacher.' },
          { chinese: '这是书。', pinyin: 'Zhè shì shū.', english: 'This is a book.' },
        ],
      },
      {
        title: '吗-questions',
        body: 'To turn any statement into a yes/no question, simply add 吗 (ma) to the end. No word order change needed — this is much simpler than English.',
        examples: [
          { chinese: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?', english: 'Are you a student?' },
          { chinese: '她喝茶吗？', pinyin: 'Tā hē chá ma?', english: 'Does she drink tea?' },
          { chinese: '这是你的书吗？', pinyin: 'Zhè shì nǐ de shū ma?', english: 'Is this your book?' },
        ],
      },
      {
        title: '不 negation',
        body: '不 (bù) is placed directly before the verb or adjective to negate it. It changes tone to bú when followed by a 4th-tone syllable (e.g. 不是 → bú shì).',
        examples: [
          { chinese: '我不是学生。', pinyin: 'Wǒ bú shì xuésheng.', english: 'I am not a student.' },
          { chinese: '她不喝咖啡。', pinyin: 'Tā bù hē kāfēi.', english: 'She does not drink coffee.' },
          { chinese: '我不去。', pinyin: 'Wǒ bù qù.', english: 'I am not going.' },
        ],
      },
      {
        title: 'Putting it together',
        body: 'These four patterns cover the vast majority of simple Mandarin sentences. Combine them freely — a 吗 question can be negated in the answer using 不.',
        examples: [
          { chinese: '你是老师吗？不，我不是老师。', pinyin: 'Nǐ shì lǎoshī ma? Bù, wǒ bú shì lǎoshī.', english: 'Are you a teacher? No, I am not a teacher.' },
          { chinese: '他喝水吗？他不喝水，他喝茶。', pinyin: 'Tā hē shuǐ ma? Tā bù hē shuǐ, tā hē chá.', english: 'Does he drink water? He does not drink water, he drinks tea.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-2',
    name: '因为…所以 (Because…therefore)',
    station: 'HSK 2',
    sequenceOrder: 25,
    description: 'The causal connective: stating a reason and its result.',
    xp: 30,
    sections: [
      {
        title: 'Structure',
        body: '因为 (yīnwèi) introduces the cause; 所以 (suǒyǐ) introduces the result. Both halves can appear in the same sentence, or either one can be omitted if the meaning is clear.',
        examples: [
          { chinese: '因为下雨，所以我没去。', pinyin: 'Yīnwèi xià yǔ, suǒyǐ wǒ méi qù.', english: 'Because it rained, I didn\'t go.' },
          { chinese: '因为他生病了，所以没来上课。', pinyin: 'Yīnwèi tā shēngbìng le, suǒyǐ méi lái shàngkè.', english: 'Because he was sick, he didn\'t come to class.' },
        ],
      },
      {
        title: 'Omitting one half',
        body: 'In natural speech, either 因为 or 所以 can be dropped. If you already know the cause, just say 所以. If you already know the result, just explain with 因为.',
        examples: [
          { chinese: '因为太贵了，我不买。', pinyin: 'Yīnwèi tài guì le, wǒ bù mǎi.', english: 'Because it\'s too expensive, I won\'t buy it.' },
          { chinese: '他很努力，所以成绩很好。', pinyin: 'Tā hěn nǔlì, suǒyǐ chéngjī hěn hǎo.', english: 'He works hard, so his grades are good.' },
        ],
      },
      {
        title: 'Word order note',
        body: '因为 always comes before the cause clause — never after. The cause-result order is fixed, unlike English where "so" can sometimes come first.',
        examples: [
          { chinese: '因为我喜欢中文，所以我每天学习。', pinyin: 'Yīnwèi wǒ xǐhuān Zhōngwén, suǒyǐ wǒ měi tiān xuéxí.', english: 'Because I like Chinese, I study every day.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-3',
    name: '虽然…但是 (Although…but)',
    station: 'HSK 2',
    sequenceOrder: 26,
    description: 'The concessive structure: acknowledging one fact while introducing a contrast.',
    xp: 30,
    sections: [
      {
        title: 'Structure',
        body: '虽然 (suīrán) introduces a conceded fact; 但是 (dànshì) introduces the contrasting reality. Both words together are stronger and more formal than using just one.',
        examples: [
          { chinese: '虽然很贵，但是很好吃。', pinyin: 'Suīrán hěn guì, dànshì hěn hǎochī.', english: 'Although it\'s expensive, it\'s delicious.' },
          { chinese: '虽然我很累，但是我还要工作。', pinyin: 'Suīrán wǒ hěn lèi, dànshì wǒ hái yào gōngzuò.', english: 'Although I\'m tired, I still have to work.' },
        ],
      },
      {
        title: '但是 can be shortened to 但',
        body: '但 (dàn) is a shorter, slightly more literary alternative to 但是. Both are correct. In spoken Mandarin 但是 is more common.',
        examples: [
          { chinese: '虽然难，但我不放弃。', pinyin: 'Suīrán nán, dàn wǒ bù fàngqì.', english: 'Although it\'s difficult, I won\'t give up.' },
        ],
      },
      {
        title: 'Key difference from English',
        body: 'In English you can say "Although A, B" without any "but". In Mandarin, 虽然 almost always pairs with 但是/但 — dropping it sounds incomplete in most contexts.',
        examples: [
          { chinese: '虽然天气不好，但是我们还是去了。', pinyin: 'Suīrán tiānqì bù hǎo, dànshì wǒmen háishì qù le.', english: 'Although the weather was bad, we still went.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-5',
    name: '越来越 / 越…越 (More and more)',
    station: 'HSK 3',
    sequenceOrder: 42,
    description: 'Expressing gradual change and proportional relationships.',
    xp: 25,
    sections: [
      {
        title: '越来越 — getting more and more',
        body: '越来越 (yuè lái yuè) means something is increasing over time. Place it before an adjective or verb to show a gradual change.',
        examples: [
          { chinese: '天气越来越冷了。', pinyin: 'Tiānqì yuè lái yuè lěng le.', english: 'The weather is getting colder and colder.' },
          { chinese: '他的中文越来越好。', pinyin: 'Tā de Zhōngwén yuè lái yuè hǎo.', english: 'His Chinese is getting better and better.' },
          { chinese: '我越来越喜欢这个城市。', pinyin: 'Wǒ yuè lái yuè xǐhuān zhège chéngshì.', english: 'I like this city more and more.' },
        ],
      },
      {
        title: '越A越B — the more A, the more B',
        body: '越…越… links two clauses to show a proportional relationship. The subject can appear before the first 越, and can be the same or different for each clause.',
        examples: [
          { chinese: '越吃越想吃。', pinyin: 'Yuè chī yuè xiǎng chī.', english: 'The more you eat, the more you want to eat.' },
          { chinese: '他说得越快，我越听不懂。', pinyin: 'Tā shuō de yuè kuài, wǒ yuè tīng bù dǒng.', english: 'The faster he speaks, the less I understand.' },
          { chinese: '书越读越有意思。', pinyin: 'Shū yuè dú yuè yǒu yìsi.', english: 'The more you read, the more interesting it gets.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-6',
    name: '一边…一边 (Doing two things at once)',
    station: 'HSK 3',
    sequenceOrder: 43,
    description: 'Expressing two simultaneous actions.',
    xp: 25,
    sections: [
      {
        title: 'Structure',
        body: '一边 (yībiān) + action1, 一边 (yībiān) + action2 means the subject does both actions at the same time. The subject appears once, before the first 一边.',
        examples: [
          { chinese: '他一边听音乐，一边做作业。', pinyin: 'Tā yībiān tīng yīnyuè, yībiān zuò zuòyè.', english: 'He listens to music while doing his homework.' },
          { chinese: '她一边走路，一边看手机。', pinyin: 'Tā yībiān zǒulù, yībiān kàn shǒujī.', english: 'She walks while looking at her phone.' },
          { chinese: '我喜欢一边喝茶，一边看书。', pinyin: 'Wǒ xǐhuān yībiān hē chá, yībiān kàn shū.', english: 'I like drinking tea while reading.' },
        ],
      },
      {
        title: 'Which action goes first?',
        body: 'The first 一边 clause is usually the secondary / background activity; the second is the main one. But in practice both orders are used and the meaning stays clear.',
        examples: [
          { chinese: '老师一边写字，一边解释。', pinyin: 'Lǎoshī yībiān xiě zì, yībiān jiěshì.', english: 'The teacher writes while explaining.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-7',
    name: '除了…以外 (Besides / Except)',
    station: 'HSK 3',
    sequenceOrder: 44,
    description: 'Two contrasting uses: adding to a set (besides) or excluding from a set (except).',
    xp: 25,
    sections: [
      {
        title: '除了…以外，也/还 — besides (inclusive)',
        body: 'When 除了…以外 is followed by 也 or 还, it means "in addition to" — the item is included AND there is more.',
        examples: [
          { chinese: '除了中文以外，她还会说英文。', pinyin: 'Chúle Zhōngwén yǐwài, tā hái huì shuō Yīngwén.', english: 'Besides Chinese, she can also speak English.' },
          { chinese: '除了苹果以外，我也喜欢吃香蕉。', pinyin: 'Chúle píngguǒ yǐwài, wǒ yě xǐhuān chī xiāngjiāo.', english: 'Besides apples, I also like bananas.' },
        ],
      },
      {
        title: '除了…以外，都 — except (exclusive)',
        body: 'When followed by 都, 除了…以外 means "except for" — everything else is included but this item is left out.',
        examples: [
          { chinese: '除了他以外，我们都去了。', pinyin: 'Chúle tā yǐwài, wǒmen dōu qù le.', english: 'Except for him, we all went.' },
          { chinese: '除了周末以外，我每天上班。', pinyin: 'Chúle zhōumò yǐwài, wǒ měi tiān shàngbān.', english: 'Except for weekends, I work every day.' },
        ],
      },
      {
        title: '以外 can be omitted',
        body: '以外 is often dropped in casual speech without changing the meaning. 除了他，我们都去了 is equally natural.',
        examples: [
          { chinese: '除了北京，我还去过上海和广州。', pinyin: 'Chúle Běijīng, wǒ hái qùguò Shànghǎi hé Guǎngzhōu.', english: 'Besides Beijing, I have also been to Shanghai and Guangzhou.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-4',
    name: '先…然后 (First…then)',
    station: 'HSK 2',
    sequenceOrder: 30,
    description: 'Sequencing actions: describing what happens first and what comes next.',
    xp: 25,
    sections: [
      {
        title: 'Structure',
        body: '先 (xiān) means "first" and comes before the first action. 然后 (ránhòu) means "then / after that" and introduces the next step. Together they sequence two or more actions clearly.',
        examples: [
          { chinese: '我先吃饭，然后去图书馆。', pinyin: 'Wǒ xiān chīfàn, ránhòu qù túshūguǎn.', english: 'I eat first, then go to the library.' },
          { chinese: '先洗手，然后吃饭。', pinyin: 'Xiān xǐ shǒu, ránhòu chīfàn.', english: 'Wash your hands first, then eat.' },
        ],
      },
      {
        title: '然后 can be used alone',
        body: '然后 can appear without 先 when the sequence is already implied, or when listing multiple steps.',
        examples: [
          { chinese: '我买了票，然后进去了。', pinyin: 'Wǒ mǎi le piào, ránhòu jìnqù le.', english: 'I bought the ticket, then went in.' },
          { chinese: '先坐地铁，然后换公共汽车，然后走路。', pinyin: 'Xiān zuò dìtiě, ránhòu huàn gōnggòng qìchē, ránhòu zǒulù.', english: 'First take the subway, then transfer to a bus, then walk.' },
        ],
      },
      {
        title: '先 can appear without 然后',
        body: '先 alone softens a request or suggests doing something before something else — common in everyday speech.',
        examples: [
          { chinese: '你先等一下。', pinyin: 'Nǐ xiān děng yīxià.', english: 'Wait a moment first.' },
          { chinese: '我先说，你听。', pinyin: 'Wǒ xiān shuō, nǐ tīng.', english: 'I\'ll speak first, you listen.' },
        ],
      },
    ],
  },
];

export default LESSONS;

export function lessonsByStation(): Record<string, Lesson[]> {
  const map: Record<string, Lesson[]> = {};
  for (const l of LESSONS) {
    if (!map[l.station]) map[l.station] = [];
    map[l.station]!.push(l);
  }
  return map;
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find(l => l.id === id);
}
