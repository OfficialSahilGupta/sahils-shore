"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Media Lightbox Component
// Fullscreen viewer with swipe, video playback, Drive link, and entity linkages
// ============================================================================

import React, { useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  Calendar,
  MapPin,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Film,
  Folder,
} from "lucide-react";
import type { MediaItem, Album } from "@/lib/media";
import { formatISTTime } from "@/lib/date-utils";
import { Select } from "@/components/ui/select";

interface MediaLightboxProps {
  item: MediaItem | null;
  items: MediaItem[];
  albums?: Album[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  onDelete: (id: string) => Promise<void>;
  onOpenLinkPicker: (item: MediaItem) => void;
  onAssignAlbum?: (itemId: string, albumId: string | null) => Promise<void>;
  onRetrySync?: (item: MediaItem) => void;
}

export function MediaLightbox({
  item,
  items,
  albums = [],
  isOpen,
  onClose,
  onSelect,
  onDelete,
  onOpenLinkPicker,
  onAssignAlbum,
  onRetrySync,
}: MediaLightboxProps) {
  const currentIndex = item ? items.findIndex((i) => i.id === item.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) onSelect(items[currentIndex - 1]);
  }, [hasPrev, currentIndex, items, onSelect]);

  const handleNext = useCallback(() => {
    if (hasNext) onSelect(items[currentIndex + 1]);
  }, [hasNext, currentIndex, items, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, item, onClose, handlePrev, handleNext]);

  if (!isOpen || !item) return null;

  const isVideo = item.media_type === "video";
  const displayUrl = item.thumb_path || "";
  const driveUrl = item.drive_file_id
    ? `https://drive.google.com/file/d/${item.drive_file_id}/view`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-md">
      {/* Top Controls Header */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate text-sm font-semibold max-w-[200px] sm:max-w-md">
            {item.file_name}
          </span>

          {/* Sync Status Badge */}
          {item.sync_status === "synced" && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />
              Drive Synced
            </span>
          )}
          {item.sync_status === "pending" && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-500/30">
              <Clock className="h-3 w-3" />
              Sync Pending
            </span>
          )}
          {item.sync_status === "failed" && (
            <button
              onClick={() => onRetrySync?.(item)}
              className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
            >
              <AlertCircle className="h-3 w-3" />
              Sync Failed (Retry)
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {driveUrl && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors border border-white/10 shadow-xs"
              title="Open original file in Google Drive"
            >
              <span>Drive</span>
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            </a>
          )}

          <button
            type="button"
            onClick={() => onOpenLinkPicker(item)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/20 text-primary-foreground border border-primary/40 px-3 py-1.5 text-xs font-medium hover:bg-primary/30 transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Link Entity</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this media item?")) {
                onDelete(item.id);
                onClose();
              }
            }}
            className="rounded-xl p-2 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            title="Delete media"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            title="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Media Preview Area */}
      <div className="relative flex-1 flex items-center justify-center p-4 select-none">
        {hasPrev && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition-all shadow-lg"
            title="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition-all shadow-lg"
            title="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              src={displayUrl}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-lg shadow-2xl"
            />
          ) : (
            <img
              src={displayUrl}
              alt={item.file_name}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>
      </div>

      {/* Bottom Metadata & Linkage Bar */}
      <div className="border-t border-white/10 bg-black/80 px-4 py-3 sm:px-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent-warm" />
              <span>Taken {formatISTTime(item.taken_at)}</span>
            </div>

            {item.lat && item.lng && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=16/${item.lat}/${item.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                </span>
              </a>
            )}

            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span className="capitalize">{item.media_type}</span>
            </div>

            {albums.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-primary" />
                <Select
                  value={item.album_id || ""}
                  onChange={(e) => onAssignAlbum?.(item.id, e.target.value || null)}
                  containerClassName="w-36"
                  options={[
                    { value: "", label: "No Album" },
                    ...albums.map((a) => ({ value: a.id, label: a.title })),
                  ]}
                />
              </div>
            )}
          </div>

          {/* Active Links Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {item.links?.place_name && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2 py-1 text-[11px] text-cyan-300 border border-cyan-500/30">
                <MapPin className="h-3 w-3" />
                {item.links.place_name}
              </span>
            )}
            {item.links?.meal_name && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1 text-[11px] text-rose-300 border border-rose-500/30">
                Meal: {item.links.meal_name}
              </span>
            )}
            {item.links?.expense_amount_paise && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-1 text-[11px] text-amber-300 border border-amber-500/30">
                Expense: ₹{(item.links.expense_amount_paise / 100).toFixed(2)}
              </span>
            )}
            {item.links?.journal_id && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-accent-warm/20 px-2 py-1 text-[11px] text-accent-warm border border-accent-warm/30">
                Linked to Journal
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
