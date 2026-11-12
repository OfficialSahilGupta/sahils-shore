"use client";

// ============================================================================
// Sahil's Shore: DSA Tracker Main Container
// Spaced Repetition, Weak Topic Detection, Blind 150 Tracker,
// Hydration-Safe State, Adaptive Mastery Targets, and Favorites.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Code2,
  Sparkles,
  Plus,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  Layers,
  Flame,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DsaProblem } from "@/types";
import {
  getDsaProblems,
  createDsaProblem,
  updateDsaProblem,
  deleteDsaProblem,
  rateRevision,
  isDueForRevision,
  detectWeakTopics,
  calculateTopicProgress,
  calculateDifficultySplit,
  calculateDsaStreak,
  canonicalDsaTopic,
  isBlindProblemSolved,
  type CreateDsaProblemInput,
  type DsaStatus,
  type Blind150Problem,
} from "@/lib/dsa";
import { DsaStatsBar } from "./DsaStatsBar";
import { RevisionQueueCard } from "./RevisionQueueCard";
import { WeakTopicAlert } from "./WeakTopicAlert";
import { TopicProgressRings } from "./TopicProgressRings";
import { DsaProblemList } from "./DsaProblemList";
import { DsaProblemModal } from "./DsaProblemModal";
import { DsaFullPageNoteModal } from "./DsaFullPageNoteModal";
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
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"my-problems" | "blind-150">("my-problems");
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [targetBenchmark, setTargetBenchmark] = useState<number | "adaptive">("adaptive");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<DsaProblem | null>(null);
  const [selectedFullPageProblem, setSelectedFullPageProblem] = useState<DsaProblem | null>(null);
  const [modalPrefill, setModalPrefill] = useState<Partial<CreateDsaProblemInput> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Hydration-safe initial mount
  useEffect(() => {
    setIsMounted(true);
    const cached = loadCachedProblems();
    if (cached && cached.length > 0) {
      setProblems(cached);
    }
  }, []);

  // Sync to local storage whenever problems state updates
  useEffect(() => {
    if (isMounted && problems.length > 0) {
      saveCachedProblems(problems);
    }
  }, [problems, isMounted]);

  // 2. Initialize user & fetch problems
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
                is_favorite: true,
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
                time_spent_minutes: 30,
                approach_notes:
                  "Topological sort via Kahn's algorithm (BFS with in-degrees) or DFS cycle detection with 3-state coloring.",
                code_snippet:
                  "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        int[] inDegree = new int[numCourses];\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());\n        for (int[] p : prerequisites) {\n            adj.get(p[1]).add(p[0]);\n            inDegree[p[0]]++;\n        }\n        Queue<Integer> q = new LinkedList<>();\n        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.offer(i);\n        int visited = 0;\n        while (!q.isEmpty()) {\n            int curr = q.poll();\n            visited++;\n            for (int next : adj.get(curr)) {\n                if (--inDegree[next] == 0) q.offer(next);\n            }\n        }\n        return visited == numCourses;\n    }\n}",
                language: "java",
                time_complexity: "O(V + E)",
                space_complexity: "O(V + E)",
                revision_interval_days: 1,
                next_revision_at: new Date().toISOString(),
                revision_count: 1,
                last_revised_at: null,
                revision_history: [],
                rating: "Hard",
                is_favorite: false,
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
                is_favorite: true,
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

  // 3. Fetch problems from Supabase
  const fetchProblems = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getDsaProblems(supabase, userId);
      if (data && data.length > 0) {
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

  // 4. Computed domain insights
  const revisionDueProblems = useMemo(() => {
    return problems.filter((p) => isDueForRevision(p));
  }, [problems]);

  const weakTopicReports = useMemo(() => {
    return detectWeakTopics(problems);
  }, [problems]);

  const topicStats = useMemo(() => {
    return calculateTopicProgress(
      problems,
      targetBenchmark === "adaptive" ? undefined : targetBenchmark
    );
  }, [problems, targetBenchmark]);

  const difficultySplit = useMemo(() => {
    return calculateDifficultySplit(problems);
  }, [problems]);

  const streakInfo = useMemo(() => {
    return calculateDsaStreak(problems);
  }, [problems]);

  const totalSolved = useMemo(() => {
    return problems.filter((p) => isBlindProblemSolved(p)).length;
  }, [problems]);

  // Count empty placeholder stubs if user accidentally imported 150 items previously
  const emptyImportedStubsCount = useMemo(() => {
    return problems.filter(
      (p) =>
        (p.id.startsWith("blind-") || p.id.startsWith("blind-b150-")) &&
        (p.status === "Todo" || p.status === "todo") &&
        (!p.code_snippet || p.code_snippet.trim() === "")
    ).length;
  }, [problems]);

  // Clean up empty stubs action
  const handleCleanStubs = async () => {
    if (
      !window.confirm(
        `Remove all ${emptyImportedStubsCount} empty placeholder stubs from your problem list?`
      )
    ) {
      return;
    }
    const remaining = problems.filter(
      (p) =>
        !(
          (p.id.startsWith("blind-") || p.id.startsWith("blind-b150-")) &&
          (p.status === "Todo" || p.status === "todo") &&
          (!p.code_snippet || p.code_snippet.trim() === "")
        )
    );
    setProblems(remaining);
    saveCachedProblems(remaining);
    showToast(`Cleaned up ${emptyImportedStubsCount} empty placeholder stubs!`);
  };

  // 5. Modal handlers
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

  // 6. Save problem (Optimistic + Supabase + LocalStorage)
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
        is_favorite: Boolean(problemData.is_favorite),
        revision_interval_days: problemData.revision_interval_days || 1,
        next_revision_at:
          problemData.next_revision_at ||
          new Date(Date.now() + 86400000).toISOString(),
        revision_count: 0,
        last_revised_at: null,
        revision_history: (problemData.revision_history as any) || [],
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

  // 6b. Save from Full Page Markdown Studio (approaches, code, diagrams, complexities)
  const handleSaveProblemFromFullPage = async (
    problemId: string,
    updates: Partial<DsaProblem>
  ) => {
    // 1. Optimistic update
    setProblems((prev) => {
      const next = prev.map((p) =>
        p.id === problemId
          ? ({
              ...p,
              ...updates,
              updated_at: new Date().toISOString(),
            } as DsaProblem)
          : p
      );
      saveCachedProblems(next);
      return next;
    });

    setSelectedFullPageProblem((prev) =>
      prev && prev.id === problemId
        ? ({ ...prev, ...updates, updated_at: new Date().toISOString() } as DsaProblem)
        : prev
    );

    showToast("Study notes & diagrams saved!");

    // 2. Persist to Supabase
    if (userId) {
      try {
        const updated = await updateDsaProblem(
          supabase,
          userId,
          problemId,
          updates
        );
        if (updated) {
          setProblems((prev) => {
            const next = prev.map((p) => (p.id === problemId ? updated : p));
            saveCachedProblems(next);
            return next;
          });
          setSelectedFullPageProblem((prev) =>
            prev && prev.id === problemId ? updated : prev
          );
        }
      } catch (e) {
        console.warn("[DsaContainer] Background notes sync failed, saved locally:", e);
      }
    }
  };

  // 7. Toggle Favorite
  const handleToggleFavorite = async (problemId: string) => {
    let nextFav = false;
    setProblems((prev) => {
      const next = prev.map((p) => {
        if (p.id === problemId) {
          nextFav = !p.is_favorite;
          return { ...p, is_favorite: nextFav };
        }
        return p;
      });
      saveCachedProblems(next);
      return next;
    });

    setSelectedFullPageProblem((prev) =>
      prev && prev.id === problemId ? { ...prev, is_favorite: nextFav } : prev
    );

    showToast(nextFav ? "Starred problem!" : "Removed from favorites.");

    if (userId) {
      try {
        await updateDsaProblem(supabase, userId, problemId, {
          is_favorite: nextFav,
        });
      } catch (e) {
        console.warn("[DsaContainer] Favorite sync warning:", e);
      }
    }
  };

  // 8. Rate revision (Easy vs Hard)
  const handleRateRevision = async (
    problem: DsaProblem,
    rating: "Easy" | "Hard"
  ) => {
    let nextIntervalDays = 1;
    if (rating === "Easy") {
      const ladder = [1, 3, 7, 14, 30];
      const curIdx = ladder.indexOf(problem.revision_interval_days as any);
      nextIntervalDays =
        curIdx >= 0 && curIdx < ladder.length - 1
          ? ladder[curIdx + 1]
          : 30;
    } else {
      nextIntervalDays = 1;
    }

    const nextRevisionDateUTC = new Date(
      Date.now() + nextIntervalDays * 86400000
    ).toISOString();

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

    setSelectedFullPageProblem((prev) =>
      prev && prev.id === problem.id
        ? {
            ...prev,
            rating,
            status: rating === "Hard" ? "Needs revision" : prev.status,
            revision_interval_days: nextIntervalDays,
            next_revision_at: nextRevisionDateUTC,
            revision_count: (prev.revision_count || 0) + 1,
            last_revised_at: new Date().toISOString(),
          }
        : prev
    );

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
          setSelectedFullPageProblem((prev) =>
            prev && prev.id === problem.id ? updated : prev
          );
        }
      } catch (e) {
        console.warn("[DsaContainer] Background revision sync warning:", e);
      }
    }
  };

  // 9. Delete problem
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

  // 10. Blind 150 Quick Toggle Solved
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
          is_favorite: currentMatch.is_favorite,
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 pt-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[var(--text)] px-4 py-2.5 text-xs font-semibold text-[var(--surface)] shadow-lg animate-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* Modern Eye-Pleasing Masthead Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-muted)]/20 to-[var(--surface)] p-5 sm:p-6 shadow-sm">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[var(--primary)]/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-[var(--accent-warm)]/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm ring-2 ring-[var(--primary)]/20">
                <Code2 className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
                DSA Tracker & Algorithm Notebook
              </h1>
              <span className="rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                Linear & Notion Studio
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
              Master algorithmic patterns, track 40+ paradigms with visual concept maps, and stay interview-ready with SM-2 spaced repetition.
            </p>

            {/* Quick mini-stat badges in header */}
            <div className="flex items-center gap-3 pt-1 flex-wrap text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                <span>
                  <strong className="text-[var(--text)]">{totalSolved}</strong> solved
                </span>
              </div>
              <span className="h-3 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-1.5 font-medium">
                <Layers className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span>
                  <strong className="text-[var(--text)]">42</strong> patterns cataloged
                </span>
              </div>
              {streakInfo.currentStreak > 0 && (
                <>
                  <span className="h-3 w-px bg-[var(--border)]" />
                  <div className="flex items-center gap-1.5 font-medium">
                    <Flame className="h-3.5 w-3.5 text-[var(--accent-warm)]" />
                    <span>
                      <strong className="text-[var(--text)]">{streakInfo.currentStreak}</strong> day streak
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Controls & Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Tabs */}
            <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("my-problems")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  activeTab === "my-problems"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>My Solutions</span>
                <span
                  suppressHydrationWarning
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                    activeTab === "my-problems"
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                  }`}
                >
                  {isMounted ? problems.length : 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("blind-150")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  activeTab === "blind-150"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Blind 150</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
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
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)] transition-colors shadow-2xs"
              title="Refresh"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/90 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:opacity-95 transition-all"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>DSA Problem & Engineering Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: My Solutions */}
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
            onOpenStudyNotes={(p) => setSelectedFullPageProblem(p)}
          />

          {/* 3. Weak Topic Detection Alert */}
          <WeakTopicAlert
            reports={weakTopicReports}
            onSelectTopic={(t) => setSelectedTopic(t)}
          />

          {/* 4. Topic Progress Rings & Difficulty Split with Adaptive Targets */}
          <TopicProgressRings
            stats={topicStats}
            difficultySplit={difficultySplit}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            targetBenchmark={targetBenchmark}
            onTargetBenchmarkChange={setTargetBenchmark}
          />

          {/* 5. Problem List with Search, Filters, Favorites, and Expanded Notes */}
          <DsaProblemList
            problems={problems}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteProblem}
            onToggleFavorite={handleToggleFavorite}
            onCleanStubs={emptyImportedStubsCount > 0 ? handleCleanStubs : undefined}
            stubsCount={emptyImportedStubsCount}
            onOpenStudyNotes={(p) => setSelectedFullPageProblem(p)}
          />
        </div>
      )}

      {/* Tab 2: Blind 150 Master Roadmap */}
      {activeTab === "blind-150" && (
        <div className="animate-in fade-in duration-200">
          <Blind150Tracker
            userProblems={problems}
            onOpenSolveModal={handleOpenSolveModalWithPrefill}
            onOpenEditProblem={handleOpenEditModal}
            onQuickToggleSolved={handleQuickToggleSolved}
            onOpenStudyNotes={(p) => setSelectedFullPageProblem(p)}
          />
        </div>
      )}

      {/* Problem Add/Edit Modal (Engineering Notebook) */}
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

      {/* Full-Page Markdown Document Studio & Visual Diagrams Gallery */}
      <DsaFullPageNoteModal
        isOpen={Boolean(selectedFullPageProblem)}
        problem={
          selectedFullPageProblem
            ? problems.find((p) => p.id === selectedFullPageProblem.id) || selectedFullPageProblem
            : null
        }
        onClose={() => setSelectedFullPageProblem(null)}
        onSave={handleSaveProblemFromFullPage}
        onRate={handleRateRevision}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
