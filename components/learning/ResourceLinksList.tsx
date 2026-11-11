"use client";

// ============================================================================
// Sahil's Shore: Resource Links Directory
// Curated documentation, official tutorials, and high-signal practice resources
// ============================================================================

import React, { useState } from "react";
import {
  Bookmark,
  ExternalLink,
  Plus,
  Trash2,
  BookOpen,
  Video,
  FileCode,
  Compass,
  X,
} from "lucide-react";
import type { ResourceLink } from "@/types";
import type { CreateResourceLinkInput } from "@/lib/learning";
import { Select } from "@/components/ui/select";
import { SafeDeleteModal } from "./SafeDeleteModal";
import { ModalPortal } from "@/components/ui/modal-portal";

interface ResourceLinksListProps {
  resources: ResourceLink[];
  activeTrackId: string | null;
  onAddResource: (input: CreateResourceLinkInput) => Promise<void>;
  onDeleteResource: (linkId: string) => Promise<void>;
}

export function ResourceLinksList({
  resources,
  activeTrackId,
  onAddResource,
  onDeleteResource,
}: ResourceLinksListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Documentation");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<ResourceLink | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddResource({
        track_id: activeTrackId,
        title: title.trim(),
        url: url.trim(),
        category,
        description: description.trim() || null,
      });
      setTitle("");
      setUrl("");
      setDescription("");
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (resource: ResourceLink) => {
    setResourceToDelete(resource);
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    await onDeleteResource(resourceToDelete.id);
    setResourceToDelete(null);
  };

  const filteredResources = resources.filter((r) => {
    if (categoryFilter === "all") return true;
    return r.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("video")) return <Video className="h-4 w-4" />;
    if (c.includes("practice")) return <FileCode className="h-4 w-4" />;
    if (c.includes("tutorial")) return <Compass className="h-4 w-4" />;
    return <BookOpen className="h-4 w-4" />;
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--surface-muted)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[var(--primary)]" />
            Resource Links & Documentation
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Curated books, official guides, benchmarks, and deep-dive references
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        {(["all", "Documentation", "Tutorial", "Practice", "Video"] as const).map(
          (c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                categoryFilter.toLowerCase() === c.toLowerCase()
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "border border-[var(--surface-muted)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
              }`}
            >
              {c === "all" ? `All (${resources.length})` : c}
            </button>
          )
        )}
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--surface-muted)] p-8 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No resources found
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add documentation links or adjust your category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="flex items-start justify-between rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/15 p-4 hover:border-[var(--primary)]/40 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                  {getCategoryIcon(res.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      {res.category}
                    </span>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm font-bold text-[var(--text)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors group"
                  >
                    <span>{res.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                  </a>
                  {res.description && (
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                      {res.description}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteClick(res)}
                className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] transition-colors shrink-0"
                title="Delete Resource"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--surface-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text)]">
                Add Resource Link
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
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High-Performance Java Persistence"
                  className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Category
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: "Documentation", label: "Documentation" },
                    { value: "Tutorial", label: "Tutorial" },
                    { value: "Practice", label: "Practice" },
                    { value: "Video", label: "Video" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this valuable? Key topics covered..."
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
                  disabled={isSubmitting || !title.trim() || !url.trim()}
                  className="rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Safe Delete Confirmation Modal */}
      {resourceToDelete && (
        <SafeDeleteModal
          isOpen={Boolean(resourceToDelete)}
          onClose={() => setResourceToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Resource Link"
          itemName={resourceToDelete.title}
          itemType="project"
          warningText={`Are you sure you want to remove "${resourceToDelete.title}" from your reference directory?`}
        />
      )}
    </div>
  );
}
