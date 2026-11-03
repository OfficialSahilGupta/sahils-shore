// ============================================================================
// Sahil's Shore: AI Coach Privacy Sanitizer
// Strips exact GPS, receipt images, and private journal text before LLM calls
// ============================================================================

import type {
  SanitizedCoachContext,
  SanitizedTimelineEvent,
  Sanitized14DayStats,
} from "./types";
import { formatTime12HourIST } from "../date-utils.ts";

/**
 * Strips all sensitive information (GPS, media URLs, personal journal entries)
 * from raw database objects before any external LLM invocation.
 */
export function sanitizeContextForCoach(params: {
  targetDate: string;
  isToday: boolean;
  timelineRows: Array<{
    type: string;
    summary: string;
    occurred_at: string;
    meta?: any;
  }>;
  stats: {
    periodStart: string;
    periodEnd: string;
    averageProductivityScore: number;
    totalFocusHours: number;
    skillHours: {
      dsa: number;
      springBoot: number;
      mern: number;
      german: number;
      other: number;
    };
    habitsCompletionRate: number;
    tasksCompletedCount: number;
    tasksPendingCount: number;
    totalSpendRupees: number;
    averageDailySpendRupees: number;
    averageMood: number | null;
  };
  journalRows?: Array<{
    date: string;
    gratitude?: string | null;
    wins?: string | null;
    lessons?: string | null;
    notes?: string | null;
  }>;
  optInJournal: boolean;
}): SanitizedCoachContext {
  const { targetDate, isToday, timelineRows, stats, journalRows, optInJournal } = params;

  // 1. Sanitize timeline events
  const sanitizedEvents: SanitizedTimelineEvent[] = timelineRows.map((row) => {
    let cleanSummary = row.summary || "";

    // Strip receipt URLs or file names
    cleanSummary = cleanSummary.replace(/https?:\/\/[^\s]+/g, "[link]");
    cleanSummary = cleanSummary.replace(/\b[\w-]+\.(jpg|jpeg|png|webp|mp4|mov|pdf)\b/gi, "[media]");

    // Strip exact coordinates (e.g. 12.9716, 77.5946 or lat: ... lng: ...)
    cleanSummary = cleanSummary.replace(/-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}/g, "[location]");

    const timeIST = row.occurred_at ? formatTime12HourIST(row.occurred_at) : "";

    return {
      type: row.type,
      summary: cleanSummary,
      timeIST,
    };
  });

  // 2. Sanitize Journal Highlights if opt-in enabled
  const journalHighlights: string[] = [];
  if (optInJournal && journalRows && journalRows.length > 0) {
    for (const j of journalRows) {
      if (j.wins) {
        journalHighlights.push(`Win (${j.date}): ${scrubText(j.wins)}`);
      }
      if (j.lessons) {
        journalHighlights.push(`Lesson (${j.date}): ${scrubText(j.lessons)}`);
      }
    }
  }

  const sanitizedStats: Sanitized14DayStats = {
    periodStart: stats.periodStart,
    periodEnd: stats.periodEnd,
    daysAnalyzed: 14,
    averageProductivityScore: Math.round(stats.averageProductivityScore),
    totalFocusHours: Math.round(stats.totalFocusHours * 10) / 10,
    skillHours: {
      dsa: Math.round(stats.skillHours.dsa * 10) / 10,
      springBoot: Math.round(stats.skillHours.springBoot * 10) / 10,
      mern: Math.round(stats.skillHours.mern * 10) / 10,
      german: Math.round(stats.skillHours.german * 10) / 10,
      other: Math.round(stats.skillHours.other * 10) / 10,
    },
    habitsCompletionRate: Math.round(stats.habitsCompletionRate),
    tasksCompletedCount: stats.tasksCompletedCount,
    tasksPendingCount: stats.tasksPendingCount,
    totalSpendRupees: Math.round(stats.totalSpendRupees),
    averageDailySpendRupees: Math.round(stats.averageDailySpendRupees),
    averageMood: stats.averageMood !== null ? Math.round(stats.averageMood * 10) / 10 : null,
    optInJournalIncluded: optInJournal,
    journalHighlights: journalHighlights.length > 0 ? journalHighlights.slice(0, 5) : undefined,
  };

  return {
    targetDate,
    isToday,
    timelineEvents: sanitizedEvents.slice(0, 30), // Cap at 30 most recent for token efficiency
    stats14Days: sanitizedStats,
  };
}

/**
 * Basic scrubber to remove emails, phone numbers, and credentials from user text.
 */
function scrubText(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]")
    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[phone]")
    .replace(/(?:password|secret|key|token|auth)\s*[:=]\s*\S+/gi, "[redacted]")
    .trim();
}
