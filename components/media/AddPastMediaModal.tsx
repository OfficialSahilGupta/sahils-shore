"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Add Past Media to Album Modal
// Allows retroactively picking past photos and videos to assign to an album
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Folder,
  Calendar,
  Check,
  Search,
  Filter,
  Film,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import type { Album, MediaItem, MediaType } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { formatISTDate } from "@/lib/date-utils";
import { useScrollLock } from "@/hooks/useScrollLock";

interface AddPastMediaModalProps {
  album: Album | null;
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (albumId: string, itemIds: string[]) => Promise<void>;
}

export function AddPastMediaModal({
  album,
  isOpen,
  onClose,
  onAddItems,
}: AddPastMediaModalProps) {
  useScrollLock(isOpen);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [onlySameDate, setOnlySameDate] = useState(false);

  const albumDateStr = album?.album_date ? formatISTDate(album.album_date) : null;

  // Load candidate media items on open
  useEffect(() => {
    if (!isOpen || !album) return;

    setSelectedIds([]);
    setSearch("");
    setTypeFilter("all");
    setOnlySameDate(false);

    const loadCandidates = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch recent 100 media items
        const { data } = await supabase
          .from("media_items")
          .select("*")
          .eq("user_id", user.id)
          .order("taken_at", { ascending: false })
          .limit(100);

        if (data) {
          // Cast and filter out items already assigned to this album
          const loaded = (data as unknown as MediaItem[]).filter(
            (i) => i.album_id !== album.id
          );
          setItems(loaded);
        }
      } catch (err) {
        console.error("Failed to load candidate media:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [isOpen, album]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "all" && item.media_type !== typeFilter) return false;
      if (onlySameDate && albumDateStr) {
        const itemDate = formatISTDate(item.taken_at);
        if (itemDate !== albumDateStr) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.file_name.toLowerCase().includes(q);
        const matchesPlace = item.links?.place_name?.toLowerCase().includes(q);
        const matchesMeal = item.links?.meal_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesPlace && !matchesMeal) return false;
      }
      return true;
    });
  }, [items, typeFilter, onlySameDate, albumDateStr, search]);

  // Count items matching the exact album date
  const matchingDateCount = useMemo(() => {
    if (!albumDateStr) return 0;
    return items.filter((i) => formatISTDate(i.taken_at) === albumDateStr).length;
  }, [items, albumDateStr]);

  if (!isOpen || !album) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllMatchingDate = () => {
    if (!albumDateStr) return;
    const dateItemIds = items
      .filter((i) => formatISTDate(i.taken_at) === albumDateStr)
      .map((i) => i.id);

    setSelectedIds((prev) => Array.from(new Set([...prev, ...dateItemIds])));
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onAddItems(album.id, selectedIds);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Folder className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                Add Past Media to &quot;{album.title}&quot;
              </h3>
              <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3 w-3 text-primary" />
                <span>Album Date: {albumDateStr || "Unset"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Date Suggestion Banner */}
        {albumDateStr && matchingDateCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 bg-primary/10 border-b border-primary/20 text-xs">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Found <strong>{matchingDateCount}</strong> media items taken on{" "}
                <strong>{albumDateStr}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSelectAllMatchingDate}
              className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all text-xs"
            >
              Select All ({matchingDateCount})
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-border bg-surface-muted/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by file name or place..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                typeFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface text-text-muted hover:text-text"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("photo")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                typeFilter === "photo"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface text-text-muted hover:text-text"
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              <span>Photos</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("video")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                typeFilter === "video"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface text-text-muted hover:text-text"
              }`}
            >
              <Film className="h-3 w-3" />
              <span>Videos</span>
            </button>

            {albumDateStr && (
              <button
                type="button"
                onClick={() => setOnlySameDate(!onlySameDate)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                  onlySameDate
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-surface text-text-muted hover:text-text"
                }`}
              >
                Same Date Only
              </button>
            )}
          </div>
        </div>

        {/* Gallery Selection Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading media items...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted text-xs">
              <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
              <span>No available media items found to add.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isVideo = item.media_type === "video";
                const dateLabel = formatISTDate(item.taken_at);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSelect(item.id)}
                    className={`group relative aspect-square overflow-hidden rounded-xl border bg-surface-muted cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 scale-[0.98]"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={item.thumb_path || ""}
                      alt={item.file_name}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Dark bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                    {/* Selection Checkbox */}
                    <div
                      className={`absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm transition-all z-10 ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground opacity-100"
                          : "bg-surface/80 border-border text-transparent opacity-80 group-hover:opacity-100"
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>

                    {/* Type badge */}
                    {isVideo && (
                      <div className="absolute top-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded bg-black/60 text-white z-10">
                        <Film className="h-2.5 w-2.5" />
                      </div>
                    )}

                    {/* Date label at bottom */}
                    <div className="absolute bottom-1 left-1.5 right-1.5 text-[9px] text-white truncate font-medium z-10">
                      {dateLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-surface-muted/30">
          <span className="text-xs text-text-muted">
            {selectedIds.length}{" "}
            {selectedIds.length === 1 ? "item" : "items"} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedIds.length === 0 || isSubmitting}
              className="rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Add {selectedIds.length} to Album</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
