// ============================================================================
// Sahil's Shore: DSA Tracker Constants & Topic Definitions
// ============================================================================

export const DSA_PLATFORMS = [
  "LeetCode",
  "GFG",
  "Codeforces",
  "HackerRank",
  "InterviewBit",
  "Other",
] as const;

export type DsaPlatform = (typeof DSA_PLATFORMS)[number];

export const DSA_TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Queue",
  "Linked List",
  "Trees",
  "Graphs",
  "Heaps",
  "DP",
  "Backtracking",
  "Greedy",
  "Binary Search",
  "Tries",
  "Intervals",
  "Math & Geometry",
  "Bit Manipulation",
] as const;

export type DsaTopic = (typeof DSA_TOPICS)[number];

export const DSA_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type DsaDifficulty = (typeof DSA_DIFFICULTIES)[number];

export const DSA_STATUSES = [
  "Solved",
  "Needs revision",
  "Stuck",
  "Revisit",
  "Todo",
] as const;
export type DsaStatus = (typeof DSA_STATUSES)[number];

export const SUPPORTED_LANGUAGES = [
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["id"];

/**
 * Spaced repetition interval ladder in days: 1, 3, 7, 14, 30
 */
export const SPACING_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

export const DEFAULT_DAILY_DSA_GOAL = 3;
