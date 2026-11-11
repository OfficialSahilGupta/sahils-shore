// ============================================================================
// Sahil's Shore: Phase 6 Unit Tests - DSA Tracker & Full-Stack Learning Hub
// Covers: Spaced repetition (1, 3, 7, 14, 30 days), weak topic detection,
// DSA streaks & daily goals, roadmap progress math, and mock interview logic
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNextRevision,
  isDueForRevision,
  detectWeakTopics,
  calculateTopicProgress,
  calculateDifficultySplit,
  calculateDsaStreak,
} from "../lib/dsa/index.ts";
import {
  calculateRoadmapProgress,
  calculateDynamicTrackMastery,
  selectMockInterviewQuestions,
  PRESET_TRACK_TEMPLATES,
  parseTopicSubSections,
  packTopicSubSections,
  type TopicSubSection,
  createRoadmapItem,
  isValidUUID,
  updateRoadmapItem,
  deleteRoadmapItem,
  reorderLearningItems,
  hasExplicitSubTopics,
  getTopicChapterNotes,
} from "../lib/learning/index.ts";
import { todayIST, yesterdayIST } from "../lib/date-utils.ts";
import type { DsaProblem, LearningItem, InterviewQa, LearningConcept, Project } from "../types/index.ts";

describe("1. Spaced Repetition (1, 3, 7, 14, 30 days) Ladder", () => {
  const baseDate = new Date("2026-11-02T10:00:00Z");

  test("rating Easy advances through the exact ladder: 1 -> 3 -> 7 -> 14 -> 30", () => {
    // 1 -> 3
    const step1 = calculateNextRevision(1, "Easy", baseDate);
    assert.equal(step1.nextIntervalDays, 3);
    const date1 = new Date(step1.nextRevisionDateUTC);
    assert.equal(date1.getUTCDate(), baseDate.getUTCDate() + 3);

    // 3 -> 7
    const step2 = calculateNextRevision(3, "Easy", baseDate);
    assert.equal(step2.nextIntervalDays, 7);

    // 7 -> 14
    const step3 = calculateNextRevision(7, "Easy", baseDate);
    assert.equal(step3.nextIntervalDays, 14);

    // 14 -> 30
    const step4 = calculateNextRevision(14, "Easy", baseDate);
    assert.equal(step4.nextIntervalDays, 30);

    // 30 -> caps at 30
    const step5 = calculateNextRevision(30, "Easy", baseDate);
    assert.equal(step5.nextIntervalDays, 30);
  });

  test("rating Hard drops interval back to 1 day from any stage", () => {
    const from3 = calculateNextRevision(3, "Hard", baseDate);
    assert.equal(from3.nextIntervalDays, 1);

    const from14 = calculateNextRevision(14, "Hard", baseDate);
    assert.equal(from14.nextIntervalDays, 1);

    const from30 = calculateNextRevision(30, "Hard", baseDate);
    assert.equal(from30.nextIntervalDays, 1);
  });

  test("isDueForRevision accurately flags overdue and needs_revision problems", () => {
    const todayISTStr = "2026-11-02";

    // 1. Due today
    const p1 = {
      id: "p1",
      user_id: "u1",
      title: "Two Sum",
      difficulty: "Easy",
      status: "Solved",
      next_revision_at: "2026-11-02T06:00:00Z",
      revision_interval_days: 1,
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p1, todayISTStr), true);

    // 2. Future revision (e.g. 5 days from now)
    const p2 = {
      id: "p2",
      user_id: "u1",
      title: "LRU Cache",
      difficulty: "Medium",
      status: "Solved",
      next_revision_at: "2026-11-08T06:00:00Z",
      revision_interval_days: 7,
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p2, todayISTStr), false);

    // 3. Status 'Needs revision' is always due regardless of date
    const p3 = {
      id: "p3",
      user_id: "u1",
      title: "N-Queens",
      difficulty: "Hard",
      status: "Needs revision",
      next_revision_at: "2026-11-20T00:00:00Z",
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p3, todayISTStr), true);

    // 4. Status 'Revisit' is always due
    const p4 = {
      id: "p4",
      user_id: "u1",
      title: "Alien Dictionary",
      difficulty: "Hard",
      status: "Revisit",
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p4, todayISTStr), true);
  });
});

