"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Food Diary Month Calendar View
// Full-month interactive grid with per-slot status, spend aggregation,
// day inspector drawer, and 1-tap skipped/eaten logging.
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Plus,
  Clock,
  Sparkles,
  Utensils,
  MapPin,
  Camera,
  Star,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import type { MealWithExpense, MealType } from "@/lib/food";
import { getISTDateString, todayIST, formatFriendlyISTDate } from "@/lib/date-utils";
import { formatINR } from "@/lib/expenses";

interface FoodCalendarViewProps {
  meals: MealWithExpense[];
  onOpenNewMeal: (dateIST?: string, slot?: MealType) => void;
  onEditMeal: (meal: MealWithExpense) => void;
  onDeleteMeal: (mealId: string, expenseId?: string | null) => void;
  onQuickMarkSkipped: (dateIST: string, slot: MealType, reason?: string) => Promise<void>;
}

const SLOTS: Array<{ type: MealType; label: string; icon: React.ElementType; short: string }> = [
  { type: "breakfast", label: "Breakfast", icon: Coffee, short: "B" },
  { type: "lunch", label: "Lunch", icon: Sun, short: "L" },
  { type: "snack", label: "Snack", icon: Cookie, short: "S" },
  { type: "dinner", label: "Dinner", icon: Moon, short: "D" },
];

