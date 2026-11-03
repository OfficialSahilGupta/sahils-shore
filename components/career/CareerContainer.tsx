"use client";

// ============================================================================
// Sahil's Shore: Career Hub Top-Level Container
// Orchestrates Kanban, Resumes, Bullet Bank, STAR Stories, Company Notes, and Stats
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Application,
  ApplicationStage,
  BulletPoint,
  CompanyNote,
  CreateApplicationInput,
  CreateBulletInput,
  CreateCompanyNoteInput,
  CreateResumeInput,
  CreateStoryInput,
  InterviewStory,
  PrepChecklistItem,
  Resume,
} from "@/types/career";
import {
  getApplications,
  createApplication,
  updateApplicationStage,
  updateApplication,
  deleteApplication,
  markFollowedUp,
  getResumes,
  createResume,
  setMasterResume,
  deleteResume,
  getBulletPoints,
  createBulletPoint,
  updateBulletPoint,
  deleteBulletPoint,
  getStories,
  createStory,
  updateStory,
  deleteStory,
  recordPracticeSession,
  getCompanyNotes,
  saveCompanyNote,
  deleteCompanyNote,
} from "@/lib/career";
import { ApplicationKanban } from "./ApplicationKanban";
import { ApplicationDialog } from "./ApplicationDialog";
import { FollowUpRemindersBanner } from "./FollowUpRemindersBanner";
import { ResumeManager } from "./ResumeManager";
import { BulletPointBank } from "./BulletPointBank";
import { StoryBank } from "./StoryBank";
import { CompanyNotesView } from "./CompanyNotesView";
import { CareerStatsPanel } from "./CareerStatsPanel";
import {
  Briefcase,
  Layers,
  FileText,
  Sparkles,
  Building2,
  TrendingUp,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ActiveTab = "kanban" | "resumes" | "bullets" | "stories" | "companies" | "analytics";

export function CareerContainer() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("kanban");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Data Collections
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [stories, setStories] = useState<InterviewStory[]>([]);
  const [companyNotes, setCompanyNotes] = useState<CompanyNote[]>([]);

  // Application Modal state
  const [isAppDialogOpen, setIsAppDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [dialogStage, setDialogStage] = useState<ApplicationStage>("wishlist");

  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const [apps, res, bul, stor, comp] = await Promise.all([
        getApplications(supabase, user.id),
        getResumes(supabase, user.id),
        getBulletPoints(supabase, user.id),
        getStories(supabase, user.id),
        getCompanyNotes(supabase, user.id),
      ]);

      setApplications(apps);
      setResumes(res);
      setBullets(bul);
      setStories(stor);
      setCompanyNotes(comp);
    } catch (err: any) {
      console.error("Failed to load career hub data:", err);
      setError(err.message || "Failed to load career data.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --------------------------------------------------------------------------
  // Application Handlers
  // --------------------------------------------------------------------------
  const handleMoveApplication = async (
    applicationId: string,
    newStage: ApplicationStage,
    company: string,
    role: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic Update
    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
    );

    const success = await updateApplicationStage(
      supabase,
      user.id,
      applicationId,
      newStage,
      company,
      role
    );

    if (!success) {
      // Rollback on failure
      loadData();
    }
  };

  const handleOpenAddApp = (stage: ApplicationStage = "wishlist") => {
    setSelectedApp(null);
    setDialogStage(stage);
    setIsAppDialogOpen(true);
  };

  const handleOpenEditApp = (app: Application) => {
    setSelectedApp(app);
    setDialogStage(app.stage);
    setIsAppDialogOpen(true);
  };

  const handleSaveApplication = async (
    input: CreateApplicationInput,
    applicationId?: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (applicationId) {
      const updated = await updateApplication(supabase, user.id, applicationId, input);
      if (updated) {
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? updated : app))
        );
      }
    } else {
      const created = await createApplication(supabase, user.id, input);
      if (created) {
        setApplications((prev) => [created, ...prev]);
      }
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic
    setApplications((prev) => prev.filter((a) => a.id !== id));
    await deleteApplication(supabase, user.id, id);
  };

  const handleMarkFollowedUp = async (
    app: Application,
    nextDate: string | null = null,
    note: string = ""
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, next_follow_up: nextDate } : a))
    );

    await markFollowedUp(supabase, user.id, app, nextDate, note);
  };

  // --------------------------------------------------------------------------
  // Resume Handlers
  // --------------------------------------------------------------------------
  const handleUploadResume = async (input: CreateResumeInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const created = await createResume(supabase, user.id, input);
    if (created) {
      if (input.is_primary) {
        setResumes((prev) => [
          created,
          ...prev.map((r) => ({ ...r, is_primary: false })),
        ]);
      } else {
        setResumes((prev) => [created, ...prev]);
      }
    }
  };

  const handleSetMasterResume = async (resumeId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setResumes((prev) =>
      prev.map((r) => ({
        ...r,
        is_primary: r.id === resumeId,
      }))
    );

    await setMasterResume(supabase, user.id, resumeId);
  };

  const handleDeleteResume = async (resumeId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    await deleteResume(supabase, user.id, resumeId);
  };

  // --------------------------------------------------------------------------
  // Bullet Bank Handlers
  // --------------------------------------------------------------------------
  const handleSaveBullet = async (input: CreateBulletInput, existingId?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (existingId) {
      const updated = await updateBulletPoint(supabase, user.id, existingId, input);
      if (updated) {
        setBullets((prev) => prev.map((b) => (b.id === existingId ? updated : b)));
      }
    } else {
      const created = await createBulletPoint(supabase, user.id, input);
      if (created) {
        setBullets((prev) => [created, ...prev]);
      }
    }
  };

  const handleDeleteBullet = async (id: string) => {
    if (!confirm("Delete this bullet point?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setBullets((prev) => prev.filter((b) => b.id !== id));
    await deleteBulletPoint(supabase, user.id, id);
  };

  // --------------------------------------------------------------------------
  // STAR Story Handlers
  // --------------------------------------------------------------------------
  const handleSaveStory = async (input: CreateStoryInput, existingId?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (existingId) {
      const updated = await updateStory(supabase, user.id, existingId, input);
      if (updated) {
        setStories((prev) => prev.map((s) => (s.id === existingId ? updated : s)));
      }
    } else {
      const created = await createStory(supabase, user.id, input);
      if (created) {
        setStories((prev) => [created, ...prev]);
      }
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm("Delete this STAR story?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setStories((prev) => prev.filter((s) => s.id !== id));
    await deleteStory(supabase, user.id, id);
  };

  const handleSavePracticeSession = async (
    title: string,
    durationSeconds: number,
    rating: number,
    notes?: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await recordPracticeSession(
      supabase,
      user.id,
      title,
      durationSeconds,
      rating,
      notes
    );
  };

  // --------------------------------------------------------------------------
  // Company Note Handlers
  // --------------------------------------------------------------------------
  const handleSaveCompanyNote = async (
    input: CreateCompanyNoteInput,
    existingId?: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const saved = await saveCompanyNote(supabase, user.id, input, existingId);
    if (saved) {
      if (existingId) {
        setCompanyNotes((prev) => prev.map((cn) => (cn.id === existingId ? saved : cn)));
      } else {
        setCompanyNotes((prev) => [saved, ...prev]);
      }
    }
  };

  const handleDeleteCompanyNote = async (id: string) => {
    if (!confirm("Delete this company note?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setCompanyNotes((prev) => prev.filter((cn) => cn.id !== id));
    await deleteCompanyNote(supabase, user.id, id);
  };

  const handleToggleChecklistItem = async (
    noteId: string,
    updatedChecklist: PrepChecklistItem[]
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setCompanyNotes((prev) =>
      prev.map((cn) => (cn.id === noteId ? { ...cn, prep_checklist: updatedChecklist } : cn))
    );

    const target = companyNotes.find((cn) => cn.id === noteId);
    if (target) {
      await saveCompanyNote(
        supabase,
        user.id,
        {
          company: target.company,
          culture: target.culture,
          tech_stack: target.tech_stack,
          interview_process: target.interview_process,
          questions_asked: target.questions_asked,
          prep_checklist: updatedChecklist,
          notes: target.notes,
        },
        noteId
      );
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Banner & Module Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text">
                Resume & Career Hub
              </h1>
              <p className="text-xs text-text-muted">
                Applications pipeline, tailored resume versions, achievement bullet bank & STAR interview stories.
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Add Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            onClick={() => handleOpenAddApp("wishlist")}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            title="Refresh data"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Follow-up Reminders Alert Banner (Always surfaces when items pending) */}
      <FollowUpRemindersBanner
        applications={applications}
        onMarkFollowedUp={handleMarkFollowedUp}
      />

      {/* Tab Navigation Pill Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/70 scrollbar-none">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "kanban"
              ? "bg-primary text-white shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Applications Kanban</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("resumes")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "resumes"
              ? "bg-primary text-white shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Resume Versions</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-surface-muted text-text-muted">
            {resumes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("bullets")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "bullets"
              ? "bg-primary text-white shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Bullet-Point Bank</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-surface-muted text-text-muted">
            {bullets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("stories")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "stories"
              ? "bg-primary text-white shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>STAR Stories & Practice</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-surface-muted text-text-muted">
            {stories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("companies")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "companies"
              ? "bg-primary text-white shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Notes</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-surface-muted text-text-muted">
            {companyNotes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "analytics"
              ? "bg-primary text-white shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics & Funnel</span>
        </button>
      </div>

      {/* Main Tab Panels */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-xs font-medium">Loading your career workspace...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div>
          {activeTab === "kanban" && (
            <ApplicationKanban
              applications={applications}
              onMoveApplication={handleMoveApplication}
              onEditApplication={handleOpenEditApp}
              onDeleteApplication={handleDeleteApplication}
              onQuickAdd={handleOpenAddApp}
              onMarkFollowedUp={handleMarkFollowedUp}
            />
          )}

          {activeTab === "resumes" && (
            <ResumeManager
              resumes={resumes}
              applications={applications}
              onUploadResume={handleUploadResume}
              onSetMaster={handleSetMasterResume}
              onDeleteResume={handleDeleteResume}
            />
          )}

          {activeTab === "bullets" && (
            <BulletPointBank
              bullets={bullets}
              onSaveBullet={handleSaveBullet}
              onDeleteBullet={handleDeleteBullet}
            />
          )}

          {activeTab === "stories" && (
            <StoryBank
              stories={stories}
              onSaveStory={handleSaveStory}
              onDeleteStory={handleDeleteStory}
              onSavePracticeSession={handleSavePracticeSession}
            />
          )}

          {activeTab === "companies" && (
            <CompanyNotesView
              companyNotes={companyNotes}
              onSaveCompanyNote={handleSaveCompanyNote}
              onDeleteCompanyNote={handleDeleteCompanyNote}
              onToggleChecklistItem={handleToggleChecklistItem}
            />
          )}

          {activeTab === "analytics" && (
            <CareerStatsPanel applications={applications} />
          )}
        </div>
      )}

      {/* Global Application Creation / Edit Dialog */}
      <ApplicationDialog
        isOpen={isAppDialogOpen}
        onClose={() => setIsAppDialogOpen(false)}
        onSave={handleSaveApplication}
        application={selectedApp}
        initialStage={dialogStage}
        resumes={resumes}
      />
    </div>
  );
}