describe("2. Weak-Topic Detection Algorithm", () => {
  test("identifies topics with problems marked 'Needs revision' or 'Stuck'", () => {
    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "Course Schedule",
        topic: "Graphs",
        difficulty: "Medium",
        status: "Needs revision",
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "Clone Graph",
        topic: "Graphs",
        difficulty: "Medium",
        status: "Stuck",
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "Two Sum",
        topic: "Arrays",
        difficulty: "Easy",
        status: "Solved",
      } as unknown as DsaProblem,
    ];

    const reports = detectWeakTopics(problems);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].topic, "Graphs");
    assert.equal(reports[0].needsRevision, 1);
    assert.equal(reports[0].stuck, 1);
    assert.ok(reports[0].reason.includes("stuck problem"));
  });

  test("identifies topics with low solve rate (< 50%) when multiple attempted", () => {
    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "Coin Change",
        topic: "DP",
        difficulty: "Medium",
        status: "attempted",
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "Longest Increasing Subsequence",
        topic: "DP",
        difficulty: "Medium",
        status: "attempted",
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "Climbing Stairs",
        topic: "DP",
        difficulty: "Easy",
        status: "Solved",
      } as unknown as DsaProblem,
    ];

    const reports = detectWeakTopics(problems);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].topic, "DP");
    assert.equal(reports[0].total, 3);
    assert.equal(reports[0].solved, 1);
    assert.equal(Math.round(reports[0].solveRate * 100), 33);
  });
});

describe("3. Topic Progress & Difficulty Breakdown", () => {
  test("aggregates total, solved, and calculates difficulty split accurately", () => {
    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "P1",
        topic: "Arrays",
        difficulty: "Easy",
        status: "Solved",
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "P2",
        topic: "Arrays",
        difficulty: "Medium",
        status: "Solved",
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "P3",
        topic: "Trees",
        difficulty: "Hard",
        status: "Needs revision",
      } as unknown as DsaProblem,
    ];

    const topicProgress = calculateTopicProgress(problems);
    const arraysStat = topicProgress.find((t) => t.topic === "Arrays");
    assert.ok(arraysStat);
    assert.equal(arraysStat.total, 2);
    assert.equal(arraysStat.solved, 2);

    const treesStat = topicProgress.find((t) => t.topic === "Trees");
    assert.ok(treesStat);
    assert.equal(treesStat.total, 1);
    assert.equal(treesStat.needsRevision, 1);

    const diffSplit = calculateDifficultySplit(problems);
    assert.equal(diffSplit.Easy, 1);
    assert.equal(diffSplit.Medium, 1);
    assert.equal(diffSplit.Hard, 1);
    assert.equal(diffSplit.total, 3);
  });
});

describe("4. DSA Streak & Daily Goal Engine", () => {
  test("calculates today's solved count and active daily goal", () => {
    const today = todayIST();
    const yesterday = yesterdayIST();

    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "P1",
        status: "Solved",
        updated_at: `${today}T10:00:00Z`,
        created_at: `${today}T10:00:00Z`,
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "P2",
        status: "Solved",
        updated_at: `${today}T12:00:00Z`,
        created_at: `${today}T12:00:00Z`,
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "P3",
        status: "Solved",
        updated_at: `${yesterday}T14:00:00Z`,
        created_at: `${yesterday}T14:00:00Z`,
      } as unknown as DsaProblem,
    ];

    const info = calculateDsaStreak(problems, 2);
    assert.equal(info.todaySolvedCount, 2);
    assert.equal(info.isDailyGoalMet, true);
    assert.equal(info.currentStreak, 2);
  });
});

describe("5. Full-Stack Roadmap Progress Calculations", () => {
  test("calculates completed, in_progress, and percentage accurately", () => {
    const items: LearningItem[] = [
      { id: "1", topic: "T1", status: "completed" } as LearningItem,
      { id: "2", topic: "T2", status: "completed" } as LearningItem,
      { id: "3", topic: "T3", status: "in_progress" } as LearningItem,
      { id: "4", topic: "T4", status: "planned" } as LearningItem,
    ];

    const progress = calculateRoadmapProgress(items);
    assert.equal(progress.total, 4);
    assert.equal(progress.completed, 2);
    assert.equal(progress.inProgress, 1);
    assert.equal(progress.planned, 1);
    assert.equal(progress.percentage, 50);
  });

  test("handles empty items gracefully", () => {
    const progress = calculateRoadmapProgress([]);
    assert.equal(progress.total, 0);
    assert.equal(progress.percentage, 0);
  });
});

