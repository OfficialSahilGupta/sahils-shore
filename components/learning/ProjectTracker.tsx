"use client";

// ============================================================================
// Sahil's Shore: Project Tracker Component
// Track engineering portfolio projects, tech stack, repo links, and README notes
// ============================================================================

import React, { useState } from "react";
import {
  FolderGit2,
  Plus,
  ExternalLink,
  Github,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  FileText,
} from "lucide-react";
import type { Project } from "@/types";
import type { CreateProjectInput } from "@/lib/learning";
import { Select } from "@/components/ui/select";
import { SafeDeleteModal } from "./SafeDeleteModal";

interface ProjectTrackerProps {
  projects: Project[];
  activeTrackId: string | null;
  onSaveProject: (input: CreateProjectInput, projectId?: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
}

export function ProjectTracker({
  projects,
  activeTrackId,
  onSaveProject,
  onDeleteProject,
}: ProjectTrackerProps) {
  const [filter, setFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [readmeModalProject, setReadmeModalProject] = useState<Project | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [status, setStatus] = useState<Project["status"]>("in_progress");
  const [repoUrl, setRepoUrl] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");
  const [readmeNotes, setReadmeNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const openAddModal = () => {
    setEditingProject(null);
    setTitle("");
    setDescription("");
    setTechStackInput("");
    setStatus("in_progress");
    setRepoUrl("");
    setDeployedUrl("");
    setReadmeNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setTitle(p.title);
    setDescription(p.description || "");
    setTechStackInput((p.tech_stack || []).join(", "));
    setStatus(p.status);
    setRepoUrl(p.repo_url || "");
    setDeployedUrl(p.deployed_url || "");
    setReadmeNotes(p.readme_notes || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const stack = techStackInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSaveProject(
        {
          track_id: activeTrackId,
          title: title.trim(),
          description: description.trim() || null,
          tech_stack: stack,
          status,
          repo_url: repoUrl.trim() || null,
          deployed_url: deployedUrl.trim() || null,
          readme_notes: readmeNotes.trim() || null,
        },
        editingProject?.id
      );
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (project: Project) => {
    setProjectToDelete(project);
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--surface-muted)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-[var(--primary)]" />
            Project Tracker
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Showcase full-stack repositories, live deployments, and architecture notes
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        {(["all", "in_progress", "completed", "deployed", "idea"] as const).map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                filter === s
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "border border-[var(--surface-muted)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
              }`}
            >
              {s === "all" ? `All (${projects.length})` : s.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--surface-muted)] p-8 text-center">
          <FolderGit2 className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No projects found
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add a project or choose from the mini-project ideas list to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => {
            const statusClass =
              p.status === "deployed"
                ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                : p.status === "completed"
                  ? "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30"
                  : p.status === "in_progress"
                    ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
                    : "bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--surface-muted)]";

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/15 p-4 space-y-3 hover:border-[var(--primary)]/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-[var(--text)]">
                    {p.title}
                  </h4>
                  {p.description && (
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  {/* Tech stack chips */}
                  {p.tech_stack && p.tech_stack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-[var(--surface-muted)]/80 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Links and README trigger */}
                <div className="pt-2 border-t border-[var(--surface-muted)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {p.repo_url && (
                      <a
                        href={p.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[var(--primary)] hover:underline font-medium"
                      >
                        <Github className="h-3.5 w-3.5" />
                        <span>Repo</span>
                      </a>
                    )}
                    {p.deployed_url && (
                      <a
                        href={p.deployed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[var(--success)] hover:underline font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>

                  {p.readme_notes && (
                    <button
                      type="button"
                      onClick={() => setReadmeModalProject(p)}
                      className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>README</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--surface-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text)]">
                {editingProject ? "Edit Project" : "Add Project"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Scheduler"
                  className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What problem does this project solve? Key architecture highlights..."
                  className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-2.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Status
                  </label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Project["status"])}
                    size="md"
                    containerClassName="w-full"
                  >
                    <option value="idea">Idea</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="deployed">Deployed</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Tech Stack (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    placeholder="Spring Boot, PostgreSQL, Docker..."
                    className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                    <Github className="h-3 w-3" /> Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Deployed URL
                  </label>
                  <input
                    type="url"
                    value={deployedUrl}
                    onChange={(e) => setDeployedUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> README & Architecture Notes
                </label>
                <textarea
                  rows={4}
                  value={readmeNotes}
                  onChange={(e) => setReadmeNotes(e.target.value)}
                  placeholder="System design decisions, API endpoints, schema ER diagram notes, deployment steps..."
                  className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-2.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--surface-muted)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[var(--surface-muted)] px-3.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* README Notes Modal */}
      {readmeModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--surface-muted)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--primary)]" />
                {readmeModalProject.title} — README Notes
              </h3>
              <button
                onClick={() => setReadmeModalProject(null)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed bg-[var(--surface-muted)]/20 p-4 rounded-xl border border-[var(--surface-muted)] font-mono">
              {readmeModalProject.readme_notes}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReadmeModalProject(null)}
                className="rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Delete Modal for Project */}
      {projectToDelete && (
        <SafeDeleteModal
          isOpen={Boolean(projectToDelete)}
          onClose={() => setProjectToDelete(null)}
          onConfirm={async () => {
            if (projectToDelete) {
              await onDeleteProject(projectToDelete.id);
              setProjectToDelete(null);
            }
          }}
          title="Delete Project Showcase"
          itemName={projectToDelete.title}
          itemType="project"
          warningText={`This will permanently remove project "${projectToDelete.title}" and its readme documentation from this track.`}
        />
      )}
    </div>
  );
}
