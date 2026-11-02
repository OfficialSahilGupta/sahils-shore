"use client";

// ============================================================================
// Sahil's Shore: Time-Blocking Day Planner
// Drag & drop tasks onto a day timeline (IST) with 30-minute slots (06:00 to 23:30)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  GripVertical,
  Plus,
} from "lucide-react";
import type { TaskWithSubtasks } from "@/lib/todos";
import {
  todayIST,
  addDaysIST,
  formatFriendlyISTDate,
  formatISTTime,
} from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";

interface DayPlannerProps {
  tasks: TaskWithSubtasks[];
  onScheduleTask: (taskId: string, date: string, time: string) => void;
  onUnscheduleTask: (taskId: string) => void;
  onSelectTask: (task: TaskWithSubtasks) => void;
  onQuickAddAtSlot: (date: string, time: string) => void;
  onToggleComplete: (task: TaskWithSubtasks) => void;
}

// Generate 30-minute slots from 06:00 to 23:30
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    const hStr = hour < 10 ? `0${hour}` : `${hour}`;
    slots.push(`${hStr}:00`);
    slots.push(`${hStr}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// Draggable Unscheduled Task Card
function DraggableBacklogTask({
  task,
  onSelect,
}: {
  task: TaskWithSubtasks;
  onSelect: (t: TaskWithSubtasks) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-xs transition-all hover:border-[var(--primary)]/60 cursor-pointer ${
        isDragging ? "opacity-50 ring-2 ring-[var(--primary)]" : ""
      }`}
      onClick={() => onSelect(task)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--text)] truncate">
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-[var(--text-muted)]">
          {task.priority !== "medium" && (
            <Badge variant={task.priority} className="text-[9px] py-0 px-1">
              {task.priority.toUpperCase()}
            </Badge>
          )}
          <span>{task.duration_minutes || 30}m</span>
        </div>
      </div>

      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-md"
        title="Drag onto timeline slot"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