describe("6. Mock Interview Randomizer & Weighting", () => {
  test("selects mock interview questions and prioritizes lower confidence", () => {
    const questions: InterviewQa[] = [
      { id: "1", question: "Q1", technology: "Java", confidence: 1 } as InterviewQa,
      { id: "2", question: "Q2", technology: "Spring", confidence: 2 } as InterviewQa,
      { id: "3", question: "Q3", technology: "Docker", confidence: 5 } as InterviewQa,
      { id: "4", question: "Q4", technology: "SQL", confidence: 5 } as InterviewQa,
    ];

    const selected = selectMockInterviewQuestions(questions, 2);
    assert.equal(selected.length, 2);
    // Lower confidence questions have significantly higher score weight
    const ids = selected.map((q) => q.id);
    assert.ok(ids.includes("1") || ids.includes("2"));
  });
});

describe("7. Dynamic Track Mastery Calculation Engine", () => {
  test("returns 0 score and Beginner tier for empty items and resources", () => {
    const mastery = calculateDynamicTrackMastery([], [], [], []);
    assert.equal(mastery.overallScore, 0);
    assert.equal(mastery.curriculumScore, 0);
    assert.equal(mastery.projectsScore, 0);
    assert.equal(mastery.conceptsScore, 0);
    assert.equal(mastery.interviewScore, 0);
    assert.equal(mastery.masteryTier, "Beginner");
  });

  test("boosts mastery above 0% when user writes notes on planned/in_progress topics", () => {
    const items: LearningItem[] = [
      {
        id: "1",
        topic: "CAP Theorem",
        status: "in_progress",
        notes: "Detailed architecture analysis of network partitions and consistency tradeoffs between AP and CP.",
      } as LearningItem,
      {
        id: "2",
        topic: "Distributed Transactions",
        status: "planned",
        notes: "Saga pattern with orchestrator vs choreography, compensating transactions.",
      } as LearningItem,
      {
        id: "3",
        topic: "Event Sourcing",
        status: "planned",
        notes: "",
      } as LearningItem,
    ];

    const mastery = calculateDynamicTrackMastery(items, [], [], []);
    assert.ok(mastery.overallScore > 0, "Mastery score should be greater than 0% even with 0 completed topics");
    assert.equal(mastery.topicsNoted, 2);
    assert.equal(mastery.topicsInProgress, 1);
    assert.equal(mastery.topicsMastered, 0);
    assert.ok(["Apprentice", "Practitioner"].includes(mastery.masteryTier));
  });

  test("computes balanced multi-pillar mastery across curriculum, projects, concepts, and interviews", () => {
    const items: LearningItem[] = [
      { id: "1", topic: "T1", status: "completed", notes: "Solid foundation notes" } as LearningItem,
      { id: "2", topic: "T2", status: "completed", notes: "Implementation details" } as LearningItem,
      { id: "3", topic: "T3", status: "in_progress", notes: "Working on it" } as LearningItem,
      { id: "4", topic: "T4", status: "planned", notes: "" } as LearningItem,
    ];

    const concepts: LearningConcept[] = [
      { id: "c1", title: "Virtual Nodes", notes: "Hashing ring distribution" } as LearningConcept,
      { id: "c2", title: "Write-Ahead Log", notes: "Durability in databases" } as LearningConcept,
      { id: "c3", title: "Two-Phase Commit", notes: "Coordinator and participants" } as LearningConcept,
    ];

    const projects: Project[] = [
      { id: "p1", title: "Distributed KV Store", status: "deployed", tech_stack: ["Go", "Raft"] } as Project,
    ];

    const questions: InterviewQa[] = [
      { id: "q1", question: "Explain Paxos vs Raft", technology: "Distributed Systems", confidence: 4, last_practiced_at: "2026-11-05T12:00:00Z" } as InterviewQa,
      { id: "q2", question: "How does Redis Cluster shard keys?", technology: "Redis", confidence: 5, last_practiced_at: "2026-11-05T12:00:00Z" } as InterviewQa,
    ];

    const mastery = calculateDynamicTrackMastery(items, concepts, projects, questions);
    assert.ok(mastery.curriculumScore > 0);
    assert.equal(mastery.projectsScore, 60); // 1 deployed project = 60
    assert.equal(mastery.conceptsScore, 60); // 3 concepts * 20 = 60
    assert.equal(mastery.interviewScore, 90); // (4 + 5) / (2 * 5) * 100 = 90%
    assert.ok(mastery.overallScore >= 55);
    assert.ok(["Practitioner", "Advanced"].includes(mastery.masteryTier));
  });

  test("assigns Staff Ready tier when comprehensive mastery reaches 85%+", () => {
    const items: LearningItem[] = [
      { id: "1", topic: "T1", status: "completed", notes: "In-depth notes" } as LearningItem,
      { id: "2", topic: "T2", status: "completed", notes: "In-depth notes" } as LearningItem,
    ];

    const concepts: LearningConcept[] = [
      { id: "c1", title: "C1" } as LearningConcept,
      { id: "c2", title: "C2" } as LearningConcept,
      { id: "c3", title: "C3" } as LearningConcept,
      { id: "c4", title: "C4" } as LearningConcept,
      { id: "c5", title: "C5" } as LearningConcept,
    ];

    const projects: Project[] = [
      { id: "p1", title: "P1", status: "deployed" } as Project,
      { id: "p2", title: "P2", status: "completed" } as Project,
    ];

    const questions: InterviewQa[] = [
      { id: "q1", question: "Q1", technology: "System Design", confidence: 5, last_practiced_at: "2026-11-05T12:00:00Z" } as InterviewQa,
      { id: "q2", question: "Q2", technology: "System Design", confidence: 5, last_practiced_at: "2026-11-05T12:00:00Z" } as InterviewQa,
    ];

    const mastery = calculateDynamicTrackMastery(items, concepts, projects, questions);
    assert.ok(mastery.overallScore >= 85);
    assert.equal(mastery.masteryTier, "Staff Ready");
  });

  test("returns 0% mastery for unstarted track with unpracticed questions and planned topics", () => {
    const items: LearningItem[] = [
      { id: "1", topic: "Spring Core", status: "planned", notes: "Syllabus outline text" } as LearningItem,
      { id: "2", topic: "Spring Boot", status: "planned", notes: "Syllabus outline text" } as LearningItem,
    ];
    const questions: InterviewQa[] = [
      { id: "q1", question: "Q1", confidence: 3, last_practiced_at: null } as InterviewQa,
    ];
    const mastery = calculateDynamicTrackMastery(items, [], [], questions);
    assert.equal(mastery.overallScore, 0);
    assert.equal(mastery.interviewScore, 0);
    assert.equal(mastery.masteryTier, "Beginner");
  });
});

