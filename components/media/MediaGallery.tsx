"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Media Gallery Component
// Responsive masonry layout grouped chronologically by IST calendar date
// Supports multi-select, day-wise bulk selection, and interactive entity badges
// ============================================================================

import React from "react";
import {
  Film,
  Receipt,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Check,
  Image as ImageIcon,
  Folder,
} from "lucide-react";
import type { MediaItem } from "@/lib/media";
import { formatISTDate, todayIST, yesterdayIST } from "@/lib/date-utils";

interface MediaGalleryProps {
  items: MediaItem[];
  selectedIds: string[];
  isSelectMode: boolean;
  onSelectItem: (item: MediaItem) => void;
  onToggleSelectId: (id: string) => void;
  onToggleSelectDate?: (ids: string[]) => void;
  onFilterAlbum?: (albumId: string) => void;
}

export function MediaGallery({
  items,
  selectedIds,
  isSelectMode,
  onSelectItem,
  onToggleSelectId,
  onToggleSelectDate,
  onFilterAlbum,
}: MediaGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-surface">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-text-muted mb-3">
          <ImageIcon className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-text">No media found</h4>
        <p className="mt-1 text-xs text-text-muted max-w-sm">
          Drop photos, videos, or receipts into the uploader above or capture directly with your camera.
        </p>
      </div>
    );
  }

  // Group items by IST calendar date (YYYY-MM-DD)
  const groupedByDate = items.reduce<Record<string, MediaItem[]>>((acc, item) => {
    const dateKey = formatISTDate(item.taken_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
  const today = todayIST();
  const yesterday = yesterdayIST();

  const getDateHeading = (dateKey: string) => {
    if (dateKey === today) return "Today";
    if (dateKey === yesterday) return "Yesterday";
    return dateKey;
  };

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => {
        const dateItems = groupedByDate[dateKey];
        const allDateItemsSelected =
          dateItems.length > 0 && dateItems.every((i) => selectedIds.includes(i.id));

        return (
          <div key={dateKey} className="space-y-3">
            {/* Date Group Header */}
            <div className="sticky top-16 z-20 flex items-center justify-between rounded-xl bg-background/80 py-2 px-1 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-text">{getDateHeading(dateKey)}</h3>
                <span className="text-xs text-text-muted">({dateItems.length})</span>
              </div>

              {/* Day-wise bulk select toggle */}
              {isSelectMode && onToggleSelectDate && (
                <button
                  type="button"
                  onClick={() => onToggleSelectDate(dateItems.map((i) => i.id))}
                  className="text-xs font-semibold text-primary hover:underline px-2.5 py-1 rounded-lg hover:bg-surface-muted transition-colors"
                >
                  {allDateItemsSelected
                    ? "Deselect Day"
                    : `Select Day (${dateItems.length})`}
                </button>
              )}
            </div>

            {/* Responsive Masonry / Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {dateItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isVideo = item.media_type === "video";
                const isReceipt = item.media_type === "receipt";

                return (
                  <div
                    key={item.id}
                    className={`group relative aspect-square overflow-hidden rounded-2xl border bg-surface-muted cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 scale-[0.98]"
                        : "border-border hover:border-primary/50 hover:shadow-md"
                    }`}
                    onClick={() => {
                      if (isSelectMode) {
                        onToggleSelectId(item.id);
                      } else {
                        onSelectItem(item);
                      }
                    }}
                  >
                    {/* Media Thumbnail */}
                    <img
                      src={item.thumb_path || ""}
                      alt={item.file_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Dark gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Top-Right: Selection Checkbox (always accessible on hover or in select mode) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectId(item.id);
                      }}
                      className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-all z-10 ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground opacity-100 scale-100 ring-2 ring-white/50"
                          : isSelectMode
                          ? "bg-surface/80 border-border text-transparent hover:border-primary opacity-100"
                          : "bg-black/40 border-white/70 text-transparent opacity-0 group-hover:opacity-100 hover:border-white hover:bg-black/60 hover:scale-105"
                      }`}
                      title={isSelected ? "Deselect" : "Select"}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>

                    {/* Top-Left: Type Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                      {isVideo && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-xs">
                          <Film className="h-3 w-3" />
                        </div>
                      )}
                      {isReceipt && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/80 text-white backdrop-blur-xs">
                          <Receipt className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata Badges */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white z-10">
                      <div className="flex items-center gap-1 min-w-0 max-w-[82%]">
                        {item.album_title && (
                          <button
                            type="button"
                            onClick={(e) => {
                              if (item.album_id && onFilterAlbum) {
                                e.stopPropagation();
                                onFilterAlbum(item.album_id);
                              }
                            }}
                            title={`Filter to album: ${item.album_title}`}
                            className="flex items-center gap-1 truncate rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-accent-warm backdrop-blur-xs border border-accent-warm/30 hover:border-accent-warm hover:bg-black/90 transition-all"
                          >
                            <Folder className="h-2.5 w-2.5 shrink-0 text-accent-warm" />
                            <span className="truncate">{item.album_title}</span>
                          </button>
                        )}

                        {item.links?.place_name && (
                          item.links.place_id ? (
                            <a
                              href={`/places/${item.links.place_id}`}
                              onClick={(e) => e.stopPropagation()}
                              title={`View place: ${item.links.place_name}`}
                              className="flex items-center gap-1 truncate rounded bg-cyan-950/80 border border-cyan-500/50 px-1.5 py-0.5 text-cyan-300 hover:text-white hover:bg-cyan-900 transition-all backdrop-blur-xs shadow-xs"
                            >
                              <MapPin className="h-2.5 w-2.5 shrink-0 text-cyan-400" />
                              <span className="truncate">{item.links.place_name}</span>
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 truncate rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-xs text-cyan-300">
                              <MapPin className="h-2.5 w-2.5 shrink-0 text-cyan-300" />
                              <span className="truncate">{item.links.place_name}</span>
                            </span>
                          )
                        )}
                      </div>

                      {/* Sync Status Icon */}
                      <div className="shrink-0 ml-1">
                        {item.sync_status === "synced" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 drop-shadow-sm" />
                        )}
                        {item.sync_status === "pending" && (
                          <Clock className="h-3.5 w-3.5 text-amber-300 drop-shadow-sm" />
                        )}
                        {item.sync_status === "failed" && (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400 drop-shadow-sm" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
