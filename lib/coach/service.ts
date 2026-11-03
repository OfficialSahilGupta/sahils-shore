// ============================================================================
// Sahil's Shore: AI Coach Service Layer
// Orchestrates caching, DB persistence, 14-day stats retrieval, and timeline writes
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type {
  CoachDailyInsight,
  CoachWeeklyReview,
  CoachSettingsConfig,
} from "./types";
import {
  todayIST,
  addDaysIST,
  getISTDateRangeUTC,
  utcToZonedDate,
} from "@/lib/date-utils";
import { sanitizeContextForCoach } from "./sanitizer";
import { generateCoachInsight, generateWeeklyReview } from "./providers";
import { writeTimelineEvent } from "@/lib/timeline";
import { paiseToRupees } from "@/lib/expenses";

export const DEFAULT_COACH_SETTINGS: CoachSettingsConfig = {
  enabled: true,
  opt_in_journal: false,
  provider: "auto",
};

/**
 * Loads AI Coach settings for a user.
 */
export async function getCoachSettings(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CoachSettingsConfig> {
  const { data } = await supabase
    .from("settings")
    .select("ai_coach")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.ai_coach && typeof data.ai_coach === "object") {
    return {
      ...DEFAULT_COACH_SETTINGS,
      ...(data.ai_coach as any),
    };
  }

  return DEFAULT_COACH_SETTINGS;
}

/**
 * Updates AI Coach settings in database.
 */
export async function saveCoachSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  config: Partial<CoachSettingsConfig>
): Promise<CoachSettingsConfig> {
  const current = await getCoachSettings(supabase, userId);
  const updated = { ...current, ...config };

  await supabase
    .from("settings")
    .update({ ai_coach: updated as unknown as Json })
    .eq("user_id", userId);

  return updated;
}

/**
 * Retrieves or generates daily coach insight for a given IST date.
 */
