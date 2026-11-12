// ============================================================================
// Sahil's Shore: DSA Tracker Data Access & Domain Logic
// Spaced Repetition (1, 3, 7, 14, 30 days), Weak Topic Detection,
// Progress Rings, IST Streak & Daily Goal, Activity Log & Timeline Sync
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.ts";
import type { DsaProblem } from "../../types/index.ts";
import {
  DSA_TOPICS,
  SPACING_INTERVALS_DAYS,
  DEFAULT_DAILY_DSA_GOAL,
  canonicalDsaTopic,
  isSameDsaTopic,
  getAdaptiveTopicTarget,
  type MasteryTierName,
  type DsaTopic,
  type DsaDifficulty,
  type DsaStatus,
  type SupportedLanguage,
} from "./constants.ts";
import {
  todayIST,
  yesterdayIST,
  addDaysIST,
  diffDaysIST,
  getISTDateString,
  getISTDateRangeUTC,
} from "../date-utils.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { logActivityTime, getActivities } from "../tracker/index.ts";

export * from "./constants.ts";
export * from "./blind150.ts";
export * from "./concept-map.ts";

export interface CreateDsaProblemInput {
  title: string;
  link?: string | null;
  platform?: string | null;
  topic?: string | null;
  difficulty: DsaDifficulty;
  status: DsaStatus;
  time_spent_minutes?: number | null;
  approach_notes?: string | null;
  code_snippet?: string | null;
  language?: SupportedLanguage | string;
  time_complexity?: string | null;
  space_complexity?: string | null;
  is_favorite?: boolean;
  revision_interval_days?: number | null;
  next_revision_at?: string | null;
  revision_history?: Json;
}

export interface WeakTopicReport {
  topic: DsaTopic;
  total: number;
  solved: number;
  needsRevision: number;
  stuck: number;
  solveRate: number; // 0 to 1
  reason: string;
}

export interface TopicProgressStat {
  topic: string;
  total: number;
  solved: number;
  needsRevision: number;
  stuck: number;
  solveRate: number;
  target: number; // adaptive milestone or benchmark
  tier?: MasteryTierName;
}

export interface DsaStreakInfo {
  currentStreak: number;
  bestStreak: number;
  todaySolvedCount: number;
  targetCount: number;
  isDailyGoalMet: boolean;
}

// ----------------------------------------------------------------------------
// Spaced Repetition Algorithm
// ----------------------------------------------------------------------------

/**
 * Calculates next revision interval and target date.
 * Ladder: 1 -> 3 -> 7 -> 14 -> 30 days.
 * If Easy: advance to next step in ladder (max 30).
 * If Hard: reset interval back to 1 day for reinforcement.
 */
export function calculateNextRevision(
  currentIntervalDays: number = 1,
  rating: "Easy" | "Hard",
  baseDate: Date = new Date()
): { nextIntervalDays: number; nextRevisionDateUTC: string } {
  let nextIntervalDays: number;

  if (rating === "Hard") {
    // Drop back to 1 day for immediate reinforcement
    nextIntervalDays = 1;
  } else {
    // Advance ladder
    const ladder = SPACING_INTERVALS_DAYS;
    const currentIndex = ladder.findIndex((d) => d >= currentIntervalDays);
    if (currentIndex === -1 || currentIndex >= ladder.length - 1) {
      nextIntervalDays = 30; // Max out at 30 days
    } else {
      nextIntervalDays = ladder[currentIndex + 1];
    }
  }

  const nextDate = new Date(baseDate.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + nextIntervalDays);

  return {
    nextIntervalDays,
    nextRevisionDateUTC: nextDate.toISOString(),
  };
}

/**
 * Determines whether a problem is due for revision on or before a given IST date.
 */
export function isDueForRevision(
  problem: DsaProblem,
  currentIstDate: string = todayIST()
): boolean {
  if (problem.status === "Needs revision" || problem.status === "Revisit") {
    return true;
  }

  if (!problem.next_revision_at) {
    return false;
  }

  const { endUTC } = getISTDateRangeUTC(currentIstDate);
  return problem.next_revision_at <= endUTC;
}

// ----------------------------------------------------------------------------
// Weak-Topic Detection
// ----------------------------------------------------------------------------

