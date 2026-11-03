// ============================================================================
// Sahil's Shore: AI Coach Types & Interfaces
// Daily reflection, weekly review, privacy scrubber, and LLM schemas
// ============================================================================

export interface CoachDailyInsight {
  id?: string;
  periodDate: string; // YYYY-MM-DD
  summary: string;    // Exactly 3 lines
  pattern: string;    // One pattern noticed across last 14 days
  suggestedPriorities: string[]; // 3 actionable priorities for tomorrow
  gentleNudge: string; // Supportive, calm coaching nudge
  provider: "gemini" | "anthropic" | "heuristic";
  createdAt?: string;
}

export interface CoachWeeklyReview {
  id?: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  highlights: string[];
  focusAndHabitPace: string;
  skillBalanceNotes: string;
  suggestedPriorities: string[];
  gentleNudge: string;
  provider: "gemini" | "anthropic" | "heuristic";
  createdAt?: string;
}

export interface SanitizedTimelineEvent {
  type: string;
  summary: string;
  timeIST: string;
}

export interface Sanitized14DayStats {
  periodStart: string;
  periodEnd: string;
  daysAnalyzed: number;
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
  optInJournalIncluded: boolean;
  journalHighlights?: string[];
}

export interface SanitizedCoachContext {
  targetDate: string;
  isToday: boolean;
  timelineEvents: SanitizedTimelineEvent[];
  stats14Days: Sanitized14DayStats;
}

export interface CoachSettingsConfig {
  enabled: boolean;
  opt_in_journal: boolean;
  provider?: "auto" | "gemini" | "anthropic" | "heuristic";
}
