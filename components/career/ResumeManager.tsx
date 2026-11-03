"use client";

// ============================================================================
// Sahil's Shore: Resume Version Manager Component
// Displays resume cards, master toggle, Drive link, and linked applications.
// ============================================================================

import React, { useState } from "react";
import type { Application, CreateResumeInput, Resume } from "@/types/career";
import { ResumeUploadDialog } from "./ResumeUploadDialog";
import {
  FileText,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResumeManagerProps {
  resumes: Resume[];
  applications: Application[];
  onUploadResume: (input: CreateResumeInput) => Promise<void>;
  onSetMaster: (resumeId: string) => Promise<void>;
  onDeleteResume: (resumeId: string) => Promise<void>;
}

export function ResumeManager({
  resumes,
  applications,
  onUploadResume,
  onSetMaster,
  onDeleteResume,
}: ResumeManagerProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getApplicationsForResume = (resumeId: string) => {
    return applications.filter((app) => app.resume_id === resumeId);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resume version?")) {
      try {
        setDeletingId(id);
        await onDeleteResume(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
        <div>
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Resume Versions & Tailoring</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Manage tailored PDF resumes, set a default master version, and track which version was sent to which company.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Version</span>
        </Button>
      </div>

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-8 text-center flex flex-col items-center justify-center">
          <FileText className="w-10 h-10 text-primary/40 mb-2" />
          <h4 className="text-sm font-bold text-text mb-1">No resumes uploaded yet</h4>
          <p className="text-xs text-text-muted max-w-sm mb-4">
            Upload your master resume or role-tailored versions (Java/Spring Boot, MERN, Full Stack) to track where each was sent.
          </p>
          <Button onClick={() => setIsUploadOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Upload First Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => {
            const linkedApps = getApplicationsForResume(resume.id);

            return (
              <div
                key={resume.id}
                className={`relative rounded-2xl border p-4 bg-surface shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                  resume.is_primary
                    ? "border-amber-500/40 ring-1 ring-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10"
                    : "border-border/80 hover:border-primary/40"
                }`}
              >
                <div>
                  {/* Top Bar: Version tag & Master badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                        {resume.version_label}
                      </span>
                      {resume.target_role && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 bg-surface-muted/60">
                          {resume.target_role}
                        </Badge>
                      )}
                    </div>

                    {resume.is_primary ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Master
                      </span>
                    ) : (
                      <button
                        onClick={() => onSetMaster(resume.id)}
                        className="text-[10px] text-text-muted hover:text-amber-500 flex items-center gap-1 transition-colors p-1"
                        title="Set as master resume"
                      >
                        <Star className="w-3 h-3" />
                        Set Master
                      </button>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <h4 className="text-sm font-bold text-text truncate mb-1" title={resume.title}>
                    {resume.title}
                  </h4>

                  <div className="flex items-center gap-2 text-[11px] text-text-muted mb-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {resume.uploaded_date || resume.created_at.slice(0, 10)}
                    </span>
                    {resume.file_size > 0 && (
                      <span>· {(resume.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    )}
                  </div>

                  {/* Notes */}
                  {resume.notes && (
                    <p className="text-xs text-text-muted/90 bg-surface-muted/40 p-2 rounded-lg border border-border/40 line-clamp-2 mb-3">
                      {resume.notes}
                    </p>
                  )}

                  {/* Linked Applications Section */}
                  <div className="pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-text flex items-center gap-1 text-[11px]">
                        <Briefcase className="w-3 h-3 text-text-muted" />
                        Sent to Applications:
                      </span>
                      <span className="font-bold text-primary text-[11px]">
                        {linkedApps.length}
                      </span>
                    </div>

                    {linkedApps.length === 0 ? (
                      <p className="text-[11px] text-text-muted italic">
                        Not yet assigned to any applications.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {linkedApps.slice(0, 5).map((app) => (
                          <span
                            key={app.id}
                            className="inline-flex items-center gap-1 text-[10px] bg-surface-muted px-1.5 py-0.5 rounded text-text truncate max-w-[120px]"
                            title={`${app.role} at ${app.company}`}
                          >
                            <Building2 className="w-2.5 h-2.5 text-text-muted shrink-0" />
                            {app.company}
                          </span>
                        ))}
                        {linkedApps.length > 5 && (
                          <span className="text-[10px] text-text-muted self-center">
                            +{linkedApps.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between">
                  {resume.file_url ? (
                    <a
                      href={resume.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View PDF / Drive
                    </a>
                  ) : (
                    <span className="text-[11px] text-text-muted">No preview file</span>
                  )}

                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deletingId === resume.id}
                    className="p-1.5 text-text-muted hover:text-rose-500 rounded-lg transition-colors"
                    title="Delete resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <ResumeUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={onUploadResume}
      />
    </div>
  );
}