/**
 * Identifies weak topics based on:
 * 1. High number of problems marked 'Needs revision' or 'Stuck' (>= 1)
 * 2. Low solve rate (< 50%) when at least 2 problems have been attempted
 */
export function detectWeakTopics(problems: DsaProblem[]): WeakTopicReport[] {
  const map = new Map<
    string,
    { total: number; solved: number; needsRevision: number; stuck: number }
  >();

  problems.forEach((p) => {
    if (!p.topic) return;
    const current = map.get(p.topic) || {
      total: 0,
      solved: 0,
      needsRevision: 0,
      stuck: 0,
    };
    current.total++;
    const s = (p.status || "").toLowerCase();
    if (s === "solved" || s === "mastered") {
      current.solved++;
    } else if (s === "needs revision") {
      current.needsRevision++;
    } else if (s === "stuck") {
      current.stuck++;
    }
    map.set(p.topic, current);
  });

  const reports: WeakTopicReport[] = [];

  map.forEach((stats, topicName) => {
    const solveRate = stats.total > 0 ? stats.solved / stats.total : 0;
    const isWeakByProblems = stats.needsRevision + stats.stuck >= 1;
    const isWeakByRate = stats.total >= 2 && solveRate < 0.5;

    if (isWeakByProblems || isWeakByRate) {
      let reason = "";
      if (stats.stuck > 0) {
        reason = `${stats.stuck} stuck problem${stats.stuck > 1 ? "s" : ""}`;
      } else if (stats.needsRevision > 0) {
        reason = `${stats.needsRevision} problem${stats.needsRevision > 1 ? "s" : ""} need revision`;
      } else {
        reason = `Low solve rate (${Math.round(solveRate * 100)}%)`;
      }

      reports.push({
        topic: topicName as DsaTopic,
        total: stats.total,
        solved: stats.solved,
        needsRevision: stats.needsRevision,
        stuck: stats.stuck,
        solveRate,
        reason,
      });
    }
  });

  // Sort descending by severity (problems needing attention first, then lowest solve rate)
  return reports.sort((a, b) => {
    const aUrgent = a.needsRevision * 2 + a.stuck * 3;
    const bUrgent = b.needsRevision * 2 + b.stuck * 3;
    if (bUrgent !== aUrgent) return bUrgent - aUrgent;
    return a.solveRate - b.solveRate;
  });
}

// ----------------------------------------------------------------------------
// Topic Progress & Difficulty Split
// ----------------------------------------------------------------------------

export function calculateTopicProgress(
  problems: DsaProblem[],
  targetOverride?: number
): TopicProgressStat[] {
  const map = new Map<
    string,
    { total: number; solved: number; needsRevision: number; stuck: number }
  >();

  DSA_TOPICS.forEach((t) => {
    map.set(t, { total: 0, solved: 0, needsRevision: 0, stuck: 0 });
  });

  problems.forEach((p) => {
    if (!p.topic) return;
    const canon = canonicalDsaTopic(p.topic);
    const targetKey = DSA_TOPICS.find((t) => isSameDsaTopic(t, canon)) || canon;

    const cur = map.get(targetKey) || {
      total: 0,
      solved: 0,
      needsRevision: 0,
      stuck: 0,
    };
    cur.total++;
    const s = (p.status || "").toLowerCase();
    if (s === "solved" || s === "mastered") {
      cur.solved++;
    } else if (s === "needs revision") {
      cur.needsRevision++;
    } else if (s === "stuck") {
      cur.stuck++;
    }
    map.set(targetKey, cur);

    // If targetKey is HashMap, also mirror to Hashing if present, and vice versa
    if (targetKey === "HashMap" && map.has("Hashing")) {
      const hCur = map.get("Hashing")!;
      hCur.total++;
      if (s === "solved" || s === "mastered") hCur.solved++;
      else if (s === "needs revision") hCur.needsRevision++;
      else if (s === "stuck") hCur.stuck++;
    } else if (targetKey === "Hashing" && map.has("HashMap")) {
      const hmCur = map.get("HashMap")!;
      hmCur.total++;
      if (s === "solved" || s === "mastered") hmCur.solved++;
      else if (s === "needs revision") hmCur.needsRevision++;
      else if (s === "stuck") hmCur.stuck++;
    }
  });

  const list: TopicProgressStat[] = [];
  DSA_TOPICS.forEach((t) => {
    const s = map.get(t) || { total: 0, solved: 0, needsRevision: 0, stuck: 0 };
    const { target: adaptiveTarget, tier } = getAdaptiveTopicTarget(s.solved, s.total);
    const resolvedTarget =
      typeof targetOverride === "number" && targetOverride > 0
        ? targetOverride
        : adaptiveTarget;

    list.push({
      topic: t,
      total: s.total,
      solved: s.solved,
      needsRevision: s.needsRevision,
      stuck: s.stuck,
      solveRate: s.total > 0 ? s.solved / s.total : 0,
      target: resolvedTarget,
      tier,
    });
  });

  return list;
}

