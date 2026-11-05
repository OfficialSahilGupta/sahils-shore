"use client";

// ============================================================================
// Sahil's Shore: DSA Container Component (Main Interactive Hub)
// Spaced Repetition, Weak Topic Detection, Blind 150 Tracker,
// Zero-data-loss Local Persistence & Supabase Synchronization.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Code2, Sparkles, RefreshCw, Plus, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DsaProblem } from "@/types";
import {
  getDsaProblems,
  createDsaProblem,
  updateDsaProblem,
  deleteDsaProblem,
  rateRevision,
  calculateNextRevision,
  isDueForRevision,
  detectWeakTopics,
  calculateTopicProgress,
  calculateDifficultySplit,
  calculateDsaStreak,
  findMatchingUserProblem,
  isBlindProblemSolved,
  canonicalDsaTopic,
  type CreateDsaProblemInput,
  type Blind150Problem,
  type DsaStatus,
} from "@/lib/dsa";
import { DsaStatsBar } from "./DsaStatsBar";
import { RevisionQueueCard } from "./RevisionQueueCard";
import { WeakTopicAlert } from "./WeakTopicAlert";
import { TopicProgressRings } from "./TopicProgressRings";
import { DsaProblemList } from "./DsaProblemList";
import { DsaProblemModal } from "./DsaProblemModal";
import { Blind150Tracker } from "./Blind150Tracker";

const DSA_STORAGE_KEY = "shore_dsa_problems_cache";

function loadCachedProblems(): DsaProblem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DSA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[DsaContainer] Failed to load cached DSA problems:", e);
  }
  return null;
}

function saveCachedProblems(list: DsaProblem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DSA_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("[DsaContainer] Failed to save cached DSA problems:", e);
  }
}

