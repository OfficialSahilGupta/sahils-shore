// ============================================================================
// Sahil's Shore: Unit Tests for Blind 150 & Resilient DSA Problem Logging
// Covers: Blind 150 syllabus verification (150 problems), completion rate math,
// title fuzzy normalization, LeetCode slug extraction, matching algorithm,
// and topic canonicalization (HashMap / Hashing).
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  BLIND_150_LIST,
  calculateBlind150Stats,
  normalizeDsaTitle,
  stripProblemNumber,
  extractLeetCodeSlug,
  findMatchingUserProblem,
  isBlindProblemSolved,
} from "../lib/dsa/blind150.ts";
import {
  canonicalDsaTopic,
  isSameDsaTopic,
} from "../lib/dsa/constants.ts";
import type { DsaProblem } from "../types/index.ts";

describe("1. Blind 150 Dataset Integrity", () => {
  test("contains exactly 150 curated problems", () => {
    assert.equal(BLIND_150_LIST.length, 150);
  });

  test("each problem has required fields, links, and difficulty", () => {
    BLIND_150_LIST.forEach((p, idx) => {
      assert.ok(p.id, `Problem at index ${idx} missing id`);
      assert.ok(p.title, `Problem at index ${idx} missing title`);
      assert.ok(p.topic, `Problem ${p.title} missing topic`);
      assert.ok(
        ["Easy", "Medium", "Hard"].includes(p.difficulty),
        `Problem ${p.title} has invalid difficulty ${p.difficulty}`
      );
      assert.ok(p.link.startsWith("https://leetcode.com/problems/"), `Problem ${p.title} has invalid link`);
      assert.ok(p.pattern, `Problem ${p.title} missing pattern`);
      assert.ok(p.timeComplexity, `Problem ${p.title} missing time complexity`);
      assert.ok(p.hints, `Problem ${p.title} missing hints`);
    });
  });

  test("covers all core topics including Arrays, DP, Graphs, Trees, Heaps, and Bit Manipulation", () => {
    const topics = new Set(BLIND_150_LIST.map((p) => p.topic));
    assert.ok(topics.has("Arrays"));
    assert.ok(topics.has("Two Pointers"));
    assert.ok(topics.has("Sliding Window"));
    assert.ok(topics.has("Stack"));
    assert.ok(topics.has("Binary Search"));
    assert.ok(topics.has("Linked List"));
    assert.ok(topics.has("Trees"));
    assert.ok(topics.has("Graphs"));
    assert.ok(topics.has("DP"));
    assert.ok(topics.has("Heaps"));
    assert.ok(topics.has("Bit Manipulation"));
  });
});