export function calculateDifficultySplit(problems: DsaProblem[]): {
  Easy: number;
  Medium: number;
  Hard: number;
  total: number;
} {
  const counts = { Easy: 0, Medium: 0, Hard: 0, total: 0 };
  problems.forEach((p) => {
    const d = (p.difficulty || "Medium") as "Easy" | "Medium" | "Hard";
    if (counts[d] !== undefined) {
      counts[d]++;
      counts.total++;
    }
  });
  return counts;
}

// ----------------------------------------------------------------------------
// Daily Goal & Streak Calculations
// ----------------------------------------------------------------------------

export function calculateDsaStreak(
  problems: DsaProblem[],
  dailyTarget: number = DEFAULT_DAILY_DSA_GOAL
): DsaStreakInfo {
  const today = todayIST();
  const yesterday = yesterdayIST();

  // Group solved problems by IST calendar date
  const solvedCountByDate: Record<string, number> = {};

  problems.forEach((p) => {
    const s = (p.status || "").toLowerCase();
    if (s === "solved" || s === "mastered") {
      // Use updated_at or created_at for event timestamp
      const istDate = getISTDateString(p.updated_at || p.created_at);
      solvedCountByDate[istDate] = (solvedCountByDate[istDate] || 0) + 1;
    }
  });

  const todaySolvedCount = solvedCountByDate[today] || 0;
  const isDailyGoalMet = todaySolvedCount >= dailyTarget;

  // Qualifying dates have >= 1 solved problem
  const qualifyingDates = Object.keys(solvedCountByDate)
    .filter((d) => solvedCountByDate[d] >= 1)
    .sort();

  if (qualifyingDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      todaySolvedCount,
      targetCount: dailyTarget,
      isDailyGoalMet,
    };
  }

  const qualifyingSet = new Set(qualifyingDates);

  // Current Streak
  let currentStreak = 0;
  let checkDate = qualifyingSet.has(today)
    ? today
    : qualifyingSet.has(yesterday)
      ? yesterday
      : null;

  if (checkDate) {
    let cur = checkDate;
    while (qualifyingSet.has(cur)) {
      currentStreak++;
      cur = addDaysIST(cur, -1);
    }
  }

  // Best Streak
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const curDate of qualifyingDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = diffDaysIST(prevDate, curDate);
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  return {
    currentStreak,
    bestStreak,
    todaySolvedCount,
    targetCount: dailyTarget,
    isDailyGoalMet,
  };
}

// ----------------------------------------------------------------------------
// Metadata Preservation Engine (Embeds rich metadata into approach_notes)
// ----------------------------------------------------------------------------

export function embedDsaMetadata(
  notes: string,
  meta: {
    time_complexity?: string | null;
    space_complexity?: string | null;
    is_favorite?: boolean;
    pattern?: string | null;
    concept_maps?: any[];
    revision_history?: any;
  }
): string {
  const cleanNotes = (notes || "").replace(/\n*<!-- SHORE_DSA_META:[\s\S]*?-->\n*/g, "").trim();
  const metaObj: Record<string, any> = {};
  if (meta.time_complexity) metaObj.time_complexity = meta.time_complexity;
  if (meta.space_complexity) metaObj.space_complexity = meta.space_complexity;
  if (meta.is_favorite !== undefined) metaObj.is_favorite = meta.is_favorite;
  if (meta.pattern) metaObj.pattern = meta.pattern;
  if (meta.concept_maps && meta.concept_maps.length > 0) metaObj.concept_maps = meta.concept_maps;
  if (meta.revision_history) metaObj.revision_history = meta.revision_history;

  if (Object.keys(metaObj).length === 0) return cleanNotes;
  return `${cleanNotes}\n\n<!-- SHORE_DSA_META:${JSON.stringify(metaObj)}-->`;
}

