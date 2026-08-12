import type { UserProgress } from './types';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2300, 3300, 4500, 6000, 8000];

const STEP_BASE_XP = [10, 20, 20, 30, 30, 25, 50];

export function xpForStep(step: number, score: number, total: number): number {
  const base = STEP_BASE_XP[step - 1] ?? 20;
  const pct = total === 0 ? 1 : score / total;
  return Math.max(Math.round(base * pct), step === 1 ? 10 : 0);
}

export function xpForRecap(score: number, total: number): number {
  return Math.round((score / Math.max(total, 1)) * 30 + score * 2);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function xpToNextLevel(xp: number): {
  current: number;
  needed: number;
  percent: number;
} {
  const level = levelFromXp(xp);
  const low = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const high = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const current = xp - low;
  const needed = high - low;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

export function addXp(progress: UserProgress, xp: number): UserProgress {
  const totalXp = progress.totalXp + xp;
  return { ...progress, totalXp, level: levelFromXp(totalXp) };
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split('T')[0]!;
  if (progress.lastCheckIn === today) return progress;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;
  const streakCount =
    progress.lastCheckIn === yesterday ? progress.streakCount + 1 : 1;
  return { ...progress, streakCount, lastCheckIn: today };
}