describe("8. Preset Track Templates Integrity", () => {
  test("contains all required preset tracks with populated roadmaps", () => {
    assert.equal(PRESET_TRACK_TEMPLATES.length, 3);
    const slugs = PRESET_TRACK_TEMPLATES.map((t) => t.slug);
    assert.ok(slugs.includes("system-design"));
    assert.ok(slugs.includes("devops-cloud"));
    assert.ok(slugs.includes("golang-backend"));

    for (const template of PRESET_TRACK_TEMPLATES) {
      assert.ok(template.title.length > 5);
      assert.ok(template.description.length > 10);
      assert.ok(template.icon.length > 0);
      assert.ok(template.color.startsWith("#"));
      assert.ok(template.roadmap.length >= 6);
      for (const topic of template.roadmap) {
        assert.ok(topic.topic.length > 3);
        assert.ok(topic.category.length > 2);
      }
    }
  });
});

describe("9. Topic Sub-Sections Parser & Serializer", () => {
  test("synthesizes default sub-section from legacy flat notes and resources without data loss", () => {
    const legacyItem = {
      notes: "Legacy architecture notes on Redis caching and cache stampede.",
      resources: [
        { title: "Redis Docs", url: "https://redis.io/docs" },
        { code_snippet: "const client = createClient();", language: "typescript" },
      ],
      status: "in_progress",
    } as unknown as LearningItem;

    const subSections = parseTopicSubSections(legacyItem);
    assert.equal(subSections.length, 1);
    assert.equal(subSections[0].title, "Overview & Core Architecture");
    assert.equal(subSections[0].notes, legacyItem.notes);
    assert.equal(subSections[0].codeSnippet, "const client = createClient();");
    assert.equal(subSections[0].codeLanguage, "typescript");
    assert.equal(subSections[0].resources.length, 1);
    assert.equal(subSections[0].resources[0].title, "Redis Docs");
    assert.equal(subSections[0].resources[0].url, "https://redis.io/docs");
  });

  test("parses packed multi-section JSON preserving notes, code, languages, and links", () => {
    const packedItem = {
      notes: "Combined markdown preview text...",
      resources: {
        category: "Caching",
        subsections: [
          {
            id: "sub-1",
            title: "Cache-Aside Pattern",
            notes: "Application directly talks to cache and database.",
            codeSnippet: "public Object get(String key) { ... }",
            codeLanguage: "java",
            resources: [{ title: "Cache Aside RFC", url: "https://example.com/cache" }],
            isCompleted: true,
          },
          {
            id: "sub-2",
            title: "Redis Eviction & LRU",
            notes: "maxmemory-policy volatile-lru vs allkeys-lru trade-offs.",
            codeSnippet: "CONFIG SET maxmemory-policy allkeys-lru",
            codeLanguage: "sql",
            resources: [{ title: "Redis Memory", url: "https://redis.io/memory" }],
            isCompleted: false,
          },
        ],
      },
      status: "in_progress",
    } as unknown as LearningItem;

    const subSections = parseTopicSubSections(packedItem);
    assert.equal(subSections.length, 2);
    assert.equal(subSections[0].id, "sub-1");
    assert.equal(subSections[0].title, "Cache-Aside Pattern");
    assert.equal(subSections[0].isCompleted, true);
    assert.equal(subSections[0].codeLanguage, "java");
    assert.equal(subSections[1].id, "sub-2");
    assert.equal(subSections[1].title, "Redis Eviction & LRU");
    assert.equal(subSections[1].isCompleted, false);
    assert.equal(subSections[1].codeLanguage, "sql");
  });

  test("packTopicSubSections creates valid synthesized markdown and packed JSON", () => {
    const subs: TopicSubSection[] = [
      {
        id: "s1",
        title: "Architecture & Core Model",
        notes: "Detailed architecture explanation here.",
        codeSnippet: "function test() { return 42; }",
        codeLanguage: "typescript",
        resources: [{ title: "MDN", url: "https://developer.mozilla.org" }],
        isCompleted: true,
      },
      {
        id: "s2",
        title: "Edge Cases & Gotchas",
        notes: "Beware of connection leak when timeout occurs.",
        codeSnippet: "",
        codeLanguage: "java",
        resources: [],
        isCompleted: false,
      },
    ];

    const packed = packTopicSubSections(subs, "Distributed Systems");
    assert.ok(packed.notes.includes("### Architecture & Core Model"));
    assert.ok(packed.notes.includes("### Edge Cases & Gotchas"));
    assert.ok(packed.notes.includes("```typescript"));
    assert.ok(packed.notes.includes("https://developer.mozilla.org"));

    const json = packed.resources as any;
    assert.equal(json.category, "Distributed Systems");
    assert.equal(json.subsections.length, 2);
    assert.equal(json.links.length, 1);
  });

  test("boosts track mastery when sub-sections are completed within in_progress topics", () => {
    const itemWithSubsections = {
      id: "item-1",
      topic: "Caching Strategies",
      status: "in_progress",
      notes: "Combined notes...",
      resources: {
        subsections: [
          {
            id: "s1",
            title: "Sub 1",
            notes: "Notes 1 with rich content exceeding 30 characters.",
            codeSnippet: "code 1",
            codeLanguage: "java",
            resources: [],
            isCompleted: true,
          },
          {
            id: "s2",
            title: "Sub 2",
            notes: "Notes 2 with rich content exceeding 30 characters.",
            codeSnippet: "code 2",
            codeLanguage: "java",
            resources: [],
            isCompleted: true,
          },
          {
            id: "s3",
            title: "Sub 3",
            notes: "Notes 3 in progress.",
            codeSnippet: "",
            codeLanguage: "java",
            resources: [],
            isCompleted: false,
          },
        ],
      },
    } as unknown as LearningItem;

    const mastery = calculateDynamicTrackMastery([itemWithSubsections], [], [], []);
    assert.ok(mastery.overallScore > 0);
    assert.ok(
      mastery.curriculumScore >= 75,
      `Curriculum score (${mastery.curriculumScore}) should be rewarded for 2/3 completed sub-sections`
    );
  });
});

