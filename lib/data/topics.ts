import type { Item, Topic } from '../types';

function it(
  id: string,
  topicId: string,
  char: string,
  pinyin: string,
  meaning: string,
  prefix: string,
  suffix: string,
  english: string,
  notes?: string
): Item {
  return {
    id,
    topicId,
    chineseChar: char,
    pinyin,
    englishMeaning: meaning,
    examplePrefix: prefix,
    exampleSuffix: suffix,
    exampleEnglish: english,
    notes,
    contentVersion: 1,
    isActive: true,
  };
}

const TOPICS: Topic[] = [
  // ─── Station: Foundation ──────────────────────────────────────────────────
  {
    id: 'topic-1',
    name: 'Core verbs',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 1,
    description: 'The 20 most essential action words you will use every day.',
    items: [
      it('t1i1',  'topic-1', '是',   'shì',     'to be; is/am/are',               '我',     '学生。',       'I am a student.'),
      it('t1i2',  'topic-1', '有',   'yǒu',     'to have',                        '你',     '书吗？',       'Do you have books?'),
      it('t1i3',  'topic-1', '要',   'yào',     'to want; will',                  '我',     '喝水。',       'I want to drink water.'),
      it('t1i4',  'topic-1', '去',   'qù',      'to go',                          '我们',   '学校。',       'We go to school.'),
      it('t1i5',  'topic-1', '来',   'lái',     'to come',                        '他',     '了。',         'He came.'),
      it('t1i6',  'topic-1', '看',   'kàn',     'to look; to watch; to read',     '我',     '书。',         'I read books.'),
      it('t1i7',  'topic-1', '吃',   'chī',     'to eat',                         '我',     '饭。',         'I eat rice.'),
      it('t1i8',  'topic-1', '喝',   'hē',      'to drink',                       '我',     '茶。',         'I drink tea.'),
      it('t1i9',  'topic-1', '说',   'shuō',    'to say; to speak',               '他',     '中文。',       'He speaks Chinese.'),
      it('t1i10', 'topic-1', '听',   'tīng',    'to listen',                      '我',     '音乐。',       'I listen to music.'),
      it('t1i11', 'topic-1', '做',   'zuò',     'to do; to make',                 '我',     '作业。',       'I do homework.'),
      it('t1i12', 'topic-1', '买',   'mǎi',     'to buy',                         '我',     '书。',         'I buy books.'),
      it('t1i13', 'topic-1', '学',   'xué',     'to study; to learn',             '我',     '中文。',       'I study Chinese.'),
      it('t1i14', 'topic-1', '喜欢', 'xǐhuān',  'to like; to enjoy',              '我',     '吃饺子。',     'I like eating dumplings.'),
      it('t1i15', 'topic-1', '知道', 'zhīdào',  'to know',                        '我',     '他的名字。',   'I know his name.'),
      it('t1i16', 'topic-1', '想',   'xiǎng',   'to think; to want; to miss',     '我',     '去北京。',     'I want to go to Beijing.'),
      it('t1i17', 'topic-1', '叫',   'jiào',    'to be called; to call',          '我',     '小明。',       'My name is Xiao Ming.'),
      it('t1i18', 'topic-1', '住',   'zhù',     'to live; to stay',               '我',     '在北京。',     'I live in Beijing.'),
      it('t1i19', 'topic-1', '工作', 'gōngzuò', 'to work; work; job',             '他',     '很努力。',     'He works very hard.'),
      it('t1i20', 'topic-1', '认识', 'rènshi',  'to know (a person)',             '我',     '你。',         'I know you.'),
    ],
  },
  {
    id: 'topic-2',
    name: 'Pronouns',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 2,
    description: 'Personal pronouns: I, you, he, she, we, they, it.',
    items: [
      it('t2i1', 'topic-2', '我',   'wǒ',    'I; me',              '今天',   '很忙。',       'I am very busy today.'),
      it('t2i2', 'topic-2', '你',   'nǐ',    'you (singular)',      '今天',   '来吗？',       'Are you coming today?'),
      it('t2i3', 'topic-2', '他',   'tā',    'he; him',            '',       '是我的朋友。', 'He is my friend.',   '他/她/它 all sound the same: tā'),
      it('t2i4', 'topic-2', '她',   'tā',    'she; her',           '',       '是我的同学。', 'She is my classmate.'),
      it('t2i5', 'topic-2', '我们', 'wǒmen', 'we; us',             '今天',   '去图书馆。',   'Today we go to the library.'),
      it('t2i6', 'topic-2', '你们', 'nǐmen', 'you (plural)',        '请',     '坐。',         'Please sit down, everyone.'),
      it('t2i7', 'topic-2', '他们', 'tāmen', 'they; them',         '',       '都是学生。',   'They are all students.'),
      it('t2i8', 'topic-2', '它',   'tā',    'it (non-human)',     '',       '是一只猫。',   'It is a cat.'),
    ],
  },
  {
    id: 'topic-3',
    name: 'Numbers',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 3,
    description: 'Numbers 1–10 plus hundred and thousand.',
    items: [
      it('t3i1',  'topic-3', '一', 'yī',  'one',      '我有',   '本书。',   'I have one book.'),
      it('t3i2',  'topic-3', '二', 'èr',  'two',      '今天是', '号。',     'Today is the 2nd.'),
      it('t3i3',  'topic-3', '三', 'sān', 'three',    '我有',   '本书。',   'I have three books.'),
      it('t3i4',  'topic-3', '四', 'sì',  'four',     '我有',   '个苹果。', 'I have four apples.'),
      it('t3i5',  'topic-3', '五', 'wǔ',  'five',     '今天',   '点下课。', 'Class ends at five today.'),
      it('t3i6',  'topic-3', '六', 'liù', 'six',      '今天是', '号。',     'Today is the 6th.'),
      it('t3i7',  'topic-3', '七', 'qī',  'seven',    '一周有', '天。',     'A week has seven days.'),
      it('t3i8',  'topic-3', '八', 'bā',  'eight',    '我们',   '点出发。', 'We leave at eight.'),
      it('t3i9',  'topic-3', '九', 'jiǔ', 'nine',     '我们班有', '个人。', 'Our class has nine people.'),
      it('t3i10', 'topic-3', '十', 'shí', 'ten',      '这里有', '个人。',   'There are ten people here.'),
      it('t3i11', 'topic-3', '百', 'bǎi', 'hundred',  '一',     '块钱。',   'One hundred yuan.'),
      it('t3i12', 'topic-3', '千', 'qiān','thousand', '一',     '个字。',   'One thousand characters.'),
    ],
  },
  {
    id: 'topic-4',
    name: 'Possessives (的)',
    category: 'grammar',
    station: 'Foundation',
    sequenceOrder: 4,
    description: "The particle 的 (de) marks possession and modifies nouns.",
    items: [
      it('t4i1', 'topic-4', '的', 'de', 'possessive particle (my, your, his…)',  '我',     '书。',         'My book.',         'Neutral tone (轻声). Always unstressed.'),
      it('t4i2', 'topic-4', '的', 'de', 'attribute marker (adjective + noun)',   '漂亮',   '花。',         'Beautiful flower.'),
      it('t4i3', 'topic-4', '的', 'de', 'noun substitute (nominalizer)',         '这是我',  '。',           "This is mine.",    "When 的 ends the phrase it nominalizes: 我的 = 'mine'"),
      it('t4i4', 'topic-4', '的', 'de', 'end-of-clause emphasis marker',        '我是坐飞机来', '。',     'I came by plane (emphasis).', "是…的 construction emphasizes how/when/where"),
      it('t4i5', 'topic-4', '的', 'de', 'possessive (complex noun phrase)',      '他',     '妈妈来了。',   'His mother came.'),
    ],
  },
  {
    id: 'topic-5',
    name: 'Measure words',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 5,
    description: 'Counters that go between numbers and nouns: 一个人, 一本书, 一张纸.',
    items: [
      it('t5i1', 'topic-5', '个', 'gè',   'general counter (people, objects)',  '一',   '人。',   'One person.',    'Most common; use when unsure which measure word to pick.'),
      it('t5i2', 'topic-5', '本', 'běn',  'counter for books, notebooks',       '一',   '书。',   'One book.'),
      it('t5i3', 'topic-5', '张', 'zhāng','counter for flat objects (paper, tickets)', '一', '纸。', 'One sheet of paper.'),
      it('t5i4', 'topic-5', '条', 'tiáo', 'counter for long, flexible things (fish, road)', '一', '鱼。', 'One fish.'),
      it('t5i5', 'topic-5', '只', 'zhī',  'counter for small animals',          '一',   '猫。',   'One cat.'),
      it('t5i6', 'topic-5', '杯', 'bēi',  'counter for cups/glasses',           '一',   '水。',   'One glass of water.'),
      it('t5i7', 'topic-5', '件', 'jiàn', 'counter for clothing items, matters','一',   '衬衫。', 'One shirt.'),
      it('t5i8', 'topic-5', '双', 'shuāng','counter for pairs (shoes, chopsticks)','一', '鞋。',  'One pair of shoes.'),
    ],
  },
  {
    id: 'topic-6',
    name: 'Question particles 吗 / 呢 / 吧',
    category: 'grammar',
    station: 'Foundation',
    sequenceOrder: 6,
    description: 'Sentence-final particles that turn statements into questions or soften assertions.',
    items: [
      it('t6i1', 'topic-6', '吗', 'ma', 'yes/no question particle',            '你是学生',   '？',   'Are you a student?',       'Neutral tone. Turns any statement into a yes/no question.'),
      it('t6i2', 'topic-6', '呢', 'ne', '"and you / and what about…?" particle','你好！我很好。你', '？', 'Hello! I am fine. And you?', 'Neutral tone. Asks the same question back, or asks about something already mentioned.'),
      it('t6i3', 'topic-6', '吧', 'ba', 'assumption / suggestion particle',    '你是中国人',  '？',   'You\'re Chinese, right?',   'Neutral tone. Softens a statement into a guess or a gentle suggestion.'),
    ],
  },
  {
    id: 'topic-7',
    name: 'Common adjectives',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 7,
    description: 'Core adjectives for describing size, quality, appearance, and quantity.',
    items: [
      it('t7i1',  'topic-7', '好',   'hǎo',      'good; well',          '他',   '吗？',     'Is he well?'),
      it('t7i2',  'topic-7', '大',   'dà',       'big; large',          '这个', '吗？',     'Is this one big?'),
      it('t7i3',  'topic-7', '小',   'xiǎo',     'small; little',       '那个', '吗？',     'Is that one small?'),
      it('t7i4',  'topic-7', '多',   'duō',      'many; much; a lot',   '人',   '吗？',     'Are there many people?'),
      it('t7i5',  'topic-7', '少',   'shǎo',     'few; little (quantity)','人',  '吗？',     'Are there few people?'),
      it('t7i6',  'topic-7', '新',   'xīn',      'new',                 '这是', '的书。',   'This is a new book.'),
      it('t7i7',  'topic-7', '旧',   'jiù',      'old; used',           '这是', '的椅子。', 'This is an old chair.'),
      it('t7i8',  'topic-7', '高',   'gāo',      'tall; high',          '他很', '。',       'He is very tall.'),
      it('t7i9',  'topic-7', '漂亮', 'piàoliang','beautiful; pretty',   '她很', '。',       'She is very beautiful.',   'Second syllable often de-toned in speech.'),
      it('t7i10', 'topic-7', '贵',   'guì',      'expensive',           '这个', '吗？',     'Is this expensive?'),
    ],
  },
  {
    id: 'topic-8',
    name: 'Time words',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 8,
    description: '今天, 明天, 昨天, 现在 and other common time expressions.',
    items: [
      it('t8i1', 'topic-8', '今天',   'jīntiān',  'today',          '',       '天气很好。',   'The weather is nice today.'),
      it('t8i2', 'topic-8', '明天',   'míngtiān', 'tomorrow',       '',       '见！',         'See you tomorrow!'),
      it('t8i3', 'topic-8', '昨天',   'zuótiān',  'yesterday',      '',       '我生病了。',   'I was sick yesterday.'),
      it('t8i4', 'topic-8', '现在',   'xiànzài',  'now; right now', '',       '几点？',       'What time is it now?'),
      it('t8i5', 'topic-8', '早上',   'zǎoshang', 'morning',        '',       '好！',         'Good morning!'),
      it('t8i6', 'topic-8', '下午',   'xiàwǔ',    'afternoon',      '',       '我有课。',     'I have class in the afternoon.'),
      it('t8i7', 'topic-8', '晚上',   'wǎnshang', 'evening; night', '',       '我们去吃饭。', 'In the evening we go out to eat.'),
    ],
  },
  {
    id: 'topic-9',
    name: 'Family vocabulary',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 9,
    description: 'Family members from parents to grandparents to siblings.',
    items: [
      it('t9i1',  'topic-9', '爸爸', 'bàba',   'dad; father',         '我',   '是老师。',   'My dad is a teacher.'),
      it('t9i2',  'topic-9', '妈妈', 'māma',   'mom; mother',         '我',   '很漂亮。',   'My mom is very beautiful.'),
      it('t9i3',  'topic-9', '哥哥', 'gēge',   'older brother',       '我',   '是大学生。', 'My older brother is a university student.'),
      it('t9i4',  'topic-9', '姐姐', 'jiějie', 'older sister',        '我',   '在北京工作。','My older sister works in Beijing.'),
      it('t9i5',  'topic-9', '弟弟', 'dìdi',   'younger brother',     '我',   '七岁。',     'My younger brother is seven years old.'),
      it('t9i6',  'topic-9', '妹妹', 'mèimei', 'younger sister',      '我',   '很聪明。',   'My younger sister is very smart.'),
      it('t9i7',  'topic-9', '爷爷', 'yéye',   'paternal grandfather','我',   '七十岁了。', 'My grandfather is 70 years old.'),
      it('t9i8',  'topic-9', '奶奶', 'nǎinai', 'paternal grandmother','我',   '做饭很好。', 'My grandmother cooks very well.'),
      it('t9i9',  'topic-9', '丈夫', 'zhàngfu','husband',             '她',   '是医生。',   'Her husband is a doctor.'),
      it('t9i10', 'topic-9', '妻子', 'qīzi',   'wife',                '他',   '很漂亮。',   'His wife is very beautiful.'),
    ],
  },
  {
    id: 'topic-10',
    name: 'Food & drink vocabulary',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 10,
    description: 'Common foods and drinks you will order and discuss.',
    items: [
      it('t10i1',  'topic-10', '米饭', 'mǐfàn',  'cooked rice',     '我想吃', '。',       'I want to eat rice.'),
      it('t10i2',  'topic-10', '面条', 'miàntiáo','noodles',        '我要',   '。',       'I want noodles.'),
      it('t10i3',  'topic-10', '饺子', 'jiǎozi',  'dumplings',      '我喜欢吃','。',      'I like eating dumplings.'),
      it('t10i4',  'topic-10', '包子', 'bāozi',   'steamed buns',   '我想吃', '。',       'I want to eat steamed buns.'),
      it('t10i5',  'topic-10', '茶',   'chá',     'tea',            '我喝',   '。',       'I drink tea.'),
      it('t10i6',  'topic-10', '水',   'shuǐ',    'water',          '我要一杯','。',      'I want a glass of water.'),
      it('t10i7',  'topic-10', '咖啡', 'kāfēi',   'coffee',         '你喝',   '吗？',     'Do you drink coffee?'),
      it('t10i8',  'topic-10', '啤酒', 'píjiǔ',   'beer',           '他要一瓶','。',      'He wants a bottle of beer.'),
      it('t10i9',  'topic-10', '苹果', 'píngguǒ', 'apple',          '我吃了一个','。',    'I ate an apple.'),
      it('t10i10', 'topic-10', '香蕉', 'xiāngjiāo','banana',        '我喜欢吃','。',      'I like eating bananas.'),
    ],
  },
  {
    id: 'topic-11',
    name: 'Modern-life nouns',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 11,
    description: '手机, 电脑 and the everyday objects of modern life.',
    items: [
      it('t11i1', 'topic-11', '手机', 'shǒujī',  'mobile phone',  '我的',   '在哪里？',   'Where is my phone?'),
      it('t11i2', 'topic-11', '电脑', 'diànnǎo', 'computer',      '他用',   '学习。',     'He uses a computer to study.'),
      it('t11i3', 'topic-11', '网络', 'wǎngluò', 'internet',      '这里有', '吗？',       'Is there internet here?'),
      it('t11i4', 'topic-11', '照片', 'zhàopiàn','photo; picture', '我看',  '。',         'I look at photos.'),
      it('t11i5', 'topic-11', '城市', 'chéngshì','city',           '这个',   '很大。',     'This city is very big.'),
    ],
  },
  {
    id: 'topic-12',
    name: 'Specific-action verbs',
    category: 'vocab',
    station: 'Foundation',
    sequenceOrder: 12,
    description: '找 (to look for), 等 (to wait) and other precise action words.',
    items: [
      it('t12i1', 'topic-12', '找',   'zhǎo',   'to look for; to search', '我在',  '你。',     'I am looking for you.'),
      it('t12i2', 'topic-12', '等',   'děng',   'to wait',                '请',     '一下。',   'Please wait a moment.'),
      it('t12i3', 'topic-12', '帮',   'bāng',   'to help',                '你能',   '我吗？',   'Can you help me?'),
      it('t12i4', 'topic-12', '用',   'yòng',   'to use',                 '我',     '手机学习。','I use my phone to study.'),
      it('t12i5', 'topic-12', '开始', 'kāishǐ', 'to start; to begin',    '我们',   '上课了。', 'We started class.'),
      it('t12i6', 'topic-12', '结束', 'jiéshù', 'to end; to finish',     '课',     '了。',     'The class ended.'),
    ],
  },
  {
    id: 'topic-13',
    name: 'Question words',
    category: 'grammar',
    station: 'Foundation',
    sequenceOrder: 13,
    description: '什么, 谁, 哪儿, 怎么, 为什么 and the rest of the question-word toolkit.',
    items: [
      it('t13i1', 'topic-13', '什么', 'shénme',  'what',           '你叫',   '名字？',     'What is your name?'),
      it('t13i2', 'topic-13', '谁',   'shéi',    'who',            '他是',   '？',         'Who is he?'),
      it('t13i3', 'topic-13', '哪儿', 'nǎr',     'where',          '你去',   '？',         'Where are you going?',   'Also 哪里 nǎlǐ — both are correct.'),
      it('t13i4', 'topic-13', '怎么', 'zěnme',   'how; why (informal)', '你',  '去？',     'How do you get there?'),
      it('t13i5', 'topic-13', '为什么','wèishénme','why',           '你',     '不来？',     'Why aren\'t you coming?'),
      it('t13i6', 'topic-13', '几',   'jǐ',      'how many (small number)', '你有', '本书？','How many books do you have?'),
      it('t13i7', 'topic-13', '多少', 'duōshao', 'how many; how much', '这个', '钱？',     'How much does this cost?'),
    ],
  },
  {
    id: 'topic-14',
    name: 'Grammar: 了 (completed action)',
    category: 'grammar',
    station: 'Foundation',
    sequenceOrder: 14,
    description: '了 marks a completed action or a change of state.',
    items: [
      it('t14i1', 'topic-14', '了', 'le', 'completion marker (verb + 了)',     '我吃',   '。',       'I have eaten.',        'Placed directly after the verb to show the action is done.'),
      it('t14i2', 'topic-14', '了', 'le', 'change-of-state marker (sentence + 了)','天冷', '。',     'It has become cold.',  'At the end of a sentence, 了 signals a new situation.'),
      it('t14i3', 'topic-14', '了', 'le', 'completion with object',            '他买',   '一本书。', 'He bought a book.',    'With a specific object, 了 goes between verb and object.'),
      it('t14i4', 'topic-14', '了', 'le', 'experiential with 过 contrast',     '他来',   '。',       'He came (and is here now).'),
      it('t14i5', 'topic-14', '了', 'le', 'negation: 没 + verb (no 了 needed)','我没来', '。',      'I did not come.',      'Use 没 to negate — never 不 with 了 for past actions.'),
    ],
  },
  {
    id: 'topic-15',
    name: 'Grammar: 比 comparisons',
    category: 'grammar',
    station: 'Foundation',
    sequenceOrder: 15,
    description: 'The 比 structure: A 比 B + adjective = "A is more ___ than B".',
    items: [
      it('t15i1', 'topic-15', '比', 'bǐ', 'comparison particle (than)',        '他',     '我高。',       'He is taller than me.'),
      it('t15i2', 'topic-15', '比', 'bǐ', 'comparison with degree',            '今天',   '昨天冷。',     'Today is colder than yesterday.'),
      it('t15i3', 'topic-15', '比', 'bǐ', 'negation: 没有 (not as … as)',      '我没有他', '高。',       'I am not as tall as him.',  "Negation uses 没有, not 不比."),
      it('t15i4', 'topic-15', '比', 'bǐ', 'comparison with manner adverb',     '她',     '我跑得快。',   'She runs faster than me.'),
      it('t15i5', 'topic-15', '比', 'bǐ', 'comparison with quantity diff',     '他',     '我大两岁。',   'He is two years older than me.'),
    ],
  },

  // ─── Station: HSK 1 ───────────────────────────────────────────────────────
  {
    id: 'topic-16', name: 'Full HSK 1 vocabulary review', category: 'review',
    station: 'HSK 1', sequenceOrder: 16, items: [],
    description: 'Systematic drill of all ~150 HSK 1 words.',
  },
  {
    id: 'topic-17', name: 'Basic sentence patterns (SVO, 吗-questions)', category: 'grammar',
    station: 'HSK 1', sequenceOrder: 17, items: [],
    description: 'SVO word order, 是-sentences, 吗-questions, and 不 negation.',
  },
  {
    id: 'topic-18', name: 'First full timed mock test', category: 'exam',
    station: 'HSK 1', sequenceOrder: 18, items: [],
    description: 'Timed practice exam covering all HSK 1 content.',
  },
  {
    id: 'topic-19', name: '★ Boss: HSK 1 exam', category: 'exam',
    station: 'HSK 1', sequenceOrder: 19, items: [],
    description: 'The HSK 1 examination milestone.',
  },

  // ─── Station: HSK 2 ───────────────────────────────────────────────────────
  {
    id: 'topic-20', name: 'Social expression: 不错', category: 'vocab',
    station: 'HSK 2', sequenceOrder: 20, items: [],
    description: '不错 (pretty good) and similar everyday affirmations.',
  },
  {
    id: 'topic-21', name: 'Social expression: 有意思 / 没意思', category: 'vocab',
    station: 'HSK 2', sequenceOrder: 21, items: [],
    description: 'Expressing interest and boredom.',
  },
  {
    id: 'topic-22', name: 'Reasons & feelings vocabulary', category: 'vocab',
    station: 'HSK 2', sequenceOrder: 22, items: [],
  },
  {
    id: 'topic-23', name: 'Health vocabulary', category: 'vocab',
    station: 'HSK 2', sequenceOrder: 23, items: [],
  },
  {
    id: 'topic-24', name: 'Grammar: 因为…所以', category: 'grammar',
    station: 'HSK 2', sequenceOrder: 24, items: [],
    description: 'Because… therefore… causal connective.',
  },
  {
    id: 'topic-25', name: 'Grammar: 虽然…但是', category: 'grammar',
    station: 'HSK 2', sequenceOrder: 25, items: [],
    description: 'Although… but… concessive structure.',
  },
  {
    id: 'topic-26', name: 'Grammar: 过 (experienced action)', category: 'grammar',
    station: 'HSK 2', sequenceOrder: 26, items: [],
  },
  {
    id: 'topic-27', name: 'Grammar: 着 (continuous action)', category: 'grammar',
    station: 'HSK 2', sequenceOrder: 27, items: [],
  },
  {
    id: 'topic-28', name: 'Grammar: 了 in expanded contexts', category: 'grammar',
    station: 'HSK 2', sequenceOrder: 28, items: [],
  },
  {
    id: 'topic-29', name: 'Grammar: 先…然后 (sequencing)', category: 'grammar',
    station: 'HSK 2', sequenceOrder: 29, items: [],
  },
  {
    id: 'topic-30', name: 'Directional complements (来/去 with verbs)', category: 'grammar',
    station: 'HSK 2', sequenceOrder: 30, items: [],
  },
  {
    id: 'topic-31', name: 'Vocabulary: weather', category: 'vocab',
    station: 'HSK 2', sequenceOrder: 31, items: [],
  },
  {
    id: 'topic-32', name: 'Vocabulary: transportation', category: 'vocab',
    station: 'HSK 2', sequenceOrder: 32, items: [],
  },
  {
    id: 'topic-33', name: 'Listening practice (HSK 2 audio)', category: 'listening',
    station: 'HSK 2', sequenceOrder: 33, items: [],
  },
  {
    id: 'topic-34', name: '★ Boss: HSK 2 exam', category: 'exam',
    station: 'HSK 2', sequenceOrder: 34, items: [],
  },

  // ─── Station: HSK 3 ───────────────────────────────────────────────────────
  {
    id: 'topic-35', name: 'Vocabulary: work', category: 'vocab',
    station: 'HSK 3', sequenceOrder: 35, items: [],
  },
  {
    id: 'topic-36', name: 'Vocabulary: school', category: 'vocab',
    station: 'HSK 3', sequenceOrder: 36, items: [],
  },
  {
    id: 'topic-37', name: 'Vocabulary: hobbies', category: 'vocab',
    station: 'HSK 3', sequenceOrder: 37, items: [],
  },
  {
    id: 'topic-38', name: 'Vocabulary: travel', category: 'vocab',
    station: 'HSK 3', sequenceOrder: 38, items: [],
  },
  {
    id: 'topic-39', name: 'Vocabulary: shopping', category: 'vocab',
    station: 'HSK 3', sequenceOrder: 39, items: [],
  },
  {
    id: 'topic-40', name: 'Apply 了 / 过 / 着 in real sentences', category: 'grammar',
    station: 'HSK 3', sequenceOrder: 40, items: [],
  },
  {
    id: 'topic-41', name: 'Reading: short dialogues & stories', category: 'reading',
    station: 'HSK 3', sequenceOrder: 41, items: [],
  },
  {
    id: 'topic-42', name: 'Listening: multi-speaker dialogues', category: 'listening',
    station: 'HSK 3', sequenceOrder: 42, items: [],
  },
  {
    id: 'topic-43', name: 'Write a short essay (5+ sentences)', category: 'writing',
    station: 'HSK 3', sequenceOrder: 43, items: [],
  },
  {
    id: 'topic-44', name: '★ Boss: HSK 3 exam', category: 'exam',
    station: 'HSK 3', sequenceOrder: 44, items: [],
  },

  // ─── Station: HSK 4 ───────────────────────────────────────────────────────
  {
    id: 'topic-45', name: 'Grammar: 把-construction', category: 'grammar',
    station: 'HSK 4', sequenceOrder: 45, items: [],
  },
  {
    id: 'topic-46', name: 'Grammar: 被-construction (passive)', category: 'grammar',
    station: 'HSK 4', sequenceOrder: 46, items: [],
  },
  {
    id: 'topic-47', name: 'Grammar: 是…的 emphasis structure', category: 'grammar',
    station: 'HSK 4', sequenceOrder: 47, items: [],
  },
  {
    id: 'topic-48', name: 'Grammar: 如果…就 conditionals', category: 'grammar',
    station: 'HSK 4', sequenceOrder: 48, items: [],
  },
  {
    id: 'topic-49', name: 'Grammar: complex comparisons', category: 'grammar',
    station: 'HSK 4', sequenceOrder: 49, items: [],
  },
  {
    id: 'topic-50', name: 'Vocabulary: opinions & emotions', category: 'vocab',
    station: 'HSK 4', sequenceOrder: 50, items: [],
  },
  {
    id: 'topic-51', name: 'Vocabulary: abstract nouns, workplace & social', category: 'vocab',
    station: 'HSK 4', sequenceOrder: 51, items: [],
  },
  {
    id: 'topic-52', name: 'Reading: short essays (100–200 characters)', category: 'reading',
    station: 'HSK 4', sequenceOrder: 52, items: [],
  },
  {
    id: 'topic-53', name: 'Writing: structured short paragraphs', category: 'writing',
    station: 'HSK 4', sequenceOrder: 53, items: [],
  },
  {
    id: 'topic-54', name: 'Full timed mock HSK 4 exams', category: 'exam',
    station: 'HSK 4', sequenceOrder: 54, items: [],
  },
  {
    id: 'topic-55', name: '★ Boss: HSK 4 exam', category: 'exam',
    station: 'HSK 4', sequenceOrder: 55, items: [],
  },
];

export default TOPICS;

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find(t => t.id === id);
}

export const STATIONS = ['Foundation', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4'] as const;
export type Station = typeof STATIONS[number];

export function topicsByStation(): Record<Station, Topic[]> {
  const result = {} as Record<Station, Topic[]>;
  for (const s of STATIONS) result[s] = [];
  for (const t of TOPICS) {
    const s = t.station as Station;
    if (result[s]) result[s].push(t);
  }
  return result;
}
