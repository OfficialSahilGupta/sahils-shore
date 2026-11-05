// ============================================================================
// Sahil's Shore: Journal & Reflection Data Layer
// Daily reflections, mood/energy tracking, timeline summaries, weekly reviews
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import {
  todayIST,
  getISTDateRangeUTC,
  formatFriendlyISTDate,
  addDaysIST,
} from "../date-utils.ts";
import { formatINR } from "../expenses/index.ts";

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  mood: number | null;
  energy: number | null;
  gratitude: string[];
  wins: string[];
  lessons: string[];
  content: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SaveJournalInput {
  entry_date: string;
  mood?: number | null;
  energy?: number | null;
  gratitude?: string[];
  wins?: string[];
  lessons?: string[];
  content?: string | null;
  tags?: string[];
}

export interface WeeklyReviewStats {
  weekStartDate: string;
  weekEndDate: string;
  studyMinutes: number;
  studyHours: number;
  dsaSolvedCount: number;
  spentPaise: number;
  tasksCompletedCount: number;
  habitsCompletedCount: number;
}

export interface MoodTimelinePoint {
  date: string;
  friendlyDate: string;
  mood: number | null;
  energy: number | null;
}

/**
 * Fetches a single journal entry for a given IST date "YYYY-MM-DD".
 */
export async function getJournalEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  entryDate: string = todayIST()
): Promise<JournalEntry | null> {
  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", entryDate)
      .maybeSingle();

    if (error) {
      console.error("[getJournalEntry] Error:", error.message);
      return null;
    }

    return (data as JournalEntry) || null;
  } catch (err) {
    console.error("[getJournalEntry] Unexpected error:", err);
    return null;
  }
}

/**
 * Saves (inserts or updates) a journal entry for the specified IST date.
 * Automatically writes to timeline_events.
 */
