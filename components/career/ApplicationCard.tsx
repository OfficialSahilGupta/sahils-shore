"use client";

// ============================================================================
// Sahil's Shore: Application Kanban Card Component
// Displays role, company, location, salary range (INR), source, resume chip,
// follow-up status, and actions.
// ============================================================================

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Application } from "@/types/career";
import { formatSalaryRange } from "@/lib/career";
import { toISTDateString, todayIST } from "@/lib/date-utils";
import {
  Building2,
  MapPin,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApplicationCardProps {
  application: Application;
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onMarkFollowedUp?: (application: Application) => void;
  isOverlay?: boolean;
}

export function ApplicationCard({
  application,
  onEdit,
  onDelete,
  onMarkFollowedUp,
  isOverlay = false,
}: ApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application.id,
    data: { application },
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const today = todayIST();
  const followUpDateStr = application.next_follow_up
    ? toISTDateString(application.next_follow_up)
    : null;

  const isFollowUpOverdue = followUpDateStr && followUpDateStr < today;
  const isFollowUpToday = followUpDateStr && followUpDateStr === today;
  const hasFollowUp = followUpDateStr !== null;

  const salaryDisplay = formatSalaryRange(
    application.salary_min_paise,
    application.salary_max_paise,
    application.salary_range
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all ${
        isOverlay ? "rotate-2 scale-105 shadow-xl border-primary ring-2 ring-primary/20 z-50" : ""
      }`}
    >
      {/* Top Header: Company, Drag Handle & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text p-0.5 -ml-1 rounded transition-colors touch-none"
            aria-label="Drag application card"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors">
              {application.role}
            </h4>
            <div className="flex items-center gap-1 text-xs text-text-muted truncate">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="font-medium text-text/90">{application.company}</span>
            </div>
          </div>
        </div>

        {/* Quick External Link & Edit Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          {application.job_url && (
            <a
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-text-muted hover:text-primary hover:bg-surface-muted rounded transition-colors"
              title="Open job link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => onEdit(application)}
            className="p-1 text-text-muted hover:text-text hover:bg-surface-muted rounded transition-colors"
            title="Edit application"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(application.id)}
            className="p-1 text-text-muted hover:text-rose-500 hover:bg-surface-muted rounded transition-colors"
            title="Delete application"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Meta chips: Location & Salary (in INR) */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
        {application.location && (
          <span className="inline-flex items-center gap-1 bg-surface-muted/60 px-2 py-0.5 rounded-md border border-border/40">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[120px]">{application.location}</span>
          </span>
        )}
        {salaryDisplay !== "Not specified" && (
          <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            {salaryDisplay}
          </span>
        )}
      </div>

      {/* Source & Resume Version tags */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {application.source && (
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 bg-surface-muted/50 border-border/60">
            {application.source}
          </Badge>
        )}
        {application.resume?.version_label && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded"
            title={`Resume used: ${application.resume.title || application.resume.version_label}`}
          >
            <FileText className="w-2.5 h-2.5" />
            {application.resume.version_label}
          </span>
        )}
      </div>

      {/* Footer: Follow-up status or Applied Date */}
      {hasFollowUp && application.stage !== "rejected" && application.stage !== "offer" && (
        <div
          className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] ${
            isFollowUpOverdue
              ? "border-rose-500/20 text-rose-600 dark:text-rose-400"
              : isFollowUpToday
              ? "border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold"
              : "border-border/50 text-text-muted"
          }`}
        >
          <div className="flex items-center gap-1">
            {isFollowUpOverdue ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>
              {isFollowUpOverdue
                ? `Follow-up overdue (${followUpDateStr})`
                : isFollowUpToday
                ? "Follow-up due TODAY"
                : `Follow-up: ${followUpDateStr}`}
            </span>
          </div>

          {onMarkFollowedUp && (
            <button
              onClick={() => onMarkFollowedUp(application)}
              className="text-[10px] font-medium underline hover:text-primary transition-colors cursor-pointer"
            >
              Follow up
            </button>
          )}
        </div>
      )}
    </div>
  );
}
