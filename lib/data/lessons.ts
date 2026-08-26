import type { Lesson } from '@/lib/types';

const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    name: 'Basic sentence patterns',
    station: 'HSK 1',
    sequenceOrder: 26,
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
    sequenceOrder: 35,
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
    sequenceOrder: 36,
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
    sequenceOrder: 61,
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
    sequenceOrder: 64,
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
    sequenceOrder: 65,
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
    id: 'lesson-8',
    name: '把 construction (把字句)',
    station: 'HSK 4',
    sequenceOrder: 73,
    description: 'The disposal marker: restructuring a sentence to focus on what happens to the object.',
    xp: 30,
    sections: [
      {
        title: 'Structure',
        body: 'Subject + 把 + Object + Verb + Result/Complement. The key rule: the verb must have something after it — a result complement, directional complement, or other element. 把 cannot stand alone with a bare verb.',
        examples: [
          { chinese: '我把作业做完了。', pinyin: 'Wǒ bǎ zuòyè zuò wán le.', english: 'I finished the homework.' },
          { chinese: '她把书放在桌子上了。', pinyin: 'Tā bǎ shū fàng zài zhuōzi shàng le.', english: 'She put the book on the table.' },
          { chinese: '请把门关上。', pinyin: 'Qǐng bǎ mén guān shàng.', english: 'Please close the door.' },
        ],
      },
      {
        title: 'When to use 把',
        body: '把 is used when the verb describes a deliberate action that changes or moves a specific, known object. The object must be definite (a specific thing, not "a book" in general). Use 把 when you want to emphasize the disposal of or effect on the object.',
        examples: [
          { chinese: '他把钱都花完了。', pinyin: 'Tā bǎ qián dōu huā wán le.', english: 'He spent all the money.' },
          { chinese: '我把那封信写好了。', pinyin: 'Wǒ bǎ nà fēng xìn xiě hǎo le.', english: 'I finished writing that letter.' },
        ],
      },
      {
        title: 'Verbs that cannot follow 把',
        body: '把 requires an action verb that involves handling or changing something. Stative verbs and mental-state verbs do not work: 是, 有, 在, 喜欢, 知道, 觉得 cannot follow 把.',
        examples: [
          { chinese: '我把这件事告诉了他。', pinyin: 'Wǒ bǎ zhè jiàn shì gàosù le tā.', english: 'I told him about this matter.' },
          { chinese: '请把这些垃圾扔掉。', pinyin: 'Qǐng bǎ zhèxiē lājī rēng diào.', english: 'Please throw away this garbage.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-9',
    name: '被 construction (被字句)',
    station: 'HSK 4',
    sequenceOrder: 74,
    description: 'The passive marker: expressing that the subject is acted upon by someone or something.',
    xp: 30,
    sections: [
      {
        title: 'Structure',
        body: 'Subject (receiver) + 被 + Agent (doer) + Verb + Result. The subject is the one who receives the action. The agent (who did it) follows 被. Like 把, the verb usually needs a result complement after it.',
        examples: [
          { chinese: '我的钱包被偷了。', pinyin: 'Wǒ de qiánbāo bèi tōu le.', english: 'My wallet was stolen.' },
          { chinese: '这本书被他借走了。', pinyin: 'Zhè běn shū bèi tā jiè zǒu le.', english: 'This book was borrowed by him.' },
          { chinese: '蛋糕被孩子们吃完了。', pinyin: 'Dàngāo bèi háizimen chī wán le.', english: 'The cake was eaten up by the children.' },
        ],
      },
      {
        title: 'The tone of 被',
        body: 'In Chinese, 被 often carries a negative or undesirable connotation — something unfortunate happened to the subject. It is less neutral than the English passive voice. Positive passives are rarer and often use different structures.',
        examples: [
          { chinese: '他被老板批评了。', pinyin: 'Tā bèi lǎobǎn pīpíng le.', english: 'He was criticized by his boss.' },
          { chinese: '我的计划被否定了。', pinyin: 'Wǒ de jìhuà bèi fǒudìng le.', english: 'My plan was rejected.' },
        ],
      },
      {
        title: 'Omitting the agent',
        body: 'The agent can be dropped when it is unknown or unimportant. 被 then appears directly before the verb.',
        examples: [
          { chinese: '自行车被偷了。', pinyin: 'Zìxíngchē bèi tōu le.', english: 'The bicycle was stolen.' },
          { chinese: '这个消息被传出去了。', pinyin: 'Zhège xiāoxi bèi chuán chūqù le.', english: 'The news got out.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-10',
    name: '是…的 emphasis structure',
    station: 'HSK 4',
    sequenceOrder: 75,
    description: 'Highlighting when, where, how, or who regarding a past action — not the action itself.',
    xp: 25,
    sections: [
      {
        title: 'What 是…的 emphasizes',
        body: '是…的 is used when an action already happened and you want to emphasize the circumstances — the time, place, manner, or person involved. The verb goes inside the frame: 是 [circumstance] Verb 的.',
        examples: [
          { chinese: '我是昨天来的。', pinyin: 'Wǒ shì zuótiān lái de.', english: 'It was yesterday that I came.' },
          { chinese: '他是坐飞机来的。', pinyin: 'Tā shì zuò fēijī lái de.', english: 'He came by plane.' },
          { chinese: '这件事是在北京发生的。', pinyin: 'Zhè jiàn shì shì zài Běijīng fāshēng de.', english: 'This event happened in Beijing.' },
        ],
      },
      {
        title: 'Emphasizing different details',
        body: 'The same event can be framed differently depending on what you want to highlight. The element placed right after 是 receives the emphasis.',
        examples: [
          { chinese: '我是去年认识他的。', pinyin: 'Wǒ shì qùnián rènshi tā de.', english: 'It was last year that I met him.' },
          { chinese: '她是在图书馆学习的。', pinyin: 'Tā shì zài túshūguǎn xuéxí de.', english: 'She studied in the library.' },
        ],
      },
      {
        title: '是 can be omitted',
        body: 'In casual speech, 是 is often dropped and only 的 remains at the end. The sentence still reads as a 是…的 emphasis structure.',
        examples: [
          { chinese: '你什么时候来的？', pinyin: 'Nǐ shénme shíhou lái de?', english: 'When did you come?' },
          { chinese: '他骑自行车来的。', pinyin: 'Tā qí zìxíngchē lái de.', english: 'He came by bike.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-11',
    name: 'Conditionals: 如果/只要/既然',
    station: 'HSK 4',
    sequenceOrder: 76,
    description: 'Three conditional connectives: hypothetical, sufficient condition, and accepted fact.',
    xp: 30,
    sections: [
      {
        title: '如果…就 — if…then (hypothetical)',
        body: '如果 (rúguǒ) introduces a hypothetical condition; 就 (jiù) introduces the result. Use it for situations that may or may not happen.',
        examples: [
          { chinese: '如果明天下雨，我们就不去了。', pinyin: 'Rúguǒ míngtiān xià yǔ, wǒmen jiù bù qù le.', english: 'If it rains tomorrow, we won\'t go.' },
          { chinese: '如果你有问题，就问我。', pinyin: 'Rúguǒ nǐ yǒu wèntí, jiù wèn wǒ.', english: 'If you have questions, ask me.' },
        ],
      },
      {
        title: '只要…就 — as long as…then (sufficient condition)',
        body: '只要 (zhǐyào) states a sufficient condition — the minimum requirement. 就 introduces what follows from it. The tone is more optimistic than 如果.',
        examples: [
          { chinese: '只要努力，就会成功。', pinyin: 'Zhǐyào nǔlì, jiù huì chénggōng.', english: 'As long as you work hard, you will succeed.' },
          { chinese: '只要你来，我们就高兴。', pinyin: 'Zhǐyào nǐ lái, wǒmen jiù gāoxìng.', english: 'As long as you come, we\'ll be happy.' },
        ],
      },
      {
        title: '既然…就 — since…then (accepted fact)',
        body: '既然 (jìrán) introduces a fact already accepted by both speaker and listener. 就 draws a logical conclusion from it. Unlike 如果, the condition is real and known.',
        examples: [
          { chinese: '既然你不喜欢，就别吃了。', pinyin: 'Jìrán nǐ bù xǐhuān, jiù bié chī le.', english: 'Since you don\'t like it, don\'t eat it.' },
          { chinese: '既然决定了，就认真做吧。', pinyin: 'Jìrán juédìng le, jiù rènzhēn zuò ba.', english: 'Since it\'s been decided, do it seriously.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-12',
    name: '连…都/也 (Even)',
    station: 'HSK 4',
    sequenceOrder: 77,
    description: 'Highlighting an extreme or unexpected case to strengthen a claim.',
    xp: 25,
    sections: [
      {
        title: 'Structure',
        body: '连 (lián) marks the item being highlighted as an extreme example. 都 or 也 follows the verb to complete the meaning. The pattern signals: "even this — which you would not expect — is true." 都 is more common; 也 is slightly softer.',
        examples: [
          { chinese: '他连饭都没吃。', pinyin: 'Tā lián fàn dōu méi chī.', english: 'He didn\'t even eat.' },
          { chinese: '这个字连老师都不认识。', pinyin: 'Zhège zì lián lǎoshī dōu bù rènshi.', english: 'Even the teacher doesn\'t know this character.' },
          { chinese: '她连一句话也没说。', pinyin: 'Tā lián yī jù huà yě méi shuō.', english: 'She didn\'t say even a single word.' },
        ],
      },
      {
        title: 'Positive and negative contexts',
        body: '连…都/也 works in both positive and negative sentences, though the negative version (emphasizing that even a minimal thing was not done) is the most common.',
        examples: [
          { chinese: '他连五岁的孩子都能教。', pinyin: 'Tā lián wǔ suì de háizi dōu néng jiāo.', english: 'He can even teach five-year-olds.' },
          { chinese: '我连他的名字都忘了。', pinyin: 'Wǒ lián tā de míngzi dōu wàng le.', english: 'I even forgot his name.' },
        ],
      },
      {
        title: 'Position of 连',
        body: '连 comes before the highlighted noun or verb phrase, always before the subject\'s verb. If the highlighted item is the object, 连 pulls it to before the verb (similar to 把 movement).',
        examples: [
          { chinese: '连你都来了，太好了！', pinyin: 'Lián nǐ dōu lái le, tài hǎo le!', english: 'Even you came — wonderful!' },
        ],
      },
    ],
  },
  {
    id: 'lesson-13',
    name: 'The particle 的 (de)',
    station: 'HSK 1',
    sequenceOrder: 6,
    description: 'How 的 marks possession, links adjectives to nouns, and substitutes for nouns.',
    xp: 25,
    sections: [
      {
        title: 'Possession: owner + 的 + thing',
        body: '的 goes between the owner and the thing owned — like "\'s" in English. It works with pronouns, names, and nouns alike.',
        examples: [
          { chinese: '我的书', pinyin: 'wǒ de shū', english: 'my book' },
          { chinese: '她的手机', pinyin: 'tā de shǒujī', english: 'her phone' },
          { chinese: '老师的名字', pinyin: 'lǎoshī de míngzi', english: "the teacher's name" },
        ],
      },
      {
        title: 'Drop the noun when it\'s obvious',
        body: 'If the owned noun is clear from context, drop it — 我的 becomes "mine", 你的 becomes "yours". 的 stays at the end.',
        examples: [
          { chinese: '这是我的。', pinyin: 'Zhè shì wǒ de.', english: 'This is mine.' },
          { chinese: '那是你的吗？', pinyin: 'Nà shì nǐ de ma?', english: 'Is that yours?' },
          { chinese: '我的在这里，你的在哪里？', pinyin: 'Wǒ de zài zhèlǐ, nǐ de zài nǎlǐ?', english: 'Mine is here — where is yours?' },
        ],
      },
      {
        title: 'Adjective + 的 + noun',
        body: '的 also links a describing word to the noun it modifies. Short common adjectives (好、大、小) often drop 的 in everyday speech; longer ones keep it.',
        examples: [
          { chinese: '漂亮的花', pinyin: 'piàoliang de huā', english: 'beautiful flower' },
          { chinese: '很贵的东西', pinyin: 'hěn guì de dōngxi', english: 'very expensive things' },
          { chinese: '好朋友', pinyin: 'hǎo péngyou', english: 'good friend (的 dropped — common with short adjectives)' },
        ],
      },
      {
        title: '的 is always neutral tone (轻声)',
        body: '的 is always unstressed and pronounced lightly as "de" — never with any of the four tones. You will hear it constantly in spoken Mandarin.',
        examples: [
          { chinese: '这是我的书。', pinyin: 'Zhè shì wǒ de shū.', english: 'This is my book.' },
          { chinese: '你的朋友很好。', pinyin: 'Nǐ de péngyou hěn hǎo.', english: 'Your friend is very nice.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-4',
    name: '先…然后 (First…then)',
    station: 'HSK 2',
    sequenceOrder: 43,
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
  {
    id: 'lesson-numbers-composed',
    name: 'Building Any Number',
    station: 'Foundation',
    sequenceOrder: 3.5,
    description: 'How to compose any number in Mandarin using the building blocks you already know.',
    xp: 20,
    sections: [
      {
        title: 'Tens: place + digit',
        body: 'For 20–99, say the tens digit, then 十, then the units digit. Drop the units digit if it is zero.',
        examples: [
          { chinese: '二十', pinyin: 'èrshí', english: 'twenty (2 × 10)' },
          { chinese: '三十五', pinyin: 'sānshíwǔ', english: 'thirty-five (3 × 10 + 5)' },
          { chinese: '九十九', pinyin: 'jiǔshíjiǔ', english: 'ninety-nine' },
        ],
      },
      {
        title: 'Hundreds: 百',
        body: 'Say the hundreds digit, then 百, then the rest. If the tens place is zero, insert 零 as a bridge — even if only one zero is missing.',
        examples: [
          { chinese: '三百', pinyin: 'sānbǎi', english: 'three hundred' },
          { chinese: '一百五十六', pinyin: 'yī bǎi wǔshíliù', english: '156' },
          { chinese: '二百零三', pinyin: 'èr bǎi líng sān', english: '203 (零 bridges the gap)' },
        ],
      },
      {
        title: 'Thousands: 千 and the 两 rule',
        body: '两 (liǎng) replaces 二 before 千 and 万 when expressing a quantity. Use 二 only in sequences like phone numbers or ordinals.',
        examples: [
          { chinese: '两千', pinyin: 'liǎng qiān', english: '2,000 (not 二千 in speech)' },
          { chinese: '一千二百三十四', pinyin: 'yī qiān èr bǎi sānshísì', english: '1,234' },
          { chinese: '九千九百九十九', pinyin: 'jiǔ qiān jiǔ bǎi jiǔshíjiǔ', english: '9,999' },
        ],
      },
      {
        title: 'Ten-thousands: 万',
        body: 'Chinese groups large numbers in units of 万 (10,000), not thousands. Think of 25,000 as "two 万 five thousand", not "twenty-five thousand".',
        examples: [
          { chinese: '一万', pinyin: 'yī wàn', english: '10,000' },
          { chinese: '两万五千', pinyin: 'liǎng wàn wǔ qiān', english: '25,000' },
          { chinese: '一百万', pinyin: 'yī bǎi wàn', english: '1,000,000 (100 × 万)' },
        ],
      },
    ],
  },
  {
    id: 'lesson-16',
    name: 'Degree complement: V + 得 + Adj',
    station: 'HSK 4',
    sequenceOrder: 85,
    description: 'Describing how well or how intensely an action is performed.',
    xp: 25,
    sections: [
      {
        title: 'Structure',
        body: 'Subject + Verb + 得 (de) + Degree adjective/phrase. The particle 得 links the verb to a description of the manner or degree of the action. The degree phrase can be a simple adjective, a comparative, or a longer comment.',
        examples: [
          { chinese: '他中文说得很流利。', pinyin: 'Tā Zhōngwén shuō de hěn liúlì.', english: 'He speaks Chinese very fluently.' },
          { chinese: '她唱得很好听。', pinyin: 'Tā chàng de hěn hǎotīng.', english: 'She sings beautifully.' },
          { chinese: '这道题做得不对。', pinyin: 'Zhè dào tí zuò de bù duì.', english: 'This problem was done incorrectly.' },
        ],
      },
      {
        title: 'When the verb has an object',
        body: 'If the verb takes an object, the verb must be repeated after the object: Subject + Verb + Object + Verb + 得 + Degree. The second verb carries 得.',
        examples: [
          { chinese: '他说汉语说得很好。', pinyin: 'Tā shuō Hànyǔ shuō de hěn hǎo.', english: 'He speaks Chinese very well.' },
          { chinese: '她写字写得很漂亮。', pinyin: 'Tā xiě zì xiě de hěn piàoliang.', english: 'She writes characters beautifully.' },
        ],
      },
      {
        title: 'Negation and questions',
        body: 'Negate inside the degree phrase (after 得), not before the verb. For questions, add 吗 or use the 好不好 / 快不快 pattern after 得.',
        examples: [
          { chinese: '他跑得不快。', pinyin: 'Tā pǎo de bù kuài.', english: "He doesn't run fast." },
          { chinese: '你睡得好吗？', pinyin: 'Nǐ shuì de hǎo ma?', english: 'Did you sleep well?' },
          { chinese: '她做得好不好？', pinyin: 'Tā zuò de hǎo bu hǎo?', english: 'Did she do it well or not?' },
        ],
      },
    ],
  },
  {
    id: 'lesson-17',
    name: 'Frame prepositions: 对 / 为 / 按 / 根据',
    station: 'HSK 4',
    sequenceOrder: 86,
    description: 'Four prepositions that set the frame — topic, beneficiary, standard, or basis — before the main verb.',
    xp: 25,
    sections: [
      {
        title: '对 — towards / regarding',
        body: '对 (duì) marks the target or topic of an attitude, feeling, or action. Pattern: Subject + 对 + Topic + Adjective/Verb.',
        examples: [
          { chinese: '我对这个城市很熟悉。', pinyin: 'Wǒ duì zhège chéngshì hěn shúxī.', english: 'I am very familiar with this city.' },
          { chinese: '他对工作很认真。', pinyin: 'Tā duì gōngzuò hěn rènzhēn.', english: 'He is very serious about his work.' },
          { chinese: '这对你的健康不好。', pinyin: 'Zhè duì nǐ de jiànkāng bù hǎo.', english: 'This is not good for your health.' },
        ],
      },
      {
        title: '为 — for (beneficiary or purpose)',
        body: '为 (wèi) marks who benefits from or what purpose motivates the action. Pattern: Subject + 为 + Beneficiary + Verb + Object.',
        examples: [
          { chinese: '这椅子是专为老年人提供的。', pinyin: 'Zhè yǐzi shì zhuān wèi lǎonián rén tígōng de.', english: 'This chair is provided specifically for the elderly.' },
          { chinese: '他为公司做了很多贡献。', pinyin: 'Tā wèi gōngsī zuò le hěn duō gòngxiàn.', english: 'He made many contributions for the company.' },
        ],
      },
      {
        title: '按 — according to (order or rule)',
        body: '按 (àn) means "in accordance with" a rule, sequence, or standard. It often appears as 按照 (ànzhào) in formal writing. Common in instructions and procedures.',
        examples: [
          { chinese: '请按从小到大的顺序排列这些数字。', pinyin: 'Qǐng àn cóng xiǎo dào dà de shùnxù páiliè zhèxiē shùzì.', english: 'Please arrange these numbers in ascending order.' },
          { chinese: '请按要求填写表格。', pinyin: 'Qǐng àn yāoqiú tiánxiě biǎogé.', english: 'Please fill in the form according to the requirements.' },
        ],
      },
      {
        title: '根据 — based on / according to',
        body: '根据 (gēnjù) introduces the evidence, source, or basis for a statement or decision. More analytical than 按 — it points to a reason or data, not a procedure.',
        examples: [
          { chinese: '根据对话，可以知道什么？', pinyin: 'Gēnjù duìhuà, kěyǐ zhīdào shénme?', english: 'Based on the dialogue, what can we know?' },
          { chinese: '根据研究，运动对健康有好处。', pinyin: 'Gēnjù yánjiū, yùndòng duì jiànkāng yǒu hǎochù.', english: 'Based on research, exercise is beneficial to health.' },
          { chinese: '根据天气预报，明天会下雨。', pinyin: 'Gēnjù tiānqì yùbào, míngtiān huì xià yǔ.', english: 'According to the weather forecast, it will rain tomorrow.' },
        ],
      },
    ],
  },
  {
    id: 'lesson-14',
    name: '不仅……而且…… (Not only… but also…)',
    station: 'HSK 4',
    sequenceOrder: 80,
    description: 'Additive escalation: presenting a second point that goes beyond the first.',
    xp: 25,
    sections: [
      {
        title: 'Structure',
        body: '不仅 (bùjǐn) introduces the first point; 而且 (érqiě) introduces the second, stronger point. Both clauses share the same subject, or each can have its own. The pattern signals that the second fact is even more notable than the first.',
        examples: [
          { chinese: '她不仅会说汉语，而且说得很流利。', pinyin: 'Tā bùjǐn huì shuō Hànyǔ, érqiě shuō de hěn liúlì.', english: 'She not only speaks Chinese, but speaks it fluently.' },
          { chinese: '这家餐厅不仅便宜，而且好吃。', pinyin: 'Zhè jiā cāntīng bùjǐn piányí, érqiě hǎochī.', english: 'This restaurant is not only cheap, but also delicious.' },
          { chinese: '不仅我去了，我朋友也去了。', pinyin: 'Bùjǐn wǒ qù le, wǒ péngyou yě qù le.', english: 'Not only did I go, my friend went too.' },
        ],
      },
      {
        title: '也 as an alternative to 而且',
        body: '不仅……也…… is equally common and slightly more conversational. 也 replaces 而且 when the second clause adds a parallel fact rather than escalating.',
        examples: [
          { chinese: '他不仅聪明，也很努力。', pinyin: 'Tā bùjǐn cōngmíng, yě hěn nǔlì.', english: 'He is not only smart but also hardworking.' },
          { chinese: '这个问题不仅复杂，也很重要。', pinyin: 'Zhège wèntí bùjǐn fùzá, yě hěn zhòngyào.', english: 'This issue is not only complex but also very important.' },
        ],
      },
      {
        title: 'Negative escalation',
        body: '不仅……连……都…… escalates into an extreme negative: "not only [A], but not even [extreme B]."',
        examples: [
          { chinese: '他不仅没来，连电话也没打。', pinyin: 'Tā bùjǐn méi lái, lián diànhuà yě méi dǎ.', english: "He not only didn't come, he didn't even call." },
        ],
      },
    ],
  },
  {
    id: 'lesson-15',
    name: '因此 / 所以 (Therefore / So)',
    station: 'HSK 4',
    sequenceOrder: 82,
    description: 'Drawing conclusions: expressing that one fact leads directly to another.',
    xp: 25,
    sections: [
      {
        title: '所以 — spoken cause-and-effect',
        body: '所以 (suǒyǐ) is the everyday word for "so / therefore." It follows the cause clause and introduces the result. It almost always pairs with 因为 earlier in the sentence, though 因为 can be omitted in casual speech.',
        examples: [
          { chinese: '因为下雨，所以我没去。', pinyin: 'Yīnwèi xià yǔ, suǒyǐ wǒ méi qù.', english: 'Because it rained, I didn\'t go.' },
          { chinese: '他很努力，所以成功了。', pinyin: 'Tā hěn nǔlì, suǒyǐ chénggōng le.', english: 'He worked hard, so he succeeded.' },
        ],
      },
      {
        title: '因此 — written cause-and-effect',
        body: '因此 (yīncǐ) means the same as 所以 but is more formal and common in written Chinese, news, and academic contexts. It can open a new sentence or clause without needing 因为.',
        examples: [
          { chinese: '研究表明运动有益健康，因此专家建议每天锻炼。', pinyin: 'Yánjiū biǎomíng yùndòng yǒuyì jiànkāng, yīncǐ zhuānjiā jiànyì měitiān duànliàn.', english: 'Research shows exercise is beneficial to health; therefore experts recommend daily exercise.' },
          { chinese: '天气突然变冷，因此很多人感冒了。', pinyin: 'Tiānqì tūrán biàn lěng, yīncǐ hěn duō rén gǎnmào le.', english: 'The weather suddenly turned cold, so many people caught colds.' },
        ],
      },
      {
        title: 'Choosing between the two',
        body: '所以 is natural in speech and informal writing. 因此 sounds bookish in conversation — prefer it in essays, reports, and formal emails. Both follow the cause; neither appears at the very start of a discourse without context.',
        examples: [
          { chinese: '价格太高，所以我没买。', pinyin: 'Jiàgé tài gāo, suǒyǐ wǒ méi mǎi.', english: 'The price was too high, so I didn\'t buy it.' },
          { chinese: '成本上升，因此公司决定调整价格。', pinyin: 'Chéngběn shàngshēng, yīncǐ gōngsī juédìng tiáozhěng jiàgé.', english: 'Costs rose; therefore the company decided to adjust prices.' },
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
