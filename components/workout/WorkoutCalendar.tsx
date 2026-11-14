"use client";

// ============================================================================
// Sahil's Shore: Workout Calendar Component
// Interactive month calendar & week strip with split badges, volume tags,
// physique photo markers, and day inspector drawer.
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Calendar as CalendarIcon,
  Camera,
  Flame,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatFriendlyISTDate, todayIST } from "@/lib/date-utils";
import type { WorkoutSession, PhysiquePhoto, SplitType, MuscleGroup } from "@/lib/workout";

interface WorkoutCalendarProps {
  sessions: WorkoutSession[];
  photos: PhysiquePhoto[];
  onOpenNewSession: (dateIST?: string) => void;
  onEditSession: (session: WorkoutSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenNewPhoto: (dateIST?: string) => void;
  onViewPhotoLightbox: (photo: PhysiquePhoto) => void;
}

export function WorkoutCalendar({
  sessions,
  photos,
  onOpenNewSession,
  onEditSession,
  onDeleteSession,
  onOpenNewPhoto,
  onViewPhotoLightbox,
}: WorkoutCalendarProps) {
  const currentTodayIST = todayIST();
  const [selectedDateIST, setSelectedDateIST] = useState<string>(currentTodayIST);

  // Month navigation
  const [currentYear, setCurrentYear] = useState(() => parseInt(currentTodayIST.split("-")[0], 10));
  const [currentMonth, setCurrentMonth] = useState(() => parseInt(currentTodayIST.split("-")[1], 10) - 1);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const parts = currentTodayIST.split("-");
    setCurrentYear(parseInt(parts[0], 10));
    setCurrentMonth(parseInt(parts[1], 10) - 1);
    setSelectedDateIST(currentTodayIST);
  };