describe("10. Resilient Learning Track Creation & Custom Track Isolation", () => {
  test("generates slug and guaranteed fallback track if database insert fails or runs offline", async () => {
    // Mock failing supabase client
    const mockFailingSupabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: "Network connection refused" } }),
          }),
        }),
      }),
    } as any;

    const { createLearningTrack } = await import("../lib/learning/index.ts");
    const track = await createLearningTrack(mockFailingSupabase, "user-test-123", {
      title: "Distributed Systems & Kubernetes",
      description: "Consensus, raft, etcd and cluster operations",
      icon: "Server",
      color: "#1F7A8C",
    });

    assert.ok(track);
    assert.equal(track.title, "Distributed Systems & Kubernetes");
    assert.equal(track.slug, "distributed-systems-kubernetes");
    assert.equal(track.icon, "Server");
    assert.ok(track.id.startsWith("track-"));
    assert.equal(track.user_id, "user-test-123");
  });

  test("derives clean kebab-case slugs from diverse track titles", async () => {
    const { createLearningTrack } = await import("../lib/learning/index.ts");
    const mockSupabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: "Mock error" } }),
          }),
        }),
      }),
    } as any;

    const t1 = await createLearningTrack(mockSupabase, "u1", { title: "AI & Large Language Models!" });
    assert.equal(t1?.slug, "ai-large-language-models");

    const t2 = await createLearningTrack(mockSupabase, "u1", { title: "Rust / Systems Programming" });
    assert.equal(t2?.slug, "rust-systems-programming");
  });
});