export function extractDsaMetadata(approach_notes: string | null | undefined): {
  cleanNotes: string;
  metadata: {
    time_complexity?: string | null;
    space_complexity?: string | null;
    is_favorite?: boolean;
    pattern?: string | null;
    concept_maps?: any[];
    revision_history?: any;
  };
} {
  if (!approach_notes) return { cleanNotes: "", metadata: {} };
  const match = approach_notes.match(/<!-- SHORE_DSA_META:([\s\S]*?)-->/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const cleanNotes = approach_notes.replace(match[0], "").trim();
      return { cleanNotes, metadata: parsed };
    } catch (e) {}
  }
  return { cleanNotes: approach_notes, metadata: {} };
}

// ----------------------------------------------------------------------------
// Supabase Data Access Functions
// ----------------------------------------------------------------------------

export async function getDsaProblems(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<DsaProblem[]> {
  const { data, error } = await supabase
    .from("dsa_problems")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getDsaProblems] Error fetching problems:", error);
    return [];
  }

  return ((data || []) as any[]).map((p) => {
    const { cleanNotes, metadata } = extractDsaMetadata(p.approach_notes);
    const existingMaps = metadata.concept_maps || (p.revision_history as any)?.concept_maps || [];
    const pattern = metadata.pattern || (p.revision_history as any)?.pattern || null;
    const history = p.revision_history || metadata.revision_history || { concept_maps: existingMaps, pattern };

    return {
      ...p,
      approach_notes: cleanNotes,
      status:
        p.status === "todo"
          ? "Todo"
          : p.status === "solved"
            ? "Solved"
            : (p.status as DsaStatus),
      topic: canonicalDsaTopic(p.topic),
      time_complexity: p.time_complexity || metadata.time_complexity || null,
      space_complexity: p.space_complexity || metadata.space_complexity || null,
      is_favorite: p.is_favorite !== undefined ? Boolean(p.is_favorite) : Boolean(metadata.is_favorite),
      revision_history: history,
    } as DsaProblem;
  });
}

