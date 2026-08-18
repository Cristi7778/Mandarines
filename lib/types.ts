export type SkillType = 'pinyin' | 'character' | 'usage' | 'speaking' | 'listening' | 'writing';
export type ResultType = 'correct' | 'incorrect' | 'correct_wrong_accent';

export interface Item {
  id: string;
  topicId: string;
  chineseChar: string;
  pinyin: string;
  englishMeaning: string;
  examplePrefix: string;
  exampleSuffix: string;
  exampleEnglish: string;
  notes?: string;
  contentVersion: number;
  isActive: boolean;
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  station: string;
  sequenceOrder: number;
  items: Item[];
  description?: string;
}

export interface TopicProgress {
  topicId: string;
  step1Complete: boolean;
  step2Complete: boolean;
  step3Complete: boolean;
  step4Complete: boolean;
  step5Complete: boolean;
  step6Complete: boolean;
  step7Complete: boolean;
  step8Complete: boolean; // Listen
}

export interface ItemProgress {
  itemId: string;
  skillType: SkillType;
  last5Results: ResultType[];
  itemContentVersionSeen: number;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  streakCount: number;
  lastCheckIn: string | null;
  completedTopics: string[];
}

export interface DrillQuestion {
  type: 'pinyin-from-english' | 'pinyin-from-char';
  item: Item;
}

export interface DrillResult {
  question: DrillQuestion;
  userAnswer: string;
  correct: boolean;
}

export interface PendingDrillMeta {
  topicId?: string;
  step?: number;
  xpEarned: number;
  score: number;
  total: number;
  mode: 'learn' | 'recap';
}