// Droppable Timeline Slot
function DroppableTimelineSlot({
  slotTime,
  scheduledTasks,
  onSelectTask,
  onUnscheduleTask,
  onQuickAdd,
  onToggleComplete,
}: {
  slotTime: string;
  scheduledTasks: TaskWithSubtasks[];
  onSelectTask: (t: TaskWithSubtasks) => void;
  onUnscheduleTask: (taskId: string) => void;
  onQuickAdd: (slotTime: string) => void;
  onToggleComplete: (t: TaskWithSubtasks) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slotTime}`,
    data: { slotTime },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group relative flex items-stretch min-h-[56px] border-b border-[var(--border)]/60 transition-colors ${
        isOver
          ? "bg-[var(--primary-soft)]/30 ring-2 ring-[var(--primary)]/50"
          : "hover:bg-[var(--surface-muted)]/20"
      }`}
    >
      {/* Time Label Column */}
      <div className="w-20 flex-shrink-0 flex items-start justify-end pr-3 pt-1 border-r border-[var(--border)]/60">
        <span className="text-[11px] font-mono font-medium text-[var(--text-muted)]">
          {formatISTTime(`${slotTime}:00`)}
        </span>
      </div>

      {/* Task Slot Content */}
      <div className="flex-1 p-1.5 flex flex-wrap gap-2 items-center min-w-0">
        {scheduledTasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 border text-xs shadow-xs transition-all max-w-md w-full ${
              task.status === "completed"
                ? "bg-[var(--surface-muted)]/50 border-[var(--border)] text-[var(--text-muted)] line-through"
                : task.priority === "urgent"
                ? "bg-[var(--danger)]/10 border-[var(--danger)]/30 text-[var(--text)]"
                : task.priority === "high"
                ? "bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--text)]"
                : "bg-[var(--primary-soft)]/20 border-[var(--primary)]/30 text-[var(--text)]"
            }`}
          >
            <div
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
              onClick={() => onSelectTask(task)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--success)]"
              >
                <CheckCircle2
                  className={`h-4 w-4 ${
                    task.status === "completed" ? "text-[var(--success)]" : ""
                  }`}
                />
              </button>
              <span className="font-medium truncate">{task.title}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono ml-auto">
                {task.duration_minutes || 30}m
              </span>
            </div>

            <button
              onClick={() => onUnscheduleTask(task.id)}
              className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1 rounded-md"
              title="Remove from slot"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {scheduledTasks.length === 0 && (
          <button
            onClick={() => onQuickAdd(slotTime)}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--primary)] px-2 py-1 rounded-lg transition-opacity"
          >
            <Plus className="h-3 w-3" />
            <span>Schedule task at {formatISTTime(`${slotTime}:00`)}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function DayPlanner({
  tasks,
  onScheduleTask,
  onUnscheduleTask,
  onSelectTask,
  onQuickAddAtSlot,
  onToggleComplete,
}: DayPlannerProps) {
  const [selectedDate, setSelectedDate] = useState(todayIST());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Unscheduled tasks: tasks that are not completed and either have no due_date or are due today but have no due_time
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== "completed" &&
        (!t.due_date || (t.due_date === selectedDate && !t.due_time))
    );
  }, [tasks, selectedDate]);

  // Tasks scheduled for the selected date
  const scheduledBySlot = useMemo(() => {
    const map: Record<string, TaskWithSubtasks[]> = {};
    TIME_SLOTS.forEach((slot) => {
      map[slot] = [];
    });

    tasks.forEach((t) => {
      if (t.due_date === selectedDate && t.due_time) {
        const slotKey = t.due_time.substring(0, 5); // "HH:MM"
        if (map[slotKey]) {
          map[slotKey].push(t);
        } else {
          // If odd time like 10:15, round or place in closest slot
          const hour = t.due_time.substring(0, 2);
          const min = parseInt(t.due_time.substring(3, 5), 10);
          const closestSlot = `${hour}:${min < 30 ? "00" : "30"}`;
          if (map[closestSlot]) {
            map[closestSlot].push(t);
          }
        }
      }
    });

    return map;
  }, [tasks, selectedDate]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    if (overId.startsWith("slot-")) {
      const slotTime = overId.replace("slot-", "");
      const taskId = active.id as string;
      onScheduleTask(taskId, selectedDate, `${slotTime}:00`);
    }
  };

  const handlePrevDay = () => setSelectedDate((d) => addDaysIST(d, -1));
  const handleNextDay = () => setSelectedDate((d) => addDaysIST(d, 1));
  const handleToday = () => setSelectedDate(todayIST());

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        {/* Date Navigator Header */}
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              {formatFriendlyISTDate(selectedDate)}
            </h2>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              ({selectedDate})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
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
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Unscheduled Drawer & 30-Minute Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Unscheduled / Backlog Tasks Dock */}
          <div className="lg:col-span-1 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 max-h-[700px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Unscheduled Dock
              </h3>
              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-mono text-[var(--text-muted)]">
                {unscheduledTasks.length}
              </span>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] mb-2">
              Drag tasks into any 30-minute slot on the right to block time.
            </p>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
              {unscheduledTasks.map((task) => (
                <DraggableBacklogTask
                  key={task.id}
                  task={task}
                  onSelect={onSelectTask}
                />
              ))}
              {unscheduledTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
                  All tasks scheduled!
                </div>
              )}
            </div>
          </div>

          {/* 30-Minute Timeline Grid */}
          <div className="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs max-h-[700px] overflow-y-auto">
            <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-muted)]/30">
              <span className="text-xs font-semibold text-[var(--text)]">
                Day Timeline (IST • 30-min slots)
              </span>
            </div>

            <div className="divide-y divide-[var(--border)]/40">
              {TIME_SLOTS.map((slot) => (
                <DroppableTimelineSlot
                  key={slot}
                  slotTime={slot}
                  scheduledTasks={scheduledBySlot[slot] || []}
                  onSelectTask={onSelectTask}
                  onUnscheduleTask={onUnscheduleTask}
                  onQuickAdd={(t) => onQuickAddAtSlot(selectedDate, `${t}:00`)}
                  onToggleComplete={onToggleComplete}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