export async function createDsaProblem(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateDsaProblemInput
): Promise<DsaProblem | null> {
  const now = new Date();
  const initialRevisionDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const normalizedTopic = canonicalDsaTopic(input.topic);
  const dbStatus = input.status === "Todo" ? "todo" : input.status === "Solved" ? "solved" : input.status;

  const existingMaps = (input.revision_history as any)?.concept_maps || [];
  const pattern = (input.revision_history as any)?.pattern || null;
  const embeddedNotes = embedDsaMetadata(input.approach_notes || "", {
    time_complexity: input.time_complexity,
    space_complexity: input.space_complexity,
    is_favorite: input.is_favorite,
    pattern,
    concept_maps: existingMaps,
    revision_history: input.revision_history,
  });

  const basePayload = {
    user_id: userId,
    title: input.title,
    link: input.link || null,
    platform: input.platform || "LeetCode",
    topic: normalizedTopic,
    difficulty: input.difficulty,
    status: dbStatus as any,
    time_spent_minutes: input.time_spent_minutes || 0,
    approach_notes: embeddedNotes,
    code_snippet: input.code_snippet || null,
    language: input.language || "java",
    next_revision_at: input.next_revision_at || initialRevisionDate,
    revision_count: 0,
  };

  let problem: DsaProblem | null = null;

  try {
    const { data, error } = await supabase
      .from("dsa_problems")
      .insert(basePayload as any)
      .select()
      .single();

    if (!error && data) {
      problem = {
        ...(data as unknown as DsaProblem),
        approach_notes: input.approach_notes || "",
        status: input.status,
        topic: normalizedTopic,
        time_complexity: input.time_complexity || null,
        space_complexity: input.space_complexity || null,
        is_favorite: Boolean(input.is_favorite),
        revision_history: input.revision_history || { concept_maps: existingMaps, pattern },
      };
    } else if (error) {
      console.warn("[createDsaProblem] Supabase insert warning:", error.message);
    }
  } catch (err) {
    console.warn("[createDsaProblem] Supabase exception:", err);
  }

  // Fallback memory representation if network/DB error
  if (!problem) {
    problem = {
      id: `dsa-${Date.now()}`,
      user_id: userId,
      title: input.title,
      link: input.link || null,
      platform: input.platform || "LeetCode",
      topic: normalizedTopic,
      difficulty: input.difficulty,
      status: input.status,
      time_spent_minutes: input.time_spent_minutes || 0,
      approach_notes: input.approach_notes || null,
      code_snippet: input.code_snippet || null,
      language: input.language || "java",
      time_complexity: input.time_complexity || null,
      space_complexity: input.space_complexity || null,
      revision_interval_days: 1,
      next_revision_at: initialRevisionDate,
      revision_count: 0,
      last_revised_at: null,
      revision_history: input.revision_history || { concept_maps: existingMaps, pattern },
      rating: null,
      is_favorite: Boolean(input.is_favorite),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
  }

  // If study time was spent, auto-log to Daily Tracker
  if (input.time_spent_minutes && input.time_spent_minutes > 0 && userId) {
    try {
      const activities = await getActivities(supabase, userId);
      const dsaActivity = activities.find(
        (a) => a.name.toLowerCase() === "dsa"
      );
      if (dsaActivity) {
        await logActivityTime(
          supabase,
          userId,
          {
            activity_id: dsaActivity.id,
            duration_seconds: input.time_spent_minutes * 60,
            notes: `Solved: ${input.title} (${input.platform || "LeetCode"})`,
          },
          "DSA"
        );
      }
    } catch (actErr) {
      console.warn("[createDsaProblem] Could not auto-log activity time:", actErr);
    }
  }

  // Write to timeline_events
  if (userId) {
    try {
      await writeTimelineEvent(supabase, {
        userId,
        type: "dsa_solved",
        summary: `${input.status === "Solved" ? "Solved" : "Logged"} ${input.difficulty} DSA: ${input.title} (${input.topic || "General"})`,
        refTable: "dsa_problems",
        refId: problem.id,
        meta: {
          platform: input.platform,
          topic: input.topic,
          difficulty: input.difficulty,
          status: input.status,
          time_spent_minutes: input.time_spent_minutes,
          time_complexity: input.time_complexity,
          space_complexity: input.space_complexity,
        },
      });
    } catch (tlErr) {
      console.warn("[createDsaProblem] Could not write timeline event:", tlErr);
    }
  }

  return problem;
}

export async function updateDsaProblem(
  supabase: SupabaseClient<Database>,
  userId: string,
  problemId: string,
  updates: Partial<DsaProblem>
): Promise<DsaProblem | null> {
  const normalizedTopic = updates.topic ? canonicalDsaTopic(updates.topic) : undefined;
  const dbStatus = updates.status === "Todo" ? "todo" : updates.status === "Solved" ? "solved" : updates.status;

  const existingMaps = (updates.revision_history as any)?.concept_maps || [];
  const pattern = (updates.revision_history as any)?.pattern || null;
  const embeddedNotes =
    updates.approach_notes !== undefined
      ? embedDsaMetadata(updates.approach_notes || "", {
          time_complexity: updates.time_complexity,
          space_complexity: updates.space_complexity,
          is_favorite: updates.is_favorite,
          pattern,
          concept_maps: existingMaps,
          revision_history: updates.revision_history,
        })
      : undefined;

  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.link !== undefined) payload.link = updates.link;
  if (updates.platform !== undefined) payload.platform = updates.platform;
  if (normalizedTopic !== undefined) payload.topic = normalizedTopic;
  if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty;
  if (dbStatus !== undefined) payload.status = dbStatus;
  if (updates.time_spent_minutes !== undefined) payload.time_spent_minutes = updates.time_spent_minutes;
  if (embeddedNotes !== undefined) payload.approach_notes = embeddedNotes;
  if (updates.code_snippet !== undefined) payload.code_snippet = updates.code_snippet;
  if (updates.language !== undefined) payload.language = updates.language;
  if (updates.next_revision_at !== undefined) payload.next_revision_at = updates.next_revision_at;
  if (updates.revision_count !== undefined) payload.revision_count = updates.revision_count;

  try {
    const { data, error } = await supabase
      .from("dsa_problems")
      .update(payload as any)
      .eq("id", problemId)
      .eq("user_id", userId)
      .select()
      .single();

    if (!error && data) {
      const { cleanNotes, metadata } = extractDsaMetadata(data.approach_notes);
      return {
        ...(data as unknown as DsaProblem),
        approach_notes: cleanNotes,
        status: updates.status || (data.status === "todo" ? "Todo" : data.status === "solved" ? "Solved" : data.status),
        topic: canonicalDsaTopic(data.topic),
        time_complexity: updates.time_complexity || metadata.time_complexity || null,
        space_complexity: updates.space_complexity || metadata.space_complexity || null,
        is_favorite: updates.is_favorite !== undefined ? updates.is_favorite : Boolean(metadata.is_favorite),
        revision_history: updates.revision_history || metadata.revision_history || { concept_maps: existingMaps, pattern },
      } as DsaProblem;
    }
  } catch (err) {
    console.warn("[updateDsaProblem] Supabase update warning:", err);
  }

  // Fallback return with updated fields
  return {
    id: problemId,
    user_id: userId,
    title: updates.title || "DSA Problem",
    difficulty: updates.difficulty || "Medium",
    status: updates.status || "Solved",
    topic: updates.topic ? canonicalDsaTopic(updates.topic) : "Arrays",
    language: updates.language || "java",
    revision_count: updates.revision_count || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...updates,
  } as DsaProblem;
}

