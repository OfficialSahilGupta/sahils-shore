// ============================================================================
// Sahil's Shore: Productivity Score Calculator
// Transparent formula combining Tasks (40%), Focus (35%), and Habits (25%)
// ============================================================================

import type { ProductivityScoreBreakdown } from "./types";

export interface ProductivityInputs {
  tasksCompleted: number;
  tasksTotal: number;
  focusMinutes: number;
  focusTargetMinutes: number;
  habitsCompleted: number;
  habitsScheduled: number;
}

/**
 * Calculates a transparent 0-100 productivity score with exact component weights.
 *
 * Weighting:
 * - 40% Task Completion: Ratio of completed tasks vs total scheduled tasks.
 * - 35% Focus Adherence: Focus study minutes logged vs target goal minutes.
 * - 25% Habit Consistency: Ratio of completed habits vs active habit days.
 */
export function calculateProductivityScore(inputs: ProductivityInputs): ProductivityScoreBreakdown {
  const {
    tasksCompleted,
    tasksTotal,
    focusMinutes,
    focusTargetMinutes,
    habitsCompleted,
    habitsScheduled,
  } = inputs;

  // 1. Task Completion Score (0-100)
  let taskScore = 100;
  if (tasksTotal > 0) {
    taskScore = Math.min(100, Math.max(0, Math.round((tasksCompleted / tasksTotal) * 100)));
  } else if (tasksCompleted > 0) {
    taskScore = 100;
  }

  // 2. Focus Adherence Score (0-100)
  let focusScore = 100;
  const target = focusTargetMinutes > 0 ? focusTargetMinutes : 120; // Default benchmark: 2 hours
  focusScore = Math.min(100, Math.max(0, Math.round((focusMinutes / target) * 100)));

  // 3. Habit Consistency Score (0-100)
  let habitScore = 100;
  if (habitsScheduled > 0) {
    habitScore = Math.min(100, Math.max(0, Math.round((habitsCompleted / habitsScheduled) * 100)));
  } else if (habitsCompleted > 0) {
    habitScore = 100;
  }

  // 4. Overall Weighted Score (0-100)
  const taskWeight = 0.4;
  const focusWeight = 0.35;
  const habitWeight = 0.25;

  const rawScore = taskScore * taskWeight + focusScore * focusWeight + habitScore * habitWeight;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    overallScore,
    taskScore,
    focusScore,
    habitScore,
    tasksCompleted,
    tasksTotal,
    focusMinutes,
    focusTargetMinutes,
    habitsCompleted,
    habitsScheduled,
    formulaExplanation: {
      taskWeight,
      focusWeight,
      habitWeight,
      description:
        "Score = (40% × Task Completion) + (35% × Focus Target Adherence) + (25% × Habit Consistency)",
    },
  };
}

/**
 * Returns a human-friendly assessment label and color class for a given score.
 */
export function getProductivityTier(score: number): {
  label: string;
  badgeClass: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: "Flow State",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Exceptional day with high deep work, goal progress, and habits locked in.",
    };
  }
  if (score >= 75) {
    return {
      label: "Productive Tide",
      badgeClass: "bg-primary/10 text-primary border-primary/30",
      description: "Strong momentum across key focus skills and daily responsibilities.",
    };
  }
  if (score >= 55) {
    return {
      label: "Steady Current",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description: "Good foundational effort with opportunities to deepen focus blocks.",
    };
  }
  return {
    label: "Gentle Shore",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
    description: "Lighter day. Rest and recovery are also essential for long-term consistency.",
  };
}
