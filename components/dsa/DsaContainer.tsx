"use client";

// ============================================================================
// Sahil's Shore: DSA Container Component (Main Interactive Hub)
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Code2, Sparkles, RefreshCw } from "lucide-react";
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
  type CreateDsaProblemInput,
} from "@/lib/dsa";
import { DsaStatsBar } from "./DsaStatsBar";
import { RevisionQueueCard } from "./RevisionQueueCard";
import { WeakTopicAlert } from "./WeakTopicAlert";
import { TopicProgressRings } from "./TopicProgressRings";
import { DsaProblemList } from "./DsaProblemList";
import { DsaProblemModal } from "./DsaProblemModal";

export function DsaContainer() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<DsaProblem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initialize user
  useEffect(() => {
    async function initUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          // Preview fallback for local dev
          setProblems([
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
              approach_notes: "Two-pointer approach maintaining leftMax and rightMax. Water trapped at each index is min(leftMax, rightMax) - height[i].",
              code_snippet: "class Solution {\n    public int trap(int[] height) {\n        int l = 0, r = height.length - 1;\n        int leftMax = 0, rightMax = 0;\n        int res = 0;\n        while (l < r) {\n            if (height[l] < height[r]) {\n                if (height[l] >= leftMax) leftMax = height[l];\n                else res += leftMax - height[l];\n                l++;\n            } else {\n                if (height[r] >= rightMax) rightMax = height[r];\n                else res += rightMax - height[r];\n                r--;\n            }\n        }\n        return res;\n    }\n}",
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
              approach_notes: "Kahn's algorithm using in-degree array and queue for topological sorting. Cycle detected if processed count != numCourses.",
              code_snippet: "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        int[] indegree = new int[numCourses];\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());\n        for (int[] p : prerequisites) {\n            adj.get(p[1]).add(p[0]);\n            indegree[p[0]]++;\n        }\n        Queue<Integer> q = new LinkedList<>();\n        for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) q.add(i);\n        int count = 0;\n        while (!q.isEmpty()) {\n            int node = q.poll();\n            count++;\n            for (int neighbor : adj.get(node)) {\n                if (--indegree[neighbor] == 0) q.add(neighbor);\n            }\n        }\n        return count == numCourses;\n    }\n}",
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
              approach_notes: "Doubly linked list combined with HashMap for O(1) get and put operations.",
              code_snippet: "class LRUCache {\n    class Node {\n        int key, val;\n        Node prev, next;\n        Node(int k, int v) { key = k; val = v; }\n    }\n    // Map and dummy head/tail\n}",
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
          ]);
        }
      } catch (err) {
        console.error("[DsaContainer] Error initializing user:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initUser();
  }, [supabase]);

  // 2. Fetch problems
  const fetchProblems = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getDsaProblems(supabase, userId);
      setProblems(data);
    } catch (err) {
      console.error("[DsaContainer] Error loading problems:", err);
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
    return problems.filter(
      (p) =>
        (p.status || "").toLowerCase() === "solved" ||
        (p.status || "").toLowerCase() === "mastered"
    ).length;
  }, [problems]);

  // 4. Handlers
  const handleOpenAddModal = () => {
    setEditingProblem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (problem: DsaProblem) => {
    setEditingProblem(problem);
    setIsModalOpen(true);
  };

  const handleSaveProblem = async (
    problemData: CreateDsaProblemInput,
    problemId?: string
  ) => {
    if (!userId) {
      if (problemId) {
        setProblems((prev) =>
          prev.map((p) =>
            p.id === problemId
              ? ({
                  ...p,
                  ...problemData,
                  updated_at: new Date().toISOString(),
                } as DsaProblem)
              : p
          )
        );
        showToast("Problem updated successfully");
      } else {
        const mockNew: DsaProblem = {
          id: `preview-dsa-${Date.now()}`,
          user_id: "preview",
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
          next_revision_at: new Date().toISOString(),
          revision_count: 0,
          last_revised_at: null,
          revision_history: [],
          rating: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProblems((prev) => [mockNew, ...prev]);
        showToast(
          `Logged ${mockNew.title}! Spaced revision scheduled for tomorrow.`
        );
      }
      return;
    }

    if (problemId) {
      // Update problem
      const updated = await updateDsaProblem(
        supabase,
        userId,
        problemId,
        problemData as Partial<DsaProblem>
      );
      if (updated) {
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? updated : p))
        );
        showToast("Problem updated successfully");
      }
    } else {
      // Create problem
      const created = await createDsaProblem(supabase, userId, problemData);
      if (created) {
        setProblems((prev) => [created, ...prev]);
        showToast(
          `Logged ${created.title}! Spaced revision scheduled for tomorrow.`
        );
      }
    }
  };

  const handleRateRevision = async (
    problem: DsaProblem,
    rating: "Easy" | "Hard"
  ) => {
    if (!userId) {
      const { nextIntervalDays, nextRevisionDateUTC } = calculateNextRevision(
        problem.revision_interval_days || 1,
        rating
      );
      setProblems((prev) =>
        prev.map((p) =>
          p.id === problem.id
            ? {
                ...p,
                rating,
                status: rating === "Hard" ? "Needs revision" : p.status,
                revision_interval_days: nextIntervalDays,
                next_revision_at: nextRevisionDateUTC,
                revision_count: (p.revision_count || 0) + 1,
              }
            : p
        )
      );
      showToast(
        rating === "Easy"
          ? `Nice! Next revision in ${nextIntervalDays} days.`
          : `Got it! Rescheduled for revision tomorrow.`
      );
      return;
    }

    const updated = await rateRevision(supabase, userId, problem, rating);
    if (updated) {
      setProblems((prev) =>
        prev.map((p) => (p.id === problem.id ? updated : p))
      );
      const nextDays = updated.revision_interval_days || 1;
      showToast(
        rating === "Easy"
          ? `Nice! Next revision in ${nextDays} days.`
          : `Got it! Rescheduled for revision tomorrow.`
      );
    }
  };

  const handleDeleteProblem = async (problemId: string) => {
    if (!userId) {
      setProblems((prev) => prev.filter((p) => p.id !== problemId));
      showToast("Problem deleted");
      return;
    }

    const success = await deleteDsaProblem(supabase, userId, problemId);
    if (success) {
      setProblems((prev) => prev.filter((p) => p.id !== problemId));
      showToast("Problem deleted");
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2.5">
            <Code2 className="h-6 w-6 text-[var(--primary)]" />
            DSA Tracker
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Spaced repetition revision queue, topic mastery rings, and CodeMirror snippets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchProblems}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--surface-muted)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

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

      {/* Problem Add/Edit Modal */}
      <DsaProblemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProblem}
        initialProblem={editingProblem}
      />
    </div>
  );
}
