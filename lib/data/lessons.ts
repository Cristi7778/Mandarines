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
