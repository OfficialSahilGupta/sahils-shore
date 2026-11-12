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

/**
 * Curated catalog of 42 industry-standard Algorithmic Patterns & Paradigms
 * categorized for interview prep and deep engineering mastery.
 */
export interface DsaPatternDefinition {
  name: string;
  category: string;
  description: string;
}

export const DSA_PATTERNS_CATALOG: DsaPatternDefinition[] = [
  // 1. Two Pointers & Arrays
  {
    name: "Two Pointers (Left/Right Convergence)",
    category: "Two Pointers & Arrays",
    description: "Sorted array boundary convergence comparing arr[L] + arr[R] against target.",
  },
  {
    name: "Fast & Slow Pointers (Cycle Detection)",
    category: "Two Pointers & Arrays",
    description: "Floyd's Tortoise and Hare algorithm for cycle detection and middle node discovery.",
  },
  {
    name: "Dutch National Flag (3-Way Partition)",
    category: "Two Pointers & Arrays",
    description: "Partitioning array in place into 3 segments (e.g. Sort Colors 0, 1, 2) in O(N).",
  },
  {
    name: "Kadane's Algorithm (Max Subarray)",
    category: "Two Pointers & Arrays",
    description: "Dynamic subarray sum optimization restarting when current running sum < 0.",
  },
  {
    name: "Prefix Sum & Running Hash",
    category: "Two Pointers & Arrays",
    description: "Precomputed prefix sums and difference arrays for O(1) subarray range query evaluations.",
  },
  {
    name: "Cyclic Sort",
    category: "Two Pointers & Arrays",
    description: "In-place array element placement for contiguous numbers in range [1, N] or [0, N].",
  },

  // 2. Sliding Window
  {
    name: "Sliding Window (Fixed Size)",
    category: "Sliding Window",
    description: "Constant window length k maintaining rolling sum, frequency, or uniqueness.",
  },
  {
    name: "Sliding Window (Dynamic / Expanding)",
    category: "Sliding Window",
    description: "Expand right to satisfy constraint, shrink left monotonically to optimize window size.",
  },
  {
    name: "Sliding Window Maximum (Monotonic Deque)",
    category: "Sliding Window",
    description: "Double-ended queue maintaining decreasing elements for O(1) sliding window extremes.",
  },

  // 3. Binary Search
  {
    name: "Binary Search (Sorted Array Boundary)",
    category: "Binary Search",
    description: "Search space halving with inclusive [L, R] boundaries and mid = L + (R-L)/2.",
  },
  {
    name: "Binary Search on Solution Space",
    category: "Binary Search",
    description: "Binary search on answers using a monotonic feasibility check function (e.g., Koko Eating Bananas).",
  },
  {
    name: "Modified Binary Search (Rotated Array)",
    category: "Binary Search",
    description: "Determining whether mid lies in sorted left half or sorted right half in pivoted arrays.",
  },

  // 4. Stacks & Queues
  {
    name: "Monotonic Stack (Next Greater/Smaller)",
    category: "Stacks & Queues",
    description: "Stack maintaining strict monotonic order to resolve next/previous greater or smaller elements in O(N).",
  },
  {
    name: "Parentheses & Expression Parsing",
    category: "Stacks & Queues",
    description: "Stack-based validation of nested brackets, prefix/postfix/infix conversion, and calculator evaluation.",
  },
  {
    name: "Min / Max Stack Design",
    category: "Stacks & Queues",
    description: "Auxiliary stack or delta tracking to query minimum/maximum in O(1) time.",
  },

  // 5. Linked Lists
  {
    name: "In-Place Linked List Reversal",
    category: "Linked Lists",
    description: "Iterative pointer reversal using prev, curr, and next pointers in O(1) auxiliary space.",
  },
  {
    name: "Reorder & Palindrome Linked List",
    category: "Linked Lists",
    description: "Fast/slow split, reverse second half, and interleave or compare halves.",
  },
  {
    name: "LRU / LFU Cache Design",
    category: "Linked Lists",
    description: "Hash map combined with doubly-linked list for O(1) get and evict operations.",
  },

  // 6. Trees & BST
  {
    name: "Tree BFS (Level Order Traversal)",
    category: "Trees & Graphs",
    description: "Queue-based level-by-level traversal with size snapshot for level grouping.",
  },
  {
    name: "Tree DFS (Preorder / Inorder / Postorder)",
    category: "Trees & Graphs",
    description: "Recursive and iterative call stack exploration computing depths, diameters, and paths.",
  },
  {
    name: "Lowest Common Ancestor (LCA)",
    category: "Trees & Graphs",
    description: "Bottom-up recursion returning matching nodes or binary lifting for logarithmic queries.",
  },
  {
    name: "BST Invariant & Validation",
    category: "Trees & Graphs",
    description: "Maintaining strict (low, high) bounds or utilizing in-order monotonic increase.",
  },
  {
    name: "Trie / Prefix Tree",
    category: "Trees & Graphs",
    description: "N-ary tree node mapping character transitions for fast prefix searches, autocomplete, and wildcard matching.",
  },

  // 7. Graphs
  {
    name: "Graph BFS (Shortest Path Unweighted)",
    category: "Trees & Graphs",
    description: "Level-wise traversal with visited set guaranteeing minimum edges to reach target.",
  },
  {
    name: "Graph DFS & Cycle Detection",
    category: "Trees & Graphs",
    description: "Backtracking traversal with 3-state coloring (unvisited, visiting, visited) to spot directed cycles.",
  },
  {
    name: "Topological Sort (Kahn's Algorithm)",
    category: "Trees & Graphs",
    description: "In-degree array + queue processing vertices with zero dependencies (DAG ordering).",
  },
  {
    name: "Dijkstra's Algorithm (Weighted Shortest Path)",
    category: "Trees & Graphs",
    description: "Min-heap priority queue relaxing edge weights greedily in non-negative weighted graphs.",
  },
  {
    name: "Union-Find / Disjoint Set Union (DSU)",
    category: "Trees & Graphs",
    description: "Near O(1) connectivity queries and dynamic cycle detection using path compression and union by rank.",
  },
  {
    name: "Minimum Spanning Tree (Kruskal's & Prim's)",
    category: "Trees & Graphs",
    description: "Greedy edge selection with DSU or cut-property vertex exploration.",
  },

  // 8. Dynamic Programming
  {
    name: "1D Dynamic Programming (Linear)",
    category: "Dynamic Programming",
    description: "State transition depending on preceding k elements (e.g. Fibonacci, Climbing Stairs, House Robber).",
  },
  {
    name: "0/1 Knapsack & Subset Sum",
    category: "Dynamic Programming",
    description: "Decision tree of choosing or skipping each item with capacity state (reverse 1D traversal).",
  },
  {
    name: "Unbounded Knapsack / Coin Change",
    category: "Dynamic Programming",
    description: "Items can be reused infinitely; state transitions iterate forward over capacity.",
  },
  {
    name: "Longest Common Subsequence (LCS)",
    category: "Dynamic Programming",
    description: "2D grid matching character equality: dp[i][j] = dp[i-1][j-1] + 1 or max(skip left, skip top).",
  },
  {
    name: "Longest Increasing Subsequence (LIS)",
    category: "Dynamic Programming",
    description: "Patience sorting / binary search on tails array achieving O(N log N) runtime.",
  },
  {
    name: "Matrix / Grid Path DP",
    category: "Dynamic Programming",
    description: "Accumulating optimal paths moving right/down with obstacle boundary checks.",
  },
  {
    name: "Interval DP",
    category: "Dynamic Programming",
    description: "Subproblem defined by range [i, j] testing optimal splitting point k (e.g. Burst Balloons).",
  },
  {
    name: "Bitmask DP",
    category: "Dynamic Programming",
    description: "Integer bitmask representing visited subsets for Hamiltonian cycles and small-set permutations.",
  },

  // 9. Backtracking & Combinatorics
  {
    name: "Subsets & Combinations Generation",
    category: "Backtracking & Recursion",
    description: "Backtracking recursion with start index tracking to generate unique subset combinations.",
  },
  {
    name: "Permutations Generation",
    category: "Backtracking & Recursion",
    description: "Backtracking with boolean used array or in-place swapping for full orderings.",
  },
  {
    name: "Grid Exploration & Word Search",
    category: "Backtracking & Recursion",
    description: "4-directional DFS traversal marking visited cells in place and backtracking upon return.",
  },

  // 10. Heaps & Greedy
  {
    name: "Top 'K' Elements (Min/Max Heap)",
    category: "Heaps & Greedy",
    description: "Bounded priority queue of size K pruning suboptimal elements in O(N log K).",
  },
  {
    name: "Two Heaps (Find Median from Stream)",
    category: "Heaps & Greedy",
    description: "Max-heap for lower half and Min-heap for upper half balanced within 1 element difference.",
  },
  {
    name: "Interval Scheduling & Merge Overlaps",
    category: "Heaps & Greedy",
    description: "Sorting by start or end times to greedily merge intervals or maximize non-overlapping bookings.",
  },

  // 11. Bit Manipulation & Math
  {
    name: "Bitwise XOR Magic",
    category: "Bit Manipulation",
    description: "Exploiting a ^ a = 0 and a ^ 0 = a for single number isolation and missing element detection.",
  },
  {
    name: "Fast Exponentiation (Binary Exponentiation)",
    category: "Bit Manipulation",
    description: "Computing x^n in O(log n) time by squaring base when power is even.",
  },
];

export const ALL_DSA_PATTERN_NAMES = DSA_PATTERNS_CATALOG.map((p) => p.name);