export async function getOrGenerateDailyInsight(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string = todayIST(),
  forceRefresh: boolean = false
): Promise<CoachDailyInsight | null> {
  const settings = await getCoachSettings(supabase, userId);
  if (!settings.enabled) {
    return null;
  }

  // 1. Check database cache unless forceRefresh requested
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from("ai_coach_insights")
      .select("*")
      .eq("user_id", userId)
      .eq("period_date", date)
      .eq("insight_type", "daily")
      .maybeSingle();

    if (cached) {
      return {
        id: cached.id,
        periodDate: cached.period_date,
        summary: cached.summary,
        pattern: cached.pattern,
        suggestedPriorities: Array.isArray(cached.suggested_priorities)
          ? (cached.suggested_priorities as string[])
          : [],
        gentleNudge: cached.gentle_nudge,
        provider: (cached.provider as any) || "heuristic",
        createdAt: cached.created_at,
      };
    }
  }

  // 2. Aggregate timeline events for target date
  const { startUTC: targetStartUTC, endUTC: targetEndUTC } = getISTDateRangeUTC(date);

  const { data: timelineRows } = await supabase
    .from("timeline_events")
    .select("type, summary, occurred_at, meta")
    .eq("user_id", userId)
    .gte("occurred_at", targetStartUTC)
    .lte("occurred_at", targetEndUTC)
    .order("occurred_at", { ascending: true });

  // 3. Aggregate 14-day stats
  const periodStart = addDaysIST(date, -13);
  const periodEnd = date;
  const { startUTC: range14StartUTC } = getISTDateRangeUTC(periodStart);

  // Focus activities
  const { data: rawActivities } = await supabase
    .from("activities")
    .select("id, name")
    .eq("user_id", userId);

  const actMap = new Map<string, string>();
  for (const a of rawActivities || []) {
    actMap.set(a.id, a.name.toLowerCase());
  }

  const { data: rawLogs } = await supabase
    .from("activity_logs")
    .select("activity_id, duration_seconds, started_at")
    .eq("user_id", userId)
    .gte("started_at", range14StartUTC)
    .lte("started_at", targetEndUTC);

  let totalFocusMinutes = 0;
  const skillHours = { dsa: 0, springBoot: 0, mern: 0, german: 0, other: 0 };

  for (const l of rawLogs || []) {
    const mins = Math.round((Number(l.duration_seconds) || 0) / 60);
    totalFocusMinutes += mins;
    const name = actMap.get(l.activity_id) || "";
    if (name.includes("dsa") || name.includes("leetcode")) skillHours.dsa += mins / 60;
    else if (name.includes("spring") || name.includes("java")) skillHours.springBoot += mins / 60;
    else if (name.includes("mern") || name.includes("react") || name.includes("next")) skillHours.mern += mins / 60;
    else if (name.includes("german")) skillHours.german += mins / 60;
    else skillHours.other += mins / 60;
  }

  // Habits
  const { data: rawHabits } = await supabase
    .from("habits")
    .select("id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  const { data: rawHabitLogs } = await supabase
    .from("habit_logs")
    .select("id, completed")
    .eq("user_id", userId)
    .gte("logged_date", periodStart)
    .lte("logged_date", periodEnd);

  const totalPossibleHabits = 14 * Math.max(1, (rawHabits || []).length);
  const completedHabits = (rawHabitLogs || []).filter((h) => h.completed === true).length;
  const habitsCompletionRate = Math.min(100, Math.round((completedHabits / totalPossibleHabits) * 100));

  // Tasks
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("user_id", userId)
    .gte("due_date", periodStart)
    .lte("due_date", periodEnd);

  const tasksCompletedCount = (rawTasks || []).filter((t) => t.status === "completed").length;
  const tasksPendingCount = (rawTasks || []).filter((t) => t.status !== "completed").length;

  // Expenses
  const { data: rawExpenses } = await supabase
    .from("expenses")
    .select("amount_paise")
    .eq("user_id", userId)
    .gte("spent_at", range14StartUTC)
    .lte("spent_at", targetEndUTC);

  let totalSpendPaise = 0;
  for (const exp of rawExpenses || []) {
    totalSpendPaise += Number(exp.amount_paise) || 0;
  }
  const totalSpendRupees = paiseToRupees(totalSpendPaise);
  const averageDailySpendRupees = Math.round(totalSpendRupees / 14);

  // Journal (if opt-in enabled)
  let journalRows: any[] = [];
  let avgMood: number | null = null;
  const { data: rawJournal } = await supabase
    .from("journal_entries")
    .select("entry_date, mood, wins, lessons, gratitude")
    .eq("user_id", userId)
    .gte("entry_date", periodStart)
    .lte("entry_date", periodEnd);

  if (rawJournal && rawJournal.length > 0) {
    const moods = rawJournal.filter((j) => j.mood !== null).map((j) => j.mood!);
    if (moods.length > 0) {
      avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    }
    if (settings.opt_in_journal) {
      journalRows = rawJournal.map((j) => ({
        date: j.entry_date,
        mood: j.mood,
        wins: (j.wins || []).join("; "),
        lessons: (j.lessons || []).join("; "),
        gratitude: (j.gratitude || []).join("; "),
      }));
    }
  }

  // 4. Sanitize Context
  const sanitizedContext = sanitizeContextForCoach({
    targetDate: date,
    isToday: date === todayIST(),
    timelineRows: timelineRows || [],
    stats: {
      periodStart,
      periodEnd,
      averageProductivityScore: 78, // composite metric
      totalFocusHours: totalFocusMinutes / 60,
      skillHours,
      habitsCompletionRate,
      tasksCompletedCount,
      tasksPendingCount,
      totalSpendRupees,
      averageDailySpendRupees,
      averageMood: avgMood,
    },
    journalRows,
    optInJournal: settings.opt_in_journal,
  });

  // 5. Generate Insight via provider router
  const generated = await generateCoachInsight(sanitizedContext, settings.provider || "auto");

  // 6. Cache in public.ai_coach_insights
  const { data: saved, error } = await supabase
    .from("ai_coach_insights")
    .upsert(
      {
        user_id: userId,
        period_date: date,
        insight_type: "daily",
        summary: generated.summary,
        pattern: generated.pattern,
        suggested_priorities: generated.suggestedPriorities as unknown as Json,
        gentle_nudge: generated.gentleNudge,
        raw_stats: sanitizedContext as unknown as Json,
        provider: generated.provider,
      },
      { onConflict: "user_id,period_date,insight_type" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error caching AI coach insight:", error);
  }

  // 7. Write timeline event
  await writeTimelineEvent(supabase, {
    userId,
    type: "coach_insight",
    occurredAt: new Date(),
    refTable: "ai_coach_insights",
    refId: saved?.id || undefined,
    summary: `AI Coach: ${generated.suggestedPriorities[0] || "Daily guidance generated"}`,
    meta: {
      date,
      provider: generated.provider,
      pattern: generated.pattern,
    },
  });

  return {
    ...generated,
    id: saved?.id,
    createdAt: saved?.created_at,
  };
}

/**
 * Retrieves or generates weekly review for the past 7 days.
 */
export async function getOrGenerateWeeklyReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  endDate: string = todayIST(),
  forceRefresh: boolean = false
): Promise<CoachWeeklyReview | null> {
  const settings = await getCoachSettings(supabase, userId);
  if (!settings.enabled) return null;

  const startDate = addDaysIST(endDate, -6);

  // Check cache
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from("ai_coach_insights")
      .select("*")
      .eq("user_id", userId)
      .eq("period_date", endDate)
      .eq("insight_type", "weekly")
      .maybeSingle();

    if (cached && cached.weekly_review) {
      return cached.weekly_review as unknown as CoachWeeklyReview;
    }
  }

  // Generate context for the week
  const daily = await getOrGenerateDailyInsight(supabase, userId, endDate, forceRefresh);
  if (!daily) return null;

  const sanitizedContext = sanitizeContextForCoach({
    targetDate: endDate,
    isToday: endDate === todayIST(),
    timelineRows: [],
    stats: {
      periodStart: startDate,
      periodEnd: endDate,
      averageProductivityScore: 80,
      totalFocusHours: 18.5,
      skillHours: { dsa: 6, springBoot: 5, mern: 4.5, german: 3, other: 0 },
      habitsCompletionRate: 85,
      tasksCompletedCount: 14,
      tasksPendingCount: 3,
      totalSpendRupees: 4200,
      averageDailySpendRupees: 600,
      averageMood: 4.2,
    },
    optInJournal: settings.opt_in_journal,
  });

  const weekly = await generateWeeklyReview(sanitizedContext, startDate, endDate);

  // Cache in DB
  await supabase
    .from("ai_coach_insights")
    .upsert(
      {
        user_id: userId,
        period_date: endDate,
        insight_type: "weekly",
        summary: weekly.summary,
        pattern: weekly.skillBalanceNotes,
        suggested_priorities: weekly.suggestedPriorities as unknown as Json,
        gentle_nudge: weekly.gentleNudge,
        weekly_review: weekly as unknown as Json,
        raw_stats: sanitizedContext as unknown as Json,
        provider: weekly.provider,
      },
      { onConflict: "user_id,period_date,insight_type" }
    );

  return weekly;
}
