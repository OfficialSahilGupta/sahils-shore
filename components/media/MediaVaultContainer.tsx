"use client";

// ============================================================================
// Sahil's Shore: Media Vault Main Container
// Complete media hub uniting masonry gallery, uploader, memories, and cloud sync
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  UploadCloud,
  FolderSync,
  Folder,
  Search,
  Filter,
  Trash2,
  FolderPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Receipt,
  Layers,
  ChevronDown,
  AlertTriangle,
  X,
  Plus,
  Link as LinkIcon,
  Calendar,
  ImagePlus,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { formatISTDate } from "@/lib/date-utils";
import {
  getMediaItems,
  getAlbums,
  createAlbum,
  deleteAlbum,
  saveMediaItem,
  deleteMediaItem,
  bulkDeleteMedia,
  bulkAssignAlbum,
  bulkUpdateMediaLinks,
  updateMediaItem,
  getOnThisDayMemories,
  type MediaItem,
  type Album,
  type MediaType,
  type SyncStatus,
  type MediaLinks,
} from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { MediaGallery } from "./MediaGallery";
import { MediaUploader } from "./MediaUploader";
import { MediaLightbox } from "./MediaLightbox";
import { MediaLinkPicker } from "./MediaLinkPicker";
import { AlbumManager } from "./AlbumManager";
import { OnThisDayWidget } from "./OnThisDayWidget";
import { DriveImportModal } from "./DriveImportModal";
import { AddPastMediaModal } from "./AddPastMediaModal";

