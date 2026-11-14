"use client";

// ============================================================================
// Sahil's Shore: Workout & Fitness Hub Container Component
// High-motivation hero header, daily calendar, exercise sets & volume logging,
// Before/After physique transformation slider, and PR tracking.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dumbbell,
  Flame,
  Calendar,
  Camera,
  Trophy,
  Layers,
  Plus,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
} from "lucide-react";
import { WorkoutCalendar } from "./WorkoutCalendar";
import { WorkoutLoggerModal } from "./WorkoutLoggerModal";
import { DailyPhysiqueGallery } from "./DailyPhysiqueGallery";
import { PersonalRecordsView } from "./PersonalRecordsView";
import { WorkoutRoutinesView } from "./WorkoutRoutinesView";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { todayIST } from "@/lib/date-utils";
import {
  WorkoutSession,
  PhysiquePhoto,
  WorkoutPR,
  RoutineTemplate,
  getWorkoutSessions,
  saveWorkoutSession,
  deleteWorkoutSession,
  getPhysiquePhotos,
  savePhysiquePhoto,
  deletePhysiquePhoto,
  getWorkoutPRs,
  checkAndUpdatePR,
  calculateWorkoutStreak,
  getDailyMotivationQuote,
  calculateEstimated1RM,
} from "@/lib/workout";

type ActiveTab = "calendar" | "physique" | "prs" | "routines";