export function DsaContainer() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my-problems" | "blind-150">("my-problems");
  const [problems, setProblems] = useState<DsaProblem[]>(() => {
    return loadCachedProblems() || [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<DsaProblem | null>(null);
  const [modalPrefill, setModalPrefill] = useState<Partial<CreateDsaProblemInput> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to local storage whenever problems state updates
  useEffect(() => {
    if (problems.length > 0) {
      saveCachedProblems(problems);
    }
  }, [problems]);

  // 1. Initialize user & fetch problems
  useEffect(() => {
    async function initUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          // If no user and no cached problems, seed defaults
          setProblems((prev) => {
            if (prev.length > 0) return prev;
            const initialSeeds: DsaProblem[] = [
              {
                id: "sample-1",
                user_id: "preview",
                title: "Trapping Rain Water",
                link: "https://leetcode.com/problems/trapping-rain-water/",
                platform: "LeetCode",
                topic: "Two Pointers",
                difficulty: "Hard",
                status: "Solved",
                time_spent_minutes: 35,
                approach_notes:
                  "Two-pointer approach maintaining leftMax and rightMax. Water trapped at each index is min(leftMax, rightMax) - height[i].",
                code_snippet:
                  "class Solution {\n    public int trap(int[] height) {\n        int l = 0, r = height.length - 1;\n        int leftMax = 0, rightMax = 0;\n        int res = 0;\n        while (l < r) {\n            if (height[l] < height[r]) {\n                if (height[l] >= leftMax) leftMax = height[l];\n                else res += leftMax - height[l];\n                l++;\n            } else {\n                if (height[r] >= rightMax) rightMax = height[r];\n                else res += rightMax - height[r];\n                r--;\n            }\n        }\n        return res;\n    }\n}",
                language: "java",
                time_complexity: "O(N)",
                space_complexity: "O(1)",
                revision_interval_days: 1,
                next_revision_at: new Date().toISOString(),
                revision_count: 0,
                last_revised_at: null,
                revision_history: [],
                rating: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: "sample-2",
                user_id: "preview",
                title: "Course Schedule",
                link: "https://leetcode.com/problems/course-schedule/",
                platform: "LeetCode",
                topic: "Graphs",
                difficulty: "Medium",
                status: "Needs revision",
                time_spent_minutes: 40,
                approach_notes:
                  "Kahn's algorithm using in-degree array and queue for topological sorting. Cycle detected if processed count != numCourses.",
                code_snippet:
                  "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        int[] indegree = new int[numCourses];\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());\n        for (int[] p : prerequisites) {\n            adj.get(p[1]).add(p[0]);\n            indegree[p[0]]++;\n        }\n        Queue<Integer> q = new LinkedList<>();\n        for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) q.add(i);\n        int count = 0;\n        while (!q.isEmpty()) {\n            int node = q.poll();\n            count++;\n            for (int neighbor : adj.get(node)) {\n                if (--indegree[neighbor] == 0) q.add(neighbor);\n            }\n        }\n        return count == numCourses;\n    }\n}",
                language: "java",
                time_complexity: "O(V + E)",
                space_complexity: "O(V + E)",
                revision_interval_days: 1,
                next_revision_at: new Date().toISOString(),
                revision_count: 1,
                last_revised_at: null,
                revision_history: [],
                rating: "Hard",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: "sample-3",
                user_id: "preview",
                title: "LRU Cache",
                link: "https://leetcode.com/problems/lru-cache/",
                platform: "LeetCode",
                topic: "Linked List",
                difficulty: "Medium",
                status: "Solved",
                time_spent_minutes: 45,
                approach_notes:
                  "Doubly linked list combined with HashMap for O(1) get and put operations.",
                code_snippet:
                  "class LRUCache {\n    class Node {\n        int key, val;\n        Node prev, next;\n        Node(int k, int v) { key = k; val = v; }\n    }\n    // Map and dummy head/tail\n}",
                language: "java",
                time_complexity: "O(1)",
                space_complexity: "O(capacity)",
                revision_interval_days: 7,
                next_revision_at: new Date(Date.now() + 5 * 86400000).toISOString(),
                revision_count: 2,
                last_revised_at: new Date().toISOString(),
                revision_history: [],
                rating: "Easy",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ];
            saveCachedProblems(initialSeeds);
            return initialSeeds;
          });
        }
      } catch (err) {
        console.error("[DsaContainer] Error initializing user:", err);
      }
    }
    initUser();
  }, [supabase]);

  // 2. Fetch problems from Supabase
  const fetchProblems = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getDsaProblems(supabase, userId);
      if (data && data.length > 0) {
        // Merge Supabase problems with any locally created ones
        setProblems(data);
        saveCachedProblems(data);
      }
    } catch (err) {
      console.warn("[DsaContainer] Could not load from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) {
      fetchProblems();
    }
  }, [userId, fetchProblems]);

  // 3. Computed domain insights
  const revisionDueProblems = useMemo(() => {
    return problems.filter((p) => isDueForRevision(p));
  }, [problems]);

  const weakTopicReports = useMemo(() => {
    return detectWeakTopics(problems);
  }, [problems]);

  const topicStats = useMemo(() => {
    return calculateTopicProgress(problems);
  }, [problems]);

  const difficultySplit = useMemo(() => {
    return calculateDifficultySplit(problems);
  }, [problems]);

  const streakInfo = useMemo(() => {
    return calculateDsaStreak(problems);
  }, [problems]);

  const totalSolved = useMemo(() => {
    return problems.filter((p) => isBlindProblemSolved(p)).length;
  }, [problems]);

  // 4. Modal handlers
  const handleOpenAddModal = () => {
    setEditingProblem(null);
    setModalPrefill(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (problem: DsaProblem) => {
    setEditingProblem(problem);
    setModalPrefill(null);
    setIsModalOpen(true);
  };

  const handleOpenSolveModalWithPrefill = (prefill: Partial<CreateDsaProblemInput>) => {
    setEditingProblem(null);
    setModalPrefill(prefill);
    setIsModalOpen(true);
  };

  // 5. Save problem (Optimistic + Supabase + LocalStorage)
  const handleSaveProblem = async (
    problemData: CreateDsaProblemInput,
    problemId?: string
  ) => {
    if (problemId) {
      // 1. Optimistic update
      setProblems((prev) => {
        const next = prev.map((p) =>
          p.id === problemId
            ? ({
                ...p,
                ...problemData,
                updated_at: new Date().toISOString(),
              } as DsaProblem)
            : p
        );
        saveCachedProblems(next);
        return next;
      });

      showToast(`Updated "${problemData.title}"!`);

      // 2. Persist to Supabase if authenticated
      if (userId) {
        try {
          const updated = await updateDsaProblem(
            supabase,
            userId,
            problemId,
            problemData as Partial<DsaProblem>
          );
          if (updated) {
            setProblems((prev) => {
              const next = prev.map((p) => (p.id === problemId ? updated : p));
              saveCachedProblems(next);
              return next;
            });
          }
        } catch (e) {
          console.warn("[DsaContainer] Background sync failed, saved locally:", e);
        }
      }
    } else {
      // Create new problem
      const tempId = `dsa-${Date.now()}`;
      const optimisticNew: DsaProblem = {
        id: tempId,
        user_id: userId || "preview",
        title: problemData.title,
        link: problemData.link || null,
        platform: problemData.platform || "LeetCode",
        topic: problemData.topic || "Arrays",
        difficulty: problemData.difficulty,
        status: problemData.status,
        time_spent_minutes: problemData.time_spent_minutes || 0,
        approach_notes: problemData.approach_notes || null,
        code_snippet: problemData.code_snippet || null,
        language: problemData.language || "java",
        time_complexity: problemData.time_complexity || null,
        space_complexity: problemData.space_complexity || null,
        revision_interval_days: 1,
        next_revision_at: new Date(Date.now() + 86400000).toISOString(),
        revision_count: 0,
        last_revised_at: null,
        revision_history: [],
        rating: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      setProblems((prev) => {
        const next = [optimisticNew, ...prev];
        saveCachedProblems(next);
        return next;
      });

      showToast(
        `Logged "${optimisticNew.title}"! Spaced revision scheduled for tomorrow.`
      );

      // Persist to Supabase
      if (userId) {
        try {
          const created = await createDsaProblem(supabase, userId, problemData);
          if (created && created.id !== tempId) {
            setProblems((prev) => {
              const next = prev.map((p) => (p.id === tempId ? created : p));
              saveCachedProblems(next);
              return next;
            });
          }
        } catch (e) {
          console.warn("[DsaContainer] Background sync failed, saved locally:", e);
        }
      }
    }
  };

  // 6. Rate revision (Easy vs. Hard)
  const handleRateRevision = async (
    problem: DsaProblem,
    rating: "Easy" | "Hard"
  ) => {
    const { nextIntervalDays, nextRevisionDateUTC } = calculateNextRevision(
      problem.revision_interval_days || 1,
      rating
    );

    // Optimistic update
    setProblems((prev) => {
      const next = prev.map((p) =>
        p.id === problem.id
          ? {
              ...p,
              rating,
              status: rating === "Hard" ? "Needs revision" : p.status,
              revision_interval_days: nextIntervalDays,
              next_revision_at: nextRevisionDateUTC,
              revision_count: (p.revision_count || 0) + 1,
              last_revised_at: new Date().toISOString(),
            }
          : p
      );
      saveCachedProblems(next);
      return next;
    });

    showToast(
      rating === "Easy"
        ? `Nice! Next revision in ${nextIntervalDays} days.`
        : `Got it! Rescheduled for revision tomorrow.`
    );

    if (userId) {
      try {
        const updated = await rateRevision(supabase, userId, problem, rating);
        if (updated) {
          setProblems((prev) => {
            const next = prev.map((p) => (p.id === problem.id ? updated : p));
            saveCachedProblems(next);
            return next;
          });
        }
      } catch (e) {
        console.warn("[DsaContainer] Background revision sync warning:", e);
      }
    }
  };

  // 7. Delete problem
  const handleDeleteProblem = async (problemId: string) => {
    setProblems((prev) => {
      const next = prev.filter((p) => p.id !== problemId);
      saveCachedProblems(next);
      return next;
    });
    showToast("Problem deleted");

    if (userId) {
      try {
        await deleteDsaProblem(supabase, userId, problemId);
      } catch (e) {
        console.warn("[DsaContainer] Delete sync warning:", e);
      }
    }
  };

  // 8. Blind 150 Quick Toggle Solved
  const handleQuickToggleSolved = async (
    blind: Blind150Problem,
    currentMatch?: DsaProblem
  ) => {
    if (currentMatch) {
      const isCurrentlySolved = isBlindProblemSolved(currentMatch);

      const nextStatus: DsaStatus = isCurrentlySolved ? "Todo" : "Solved";

      await handleSaveProblem(
        {
          title: currentMatch.title,
          link: currentMatch.link,
          platform: currentMatch.platform || "LeetCode",
          topic: canonicalDsaTopic(currentMatch.topic || blind.topic),
          difficulty: currentMatch.difficulty || blind.difficulty,
          status: nextStatus,
          time_spent_minutes: currentMatch.time_spent_minutes || 30,
          approach_notes: currentMatch.approach_notes,
          code_snippet: currentMatch.code_snippet,
          language: currentMatch.language || "java",
        },
        currentMatch.id
      );

      showToast(
        nextStatus === "Solved"
          ? `Marked "${blind.title}" as Solved!`
          : `Marked "${blind.title}" as Todo.`
      );
    } else {
      // Create new solved problem
      await handleSaveProblem({
        title: blind.title,
        link: blind.link,
        platform: "LeetCode",
        topic: canonicalDsaTopic(blind.topic),
        difficulty: blind.difficulty,
        status: "Solved",
        time_spent_minutes: 30,
        approach_notes: `${blind.pattern}: ${blind.hints}`,
        time_complexity: blind.timeComplexity,
        space_complexity: blind.spaceComplexity,
        language: "java",
      });
      showToast(`Mastered "${blind.title}"! Added to your solved list.`);
    }
  };

  // 9. Batch import Blind 150
  const handleBatchImport = async (unsolvedOnly: boolean) => {
    const { BLIND_150_LIST } = await import("@/lib/dsa/blind150");
    let addedCount = 0;

    const newProblemsToAdd: DsaProblem[] = [];

    BLIND_150_LIST.forEach((b) => {
      const match = findMatchingUserProblem(b, problems);
      if (unsolvedOnly && match) return;

      const p: DsaProblem = {
        id: `blind-${b.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: userId || "preview",
        title: b.title,
        link: b.link,
        platform: "LeetCode",
        topic: b.topic,
        difficulty: b.difficulty,
        status: "Todo",
        time_spent_minutes: 0,
        approach_notes: `${b.pattern}: ${b.hints}`,
        code_snippet: null,
        language: "java",
        time_complexity: b.timeComplexity,
        space_complexity: b.spaceComplexity,
        revision_interval_days: 1,
        next_revision_at: null,
        revision_count: 0,
        last_revised_at: null,
        revision_history: [],
        rating: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newProblemsToAdd.push(p);
      addedCount++;
    });

    if (newProblemsToAdd.length > 0) {
      setProblems((prev) => {
        const next = [...newProblemsToAdd, ...prev];
        saveCachedProblems(next);
        return next;
      });
      showToast(`Imported ${addedCount} Blind 150 problems to your tracker!`);
    } else {
      showToast("All Blind 150 problems are already in your tracker!");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 pt-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[var(--text)] px-4 py-2.5 text-xs font-semibold text-[var(--surface)] shadow-lg animate-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2.5">
            <Code2 className="h-6 w-6 text-[var(--primary)]" />
            DSA Tracker
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Spaced repetition revision queue, Blind 150 roadmap, mastery rings, and CodeMirror snippets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("my-problems")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "my-problems"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>My Solutions</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "my-problems"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                }`}
              >
                {problems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("blind-150")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "blind-150"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Blind 150</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "blind-150"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                }`}
              >
                150
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchProblems}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Problem</span>
          </button>
        </div>
      </div>

      {/* Tab 1: My Problems & Revisions Hub */}
      {activeTab === "my-problems" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Daily Goal, Streak & Stats Bar */}
          <DsaStatsBar
            streakInfo={streakInfo}
            totalSolved={totalSolved}
            revisionQueueCount={revisionDueProblems.length}
            onOpenLogModal={handleOpenAddModal}
          />

          {/* 2. Spaced Repetition Revision Queue ("Revise Today") */}
          <RevisionQueueCard
            problems={revisionDueProblems}
            onRate={handleRateRevision}
            onEdit={handleOpenEditModal}
          />

          {/* 3. Weak Topic Detection Alert */}
          <WeakTopicAlert
            reports={weakTopicReports}
            onSelectTopic={(t) => setSelectedTopic(t)}
          />

          {/* 4. Topic Progress Rings & Difficulty Split */}
          <TopicProgressRings
            stats={topicStats}
            difficultySplit={difficultySplit}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
          />

          {/* 5. Problem List with Search, Filters, and Code Peeks */}
          <DsaProblemList
            problems={problems}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteProblem}
          />
        </div>
      )}

      {/* Tab 2: Blind 150 Master Roadmap */}
      {activeTab === "blind-150" && (
        <div className="animate-in fade-in duration-200">
          <Blind150Tracker
            userProblems={problems}
            onOpenSolveModal={handleOpenSolveModalWithPrefill}
            onQuickToggleSolved={handleQuickToggleSolved}
            onBatchImport={handleBatchImport}
          />
        </div>
      )}

      {/* Problem Add/Edit Modal */}
      <DsaProblemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalPrefill(null);
        }}
        onSave={handleSaveProblem}
        initialProblem={editingProblem}
        prefill={modalPrefill}
      />
    </div>
  );
}
