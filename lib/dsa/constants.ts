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
  "HashMap",
  "Hashing",
  "Strings",
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

/**
 * Adaptive mastery tiers and thresholds for problem solving
 */
export const MASTERY_TIERS = [
  { minSolved: 0, target: 10, tier: "Apprentice" },
  { minSolved: 10, target: 25, tier: "Practitioner" },
  { minSolved: 25, target: 50, tier: "Proficient" },
  { minSolved: 50, target: 100, tier: "Master" },
  { minSolved: 100, target: 200, tier: "Grandmaster" },
] as const;

export type MasteryTierName = (typeof MASTERY_TIERS)[number]["tier"];

/**
 * Calculates adaptive milestone target based on solved count and total logged
 * Tier milestones: 10 (Apprentice) -> 25 (Practitioner) -> 50 (Proficient) -> 100 (Master) -> 200+ (Grandmaster)
 */
export function getAdaptiveTopicTarget(
  solved: number,
  total: number = 0
): { target: number; tier: MasteryTierName } {
  if (solved >= 100) {
    const nextTarget = Math.max(total, Math.ceil((solved + 1) / 50) * 50);
    return { target: nextTarget, tier: "Grandmaster" };
  }
  if (solved >= 50) return { target: 100, tier: "Master" };
  if (solved >= 25) return { target: 50, tier: "Proficient" };
  if (solved >= 10) return { target: 25, tier: "Practitioner" };
  return { target: 10, tier: "Apprentice" };
}

/**
 * Normalizes any category string into a standardized canonical DSA topic.
 * Maps 'hashmap', 'hash table', 'arrays & hashing', etc. cleanly to 'HashMap'.
 */
export function canonicalDsaTopic(rawTopic?: string | null): string {
  if (!rawTopic) return "Arrays";
  const trimmed = rawTopic.trim();
  const lower = trimmed.toLowerCase();

  // Hashmap / Hash Table / Arrays & Hashing
  if (
    lower === "hashmap" ||
    lower === "hash map" ||
    lower === "hashtable" ||
    lower === "hash table" ||
    lower === "hashing" ||
    lower === "arrays & hashing" ||
    lower.includes("hash") ||
    lower.includes("map")
  ) {
    return "HashMap";
  }

  if (lower === "arrays" || lower === "array") return "Arrays";
  if (lower === "strings" || lower === "string") return "Strings";
  if (lower.includes("two pointer") || lower === "2 pointers") return "Two Pointers";
  if (lower.includes("sliding") || lower.includes("window")) return "Sliding Window";
  if (lower === "stack") return "Stack";
  if (lower === "queue") return "Queue";
  if (lower.includes("linked") || lower.includes("list")) return "Linked List";
  if (lower.includes("tree") || lower.includes("bst")) return "Trees";
  if (lower.includes("graph")) return "Graphs";
  if (lower.includes("heap") || lower.includes("priority queue")) return "Heaps";
  if (lower === "dp" || lower.includes("dynamic programming")) return "DP";
  if (lower.includes("backtrack")) return "Backtracking";
  if (lower.includes("greedy")) return "Greedy";
  if (lower.includes("binary search")) return "Binary Search";
  if (lower.includes("trie")) return "Tries";
  if (lower.includes("interval")) return "Intervals";
  if (lower.includes("math") || lower.includes("geometry")) return "Math & Geometry";
  if (lower.includes("bit")) return "Bit Manipulation";

  const exact = DSA_TOPICS.find((t) => t.toLowerCase() === lower);
  return exact || trimmed;
}

/**
 * Checks whether two topic representations refer to the same logical algorithmic category
 */
export function isSameDsaTopic(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a.toLowerCase() === b.toLowerCase()) return true;
  return canonicalDsaTopic(a).toLowerCase() === canonicalDsaTopic(b).toLowerCase();
}
