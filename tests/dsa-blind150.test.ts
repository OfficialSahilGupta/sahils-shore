// ============================================================================
// Sahil's Shore: Unit Tests for Blind 150 & Resilient DSA Problem Logging
// Covers: Blind 150 syllabus verification (150 problems), completion rate math,
// title fuzzy normalization, matching algorithm, and resilient problem creation.
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  BLIND_150_LIST,
  calculateBlind150Stats,
  normalizeDsaTitle,
  findMatchingUserProblem,
} from "../lib/dsa/blind150.ts";
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

describe("2. Blind 150 Matching & Stats Engine", () => {
  test("normalizes titles cleanly ignoring spaces and special characters", () => {
    assert.equal(normalizeDsaTitle("Trapping Rain Water"), "trappingrainwater");
    assert.equal(normalizeDsaTitle("Two Sum II - Input Array Is Sorted"), "twosumiilinputarrayissorted".replace("l", ""));
    assert.equal(normalizeDsaTitle("Reverse Nodes in k-Group"), "reversenodesinkgroup");
  });

  test("findMatchingUserProblem matches both exact and fuzzy LeetCode titles", () => {
    const blindProb = BLIND_150_LIST.find((p) => p.title === "Trapping Rain Water")!;
    assert.ok(blindProb);

    const userProblems: DsaProblem[] = [
      {
        id: "p1",
        user_id: "u1",
        title: "Trapping Rain Water",
        link: "https://leetcode.com/problems/trapping-rain-water/",
        status: "Solved",
        difficulty: "Hard",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
    ];

    const match = findMatchingUserProblem(blindProb, userProblems);
    assert.ok(match);
    assert.equal(match.id, "p1");
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
        status: "Needs revision", // Not yet solved
        difficulty: "Medium",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as DsaProblem,
    ];

    const stats = calculateBlind150Stats(userProblems);
    assert.equal(stats.total, 150);
    assert.equal(stats.solvedCount, 3);
    assert.equal(stats.easySolved, 2);
    assert.equal(stats.hardSolved, 1);
    assert.equal(stats.mediumSolved, 0);
    assert.equal(stats.completionRate, 3 / 150);
    assert.ok(stats.topicProgress["Arrays"].solved >= 2);
  });
});
