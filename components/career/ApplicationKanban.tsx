"use client";

// ============================================================================
// Sahil's Shore: Application Kanban Board Component
// 5 Columns: Wishlist, Applied, Interview, Offer, Rejected
// Drag-and-drop powered by @dnd-kit
// ============================================================================

import React, { useState } from "react";
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
} from "@dnd-kit/sortable";
import type { Application, ApplicationStage } from "@/types/career";
import { APPLICATION_STAGES } from "@/lib/career";
import { ApplicationCard } from "./ApplicationCard";
import { Plus, Inbox, Send, Users, Award, ArchiveX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationKanbanProps {
  applications: Application[];
  onMoveApplication: (
    applicationId: string,
    newStage: ApplicationStage,
    company: string,
    role: string
  ) => void;
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (id: string) => void;
  onQuickAdd: (stage: ApplicationStage) => void;
  onMarkFollowedUp: (application: Application) => void;
}

const STAGE_ICONS: Record<ApplicationStage, React.ReactNode> = {
  wishlist: <Inbox className="w-4 h-4 text-slate-500" />,
  applied: <Send className="w-4 h-4 text-blue-500" />,
  interview: <Users className="w-4 h-4 text-amber-500" />,
  offer: <Award className="w-4 h-4 text-emerald-500" />,
  rejected: <ArchiveX className="w-4 h-4 text-rose-500" />,
};

interface ColumnProps {
  stage: (typeof APPLICATION_STAGES)[0];
  applications: Application[];
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onQuickAdd: (stage: ApplicationStage) => void;
  onMarkFollowedUp: (application: Application) => void;
}

function KanbanColumn({
  stage,
  applications,
  onEdit,
  onDelete,
  onQuickAdd,
  onMarkFollowedUp,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage: stage.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] max-w-[340px] rounded-2xl border bg-surface/60 p-3 transition-colors ${
        isOver ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border/70"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          {STAGE_ICONS[stage.id]}
          <span className="font-bold text-sm text-text">{stage.label}</span>
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full bg-surface-muted text-text-muted">
            {applications.length}
          </span>
        </div>
        <button
          onClick={() => onQuickAdd(stage.id)}
          className="p-1 text-text-muted hover:text-primary hover:bg-surface-muted rounded-md transition-colors"
          title={`Add application to ${stage.label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Column Cards (Sortable Droppable List) */}
      <SortableContext
        items={applications.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[160px] pr-0.5">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkFollowedUp={onMarkFollowedUp}
            />
          ))}

          {applications.length === 0 && (
            <div
              onClick={() => onQuickAdd(stage.id)}
              className="flex-1 min-h-[120px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-4 text-center text-text-muted hover:text-text hover:border-primary/40 hover:bg-surface-muted/30 cursor-pointer transition-colors"
            >
              <Plus className="w-5 h-5 mb-1 opacity-60" />
              <p className="text-xs font-medium">Drop here or click to add</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function ApplicationKanban({
  applications,
  onMoveApplication,
  onEditApplication,
  onDeleteApplication,
  onQuickAdd,
  onMarkFollowedUp,
}: ApplicationKanbanProps) {
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);

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

  // Group applications by stage
  const applicationsByStage: Record<ApplicationStage, Application[]> = {
    wishlist: [],
    applied: [],
    interview: [],
    offer: [],
    rejected: [],
  };

  applications.forEach((app) => {
    const stage = app.stage || "wishlist";
    if (applicationsByStage[stage]) {
      applicationsByStage[stage].push(app);
    } else {
      applicationsByStage.wishlist.push(app);
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a.id === event.active.id);
    if (app) setActiveApplication(app);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApplication(null);

    if (!over) return;

    const activeApp = applications.find((a) => a.id === active.id);
    if (!activeApp) return;

    // Determine target stage
    let targetStage: ApplicationStage | null = null;

    // 1. Did we drop directly on a column droppable?
    const validStages: ApplicationStage[] = ["wishlist", "applied", "interview", "offer", "rejected"];
    if (validStages.includes(over.id as ApplicationStage)) {
      targetStage = over.id as ApplicationStage;
    } else {
      // 2. Or did we drop over another application card?
      const overApp = applications.find((a) => a.id === over.id);
      if (overApp) {
        targetStage = overApp.stage;
      }
    }

    if (targetStage && targetStage !== activeApp.stage) {
      onMoveApplication(activeApp.id, targetStage, activeApp.company, activeApp.role);
    }
  };

  const customCollisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCorners(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start snap-x">
        {APPLICATION_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            applications={applicationsByStage[stage.id]}
            onEdit={onEditApplication}
            onDelete={onDeleteApplication}
            onQuickAdd={onQuickAdd}
            onMarkFollowedUp={onMarkFollowedUp}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeApplication ? (
          <ApplicationCard
            application={activeApplication}
            onEdit={() => {}}
            onDelete={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