export async function saveJournalEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: SaveJournalInput
): Promise<JournalEntry | null> {
  try {
    const entryDate = input.entry_date || todayIST();

    const payload = {
      user_id: userId,
      entry_date: entryDate,
      mood: input.mood ?? null,
      energy: input.energy ?? null,
      gratitude: input.gratitude || [],
      wins: input.wins || [],
      lessons: input.lessons || [],
      content: input.content || "",
      tags: input.tags || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("journal_entries")
      .upsert(payload, { onConflict: "user_id,entry_date" })
      .select()
      .single();

    if (error) {
      console.error("[saveJournalEntry] Upsert error:", error.message);
      return null;
    }

    const saved = data as JournalEntry;

    // Write to timeline_events
    const moodStr = saved.mood ? `Mood ${saved.mood}/5` : "";
    const energyStr = saved.energy ? `Energy ${saved.energy}/5` : "";
    const metrics = [moodStr, energyStr].filter(Boolean).join(", ");

    await writeTimelineEvent(supabase, {
      userId,
      type: "journal_entry",
      summary: `Logged reflection for ${entryDate}${metrics ? ` (${metrics})` : ""}`,
      refTable: "journal_entries",
      refId: saved.id,
      meta: {
        entry_date: saved.entry_date,
        mood: saved.mood,
        energy: saved.energy,
        gratitude_count: saved.gratitude.length,
        wins_count: saved.wins.length,
      },
    });

    return saved;
  } catch (err) {
    console.error("[saveJournalEntry] Unexpected error:", err);
    return null;
  }
}

/**
 * Fetches recent journal entries for history list.
 */
export async function getRecentJournalEntries(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 30
): Promise<JournalEntry[]> {
  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getRecentJournalEntries] Error:", error.message);
      return [];
    }

    return (data || []) as JournalEntry[];
  } catch (err) {
    console.error("[getRecentJournalEntries] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches mood and energy timeline data for the past N days.
 */
export async function getMoodTimelineData(
  supabase: SupabaseClient<Database>,
  userId: string,
  daysCount: number = 14
): Promise<MoodTimelinePoint[]> {
  try {
    const today = todayIST();
    const startDate = addDaysIST(today, -daysCount + 1);

    const { data, error } = await supabase
      .from("journal_entries")
      .select("entry_date, mood, energy")
      .eq("user_id", userId)
      .gte("entry_date", startDate)
      .lte("entry_date", today)
      .order("entry_date", { ascending: true });

    if (error) {
      console.error("[getMoodTimelineData] Error:", error.message);
      return [];
    }

    const map = new Map<string, { mood: number | null; energy: number | null }>();
    (data || []).forEach((row) => {
      map.set(row.entry_date, { mood: row.mood, energy: row.energy });
    });

    const result: MoodTimelinePoint[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = addDaysIST(startDate, i);
      const entry = map.get(d);
      result.push({
        date: d,
        friendlyDate: formatFriendlyISTDate(d),
        mood: entry?.mood ?? null,
        energy: entry?.energy ?? null,
      });
    }

    return result;
  } catch (err) {
    console.error("[getMoodTimelineData] Unexpected error:", err);
    return [];
  }
}

/**
 * Summarizes the events of an IST calendar date from timeline_events.
 * Provides a structured pre-filled daily summary for reflection.
 */
export async function summarizeDayFromTimeline(
  supabase: SupabaseClient<Database>,
  userId: string,
  dateStr: string = todayIST()
): Promise<string> {
  try {
    const { startUTC, endUTC } = getISTDateRangeUTC(dateStr);

    const { data: events, error } = await supabase
      .from("timeline_events")
      .select("type, summary, meta, occurred_at")
      .eq("user_id", userId)
      .gte("occurred_at", startUTC)
      .lte("occurred_at", endUTC)
      .order("occurred_at", { ascending: true });

    if (error || !events || events.length === 0) {
      return `No logged timeline activity recorded for ${formatFriendlyISTDate(dateStr)} yet.`;
    }

    // Categorize events
    const completedTasks: string[] = [];
    let studyMinutes = 0;
    let dsaProblemsSolved = 0;
    let totalSpendPaise = 0;
    const mealsLogged: string[] = [];
    const placesVisited: string[] = [];

    events.forEach((evt) => {
      const type = evt.type.toLowerCase();
      if (type.includes("task") && type.includes("completed")) {
        completedTasks.push(evt.summary.replace(/^Completed task:\s*/i, ""));
      } else if (type.includes("study") || type.includes("activity")) {
        const durationSec = (evt.meta as any)?.duration_seconds || 0;
        studyMinutes += Math.round(durationSec / 60);
      } else if (type.includes("dsa") && type.includes("solved")) {
        dsaProblemsSolved += 1;
      } else if (type.includes("expense")) {
        const paise = (evt.meta as any)?.amount_paise || 0;
        totalSpendPaise += paise;
      } else if (type.includes("meal")) {
        mealsLogged.push(evt.summary.replace(/^Logged meal:\s*/i, ""));
      } else if (type.includes("place")) {
        placesVisited.push(evt.summary.replace(/^Visited:\s*/i, ""));
      }
    });

    const lines: string[] = [];
    lines.push(`### Daily Timeline Highlights (${formatFriendlyISTDate(dateStr)})`);

    if (completedTasks.length > 0) {
      lines.push(`- **Tasks Finished (${completedTasks.length}):** ${completedTasks.slice(0, 4).join(", ")}${completedTasks.length > 4 ? "..." : ""}`);
    }
    if (studyMinutes > 0) {
      const hrs = Math.floor(studyMinutes / 60);
      const mins = studyMinutes % 60;
      lines.push(`- **Focused Study Session:** ${hrs > 0 ? `${hrs}h ` : ""}${mins}m total`);
    }
    if (dsaProblemsSolved > 0) {
      lines.push(`- **DSA Solved:** ${dsaProblemsSolved} problem${dsaProblemsSolved > 1 ? "s" : ""}`);
    }
    if (totalSpendPaise > 0) {
      lines.push(`- **Spend Today:** ${formatINR(totalSpendPaise)}`);
    }
    if (mealsLogged.length > 0) {
      lines.push(`- **Meals Logged:** ${mealsLogged.join(", ")}`);
    }
    if (placesVisited.length > 0) {
      lines.push(`- **Places Visited:** ${placesVisited.join(", ")}`);
    }

    if (lines.length === 1) {
      lines.push(`- General day logging (${events.length} events logged)`);
    }

    return lines.join("\n");
  } catch (err) {
    console.error("[summarizeDayFromTimeline] Unexpected error:", err);
    return "";
  }
}

/**
 * Aggregates weekly metrics across study logs, DSA, expenses, and tasks.
 */
export async function getWeeklyReviewStats(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string,
  weekEndDate: string
): Promise<WeeklyReviewStats> {
  const stats: WeeklyReviewStats = {
    weekStartDate,
    weekEndDate,
    studyMinutes: 0,
    studyHours: 0,
    dsaSolvedCount: 0,
    spentPaise: 0,
    tasksCompletedCount: 0,
    habitsCompletedCount: 0,
  };

  try {
    const { startUTC } = getISTDateRangeUTC(weekStartDate);
    const { endUTC } = getISTDateRangeUTC(weekEndDate);

    // 1. Study time from activity_logs
    const { data: actLogs } = await supabase
      .from("activity_logs")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("started_at", startUTC)
      .lte("started_at", endUTC);

    if (actLogs) {
      const totalSec = actLogs.reduce((sum, row) => sum + (row.duration_seconds || 0), 0);
      stats.studyMinutes = Math.round(totalSec / 60);
      stats.studyHours = Math.round((totalSec / 3600) * 10) / 10;
    }

    // 2. DSA solved count
    const { data: dsaProblems } = await supabase
      .from("dsa_problems")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "Solved")
      .gte("last_revised_at", startUTC)
      .lte("last_revised_at", endUTC);

    stats.dsaSolvedCount = dsaProblems?.length || 0;

    // 3. Expenses in paise
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount_paise")
      .eq("user_id", userId)
      .gte("spent_at", startUTC)
      .lte("spent_at", endUTC);

    if (expenses) {
      stats.spentPaise = expenses.reduce((sum, row) => sum + (row.amount_paise || 0), 0);
    }

    // 4. Tasks completed
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", startUTC)
      .lte("completed_at", endUTC);

    stats.tasksCompletedCount = tasks?.length || 0;

    // 5. Habits completed
    const { data: habits } = await supabase
      .from("habit_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("logged_date", weekStartDate)
      .lte("logged_date", weekEndDate);

    stats.habitsCompletedCount = habits?.length || 0;

    return stats;
  } catch (err) {
    console.error("[getWeeklyReviewStats] Error:", err);
    return stats;
  }
}

/**
 * Generates an auto-filled markdown template for a weekly review.
 */
export function generateWeeklyReviewMarkdown(
  stats: WeeklyReviewStats,
  weekStartDate: string,
  weekEndDate: string
): string {
  const hrs = Math.floor(stats.studyMinutes / 60);
  const mins = stats.studyMinutes % 60;
  const studyFormatted = `${hrs}h ${mins}m`;
  const spendFormatted = formatINR(stats.spentPaise);

  return `# Weekly Review: ${formatFriendlyISTDate(weekStartDate)} - ${formatFriendlyISTDate(weekEndDate)}

### Week at a Glance (Auto-Aggregated)
- **Deep Work & Study:** ${studyFormatted}
- **DSA Problems Solved:** ${stats.dsaSolvedCount}
- **Total Expenditure:** ${spendFormatted}
- **Tasks Finished:** ${stats.tasksCompletedCount}
- **Habits Maintained:** ${stats.habitsCompletedCount} check-ins

---

### Wins & Milestones This Week
- 

### Key Lessons & Takeaways
- 

### What Needs Adjustment Next Week
- 

### Top 3 Priorities for Next Week
1. 
2. 
3. 
`;
}
