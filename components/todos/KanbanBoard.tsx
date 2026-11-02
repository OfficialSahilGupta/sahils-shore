"use client";

// ============================================================================
// Sahil's Shore: Kanban Board View with @dnd-kit
// Columns: Backlog, Today, Doing, Done
// Supports drag and drop between columns and into empty columns
// ============================================================================

import React, { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  pointerWithin,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithSubtasks } from "@/lib/todos";
import { isTodayIST } from "@/lib/date-utils";
import { Plus, GripVertical, CheckCircle2, Clock, Inbox, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type KanbanColumnId = "backlog" | "today" | "doing" | "done";

interface KanbanBoardProps {
  tasks: TaskWithSubtasks[];
  onMoveTask: (taskId: string, targetColumn: KanbanColumnId) => void;
  onEditTask: (task: TaskWithSubtasks) => void;
  onQuickAdd: (column: KanbanColumnId) => void;
}

interface ColumnDef {
  id: KanbanColumnId;
  title: string;
  icon: React.ReactNode;
  colorClass: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: "backlog",
    title: "Backlog",
    icon: <Inbox className="h-4 w-4" />,
    colorClass: "text-[var(--text-muted)]",
  },
  {
    id: "today",
    title: "Today",
    icon: <Clock className="h-4 w-4" />,
    colorClass: "text-[var(--primary)]",
  },
  {
    id: "doing",
    title: "Doing",
    icon: <PlayCircle className="h-4 w-4" />,
    colorClass: "text-[var(--warning)]",
  },
  {
    id: "done",
    title: "Done",
    icon: <CheckCircle2 className="h-4 w-4" />,
    colorClass: "text-[var(--success)]",
  },
];

// Helper to partition tasks into the 4 columns
export function categorizeTask(task: TaskWithSubtasks): KanbanColumnId {
  if (task.status === "completed") return "done";
  if (task.status === "in_progress") return "doing";
  if (isTodayIST(task.due_date)) return "today";
  return "backlog";
}

// Draggable Task Card in Kanban
function SortableTaskCard({
  task,
  onEdit,
}: {
  task: TaskWithSubtasks;
  onEdit: (task: TaskWithSubtasks) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs transition-all cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/60 hover:shadow-sm select-none ${
        isDragging ? "ring-2 ring-[var(--primary)] shadow-lg" : ""
      }`}
      onClick={(e) => {
        // Only trigger edit if not dragging
        if (!isDragging) {
          onEdit(task);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-medium leading-snug line-clamp-2 ${
            task.status === "completed"
              ? "line-through text-[var(--text-muted)]"
              : "text-[var(--text)]"
          }`}
        >
          {task.title}
        </span>
        <div
          className="text-[var(--text-muted)] group-hover:text-[var(--text)] p-0.5 flex-shrink-0"
          title="Drag card"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
        {task.priority !== "medium" && (
          <Badge variant={task.priority} className="text-[9px] py-0 px-1.5">
            {task.priority.toUpperCase()}
          </Badge>
        )}
        {task.tags &&
          task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-[var(--surface-muted)] px-1 py-0.5 text-[var(--text-muted)]"
            >
              #{tag}
            </span>
          ))}
        {task.subtasks.length > 0 && (
          <span className="text-[var(--text-muted)] ml-auto font-mono">
            {task.subtasks.filter((s) => s.is_completed).length}/{task.subtasks.length}
          </span>
        )}
      </div>
    </div>
  );
}

// Droppable Kanban Column
function KanbanColumn({
  col,
  tasks,
  onEditTask,
  onQuickAdd,
}: {
  col: ColumnDef;
  tasks: TaskWithSubtasks[];
  onEditTask: (task: TaskWithSubtasks) => void;
  onQuickAdd: (column: KanbanColumnId) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
    data: { type: "column", columnId: col.id },
  });

  return (
    <div
      ref={setNodeRef}
      id={col.id}
      className={`w-full min-w-0 flex flex-col rounded-2xl border transition-all p-3 min-h-[480px] ${
        isOver
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-[var(--primary-soft)]/15"
          : "border-[var(--border)] bg-[var(--surface-muted)]/30"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/50 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={col.colorClass}>{col.icon}</span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
            {col.title}
          </h3>
          <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-muted)]">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAdd(col.id)}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
          title={`Add task to ${col.title}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tasks List in Column */}
      <SortableContext
        id={col.id}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 min-h-[150px]">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
            />
          ))}

          {tasks.length === 0 && (
            <div
              className={`flex flex-1 items-center justify-center rounded-xl border border-dashed p-4 text-center text-xs transition-colors ${
                isOver
                  ? "border-[var(--primary)] text-[var(--primary)] font-medium"
                  : "border-[var(--border)]/60 text-[var(--text-muted)]"
              }`}
            >
              {isOver ? "Release to drop" : "Drop tasks here"}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  onMoveTask,
  onEditTask,
  onQuickAdd,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<TaskWithSubtasks | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnTasks = useMemo(() => {
    const map: Record<KanbanColumnId, TaskWithSubtasks[]> = {
      backlog: [],
      today: [],
      doing: [],
      done: [],
    };
    tasks.forEach((t) => {
      const col = categorizeTask(t);
      map[col].push(t);
    });
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  // Custom collision detection favoring pointer collisions over container and cards
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    let targetCol: KanbanColumnId | null = null;

    if (COLUMNS.some((c) => c.id === overId)) {
      targetCol = overId as KanbanColumnId;
    } else if (over.data?.current?.type === "column") {
      targetCol = over.data.current.columnId;
    } else {
      // Hovering over another card: find which column that card belongs to
      const overTask =
        tasks.find((t) => t.id === overId) ||
        (over.data?.current?.task as TaskWithSubtasks | undefined);
      if (overTask) {
        targetCol = categorizeTask(overTask);
      }
    }

    if (targetCol) {
      const currentTask = tasks.find((t) => t.id === activeId);
      if (currentTask && categorizeTask(currentTask) !== targetCol) {
        onMoveTask(activeId, targetCol);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={columnTasks[col.id] || []}
            onEditTask={onEditTask}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rounded-xl border-2 border-[var(--primary)] bg-[var(--surface)] p-3 shadow-2xl opacity-95 rotate-1 max-w-[280px]">
            <span className="text-xs font-semibold text-[var(--text)] line-clamp-2">
              {activeTask.title}
            </span>
            <div className="flex items-center gap-1.5 pt-2 text-[10px]">
              {activeTask.priority !== "medium" && (
                <Badge variant={activeTask.priority} className="text-[9px] py-0 px-1.5">
                  {activeTask.priority.toUpperCase()}
                </Badge>
              )}
              {activeTask.tags && activeTask.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded bg-[var(--surface-muted)] px-1 py-0.5 text-[var(--text-muted)]">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