export function MediaVaultContainer() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [memories, setMemories] = useState<{ yearsAgo: number; year: number; items: MediaItem[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // UI state
  const [showUploader, setShowUploader] = useState(false);
  const [showAlbumManager, setShowAlbumManager] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeLightboxItem, setActiveLightboxItem] = useState<MediaItem | null>(null);
  const [activeLinkPickerItem, setActiveLinkPickerItem] = useState<MediaItem | null>(null);
  const [isBulkLinkPickerOpen, setIsBulkLinkPickerOpen] = useState(false);
  const [albumForAddingPastMedia, setAlbumForAddingPastMedia] = useState<Album | null>(null);

  // Album direct deletion confirmation modal
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

  // Bulk selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Sync state
  const [failedSyncCount, setFailedSyncCount] = useState(0);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [loadedItems, loadedAlbums, loadedMemories] = await Promise.all([
        getMediaItems(supabase, user.id, {
          albumId: selectedAlbumId,
          mediaType: typeFilter,
          search,
        }),
        getAlbums(supabase, user.id),
        getOnThisDayMemories(supabase, user.id),
      ]);

      setItems(loadedItems);
      setAlbums(loadedAlbums);
      setMemories(loadedMemories);

      // Background ensure all albums exist in Google Drive
      if (loadedAlbums.length > 0) {
        fetch("/api/drive/albums").catch(() => {});
      }

      const failed = loadedItems.filter((i) => i.sync_status === "failed").length;
      setFailedSyncCount(failed);
    } catch (err) {
      console.error("[MediaVault] Failed to load media data:", err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlbumId, typeFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Upload callback
  const handleUploadComplete = async (mediaData: Partial<MediaItem>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Use mediaData.album_id if chosen in uploader dropdown, fallback to currently active album
    const targetAlbumId =
      mediaData.album_id !== undefined ? mediaData.album_id : selectedAlbumId;

    const saved = await saveMediaItem(supabase, user.id, {
      fileName: mediaData.file_name || "Media file",
      mimeType: mediaData.mime_type || "image/jpeg",
      mediaType: mediaData.media_type,
      thumbPath: mediaData.thumb_path,
      takenAt: mediaData.taken_at,
      lat: mediaData.lat,
      lng: mediaData.lng,
      albumId: targetAlbumId,
      driveFileId: mediaData.drive_file_id,
      syncStatus: mediaData.sync_status || "synced",
    });

    if (saved) {
      const albumObj = albums.find((a) => a.id === targetAlbumId);
      const itemWithAlbum: MediaItem = {
        ...saved,
        album_title: albumObj ? albumObj.title : null,
      };

      // If we are viewing "All Media" or currently viewing the target album, display it
      if (!selectedAlbumId || selectedAlbumId === targetAlbumId) {
        setItems((prev) => [itemWithAlbum, ...prev]);
      }

      // Increment album count
      if (targetAlbumId) {
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === targetAlbumId ? { ...a, item_count: (a.item_count || 0) + 1 } : a
          )
        );
      }
    }
  };

  // Item deletion
  const handleDeleteItem = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const success = await deleteMediaItem(supabase, user.id, id);
    if (success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      // Refresh albums counts
      const loadedAlbums = await getAlbums(supabase, user.id);
      setAlbums(loadedAlbums);
    }
  };

  // Album deletion
  const handleDeleteAlbum = async (albumId: string, deletePhotosInside: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const albumObj = albums.find((a) => a.id === albumId);
    const ok = await deleteAlbum(supabase, user.id, albumId, deletePhotosInside);
    if (ok) {
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId(null);
      }

      if (deletePhotosInside) {
        setItems((prev) => prev.filter((i) => i.album_id !== albumId));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.album_id === albumId ? { ...i, album_id: null, album_title: null } : i
          )
        );
      }

      setAlbumToDelete(null);

      // Sync folder deletion / moving to Google Drive
      if (albumObj?.title) {
        fetch("/api/drive/albums", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: albumObj.title,
            deletePhotosInside,
          }),
        }).catch((err) => console.warn("Drive album delete sync error:", err));
      }

      // Reload to ensure all filters and counts are completely fresh
      await loadData();
    }
  };

  // Assign individual photo to album from Lightbox
  const handleAssignAlbum = async (itemId: string, albumId: string | null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const updated = await updateMediaItem(supabase, user.id, itemId, {
      album_id: albumId,
    });
    if (updated) {
      const albumObj = albums.find((a) => a.id === albumId);
      const itemWithAlbum: MediaItem = {
        ...updated,
        album_title: albumObj ? albumObj.title : null,
      };

      if (selectedAlbumId && selectedAlbumId !== albumId) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        setItems((prev) => prev.map((i) => (i.id === itemId ? itemWithAlbum : i)));
      }

      if (activeLightboxItem?.id === itemId) {
        setActiveLightboxItem(itemWithAlbum);
      }

      const loadedAlbums = await getAlbums(supabase, user.id);
      setAlbums(loadedAlbums);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected items?`)) return;

    setIsBulkDeleting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const success = await bulkDeleteMedia(supabase, user.id, selectedIds);
    if (success) {
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      setIsSelectMode(false);
      const loadedAlbums = await getAlbums(supabase, user.id);
      setAlbums(loadedAlbums);
    }
    setIsBulkDeleting(false);
  };

  const handleBulkAssignAlbum = async (albumId: string | null) => {
    if (selectedIds.length === 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const success = await bulkAssignAlbum(supabase, user.id, selectedIds, albumId);
    if (success) {
      await loadData();
      setSelectedIds([]);
      setIsSelectMode(false);
    }
  };

  // Link save (handles both single-item and bulk items)
  const handleSaveLinks = async (
    targetItemIds: string[],
    links: Partial<MediaLinks>,
    albumId?: string | null | undefined
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (targetItemIds.length === 1) {
      const id = targetItemIds[0];
      const updatePayload: Partial<MediaItem> = { links: links as MediaLinks };
      if (albumId !== undefined) {
        updatePayload.album_id = albumId;
      }

      const updated = await updateMediaItem(supabase, user.id, id, updatePayload);
      if (updated) {
        const albumObj = albums.find((a) => a.id === updated.album_id);
        const itemWithAlbum: MediaItem = {
          ...updated,
          album_title: albumObj ? albumObj.title : null,
        };
        setItems((prev) => prev.map((i) => (i.id === id ? itemWithAlbum : i)));
        if (activeLightboxItem?.id === id) {
          setActiveLightboxItem(itemWithAlbum);
        }
      }
    } else if (targetItemIds.length > 1) {
      const success = await bulkUpdateMediaLinks(supabase, user.id, targetItemIds, {
        links,
        albumId,
      });

      if (success) {
        await loadData();
        setSelectedIds([]);
        setIsSelectMode(false);
      }
    }

    if (albumId !== undefined) {
      const loadedAlbums = await getAlbums(supabase, user.id);
      setAlbums(loadedAlbums);
    }
  };

  // Sync retry
  const handleRetryAllSync = async () => {
    setIsRetryingSync(true);
    try {
      const res = await fetch("/api/drive/sync-retry", { method: "POST" });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Retry sync failed:", err);
    } finally {
      setIsRetryingSync(false);
    }
  };

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header & Action Dock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
            <span>Google Drive Media Vault</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Photos, Videos & Memories
          </h1>
          <p className="text-xs text-text-muted sm:text-sm">
            Resumable Drive storage with automatic EXIF timestamps, GPS extraction, and entity linking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {failedSyncCount > 0 && (
            <button
              type="button"
              onClick={handleRetryAllSync}
              disabled={isRetryingSync}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Retry {failedSyncCount} Failed</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-surface-muted transition-all"
          >
            <FolderSync className="h-3.5 w-3.5 text-accent-warm" />
            <span>Import Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAlbumManager(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-surface-muted transition-all"
          >
            <Folder className="h-3.5 w-3.5 text-accent-warm" />
            <span>Manage Albums</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUploader(!showUploader)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-98 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{showUploader ? "Close Uploader" : "Upload Media"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Drag & Drop Uploader */}
      {showUploader && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs animate-in fade-in">
          <MediaUploader
            onUploadComplete={handleUploadComplete}
            albumId={selectedAlbumId}
            albums={albums}
          />
        </div>
      )}

      {/* Horizontal Album Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {/* All Media Tab */}
        <button
          type="button"
          onClick={() => setSelectedAlbumId(null)}
          className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
            selectedAlbumId === null
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border bg-surface text-text hover:bg-surface-muted"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Media</span>
        </button>

        {/* Individual Album Tabs */}
        {albums.map((album) => {
          const isCurrent = selectedAlbumId === album.id;
          return (
            <button
              key={album.id}
              type="button"
              onClick={() => setSelectedAlbumId(album.id)}
              className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30 font-semibold"
                  : "border border-border bg-surface text-text hover:bg-surface-muted hover:border-primary/40"
              }`}
            >
              <Folder className={`h-3.5 w-3.5 ${isCurrent ? "text-primary-foreground" : "text-primary"}`} />
              <span>{album.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isCurrent ? "bg-white/20 text-white" : "bg-surface-muted text-text-muted"
                }`}
              >
                {album.item_count || 0}
              </span>
            </button>
          );
        })}

        {/* Quick New Album Button */}
        <button
          type="button"
          onClick={() => setShowAlbumManager(true)}
          className="flex items-center gap-1.5 shrink-0 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-medium text-text-muted hover:border-primary hover:text-primary transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Album</span>
        </button>
      </div>

      {/* Active Album Banner */}
      {selectedAlbum && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-surface p-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-text">{selectedAlbum.title}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                  {selectedAlbum.item_count || 0}{" "}
                  {selectedAlbum.item_count === 1 ? "item" : "items"}
                </span>
                {selectedAlbum.album_date && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3 text-primary" />
                    {formatISTDate(selectedAlbum.album_date)}
                  </span>
                )}
              </div>
              {selectedAlbum.description && (
                <p className="text-xs text-text-muted mt-0.5">{selectedAlbum.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setAlbumForAddingPastMedia(selectedAlbum)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all shadow-xs"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>Add Past Media</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload to Album</span>
            </button>
            <button
              type="button"
              onClick={() => setAlbumToDelete(selectedAlbum)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-all"
              title="Delete this album"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Album</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedAlbumId(null)}
              className="p-1.5 rounded-xl text-text-muted hover:bg-surface hover:text-text transition-colors"
              title="Close album filter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* On This Day Memories Section */}
      <OnThisDayWidget
        groups={memories}
        onOpenItem={(item) => setActiveLightboxItem(item)}
      />

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search by file name, place, meal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-muted/50 py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* Media Type Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              typeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("photo")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              typeFilter === "photo"
                ? "bg-primary text-primary-foreground"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            <ImageIcon className="h-3 w-3" />
            <span>Photos</span>
          </button>
          <button
            onClick={() => setTypeFilter("video")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              typeFilter === "video"
                ? "bg-primary text-primary-foreground"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            <Film className="h-3 w-3" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setTypeFilter("receipt")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              typeFilter === "receipt"
                ? "bg-primary text-primary-foreground"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            <Receipt className="h-3 w-3" />
            <span>Receipts</span>
          </button>

          {/* Toggle Multi-Select Mode */}
          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              setSelectedIds([]);
            }}
            className={`ml-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
              isSelectMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-text-muted hover:bg-surface-muted"
            }`}
          >
            {isSelectMode ? "Cancel Select" : "Select"}
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {isSelectMode && selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-surface/95 px-5 py-3 shadow-xl backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-text">
              {selectedIds.length} {selectedIds.length === 1 ? "Item" : "Items"} Selected
            </span>

            {/* Quick toggle all */}
            <button
              type="button"
              onClick={() => {
                if (selectedIds.length === items.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(items.map((i) => i.id));
                }
              }}
              className="text-xs text-text-muted hover:text-text hover:underline ml-1 font-medium"
            >
              {selectedIds.length === items.length ? "Deselect All" : `Select All (${items.length})`}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Bulk Action: Link Entity (Place, Album, Meal, Expense) */}
            <button
              type="button"
              onClick={() => setIsBulkLinkPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold shadow-xs hover:opacity-90 active:scale-98 transition-all"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link Entity</span>
            </button>

            {albums.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-primary" />
                <Select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "none") {
                      handleBulkAssignAlbum(null);
                    } else if (val) {
                      handleBulkAssignAlbum(val);
                    }
                  }}
                  containerClassName="w-44"
                  placeholder="Move to album..."
                  options={[
                    { value: "none", label: "Remove from album" },
                    ...albums.map((a) => ({
                      value: a.id,
                      label: a.title,
                    })),
                  ]}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isBulkDeleting ? "Deleting..." : "Delete"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSelectMode(false);
                setSelectedIds([]);
              }}
              className="p-1.5 rounded-xl text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
              title="Cancel Selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Gallery View */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <MediaGallery
          items={items}
          selectedIds={selectedIds}
          isSelectMode={isSelectMode}
          onSelectItem={(item) => setActiveLightboxItem(item)}
          onToggleSelectId={(id) => {
            setIsSelectMode(true);
            setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
            );
          }}
          onToggleSelectDate={(dateIds) => {
            setIsSelectMode(true);
            const allSelected = dateIds.every((id) => selectedIds.includes(id));
            if (allSelected) {
              setSelectedIds((prev) => prev.filter((id) => !dateIds.includes(id)));
            } else {
              setSelectedIds((prev) => Array.from(new Set([...prev, ...dateIds])));
            }
          }}
          onFilterAlbum={(albumId) => setSelectedAlbumId(albumId)}
        />
      )}

      {/* Lightbox Modal */}
      <MediaLightbox
        item={activeLightboxItem}
        items={items}
        albums={albums}
        isOpen={activeLightboxItem !== null}
        onClose={() => setActiveLightboxItem(null)}
        onSelect={(item) => setActiveLightboxItem(item)}
        onDelete={handleDeleteItem}
        onOpenLinkPicker={(item) => setActiveLinkPickerItem(item)}
        onAssignAlbum={handleAssignAlbum}
        onRetrySync={async (item) => {
          await fetch("/api/drive/sync-retry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaId: item.id }),
          });
          loadData();
        }}
      />

      {/* Link Picker Modal (Single item or Bulk) */}
      <MediaLinkPicker
        item={activeLinkPickerItem}
        selectedItems={
          isBulkLinkPickerOpen
            ? items.filter((i) => selectedIds.includes(i.id))
            : []
        }
        albums={albums}
        isOpen={activeLinkPickerItem !== null || isBulkLinkPickerOpen}
        onClose={() => {
          setActiveLinkPickerItem(null);
          setIsBulkLinkPickerOpen(false);
        }}
        onSaveLinks={handleSaveLinks}
      />

      {/* Album Manager Modal */}
      <AlbumManager
        albums={albums}
        activeAlbumId={selectedAlbumId}
        isOpen={showAlbumManager}
        onClose={() => setShowAlbumManager(false)}
        onSelectAlbum={(albumId) => setSelectedAlbumId(albumId)}
        onCreateAlbum={async (title, desc, albumDate) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          const created = await createAlbum(supabase, user.id, title, desc, albumDate);
          if (created) {
            setAlbums((prev) => [created, ...prev]);
            // Create matching folder in Google Drive under Shore/Photos/
            fetch("/api/drive/albums", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: created.title,
                albumDate: created.album_date,
              }),
            }).catch((e) => console.warn("Drive album creation background error:", e));
          }
        }}
        onDeleteAlbum={handleDeleteAlbum}
        onOpenAddPastMedia={(album) => setAlbumForAddingPastMedia(album)}
      />

      {/* Add Past Media to Album Modal */}
      {albumForAddingPastMedia && (
        <AddPastMediaModal
          album={albumForAddingPastMedia}
          isOpen={!!albumForAddingPastMedia}
          onClose={() => setAlbumForAddingPastMedia(null)}
          onAddItems={async (albumId, itemIds) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const ok = await bulkAssignAlbum(supabase, user.id, itemIds, albumId);
            if (ok) {
              await loadData();
            }
          }}
        />
      )}

      {/* Direct Album Deletion Dialog from Active Banner */}
      {albumToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h4 className="text-base font-bold text-text mb-1">
              Delete &quot;{albumToDelete.title}&quot;?
            </h4>
            <p className="text-xs text-text-muted mb-5">
              This album contains {albumToDelete.item_count || 0}{" "}
              {albumToDelete.item_count === 1 ? "item" : "items"}. How would you like to handle them?
            </p>

            <div className="w-full space-y-2.5">
              {/* Option 1: Keep photos in gallery */}
              <button
                type="button"
                disabled={isDeletingAlbum}
                onClick={async () => {
                  setIsDeletingAlbum(true);
                  try {
                    await handleDeleteAlbum(albumToDelete.id, false);
                  } finally {
                    setIsDeletingAlbum(false);
                  }
                }}
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

              {/* Option 2: Delete album AND all photos */}
              <button
                type="button"
                disabled={isDeletingAlbum}
                onClick={async () => {
                  setIsDeletingAlbum(true);
                  try {
                    await handleDeleteAlbum(albumToDelete.id, true);
                  } finally {
                    setIsDeletingAlbum(false);
                  }
                }}
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
                disabled={isDeletingAlbum}
                onClick={() => setAlbumToDelete(null)}
                className="w-full rounded-xl py-2 text-xs font-medium text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drive Import Notice Modal */}
      <DriveImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSelectFiles={(files) => {
          setShowUploader(true);
        }}
      />
    </div>
  );
}
