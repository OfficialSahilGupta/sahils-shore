"use client";

// ============================================================================
// Sahil's Shore: Journal & Reflection Top-Level Container
// Orchestrates Daily Reflection, Weekly Reviews, Mood Trajectory & History
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  JournalEntry,
  SaveJournalInput,
  WeeklyReviewStats,
  MoodTimelinePoint,
} from "@/lib/journal";
import {
  getJournalEntry,
  saveJournalEntry,
  getRecentJournalEntries,
  getMoodTimelineData,
  summarizeDayFromTimeline,
  getWeeklyReviewStats,
} from "@/lib/journal";
import {
  todayIST,
  addDaysIST,
  formatFriendlyISTDate,
} from "@/lib/date-utils";
import { DailyReflectionView } from "./DailyReflectionView";
import { WeeklyReviewView } from "./WeeklyReviewView";
import { MoodTimelineChart } from "./MoodTimelineChart";
import { JournalHistoryList } from "./JournalHistoryList";
import {
  BookOpen,
  Calendar,
  Sparkles,
  BarChart3,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type JournalTab = "daily" | "weekly" | "mood" | "history";

export function JournalContainer() {
  const [activeTab, setActiveTab] = useState<JournalTab>("daily");
  const [currentDate, setCurrentDate] = useState<string>(todayIST());
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [moodData, setMoodData] = useState<MoodTimelinePoint[]>([]);
  const [daysCount, setDaysCount] = useState<number>(14);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch entry for currentDate
  const loadEntry = useCallback(
    async (date: string) => {
      if (!userId) return;
      setIsLoading(true);
      const supabase = createClient();
      const loaded = await getJournalEntry(supabase, userId, date);
      setEntry(loaded);
      setIsLoading(false);
    },
    [userId]
  );

  // Fetch history and mood data
  const loadOverviewData = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const [recent, moodPoints] = await Promise.all([
      getRecentJournalEntries(supabase, userId, 40),
      getMoodTimelineData(supabase, userId, daysCount),
    ]);
    setHistory(recent);
    setMoodData(moodPoints);
  }, [userId, daysCount]);

  useEffect(() => {
    if (userId) {
      loadEntry(currentDate);
      loadOverviewData();
    }
  }, [userId, currentDate, loadEntry, loadOverviewData]);

  // Handlers
  const handleSaveEntry = async (input: SaveJournalInput): Promise<boolean> => {
    if (!userId) return false;
    const supabase = createClient();
    const saved = await saveJournalEntry(supabase, userId, input);
    if (saved) {
      setEntry(saved);
      loadOverviewData();
      return true;
    }
    return false;
  };

  const handlePullTimelineSummary = async (date: string): Promise<string> => {
    if (!userId) return "";
    const supabase = createClient();
    return await summarizeDayFromTimeline(supabase, userId, date);
  };

  const handleFetchWeeklyStats = async (
    startDate: string,
    endDate: string
  ): Promise<WeeklyReviewStats> => {
    if (!userId) {
      return {
        weekStartDate: startDate,
        weekEndDate: endDate,
        studyMinutes: 0,
        studyHours: 0,
        dsaSolvedCount: 0,
        spentPaise: 0,
        tasksCompletedCount: 0,
        habitsCompletedCount: 0,
      };
    }
    const supabase = createClient();
    return await getWeeklyReviewStats(supabase, userId, startDate, endDate);
  };

  const handleSaveWeeklyReview = async (date: string, content: string): Promise<boolean> => {
    return handleSaveEntry({
      entry_date: date,
      content,
      tags: ["weekly-review"],
    });
  };

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
    if (activeTab === "history") {
      setActiveTab("daily");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6 md:px-6">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Life Logging & Reflection
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Journal & Reflection
          </h1>
        </div>

        {/* Date Navigator (Always visible for easy jumping) */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 shadow-sm">
          <button
            onClick={() => handleDateChange(addDaysIST(currentDate, -1))}
            className="rounded-xl p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text outline-none cursor-pointer"
            />
            <span className="text-[11px] text-text-muted">
              ({formatFriendlyISTDate(currentDate)})
            </span>
          </div>

          <button
            onClick={() => handleDateChange(todayIST())}
            className="rounded-xl bg-surface-muted px-2.5 py-1 text-xs font-medium text-text hover:bg-primary/10 hover:text-primary transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => handleDateChange(addDaysIST(currentDate, 1))}
            className="rounded-xl p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: "daily", label: "Daily Reflection", icon: Sparkles },
          { id: "weekly", label: "Weekly Review", icon: Calendar },
          { id: "mood", label: "Mood Trajectory", icon: BarChart3 },
          { id: "history", label: `Archive (${history.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as JournalTab)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/70 bg-surface text-text-muted hover:bg-surface-muted hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "daily" && (
        <DailyReflectionView
          currentDate={currentDate}
          entry={entry}
          onSave={handleSaveEntry}
          onPullTimelineSummary={handlePullTimelineSummary}
        />
      )}

      {activeTab === "weekly" && (
        <WeeklyReviewView
          onFetchStats={handleFetchWeeklyStats}
          onSaveReview={handleSaveWeeklyReview}
        />
      )}

      {activeTab === "mood" && (
        <MoodTimelineChart
          data={moodData}
          daysCount={daysCount}
          onDaysCountChange={setDaysCount}
        />
      )}

      {activeTab === "history" && (
        <JournalHistoryList
          entries={history}
          selectedDate={currentDate}
          onSelectDate={handleDateChange}
        />
      )}
    </div>
  );
}