describe("11. Resilient Roadmap Topic Creation (createRoadmapItem)", () => {
  test("isValidUUID correctly identifies valid and invalid UUID strings", () => {
    assert.equal(isValidUUID("550e8400-e29b-41d4-a716-446655440000"), true);
    assert.equal(isValidUUID("preview-spring"), false);
    assert.equal(isValidUUID("custom-1730000000"), false);
    assert.equal(isValidUUID(null), false);
    assert.equal(isValidUUID(undefined), false);
    assert.equal(isValidUUID(""), false);
  });

  test("creates roadmap item with primary enhanced columns when supported", async () => {
    const mockSupabase = {
      from: (table: string) => ({
        insert: (payload: any) => ({
          select: () => ({
            single: async () => ({
              data: {
                id: "550e8400-e29b-41d4-a716-446655440001",
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const item = await createRoadmapItem(mockSupabase, "550e8400-e29b-41d4-a716-446655440002", {
      track_id: "550e8400-e29b-41d4-a716-446655440003",
      topic: "Distributed Tracing & OpenTelemetry",
      category: "Observability",
      notes: "Jaeger, Zipkin, OTLP collectors, and W3C TraceContext propagation.",
      status: "in_progress",
      order_index: 16,
    });

    assert.ok(item);
    assert.equal(item.id, "550e8400-e29b-41d4-a716-446655440001");
    assert.equal(item.topic, "Distributed Tracing & OpenTelemetry");
    assert.equal(item.category, "Observability");
    assert.equal(item.status, "in_progress");
    assert.equal(item.order_index, 16);
    assert.ok(item.resources);
  });

  test("falls back cleanly to base schema columns when order_index or category are not present", async () => {
    let callCount = 0;
    const mockSupabase = {
      from: (table: string) => ({
        insert: (payload: any) => {
          callCount++;
          if (callCount === 1) {
            // First call fails because category or order_index column does not exist
            return {
              select: () => ({
                single: async () => ({
                  data: null,
                  error: { message: 'column "category" of relation "learning_items" does not exist' },
                }),
              }),
            };
          }
          // Second call (fallback) succeeds without those columns
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: "550e8400-e29b-41d4-a716-446655440010",
                  ...payload,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          };
        },
      }),
    } as any;

    const item = await createRoadmapItem(mockSupabase, "550e8400-e29b-41d4-a716-446655440002", {
      track_id: "550e8400-e29b-41d4-a716-446655440003",
      topic: "Kafka Partition Rebalancing & Consumer Groups",
      category: "Messaging",
      notes: "Eager vs Cooperative Sticky Assignor protocols.",
      status: "planned",
      order_index: 17,
    });

    assert.ok(item);
    assert.equal(item.topic, "Kafka Partition Rebalancing & Consumer Groups");
    assert.equal(item.category, "Messaging");
    assert.equal(item.order_index, 17);
    assert.equal(callCount, 2);
  });

  test("generates guaranteed deterministic local item if database insert fails or runs offline", async () => {
    const mockFailingSupabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: "Network connection refused" } }),
          }),
        }),
      }),
    } as any;

    const item = await createRoadmapItem(mockFailingSupabase, "preview", {
      track_id: "preview-spring",
      topic: "Spring Cloud Gateway & Resilience4j Circuit Breakers",
      category: "Microservices",
      status: "planned",
    });

    assert.ok(item);
    assert.ok(item.id.startsWith("item-"));
    assert.equal(item.topic, "Spring Cloud Gateway & Resilience4j Circuit Breakers");
    assert.equal(item.category, "Microservices");
    assert.equal(item.status, "planned");
    // Verify standard subsections packed
    const res = item.resources as any;
    assert.ok(res.subsections);
    assert.equal(res.subsections.length, 1);
    assert.equal(res.subsections[0].title, "Overview & Core Architecture");
  });
});