export function FoodCalendarView({
  meals,
  onOpenNewMeal,
  onEditMeal,
  onDeleteMeal,
  onQuickMarkSkipped,
}: FoodCalendarViewProps) {
  const currentTodayIST = todayIST();
  const [selectedDateIST, setSelectedDateIST] = useState<string>(currentTodayIST);

  // Month navigation: year and month index (0 = Jan)
  const [currentYear, setCurrentYear] = useState(() => {
    const parts = currentTodayIST.split("-");
    return parseInt(parts[0], 10);
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const parts = currentTodayIST.split("-");
    return parseInt(parts[1], 10) - 1;
  });

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

  // Map meals by dateIST
  const mealsByDate = useMemo(() => {
    const map = new Map<string, MealWithExpense[]>();
    for (const meal of meals) {
      const dateKey = getISTDateString(new Date(meal.eaten_at));
      const list = map.get(dateKey) || [];
      list.push(meal);
      map.set(dateKey, list);
    }
    return map;
  }, [meals]);

  // Calendar cells generation (Monday-start grid)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(Date.UTC(currentYear, currentMonth, 1));
    const lastDay = new Date(Date.UTC(currentYear, currentMonth + 1, 0));
    const daysInMonth = lastDay.getUTCDate();

    // Day of week: 0 = Sun, 1 = Mon ... We want Mon = 0
    let startDayOfWeek = firstDay.getUTCDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateIST: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      meals: MealWithExpense[];
      spendPaise: number;
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
      const dayMeals = mealsByDate.get(dateKey) || [];
      const spend = dayMeals.reduce((acc, m) => acc + (m.expense?.amount_paise || 0), 0);
      days.push({
        dateIST: dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        meals: dayMeals,
        spendPaise: spend,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateKey = `${currentYear}-${mStr}-${dStr}`;
      const dayMeals = mealsByDate.get(dateKey) || [];
      const spend = dayMeals.reduce((acc, m) => acc + (m.expense?.amount_paise || 0), 0);
      days.push({
        dateIST: dateKey,
        dayNumber: d,
        isCurrentMonth: true,
        meals: dayMeals,
        spendPaise: spend,
      });
    }

    // Next month padding to fill complete rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mStr = String(nextMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateKey = `${nextYear}-${mStr}-${dStr}`;
      const dayMeals = mealsByDate.get(dateKey) || [];
      const spend = dayMeals.reduce((acc, m) => acc + (m.expense?.amount_paise || 0), 0);
      days.push({
        dateIST: dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        meals: dayMeals,
        spendPaise: spend,
      });
    }

    return days;
  }, [currentYear, currentMonth, mealsByDate]);

  // Aggregate stats for current viewing month
  const monthStats = useMemo(() => {
    let totalSpend = 0;
    let eatenCount = 0;
    let skippedCount = 0;

    for (const d of calendarDays) {
      if (!d.isCurrentMonth) continue;
      totalSpend += d.spendPaise;
      for (const m of d.meals) {
        if (m.is_skipped) {
          skippedCount++;
        } else {
          eatenCount++;
        }
      }
    }

    return { totalSpend, eatenCount, skippedCount };
  }, [calendarDays]);

  // Selected Day Details
  const selectedDayMeals = mealsByDate.get(selectedDateIST) || [];
  const selectedDaySpend = selectedDayMeals.reduce(
    (acc, m) => acc + (m.expense?.amount_paise || 0),
    0
  );

  return (
    <div className="space-y-6">
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
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <span>{monthStats.eatenCount} meals logged</span>
              <span>•</span>
              <span className="text-primary font-medium">
                {monthStats.skippedCount} skipped
              </span>
              {monthStats.totalSpend > 0 && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-text">
                    {formatINR(monthStats.totalSpend)} food spend
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
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
        {/* Calendar Grid (2 Cols on Desktop) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-4 shadow-xs">
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
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((day) => {
              const isSelected = day.dateIST === selectedDateIST;
              const isToday = day.dateIST === currentTodayIST;
              const hasMeals = day.meals.length > 0;

              return (
                <button
                  key={day.dateIST}
                  type="button"
                  onClick={() => setSelectedDateIST(day.dateIST)}
                  className={`relative flex flex-col justify-between p-2 min-h-[72px] sm:min-h-[86px] rounded-xl border text-left transition-all ${
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
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]"
                          : isSelected
                          ? "text-primary"
                          : ""
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {day.spendPaise > 0 && (
                      <span className="text-[9px] font-mono text-text-muted truncate">
                        ₹{Math.round(day.spendPaise / 100)}
                      </span>
                    )}
                  </div>

                  {/* Slot Badges */}
                  <div className="flex items-center gap-1 my-1 flex-wrap">
                    {SLOTS.map(({ type, short, icon: SlotIcon }) => {
                      const mealForSlot = day.meals.find((m) => m.meal_type === type);
                      if (!mealForSlot) {
                        return (
                          <span
                            key={type}
                            className="h-1.5 w-1.5 rounded-full bg-border"
                            title={`No ${type}`}
                          />
                        );
                      }
                      if (mealForSlot.is_skipped) {
                        return (
                          <span
                            key={type}
                            className="h-3 px-1 rounded-sm bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[8px] font-bold flex items-center justify-center"
                            title={`Skipped ${type}`}
                          >
                            {short}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={type}
                          className="h-3 px-1 rounded-sm bg-primary/20 text-primary text-[8px] font-bold flex items-center justify-center"
                          title={`${type}: ${mealForSlot.description}`}
                        >
                          {short}
                        </span>
                      );
                    })}
                  </div>

                  {/* Bottom photos or items count */}
                  {hasMeals && (
                    <div className="text-[9px] text-text-muted truncate">
                      {day.meals.length} {day.meals.length === 1 ? "entry" : "entries"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector (1 Col on Desktop) */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
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
                  <span>{selectedDayMeals.length} recorded</span>
                  {selectedDaySpend > 0 && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-text">
                        {formatINR(selectedDaySpend)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenNewMeal(selectedDateIST)}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log Meal</span>
              </button>
            </div>

            {/* 4 Slots List */}
            <div className="space-y-3">
              {SLOTS.map(({ type, label, icon: SlotIcon }) => {
                const meal = selectedDayMeals.find((m) => m.meal_type === type);

                if (!meal) {
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-xl border border-dashed border-border p-3 text-xs bg-surface-muted/30"
                    >
                      <div className="flex items-center gap-2.5 text-text-muted">
                        <SlotIcon className="h-4 w-4" />
                        <span className="font-medium">{label}</span>
                        <span className="text-[10px] opacity-60">Not logged</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onQuickMarkSkipped(selectedDateIST, type, "Intermittent Fasting (16:8)")}
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text-muted hover:text-text hover:bg-surface-muted transition-colors flex items-center gap-1"
                          title="Mark slot as skipped (fasting)"
                        >
                          <Clock className="h-3 w-3 text-primary" />
                          <span>Fast/Skip</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenNewMeal(selectedDateIST, type)}
                          className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Log</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                if (meal.is_skipped) {
                  return (
                    <div
                      key={type}
                      className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-semibold text-text">Skipped {label}</span>
                          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            {meal.skipped_reason || "Fasting"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditMeal(meal)}
                            className="p-1 rounded text-text-muted hover:text-text hover:bg-surface"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMeal(meal.id, meal.expense_id)}
                            className="p-1 rounded text-text-muted hover:text-danger hover:bg-surface"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Regular eaten meal
                return (
                  <div
                    key={type}
                    className="rounded-xl border border-border bg-surface p-3 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                          <SlotIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-text truncate">{meal.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                            <span className="font-semibold text-primary">{label}</span>
                            {meal.location_type === "amrita_mess" ? (
                              <span>• Amrita Mess</span>
                            ) : meal.location_type === "home" ? (
                              <span>• Home</span>
                            ) : meal.restaurant_name ? (
                              <span className="truncate">• {meal.restaurant_name}</span>
                            ) : null}
                            {meal.expense?.amount_paise && meal.expense.amount_paise > 0 ? (
                              <span className="font-semibold text-text">
                                • {formatINR(meal.expense.amount_paise)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {meal.rating && (
                          <div className="flex items-center gap-0.5 text-accent-warm font-semibold text-[11px] mr-1">
                            <Star className="h-3 w-3 fill-accent-warm" />
                            <span>{meal.rating}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditMeal(meal)}
                          className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-muted"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMeal(meal.id, meal.expense_id)}
                          className="p-1 rounded text-text-muted hover:text-danger hover:bg-surface-muted"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Photos Preview */}
                    {meal.photo_urls && meal.photo_urls.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                        {meal.photo_urls.map((photo, pIdx) => (
                          <img
                            key={pIdx}
                            src={photo}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
