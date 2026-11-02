"use client";

// ============================================================================
// Sahil's Shore: Calendar View (Month & Week Views in IST)
// Displays tasks on their scheduled due dates with quick navigation
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
} from "lucide-react";
import type { TaskWithSubtasks } from "@/lib/todos";
import {
  todayIST,
  addDaysIST,
  getISTMonthGrid,
  getISTWeekDays,
  formatISTTime,
  formatFriendlyISTDate,
} from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";

interface CalendarViewProps {
  tasks: TaskWithSubtasks[];
  onSelectTask: (task: TaskWithSubtasks) => void;
  onSelectDate: (date: string) => void;
}

export function CalendarView({
  tasks,
  onSelectTask,
  onSelectDate,
}: CalendarViewProps) {
  const [mode, setMode] = useState<"month" | "week">("month");

  // Track active month (year, month 1-indexed)
  const today = todayIST();
  const [currentYear, setCurrentYear] = useState(() =>
    parseInt(today.split("-")[0], 10)
  );
  const [currentMonth, setCurrentMonth] = useState(() =>
    parseInt(today.split("-")[1], 10)
  );

  // Track active week base date
  const [weekBaseDate, setWeekBaseDate] = useState(today);

  // Map tasks by due_date
  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskWithSubtasks[]> = {};
    tasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const t = todayIST();
    setCurrentYear(parseInt(t.split("-")[0], 10));
    setCurrentMonth(parseInt(t.split("-")[1], 10));
    setWeekBaseDate(t);
  };

  // Week navigation
  const handlePrevWeek = () => {
    setWeekBaseDate((prev) => addDaysIST(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekBaseDate((prev) => addDaysIST(prev, 7));
  };

  const monthGrid = useMemo(() => {
    return getISTMonthGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const weekDays = useMemo(() => {
    return getISTWeekDays(weekBaseDate);
  }, [weekBaseDate]);

  const monthTitle = useMemo(() => {
    const d = new Date(Date.UTC(currentYear, currentMonth - 1, 15, 12, 0, 0));
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "long",
      year: "numeric",
    }).format(d);
  }, [currentYear, currentMonth]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Calendar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--text)]">
            {mode === "month"
              ? monthTitle
              : `Week of ${formatFriendlyISTDate(weekDays[0].date)}`}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={mode === "month" ? handlePrevMonth : handlePrevWeek}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-muted)]"
            >
              Today
            </button>
            <button
              onClick={mode === "month" ? handleNextMonth : handleNextWeek}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Toggle: Month vs Week */}
        <div className="flex rounded-xl bg-[var(--surface-muted)] p-1 text-xs">
          <button
            onClick={() => setMode("month")}
            className={`rounded-lg px-3 py-1 font-medium transition-colors ${
              mode === "month"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setMode("week")}
            className={`rounded-lg px-3 py-1 font-medium transition-colors ${
              mode === "week"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {mode === "month" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-muted)]/50 text-center text-xs font-semibold text-[var(--text-muted)] py-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* 42 Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[var(--border)]/60">
            {monthGrid.map((cell) => {
              const dayTasks = tasksByDate[cell.date] || [];

              return (
                <div
                  key={cell.date}
                  onClick={() => onSelectDate(cell.date)}
                  className={`min-h-[105px] p-2 flex flex-col gap-1 transition-colors hover:bg-[var(--surface-muted)]/30 cursor-pointer ${
                    !cell.isCurrentMonth ? "opacity-35 bg-[var(--surface-muted)]/15" : ""
                  } ${cell.isToday ? "bg-[var(--primary-soft)]/20" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                        cell.isToday
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--text)]"
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Chips */}
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80 ${
                          task.status === "completed"
                            ? "bg-[var(--surface-muted)] text-[var(--text-muted)] line-through"
                            : task.priority === "urgent"
                            ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                            : task.priority === "high"
                            ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                            : "bg-[var(--primary-soft)] text-[var(--primary)]"
                        }`}
                        title={task.title}
                      >
                        {task.due_time && (
                          <span className="font-mono mr-1">
                            {task.due_time.substring(0, 5)}
                          </span>
                        )}
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-[var(--text-muted)] font-medium pl-1">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {mode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayTasks = tasksByDate[day.date] || [];

            return (
              <div
                key={day.date}
                className={`flex flex-col rounded-2xl border p-3 min-h-[350px] transition-all bg-[var(--surface)] ${
                  day.isToday
                    ? "border-[var(--primary)] shadow-sm bg-[var(--primary-soft)]/10"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-2">
                  <div>
                    <span className="block text-xs font-semibold uppercase text-[var(--text-muted)]">
                      {day.dayShort}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        day.isToday ? "text-[var(--primary)]" : "text-[var(--text)]"
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectDate(day.date)}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                    title={`Add task on ${day.dayShort}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Day's Tasks */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="group flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs hover:border-[var(--primary)]/60 cursor-pointer transition-all"
                    >
                      <span
                        className={`font-medium line-clamp-2 ${
                          task.status === "completed"
                            ? "line-through text-[var(--text-muted)]"
                            : "text-[var(--text)]"
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.due_time && (
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{formatISTTime(task.due_time)}</span>
                        </div>
                      )}

                      {task.priority !== "medium" && (
                        <div className="pt-0.5">
                          <Badge variant={task.priority} className="text-[9px] py-0 px-1.5">
                            {task.priority.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}

                  {dayTasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-center text-xs text-[var(--text-muted)]/60 border border-dashed border-[var(--border)] rounded-xl p-3">
                      Free
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
