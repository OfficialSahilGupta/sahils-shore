"use client";

// ============================================================================
// Sahil's Shore: Album Manager Modal
// Organize photos and videos into custom albums with safe deletion options
// ============================================================================

import React, { useState } from "react";
import {
  X,
  FolderPlus,
  Folder,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
  Loader2,
  Calendar,
  ImagePlus,
  Edit2,
} from "lucide-react";
import type { Album } from "@/lib/media";
import { todayIST, formatISTDate } from "@/lib/date-utils";

interface AlbumManagerProps {
  albums: Album[];
  activeAlbumId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAlbum: (albumId: string | null) => void;
  onCreateAlbum: (title: string, description?: string, albumDate?: string) => Promise<void>;
  onUpdateAlbum?: (albumId: string, updates: { title?: string; albumDate?: string }) => Promise<void>;
  onDeleteAlbum: (albumId: string, deletePhotosInside: boolean) => Promise<void>;
  onOpenAddPastMedia?: (album: Album) => void;
}

export function AlbumManager({
  albums,
  activeAlbumId,
  isOpen,
  onClose,
  onSelectAlbum,
  onCreateAlbum,
  onUpdateAlbum,
  onDeleteAlbum,
  onOpenAddPastMedia,
}: AlbumManagerProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(todayIST());
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editing state for existing albums
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const isoDate = newDate ? new Date(`${newDate}T12:00:00Z`).toISOString() : undefined;
      await onCreateAlbum(newTitle.trim(), newDesc.trim() || undefined, isoDate);
      setNewTitle("");
      setNewDesc("");
      setNewDate(todayIST());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create album";
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (albumId: string) => {
    if (!editingTitle.trim() || !onUpdateAlbum) return;
    setIsSavingEdit(true);
    try {
      const isoDate = editingDate ? new Date(`${editingDate}T12:00:00Z`).toISOString() : undefined;
      await onUpdateAlbum(albumId, {
        title: editingTitle.trim(),
        albumDate: isoDate,
      });
      setEditingAlbumId(null);
    } catch (err: unknown) {
      console.error("Failed to update album:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExecuteDelete = async (deletePhotos: boolean) => {
    if (!albumToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteAlbum(albumToDelete.id, deletePhotos);
      setAlbumToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-text">Photo & Video Albums</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Create Album Form */}
        <form onSubmit={handleCreate} className="p-4 border-b border-border bg-surface-muted/30 space-y-3">
          <div className="text-xs font-semibold text-text flex items-center gap-1.5">
            <FolderPlus className="h-3.5 w-3.5 text-primary" />
            <span>Create New Album</span>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Album title (e.g., Summer Travels, Goa 2024, Cafes)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Optional description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
                  title="Album date (past date for retro albums)"
                />
              </div>
            </div>
          </div>
          {createError && (
            <p className="text-[11px] text-danger bg-danger/10 p-2 rounded-lg border border-danger/20">
              {createError}
            </p>
          )}

          <button
            type="submit"
            disabled={!newTitle.trim() || isCreating}
            className="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Creating Album...</span>
              </>
            ) : (
              <span>Create Album</span>
            )}
          </button>
        </form>

        {/* Albums List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Option for All Items */}
          <button
            type="button"
            onClick={() => {
              onSelectAlbum(null);
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
              activeAlbumId === null
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border hover:bg-surface-muted text-text"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Folder className="h-4 w-4 text-primary" />
              <span>All Media (No Album Filter)</span>
            </div>
            {activeAlbumId === null && <Check className="h-4 w-4 text-primary" />}
          </button>

          {albums.map((album) => {
            const isSelected = activeAlbumId === album.id;
            const isEditing = editingAlbumId === album.id;
            const rawDate = album.album_date || album.created_at;
            const formattedDate = rawDate ? formatISTDate(rawDate) : null;

            if (isEditing) {
              return (
                <div
                  key={album.id}
                  className="rounded-xl border border-primary/50 bg-primary/5 p-3 text-xs space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-primary text-xs">
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Album</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Album title"
                      className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="date"
                          value={editingDate}
                          onChange={(e) => setEditingDate(e.target.value)}
                          className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
                          title="Preferred album date (past or present)"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!editingTitle.trim() || isSavingEdit}
                        onClick={() => handleSaveEdit(album.id)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1 shrink-0"
                      >
                        {isSavingEdit ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSavingEdit}
                        onClick={() => setEditingAlbumId(null)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-muted transition-colors shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={album.id}
                className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:bg-surface-muted text-text"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectAlbum(album.id);
                    onClose();
                  }}
                  className="flex flex-1 items-center gap-2.5 text-left min-w-0 pr-2"
                >
                  <Folder className="h-4 w-4 text-primary shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-text truncate">{album.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                      <span>
                        {album.item_count || 0} {album.item_count === 1 ? "item" : "items"}
                      </span>
                      {formattedDate && (
                        <span className="flex items-center gap-0.5 text-text-muted">
                          • {formattedDate}
                        </span>
                      )}
                      {album.description && (
                        <span className="truncate max-w-[120px]">• {album.description}</span>
                      )}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  {isSelected && <Check className="h-4 w-4 text-primary mr-1" />}
                  {onOpenAddPastMedia && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAddPastMedia(album);
                      }}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title={`Add past pictures to ${album.title}`}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onUpdateAlbum && (
                    <button
                      type="button"
                      onClick={() => {
                        const effectiveDateStr = album.album_date || album.created_at;
                        setEditingAlbumId(album.id);
                        setEditingTitle(album.title);
                        setEditingDate(effectiveDateStr ? effectiveDateStr.slice(0, 10) : todayIST());
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface transition-colors"
                      title={`Edit album ${album.title}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAlbumToDelete(album)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-surface transition-colors"
                    title={`Delete album ${album.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {albumToDelete && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface/95 p-6 backdrop-blur-md text-center animate-in fade-in duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h4 className="text-base font-bold text-text mb-1">
              Delete &quot;{albumToDelete.title}&quot;?
            </h4>
            <p className="text-xs text-text-muted mb-5 max-w-xs">
              This album contains {albumToDelete.item_count || 0}{" "}
              {albumToDelete.item_count === 1 ? "photo/video" : "photos/videos"}.
              Please choose how you want to handle them:
            </p>

            <div className="w-full space-y-2.5">
              {/* Option 1: Keep photos */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleExecuteDelete(false)}
                className="w-full rounded-xl border border-border bg-surface-muted/60 p-3 text-left hover:bg-surface-muted hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-text group-hover:text-primary">
                    Keep photos in gallery
                  </span>
                  <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Removes the album folder only. All {albumToDelete.item_count || 0} photos remain visible in your gallery under &quot;All Media&quot;.
                </p>
              </button>

              {/* Option 2: Delete album AND photos */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleExecuteDelete(true)}
                className="w-full rounded-xl border border-danger/30 bg-danger/10 p-3 text-left hover:bg-danger/20 hover:border-danger/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-danger">
                    Delete album AND all photos inside
                  </span>
                  <span className="text-[10px] rounded bg-danger/20 text-danger px-1.5 py-0.5 font-bold">
                    Permanent
                  </span>
                </div>
                <p className="text-[11px] text-danger/80 leading-relaxed">
                  Permanently deletes both the album and all {albumToDelete.item_count || 0} media items from your gallery.
                </p>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAlbumToDelete(null)}
                className="w-full rounded-xl py-2 text-xs font-medium text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
