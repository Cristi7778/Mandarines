'use client';

import type {
  TopicProgress,
  ItemProgress,
  UserProgress,
  DrillResult,
  PendingDrillMeta,
} from './types';

const KEYS = {
  userProgress: 'mandarin_user_progress',
  topicProgress: 'mandarin_topic_progress',
  itemProgress: 'mandarin_item_progress',
  pendingResults: 'mandarin_pending_results',
  pendingMeta: 'mandarin_pending_meta',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getUserProgress(): UserProgress {
  return safeGet<UserProgress>(KEYS.userProgress, {
    totalXp: 0,
    level: 1,
    streakCount: 0,
    lastCheckIn: null,
    completedTopics: [],
  });
}

export function saveUserProgress(p: UserProgress): void {
  safeSet(KEYS.userProgress, p);
}

export function getTopicProgress(topicId: string): TopicProgress {
  const all = safeGet<Record<string, TopicProgress>>(KEYS.topicProgress, {});
  return (
    all[topicId] ?? {
      topicId,
      step1Complete: false,
      step2Complete: false,
      step3Complete: false,
      step4Complete: false,
      step5Complete: false,
      step6Complete: false,
    }
  );
}

export function saveTopicProgress(p: TopicProgress): void {
  const all = safeGet<Record<string, TopicProgress>>(KEYS.topicProgress, {});
  all[p.topicId] = p;
  safeSet(KEYS.topicProgress, all);
}

export function getAllTopicProgress(): Record<string, TopicProgress> {
  return safeGet<Record<string, TopicProgress>>(KEYS.topicProgress, {});
}

export function getItemProgress(itemId: string, skill: string): ItemProgress | null {
  const all = safeGet<Record<string, ItemProgress>>(KEYS.itemProgress, {});
  return all[`${itemId}_${skill}`] ?? null;
}

export function saveItemProgress(p: ItemProgress): void {
  const all = safeGet<Record<string, ItemProgress>>(KEYS.itemProgress, {});
  all[`${p.itemId}_${p.skillType}`] = p;
  safeSet(KEYS.itemProgress, all);
}

export function storePendingDrill(
  results: DrillResult[],
  meta: PendingDrillMeta
): void {
  safeSet(KEYS.pendingResults, results);
  safeSet(KEYS.pendingMeta, meta);
}

export function getPendingDrill(): {
  results: DrillResult[];
  meta: PendingDrillMeta | null;
} {
  return {
    results: safeGet<DrillResult[]>(KEYS.pendingResults, []),
    meta: safeGet<PendingDrillMeta | null>(KEYS.pendingMeta, null),
  };
}

export function clearPendingDrill(): void {
  try {
    localStorage.removeItem(KEYS.pendingResults);
    localStorage.removeItem(KEYS.pendingMeta);
  } catch {}
}
