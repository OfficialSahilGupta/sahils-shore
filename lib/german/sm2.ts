// ============================================================================
// Sahil's Shore: Pure SM-2 (SuperMemo-2) Spaced Repetition Scheduler
// Pure, deterministic function for flashcard scheduling and interval previews
// ============================================================================

export type SM2Grade = "again" | "hard" | "good" | "easy";

export interface SM2Card {
  repetition: number;
  interval: number;
  ease_factor: number;
  last_reviewed_at?: string | null;
}

export interface SM2Result {
  repetition: number;
  interval: number; // in days
  ease_factor: number;
  next_review_at: string; // ISO 8601 string
}

export interface SM2IntervalPreviews {
  again: { interval: number; label: string };
  hard: { interval: number; label: string };
  good: { interval: number; label: string };
  easy: { interval: number; label: string };
}

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;
export const MAX_EASE_FACTOR = 3.0;

/**
 * Maps categorical SM-2 grades to standard quality scores (0 - 5)
 */
export function gradeToQuality(grade: SM2Grade): number {
  switch (grade) {
    case "again":
      return 1; // Failed recall
    case "hard":
      return 3; // Passed with significant difficulty
    case "good":
      return 4; // Correct recall after hesitation
    case "easy":
      return 5; // Perfect instant recall
  }
}

/**
 * Formats day interval into concise human-readable preview label
 */
export function formatIntervalLabel(days: number): string {
  if (days <= 1) return "1d";
  if (days < 30) return `${days}d`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months}mo`;
  }
  const years = (days / 365).toFixed(1);
  return `${years}y`;
}

/**
 * Pure SM-2 calculation function
 * @param card Current card stats (repetition, interval, ease_factor)
 * @param grade Selected response ('again' | 'hard' | 'good' | 'easy')
 * @param baseDate Reference date for calculating next_review_at (defaults to current date)
 */
export function calculateSM2(
  card: SM2Card,
  grade: SM2Grade,
  baseDate: Date = new Date()
): SM2Result {
  const quality = gradeToQuality(grade);
  let rep = card.repetition || 0;
  let interval = card.interval || 0;
  let ef = card.ease_factor || DEFAULT_EASE_FACTOR;

  // 1. Calculate new Ease Factor (EF')
  // Standard SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // For 'again', we apply a gentle floor penalty (-0.20) rather than harsh -0.54
  if (grade === "again") {
    ef = Math.max(MIN_EASE_FACTOR, ef - 0.2);
  } else {
    const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    ef = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, ef + delta));
  }
  // Round ease factor to 2 decimals
  ef = Math.round(ef * 100) / 100;

  // 2. Calculate next Repetition count & Interval
  if (grade === "again") {
    // Failed: reset repetition streak to 0, review again tomorrow (1 day)
    rep = 0;
    interval = 1;
  } else {
    // Successful recall (hard, good, easy)
    if (rep === 0) {
      // First successful repetition
      interval = grade === "easy" ? 3 : 1;
    } else if (rep === 1) {
      // Second successful repetition
      if (grade === "hard") {
        interval = 3;
      } else if (grade === "easy") {
        interval = 8;
      } else {
        interval = 6; // standard SM-2 step 2
      }
    } else {
      // Subsequent repetitions (rep >= 2)
      if (grade === "hard") {
        interval = Math.max(interval + 1, Math.round(interval * 1.2));
      } else if (grade === "easy") {
        interval = Math.max(interval + 2, Math.round(interval * ef * 1.3));
      } else {
        // 'good'
        interval = Math.max(interval + 1, Math.round(interval * ef));
      }
    }
    rep += 1;
  }

  // 3. Compute next_review_at UTC timestamp
  const nextReview = new Date(baseDate.getTime());
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    repetition: rep,
    interval,
    ease_factor: ef,
    next_review_at: nextReview.toISOString(),
  };
}

/**
 * Computes preview intervals for all 4 rating buttons before user selects one
 */
export function getSM2IntervalPreviews(
  card: SM2Card,
  baseDate: Date = new Date()
): SM2IntervalPreviews {
  const againRes = calculateSM2(card, "again", baseDate);
  const hardRes = calculateSM2(card, "hard", baseDate);
  const goodRes = calculateSM2(card, "good", baseDate);
  const easyRes = calculateSM2(card, "easy", baseDate);

  return {
    again: {
      interval: againRes.interval,
      label: `<${formatIntervalLabel(againRes.interval)}`,
    },
    hard: {
      interval: hardRes.interval,
      label: formatIntervalLabel(hardRes.interval),
    },
    good: {
      interval: goodRes.interval,
      label: formatIntervalLabel(goodRes.interval),
    },
    easy: {
      interval: easyRes.interval,
      label: formatIntervalLabel(easyRes.interval),
    },
  };
}

/**
 * Determines whether a vocab card is currently due for review
 */
export function isCardDueForReview(
  card: { next_review_at: string },
  nowISO: string = new Date().toISOString()
): boolean {
  if (!card.next_review_at) return true;
  return new Date(card.next_review_at).getTime() <= new Date(nowISO).getTime();
}