export function WorkoutContainer() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("calendar");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Data states
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [photos, setPhotos] = useState<PhysiquePhoto[]>([]);
  const [prs, setPrs] = useState<WorkoutPR[]>([]);

  // Dialog states
  const [loggerModalOpen, setLoggerModalOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [loggerDefaultDate, setLoggerDefaultDate] = useState<string | undefined>(undefined);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhysiquePhoto | null>(null);

  const currentTodayIST = todayIST();
  const dailyQuote = useMemo(() => getDailyMotivationQuote(currentTodayIST), [currentTodayIST]);

  // Load user and data
  const loadData = useCallback(async (uid: string) => {
    try {
      setIsLoading(true);
      const [sData, pData, prData] = await Promise.all([
        getWorkoutSessions(uid),
        getPhysiquePhotos(uid),
        getWorkoutPRs(uid),
      ]);
      setSessions(sData);
      setPhotos(pData);
      setPrs(prData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id || "local-sahil";
      setUserId(uid);
      loadData(uid);
    });
  }, [loadData]);

  // Workout streak
  const streak = useMemo(() => {
    return calculateWorkoutStreak(sessions, currentTodayIST);
  }, [sessions, currentTodayIST]);

  // Overall stats
  const stats = useMemo(() => {
    const totalVolume = sessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const thisMonthPrefix = currentTodayIST.slice(0, 7);
    const monthSessions = sessions.filter((s) => s.workoutDate.startsWith(thisMonthPrefix));

    return {
      totalSessions: sessions.length,
      monthSessionsCount: monthSessions.length,
      totalVolumeKg: totalVolume,
      totalHours: Math.round(totalMinutes / 60),
    };
  }, [sessions, currentTodayIST]);

  // Handlers
  const handleSaveSession = async (sessionData: any) => {
    if (!userId) return;
    const saved = await saveWorkoutSession(userId, sessionData);
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== saved.id);
      return [saved, ...filtered].sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
    });
    // Refresh PRs in case any new PR was achieved
    getWorkoutPRs(userId).then(setPrs);
    toast({
      title: "Workout Logged",
      description: `${saved.routineName} recorded (${saved.exercises.length} exercises, ${saved.totalSets} sets).`,
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!userId) return;
    await deleteWorkoutSession(userId, sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast({
      title: "Workout Removed",
      description: "Workout session deleted successfully.",
    });
  };

  const handleSavePhoto = async (photoData: any) => {
    if (!userId) return;
    const saved = await savePhysiquePhoto(userId, photoData);
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== saved.id);
      return [saved, ...filtered].sort((a, b) => b.photoDate.localeCompare(a.photoDate));
    });
    toast({
      title: "Physique Photo Saved",
      description: `Progress update recorded for ${saved.photoDate}.`,
    });
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!userId) return;
    await deletePhysiquePhoto(userId, photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    toast({
      title: "Photo Deleted",
      description: "Physique photo removed.",
    });
  };

  const handleSavePR = async (exerciseName: string, weightKg: number, reps: number, dateIST: string) => {
    if (!userId) return;
    const est1rm = calculateEstimated1RM(weightKg, reps);
    const updated = await checkAndUpdatePR(userId, exerciseName, weightKg, reps, est1rm, dateIST);
    if (updated) {
      setPrs((prev) => {
        const filtered = prev.filter((p) => p.exerciseName.toLowerCase() !== exerciseName.toLowerCase());
        return [updated, ...filtered];
      });
      toast({
        title: "New Personal Record!",
        description: `${exerciseName}: ${weightKg}kg × ${reps} reps (1RM: ${est1rm}kg).`,
      });
    } else {
      toast({
        title: "Record Saved",
        description: "PR recorded in your personal bests ledger.",
      });
    }
  };

  const handleStartRoutine = (template: RoutineTemplate) => {
    setEditingSession(null);
    setLoggerDefaultDate(currentTodayIST);
    setLoggerModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0 w-full">
      {/* 1. Motivating Hero Header */}
      <Card className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-surface-muted/60 p-5 sm:p-7 shadow-sm">
        {/* Subtle decorative background wave blur */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Branding & Daily Motivation */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-primary/15 px-2.5 text-[11px] font-bold text-primary">
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Iron Shore</span>
              </span>
              <span className="text-xs text-text-muted font-medium">Daily Strength & Hypertrophy</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
              Forge Your Strength, Sahil.
            </h1>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed italic border-l-2 border-primary/50 pl-3 py-0.5">
              &ldquo;{dailyQuote.quote}&rdquo;{" "}
              <span className="font-semibold text-text not-italic">— {dailyQuote.author}</span>
            </p>
          </div>

          {/* Right: Quick Action Buttons & Streak */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Streak Counter Chip */}
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                <Flame className="h-5 w-5 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-tight">
                  Active Streak
                </span>
                <span className="text-lg font-extrabold font-mono text-text leading-none">
                  {streak} {streak === 1 ? "day" : "days"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setLoggerDefaultDate(currentTodayIST);
                setLoggerModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Log Workout</span>
            </button>
          </div>
        </div>

        {/* Mini Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-border/60">
          <div>
            <span className="text-[11px] text-text-muted block font-medium">This Month</span>
            <span className="text-lg font-bold font-mono text-text">
              {stats.monthSessionsCount} sessions
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-muted block font-medium">Total Volume</span>
            <span className="text-lg font-bold font-mono text-primary">
              {stats.totalVolumeKg >= 1000
                ? `${(stats.totalVolumeKg / 1000).toFixed(1)} tons`
                : `${Math.round(stats.totalVolumeKg)} kg`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-muted block font-medium">Training Hours</span>
            <span className="text-lg font-bold font-mono text-text">
              {stats.totalHours} hrs active
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-muted block font-medium">Physique Updates</span>
            <span className="text-lg font-bold font-mono text-text">
              {photos.length} photos
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-1 overflow-x-auto scrollbar-none">
        {[
          { key: "calendar", label: "Workout Calendar", icon: Calendar },
          { key: "physique", label: `Physique Progression (${photos.length})`, icon: Camera },
          { key: "prs", label: `Personal Records (${prs.length})`, icon: Trophy },
          { key: "routines", label: "Routines & Splits", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "bg-surface text-primary shadow-xs border border-border"
                  : "text-text-muted hover:text-text hover:bg-surface-muted"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "calendar" && (
        <WorkoutCalendar
          sessions={sessions}
          photos={photos}
          onOpenNewSession={(date) => {
            setEditingSession(null);
            setLoggerDefaultDate(date || currentTodayIST);
            setLoggerModalOpen(true);
          }}
          onEditSession={(session) => {
            setEditingSession(session);
            setLoggerModalOpen(true);
          }}
          onDeleteSession={handleDeleteSession}
          onOpenNewPhoto={(date) => {
            setActiveTab("physique");
          }}
          onViewPhotoLightbox={(photo) => {
            setLightboxPhoto(photo);
          }}
        />
      )}

      {activeTab === "physique" && (
        <DailyPhysiqueGallery
          photos={photos}
          userId={userId}
          onSavePhoto={handleSavePhoto}
          onDeletePhoto={handleDeletePhoto}
        />
      )}

      {activeTab === "prs" && (
        <PersonalRecordsView prs={prs} onSavePR={handleSavePR} />
      )}

      {activeTab === "routines" && (
        <WorkoutRoutinesView onStartRoutine={handleStartRoutine} />
      )}

      {/* 4. Workout Logger Modal */}
      <WorkoutLoggerModal
        isOpen={loggerModalOpen}
        onClose={() => {
          setLoggerModalOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSaveSession}
        editingSession={editingSession}
        defaultDateIST={loggerDefaultDate}
      />
    </div>
  );
}