describe("12. Curriculum Growth Beyond 16 Topics & Dynamic Mastery Recalculation", () => {
  test("mastery score formula smoothly incorporates 17+ topics without degradation", () => {
    // 16 default Spring topics
    const baselineItems: LearningItem[] = Array.from({ length: 16 }, (_, idx) => ({
      id: `item-${idx}`,
      user_id: "u1",
      track_id: "t1",
      topic: `Topic ${idx + 1}`,
      status: idx < 8 ? "completed" : idx < 12 ? "in_progress" : "planned",
      notes: idx < 8 ? "Rich completed architecture notes..." : "",
      resources: [],
      order_index: idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as LearningItem));

    const baselineMastery = calculateDynamicTrackMastery(baselineItems, [], [], []);
    assert.equal(baselineMastery.topicsTotal, 16);
    assert.equal(baselineMastery.topicsMastered, 8);
    assert.equal(baselineMastery.topicsInProgress, 4);

    // Add topic #17 (newly added user topic)
    const newTopic17: LearningItem = {
      id: "item-16",
      user_id: "u1",
      track_id: "t1",
      topic: "Apache Kafka Event Streaming",
      status: "completed",
      notes: "Producers, consumer groups, partition keys, compaction.",
      resources: [],
      order_index: 16,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as LearningItem;

    const expandedItems = [...baselineItems, newTopic17];
    const expandedMastery = calculateDynamicTrackMastery(expandedItems, [], [], []);

    assert.equal(expandedMastery.topicsTotal, 17);
    assert.equal(expandedMastery.topicsMastered, 9);
    assert.ok(
      expandedMastery.overallScore >= baselineMastery.overallScore,
      "Adding and mastering topic #17 should increase overall mastery score"
    );
  });
});

describe("8. Topic Position Switching & Reordering Engine", () => {
  const sampleTopics: LearningItem[] = [
    { id: "t1", topic: "Spring Boot Basics", order_index: 0 } as any,
    { id: "t2", topic: "Spring Data JPA", order_index: 1 } as any,
    { id: "t3", topic: "Spring Security", order_index: 2 } as any,
    { id: "t4", topic: "Microservices", order_index: 3 } as any,
    { id: "t5", topic: "Spring Intro", order_index: 4 } as any,
  ];

  test("moving a custom topic (e.g. 'Spring Intro') from last to 1st automatically shifts all other topics down", () => {
    // Move topic 'Spring Intro' at index 4 to index 0 (Position #1)
    const reordered = reorderLearningItems(sampleTopics, 4, 0);

    assert.equal(reordered.length, 5);
    assert.equal(reordered[0].topic, "Spring Intro");
    assert.equal(reordered[0].order_index, 0);

    assert.equal(reordered[1].topic, "Spring Boot Basics");
    assert.equal(reordered[1].order_index, 1);

    assert.equal(reordered[2].topic, "Spring Data JPA");
    assert.equal(reordered[2].order_index, 2);

    assert.equal(reordered[3].topic, "Spring Security");
    assert.equal(reordered[3].order_index, 3);

    assert.equal(reordered[4].topic, "Microservices");
    assert.equal(reordered[4].order_index, 4);
  });

  test("moving a topic up one slot swaps positions with predecessor", () => {
    // Move 'Spring Security' (index 2) up to index 1
    const reordered = reorderLearningItems(sampleTopics, 2, 1);

    assert.equal(reordered[1].topic, "Spring Security");
    assert.equal(reordered[1].order_index, 1);
    assert.equal(reordered[2].topic, "Spring Data JPA");
    assert.equal(reordered[2].order_index, 2);
  });

  test("moving a topic down one slot swaps positions with successor", () => {
    // Move 'Spring Boot Basics' (index 0) down to index 1
    const reordered = reorderLearningItems(sampleTopics, 0, 1);

    assert.equal(reordered[0].topic, "Spring Data JPA");
    assert.equal(reordered[0].order_index, 0);
    assert.equal(reordered[1].topic, "Spring Boot Basics");
    assert.equal(reordered[1].order_index, 1);
  });

  test("edge cases: out-of-bounds or same-index moves return unchanged list safely", () => {
    const noopSame = reorderLearningItems(sampleTopics, 2, 2);
    assert.deepEqual(noopSame, sampleTopics);

    const noopNegative = reorderLearningItems(sampleTopics, -1, 2);
    assert.deepEqual(noopNegative, sampleTopics);

    const noopBeyond = reorderLearningItems(sampleTopics, 1, 99);
    assert.deepEqual(noopBeyond, sampleTopics);
  });
});

describe("14. Sub-Topic Differentiation & Chapter Notes Handling", () => {
  test("returns false for legacy items without subsections in resources", () => {
    const item = {
      topic: "Spring Boot Basics",
      notes: "Direct notes without subsections array.",
      resources: [],
    } as unknown as LearningItem;

    assert.equal(hasExplicitSubTopics(item), false);
  });

  test("returns false for items with single default 'Overview & Core Architecture' subsection", () => {
    const item = {
      topic: "Spring Boot Actuator",
      notes: "Metrics and health endpoints.",
      resources: {
        category: "Monitoring",
        subsections: [
          {
            id: "sub-1",
            title: "Overview & Core Architecture",
            notes: "Metrics and health endpoints.",
            codeSnippet: "",
            resources: [],
          },
        ],
      },
    } as unknown as LearningItem;

    assert.equal(hasExplicitSubTopics(item), false);
  });

  test("returns false when single subsection title matches the topic title", () => {
    const item = {
      topic: "Spring Security Filters",
      notes: "Filter chain architecture.",
      resources: {
        category: "Security",
        subsections: [
          {
            id: "sub-1",
            title: "Spring Security Filters",
            notes: "Filter chain architecture.",
            codeSnippet: "",
            resources: [],
          },
        ],
      },
    } as unknown as LearningItem;

    assert.equal(hasExplicitSubTopics(item), false);
  });

  test("returns true for items with multiple explicit sub-sections", () => {
    const item = {
      topic: "Spring Boot Architecture",
      notes: "Multi-chapter study.",
      resources: {
        category: "Architecture",
        subsections: [
          {
            id: "sub-1",
            title: "Bean Lifecycle & Scopes",
            notes: "Singleton vs Prototype scopes.",
            codeSnippet: "",
            resources: [],
          },
          {
            id: "sub-2",
            title: "Auto-Configuration Internals",
            notes: "@EnableAutoConfiguration and spring.factories.",
            codeSnippet: "",
            resources: [],
          },
        ],
      },
    } as unknown as LearningItem;

    assert.equal(hasExplicitSubTopics(item), true);
  });

  test("returns true for single subsection if user gave it a custom, non-default sub-topic title", () => {
    const item = {
      topic: "Spring Boot",
      notes: "Specific sub-topic.",
      resources: {
        category: "Core",
        subsections: [
          {
            id: "sub-1",
            title: "Custom ConditionalOnProperty Annotations",
            notes: "Creating custom condition matchers.",
            codeSnippet: "",
            resources: [],
          },
        ],
      },
    } as unknown as LearningItem;

    assert.equal(hasExplicitSubTopics(item), true);
  });

  test("getTopicChapterNotes extracts notes from primary subsection or root notes safely", () => {
    const itemWithSubNote = {
      topic: "Kafka",
      notes: "Root note",
      resources: {
        subsections: [
          {
            id: "sub-1",
            title: "Core Kafka",
            notes: "Partition and offset management details.",
            codeSnippet: "",
            resources: [],
          },
        ],
      },
    } as unknown as LearningItem;

    assert.equal(getTopicChapterNotes(itemWithSubNote), "Partition and offset management details.");

    const itemWithoutSubNote = {
      topic: "Kafka",
      notes: "Fallback root note.",
      resources: {},
    } as unknown as LearningItem;

    assert.equal(getTopicChapterNotes(itemWithoutSubNote), "Fallback root note.");
    assert.equal(getTopicChapterNotes(null), "");
  });
});