describe("2. Blind 150 Advanced Matching & Title Normalization", () => {
  test("strips leading problem numbers cleanly", () => {
    assert.equal(stripProblemNumber("49. Group Anagrams"), "Group Anagrams");
    assert.equal(stripProblemNumber("#49: Group Anagrams"), "Group Anagrams");
    assert.equal(stripProblemNumber("347 - Top K Frequent Elements"), "Top K Frequent Elements");
    assert.equal(stripProblemNumber("015. 3Sum"), "3Sum");
    assert.equal(stripProblemNumber("Trapping Rain Water"), "Trapping Rain Water");
  });

  test("extracts LeetCode slugs from various URL formats", () => {
    assert.equal(
      extractLeetCodeSlug("https://leetcode.com/problems/group-anagrams/"),
      "group-anagrams"
    );
    assert.equal(
      extractLeetCodeSlug("https://leetcode.com/problems/group-anagrams/description/"),
      "group-anagrams"
    );
    assert.equal(
      extractLeetCodeSlug("https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/solutions/"),
      "two-sum-ii-input-array-is-sorted"
    );
    assert.equal(
      extractLeetCodeSlug("group-anagrams"),
      "group-anagrams"
    );
  });

  test("matches medium problems even when user enters problem number or URL variations", () => {
    const groupAnagrams = BLIND_150_LIST.find((p) => p.title === "Group Anagrams")!;
    assert.ok(groupAnagrams);

    const userProblems: DsaProblem[] = [
      {
        id: "p1",
        user_id: "u1",
        title: "49. Group Anagrams", // With LeetCode number
        link: "https://leetcode.com/problems/group-anagrams/description/",
        status: "Solved",
        difficulty: "Medium",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
    ];

    const match = findMatchingUserProblem(groupAnagrams, userProblems);
    assert.ok(match, "Failed to match Group Anagrams with number and URL description");
    assert.equal(match.id, "p1");
  });

  test("matches complex titles like Two Sum II - Input Array Is Sorted and 3Sum", () => {
    const twoSum2 = BLIND_150_LIST.find((p) => p.title.includes("Two Sum II"))!;
    assert.ok(twoSum2);

    const userProblems: DsaProblem[] = [
      {
        id: "p2",
        user_id: "u1",
        title: "Two Sum II - Input Array Is Sorted",
        link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
        status: "Solved",
        difficulty: "Medium",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
    ];

    const match = findMatchingUserProblem(twoSum2, userProblems);
    assert.ok(match);
    assert.equal(match.id, "p2");
  });

  test("isBlindProblemSolved recognizes solved problems in revision queue", () => {
    assert.equal(isBlindProblemSolved({ status: "Solved" } as any), true);
    assert.equal(isBlindProblemSolved({ status: "solved" } as any), true);
    assert.equal(isBlindProblemSolved({ status: "mastered" } as any), true);
    assert.equal(isBlindProblemSolved({ status: "Needs revision" } as any), true);
    assert.equal(isBlindProblemSolved({ status: "Todo" } as any), false);
    assert.equal(isBlindProblemSolved({ status: "todo" } as any), false);
    assert.equal(isBlindProblemSolved({ status: "Stuck" } as any), false);
  });

  test("calculateBlind150Stats calculates accurate percentages and difficulty breakdowns", () => {
    const userProblems: DsaProblem[] = [
      {
        id: "p1",
        user_id: "u1",
        title: "Contains Duplicate",
        status: "Solved",
        difficulty: "Easy",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
      {
        id: "p2",
        user_id: "u1",
        title: "Two Sum",
        status: "Solved",
        difficulty: "Easy",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
      {
        id: "p3",
        user_id: "u1",
        title: "Trapping Rain Water",
        status: "Solved",
        difficulty: "Hard",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
      {
        id: "p4",
        user_id: "u1",
        title: "Course Schedule",
        status: "Needs revision", // In revision queue -> solved!
        difficulty: "Medium",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
    ];

    const stats = calculateBlind150Stats(userProblems);
    assert.equal(stats.total, 150);
    assert.equal(stats.solvedCount, 4);
    assert.equal(stats.easySolved, 2);
    assert.equal(stats.mediumSolved, 1);
    assert.equal(stats.hardSolved, 1);
    assert.equal(stats.completionRate, 4 / 150);
    assert.ok(stats.topicProgress["Arrays"].solved >= 2);
  });
});

describe("3. Topic Canonicalization & HashMap Aliasing", () => {
  test("maps hashmap variations cleanly to HashMap", () => {
    assert.equal(canonicalDsaTopic("hashmap"), "HashMap");
    assert.equal(canonicalDsaTopic("HashMap"), "HashMap");
    assert.equal(canonicalDsaTopic("Hash Map"), "HashMap");
    assert.equal(canonicalDsaTopic("Hash Table"), "HashMap");
    assert.equal(canonicalDsaTopic("Arrays & Hashing"), "HashMap");
    assert.equal(canonicalDsaTopic("hashing"), "HashMap");
  });

  test("isSameDsaTopic correctly aliases HashMap and Hashing", () => {
    assert.equal(isSameDsaTopic("hashmap", "HashMap"), true);
    assert.equal(isSameDsaTopic("hashmap", "Hashing"), true);
    assert.equal(isSameDsaTopic("Hash Table", "HashMap"), true);
    assert.equal(isSameDsaTopic("Arrays & Hashing", "HashMap"), true);
    assert.equal(isSameDsaTopic("Arrays", "Strings"), false);
  });
});