  // Group sessions and photos by dateIST
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      const list = map.get(s.workoutDate) || [];
      list.push(s);
      map.set(s.workoutDate, list);
    }
    return map;
  }, [sessions]);

  const photosByDate = useMemo(() => {
    const map = new Map<string, PhysiquePhoto[]>();
    for (const p of photos) {
      const list = map.get(p.photoDate) || [];
      list.push(p);
      map.set(p.photoDate, list);
    }
    return map;
  }, [photos]);

  // Calendar days generation (Monday start)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(Date.UTC(currentYear, currentMonth, 1));
    const lastDay = new Date(Date.UTC(currentYear, currentMonth + 1, 0));
    const daysInMonth = lastDay.getUTCDate();

    let startDayOfWeek = firstDay.getUTCDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateIST: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      sessions: WorkoutSession[];
      photos: PhysiquePhoto[];
      totalVolumeKg: number;
    }> = [];

    // Prev month padding
    const prevMonthLastDay = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mStr = String(prevMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateKey = `${prevYear}-${mStr}-${dStr}`;
      const daySessions = sessionsByDate.get(dateKey) || [];
      const dayPhotos = photosByDate.get(dateKey) || [];
      const vol = daySessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
      days.push({
        dateIST: dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        sessions: daySessions,
        photos: dayPhotos,
        totalVolumeKg: vol,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateKey = `${currentYear}-${mStr}-${dStr}`;
      const daySessions = sessionsByDate.get(dateKey) || [];
      const dayPhotos = photosByDate.get(dateKey) || [];
      const vol = daySessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
      days.push({
        dateIST: dateKey,
        dayNumber: d,
        isCurrentMonth: true,
        sessions: daySessions,
        photos: dayPhotos,
        totalVolumeKg: vol,
      });
    }

    // Next month padding to complete rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mStr = String(nextMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateKey = `${nextYear}-${mStr}-${dStr}`;
      const daySessions = sessionsByDate.get(dateKey) || [];
      const dayPhotos = photosByDate.get(dateKey) || [];
      const vol = daySessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
      days.push({
        dateIST: dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        sessions: daySessions,
        photos: dayPhotos,
        totalVolumeKg: vol,
      });
    }

    return days;
  }, [currentYear, currentMonth, sessionsByDate, photosByDate]);

  // Monthly stats
  const monthStats = useMemo(() => {
    let sessionCount = 0;
    let totalVolume = 0;
    let totalMinutes = 0;
    let photoCount = 0;

    for (const d of calendarDays) {
      if (!d.isCurrentMonth) continue;
      sessionCount += d.sessions.length;
      totalVolume += d.totalVolumeKg;
      photoCount += d.photos.length;
      for (const s of d.sessions) {
        totalMinutes += s.durationMinutes;
      }
    }

    return { sessionCount, totalVolume, totalMinutes, photoCount };
  }, [calendarDays]);

  // Selected Day Details
  const selectedDaySessions = sessionsByDate.get(selectedDateIST) || [];
  const selectedDayPhotos = photosByDate.get(selectedDateIST) || [];

  const getSplitBadgeStyle = (split: SplitType) => {
    switch (split) {
      case "push":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "pull":
        return "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30";
      case "legs":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "upper":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "lower":
        return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
      case "full_body":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-primary/15 text-primary border-primary/30";
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5 flex-wrap">
              <span className="font-semibold text-primary">
                {monthStats.sessionCount} workouts
              </span>
              <span>•</span>
              <span>
                {monthStats.totalVolume >= 1000
                  ? `${(monthStats.totalVolume / 1000).toFixed(1)} tons volume`
                  : `${Math.round(monthStats.totalVolume)} kg volume`}
              </span>
              {monthStats.totalMinutes > 0 && (
                <>
                  <span>•</span>
                  <span>{Math.round(monthStats.totalMinutes / 60)} hrs active</span>
                </>
              )}
              {monthStats.photoCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-text font-medium">
                    {monthStats.photoCount} physique photos
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleJumpToday}
            className="rounded-xl border border-border bg-surface-muted/60 px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-text-muted hover:text-text transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border" />
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-text-muted hover:text-text transition-colors"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid & Day Detail Split Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Columns on Desktop) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-3 sm:p-4 shadow-xs">
          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-2 border-b border-border text-[11px] font-semibold text-text-muted">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day) => {
              const isSelected = day.dateIST === selectedDateIST;
              const isToday = day.dateIST === currentTodayIST;
              const hasWorkouts = day.sessions.length > 0;
              const hasPhotos = day.photos.length > 0;
              const mainSession = day.sessions[0];

              return (
                <button
                  key={day.dateIST}
                  type="button"
                  onClick={() => setSelectedDateIST(day.dateIST)}
                  className={`relative flex flex-col justify-between p-1 sm:p-2 min-h-[54px] sm:min-h-[86px] rounded-xl border text-left transition-all min-w-0 ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                      : isToday
                      ? "border-primary/50 bg-primary/5 text-text"
                      : day.isCurrentMonth
                      ? "border-border/70 bg-surface hover:bg-surface-muted text-text"
                      : "border-border/30 bg-surface-muted/20 text-text-muted/40"
                  }`}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isToday
                          ? "flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] sm:text-[10px]"
                          : isSelected
                          ? "text-primary"
                          : ""
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Camera icon if photo logged */}
                    {hasPhotos && (
                      <span
                        className="text-primary flex items-center justify-center shrink-0"
                        title="Physique photo recorded"
                      >
                        <Camera className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  {/* Split Tag or Indicator */}
                  {hasWorkouts ? (
                    <div className="my-auto w-full">
                      {/* Mobile Indicator */}
                      <div className="sm:hidden flex items-center justify-center py-0.5">
                        <span
                          className={`h-2 w-2 rounded-full border ${getSplitBadgeStyle(
                            mainSession.splitType
                          )}`}
                          title={`${mainSession.routineName} (${mainSession.durationMinutes}m)`}
                        />
                      </div>

                      {/* Desktop Rich Tag */}
                      <div className="hidden sm:block space-y-1">
                        <div
                          className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold truncate ${getSplitBadgeStyle(
                            mainSession.splitType
                          )}`}
                        >
                          {mainSession.routineName}
                        </div>
                        {day.totalVolumeKg > 0 && (
                          <div className="text-[9px] font-mono text-text-muted truncate">
                            {day.totalVolumeKg >= 1000
                              ? `${(day.totalVolumeKg / 1000).toFixed(1)}t`
                              : `${Math.round(day.totalVolumeKg)}kg`}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="my-auto hidden sm:block">
                      {/* Subtle rest indicator */}
                      <span className="text-[9px] text-text-muted/30 italic">Rest</span>
                    </div>
                  )}

                  {/* Bottom exercises count */}
                  {hasWorkouts && (
                    <div className="hidden sm:block text-[9px] text-text-muted truncate">
                      {day.sessions.reduce((acc, s) => acc + s.exercises.length, 0)} ex
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector (1 Column on Desktop) */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {selectedDateIST === currentTodayIST ? "Today" : "Selected Date"}
                </span>
                <h3 className="text-base font-bold text-text">
                  {formatFriendlyISTDate(selectedDateIST)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span>{selectedDaySessions.length} workout logged</span>
                  {selectedDayPhotos.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{selectedDayPhotos.length} photo</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenNewPhoto(selectedDateIST)}
                  className="p-1.5 rounded-xl border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                  title="Add physique photo"
                  aria-label="Add physique photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenNewSession(selectedDateIST)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Workout</span>
                </button>
              </div>
            </div>

            {/* Sessions List */}
            {selectedDaySessions.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface-muted/30">
                <Dumbbell className="h-8 w-8 text-text-muted/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-text">No workout logged for this day</p>
                <p className="text-[11px] text-text-muted mt-1">
                  Enjoy your rest & recovery, or tap &ldquo;Log Workout&rdquo; to record your training.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-border bg-surface-muted/20 space-y-3"
                  >
                    {/* Session Title & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getSplitBadgeStyle(
                              session.splitType
                            )}`}
                          >
                            {session.splitType.toUpperCase()}
                          </span>
                          <h4 className="text-sm font-bold text-text">{session.routineName}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.durationMinutes} mins
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-text font-mono">
                            {session.totalVolumeKg >= 1000
                              ? `${(session.totalVolumeKg / 1000).toFixed(1)}t`
                              : `${Math.round(session.totalVolumeKg)}kg`}{" "}
                            volume
                          </span>
                          <span>•</span>
                          <span>{session.totalSets} sets</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditSession(session)}
                          className="p-1 rounded text-text-muted hover:text-text hover:bg-surface"
                          title="Edit workout"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1 rounded text-text-muted hover:text-danger hover:bg-surface"
                          title="Delete workout"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Muscle groups badges */}
                    {session.muscleGroups.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {session.muscleGroups.map((mg) => (
                          <span
                            key={mg}
                            className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-surface border border-border text-text-muted"
                          >
                            {mg}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Exercise List */}
                    <div className="space-y-2 pt-1 border-t border-border/50">
                      {session.exercises.map((ex, exIdx) => (
                        <div key={ex.id || exIdx} className="text-xs space-y-1">
                          <div className="flex items-center justify-between font-semibold text-text">
                            <span className="truncate">{ex.exerciseName}</span>
                            <span className="text-[10px] text-text-muted font-normal shrink-0 ml-1">
                              {ex.muscleGroup}
                            </span>
                          </div>

                          {/* Sets summary */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {ex.sets.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                  s.completed
                                    ? "bg-surface border-border text-text font-medium"
                                    : "bg-surface-muted border-border/40 text-text-muted line-through"
                                }`}
                              >
                                {s.weightKg}kg × {s.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {session.notes && (
                      <p className="text-[11px] text-text-muted italic border-t border-border/40 pt-1.5">
                        &ldquo;{session.notes}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Photos for this day */}
            {selectedDayPhotos.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">Physique Progression</span>
                  <span className="text-[10px] text-text-muted">
                    {selectedDayPhotos.length} photo(s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedDayPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => onViewPhotoLightbox(photo)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-surface-muted aspect-[3/4]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.photoUrl}
                        alt="Physique update"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white">
                        <span className="text-[10px] font-bold capitalize block">
                          {photo.poseType}
                        </span>
                        {photo.weightKg && (
                          <span className="text-[9px] font-mono text-white/80">
                            {photo.weightKg} kg
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
