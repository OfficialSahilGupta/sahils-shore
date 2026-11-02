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
  target: number; // benchmark
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
  problems: DsaProblem[]
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
    const cur = map.get(p.topic) || {
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
    map.set(p.topic, cur);
  });

  const list: TopicProgressStat[] = [];
  DSA_TOPICS.forEach((t) => {
    const s = map.get(t) || { total: 0, solved: 0, needsRevision: 0, stuck: 0 };
    list.push({
      topic: t,
      total: s.total,
      solved: s.solved,
      needsRevision: s.needsRevision,
      stuck: s.stuck,
      solveRate: s.total > 0 ? s.solved / s.total : 0,
      target: 10, // Default target benchmark per topic
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

  return (data || []) as DsaProblem[];
}

export async function createDsaProblem(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateDsaProblemInput
): Promise<DsaProblem | null> {
  const now = new Date();
  // Initial spaced repetition scheduled 1 day out
  const initialRevisionDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: problem, error } = await supabase
    .from("dsa_problems")
    .insert({
      user_id: userId,
      title: input.title,
      link: input.link || null,
      platform: input.platform || "LeetCode",
      topic: input.topic || "Arrays",
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
      revision_history: [],
    })
    .select()
    .single();

  if (error || !problem) {
    console.error("[createDsaProblem] Error creating problem:", error);
    return null;
  }

  // 1. If study time was spent, log to activity_logs via Daily Tracker
  if (input.time_spent_minutes && input.time_spent_minutes > 0) {
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

  // 2. Write to timeline_events
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

  return problem as DsaProblem;
}

export async function updateDsaProblem(
  supabase: SupabaseClient<Database>,
  userId: string,
  problemId: string,
  updates: Partial<DsaProblem>
): Promise<DsaProblem | null> {
  const { data, error } = await supabase
    .from("dsa_problems")
    .update(updates)
    .eq("id", problemId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[updateDsaProblem] Error updating problem:", error);
    return null;
  }

  return data as DsaProblem;
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

  if (error || !updated) {
    console.error("[rateRevision] Error rating revision:", error);
    return null;
  }

  // Write revision timeline event
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

  return updated as DsaProblem;
}
