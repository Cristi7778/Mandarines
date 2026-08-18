import { supabase } from './supabase';
import type { DrillResult, ItemProgress, PendingDrillMeta, TopicProgress, UserProgress } from './types';

// ─── helpers ────────────────────────────────────────────────────────────────

async function uid(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// ─── UserProgress ────────────────────────────────────────────────────────────

export async function getUserProgress(): Promise<UserProgress> {
  const { data } = await supabase.from('user_progress').select('*').maybeSingle();
  if (!data) return { totalXp: 0, level: 1, streakCount: 0, lastCheckIn: null, completedTopics: [] };
  return {
    totalXp: data.total_xp,
    level: data.level,
    streakCount: data.streak_count,
    lastCheckIn: data.last_check_in ?? null,
    completedTopics: data.completed_topics ?? [],
  };
}

export async function saveUserProgress(p: UserProgress): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      total_xp: p.totalXp,
      level: p.level,
      streak_count: p.streakCount,
      last_check_in: p.lastCheckIn,
      completed_topics: p.completedTopics,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

// ─── TopicProgress ───────────────────────────────────────────────────────────

export async function getTopicProgress(topicId: string): Promise<TopicProgress> {
  const { data } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('topic_id', topicId)
    .maybeSingle();
  if (!data)
    return {
      topicId,
      step1Complete: false,
      step2Complete: false,
      step3Complete: false,
      step4Complete: false,
      step5Complete: false,
      step6Complete: false,
      step7Complete: false,
      step8Complete: false,
    };
  return {
    topicId: data.topic_id,
    step1Complete: data.step1_complete,
    step2Complete: data.step2_complete,
    step3Complete: data.step3_complete,
    step4Complete: data.step4_complete,
    step5Complete: data.step5_complete,
    step6Complete: data.step6_complete,
    step7Complete: data.step7_complete ?? false,
    step8Complete: data.step8_complete ?? false,
  };
}

export async function saveTopicProgress(p: TopicProgress): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('topic_progress').upsert(
    {
      user_id: userId,
      topic_id: p.topicId,
      step1_complete: p.step1Complete,
      step2_complete: p.step2Complete,
      step3_complete: p.step3Complete,
      step4_complete: p.step4Complete,
      step5_complete: p.step5Complete,
      step6_complete: p.step6Complete,
      step7_complete: p.step7Complete,
      step8_complete: p.step8Complete,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,topic_id' }
  );
}

export async function getAllTopicProgress(): Promise<Record<string, TopicProgress>> {
  const { data } = await supabase.from('topic_progress').select('*');
  if (!data) return {};
  return Object.fromEntries(
    data.map(row => [
      row.topic_id,
      {
        topicId: row.topic_id,
        step1Complete: row.step1_complete,
        step2Complete: row.step2_complete,
        step3Complete: row.step3_complete,
        step4Complete: row.step4_complete,
        step5Complete: row.step5_complete,
        step6Complete: row.step6_complete,
        step7Complete: row.step7_complete ?? false,
        step8Complete: row.step8_complete ?? false,
      },
    ])
  );
}

// ─── ItemProgress ─────────────────────────────────────────────────────────────

export async function getItemProgress(itemId: string, skill: string): Promise<ItemProgress | null> {
  const { data } = await supabase
    .from('item_progress')
    .select('*')
    .eq('item_id', itemId)
    .eq('skill_type', skill)
    .maybeSingle();
  if (!data) return null;
  return {
    itemId: data.item_id,
    skillType: data.skill_type,
    last5Results: data.last5_results ?? [],
    itemContentVersionSeen: data.item_content_version_seen,
  };
}

export async function saveItemProgress(p: ItemProgress): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('item_progress').upsert(
    {
      user_id: userId,
      item_id: p.itemId,
      skill_type: p.skillType,
      last5_results: p.last5Results,
      item_content_version_seen: p.itemContentVersionSeen,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,item_id,skill_type' }
  );
}

// ─── Reset all progress ───────────────────────────────────────────────────────

export async function resetAllProgress(): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await Promise.all([
    supabase.from('topic_progress').delete().eq('user_id', userId),
    supabase.from('item_progress').delete().eq('user_id', userId),
    supabase.from('user_progress').upsert(
      { user_id: userId, total_xp: 0, level: 1, streak_count: 0, last_check_in: null, completed_topics: [], updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ),
  ]);
}

// ─── Pending drill (localStorage only — temp handoff between drill → results) ─

const PENDING_KEY = 'mandarin_pending';

export function storePendingDrill(results: DrillResult[], meta: PendingDrillMeta): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ results, meta }));
  } catch {}
}

export function getPendingDrill(): { results: DrillResult[]; meta: PendingDrillMeta | null } {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return { results: [], meta: null };
    return JSON.parse(raw);
  } catch {
    return { results: [], meta: null };
  }
}

export function clearPendingDrill(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch {}
}