export async function deleteDsaProblem(
  supabase: SupabaseClient<Database>,
  userId: string,
  problemId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("dsa_problems")
    .delete()
    .eq("id", problemId)
    .eq("user_id", userId);

  if (error) {
    console.error("[deleteDsaProblem] Error deleting problem:", error);
    return false;
  }

  return true;
}

/**
 * Reschedules a problem based on user revision rating (Easy vs. Hard).
 * Updates interval ladder, next_revision_at, rating, and writes timeline event.
 */
export async function rateRevision(
  supabase: SupabaseClient<Database>,
  userId: string,
  problem: DsaProblem,
  rating: "Easy" | "Hard"
): Promise<DsaProblem | null> {
  const now = new Date();
  const currentInterval = problem.revision_interval_days || 1;
  const { nextIntervalDays, nextRevisionDateUTC } = calculateNextRevision(
    currentInterval,
    rating,
    now
  );

  const history = Array.isArray(problem.revision_history)
    ? [...problem.revision_history]
    : [];

  history.push({
    rated_at: now.toISOString(),
    rating,
    previous_interval_days: currentInterval,
    new_interval_days: nextIntervalDays,
  });

  const nextStatus =
    rating === "Hard"
      ? "Needs revision"
      : problem.status === "Needs revision"
        ? "Solved"
        : problem.status;

  let updatedProblem: DsaProblem | null = null;
  try {
    const { data: updated, error } = await supabase
      .from("dsa_problems")
      .update({
        rating,
        status: nextStatus,
        revision_interval_days: nextIntervalDays,
        next_revision_at: nextRevisionDateUTC,
        revision_count: (problem.revision_count || 0) + 1,
        last_revised_at: now.toISOString(),
        revision_history: history as unknown as Json,
      })
      .eq("id", problem.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (!error && updated) {
      updatedProblem = updated as DsaProblem;
    }
  } catch (err) {
    console.warn("[rateRevision] Supabase update warning:", err);
  }

  if (!updatedProblem) {
    updatedProblem = {
      ...problem,
      rating,
      status: nextStatus,
      revision_interval_days: nextIntervalDays,
      next_revision_at: nextRevisionDateUTC,
      revision_count: (problem.revision_count || 0) + 1,
      last_revised_at: now.toISOString(),
      revision_history: history,
      updated_at: now.toISOString(),
    };
  }

  // Write revision timeline event safely
  try {
    await writeTimelineEvent(supabase, {
      userId,
      type: "dsa_solved",
      summary: `Revised DSA: ${problem.title} (Rated ${rating}, next in ${nextIntervalDays}d)`,
      refTable: "dsa_problems",
      refId: problem.id,
      meta: {
        rating,
        previous_interval_days: currentInterval,
        next_interval_days: nextIntervalDays,
        topic: problem.topic,
        difficulty: problem.difficulty,
      },
    });
  } catch (tlErr) {
    console.warn("[rateRevision] Timeline write warning:", tlErr);
  }

  return updatedProblem;
}
