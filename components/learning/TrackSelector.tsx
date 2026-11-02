"use client";

// ============================================================================
// Sahil's Shore: Learning Track Selector
// ============================================================================

import React from "react";
import { Cpu, Layers, CheckCircle2 } from "lucide-react";
import type { LearningTrack } from "@/types";

interface TrackSelectorProps {
  tracks: LearningTrack[];
  activeTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  progressMap: Record<string, number>; // trackId -> percentage
}

export function TrackSelector({
  tracks,
  activeTrackId,
  onSelectTrack,
  progressMap,
}: TrackSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {tracks.map((track) => {
        const isActive = track.id === activeTrackId;
        const progress = progressMap[track.id] || 0;
        const isSpring =
          track.slug === "spring" ||
          track.title.toLowerCase().includes("spring") ||
          track.title.toLowerCase().includes("java");

        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelectTrack(track.id)}
            className={`group relative flex flex-col justify-between w-full min-w-0 h-full rounded-2xl border p-4 sm:p-5 text-left transition-all ${
              isActive
                ? "border-[var(--primary)] bg-[var(--surface)] shadow-md ring-2 ring-[var(--primary)]/20"
                : "border-[var(--surface-muted)] bg-[var(--surface)]/60 hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]"
            }`}
          >
            {/* Top row: Icon, Title & Description with uniform padding */}
            <div className="flex items-start gap-3.5 w-full min-w-0">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive
                    ? isSpring
                      ? "bg-[#2E9E6B]/15 text-[#2E9E6B]"
                      : "bg-[#4FB3C8]/15 text-[#4FB3C8]"
                    : "bg-[var(--surface-muted)]/60 text-[var(--text-muted)] group-hover:text-[var(--text)]"
                }`}
              >
                {isSpring ? (
                  <Cpu className="h-6 w-6" />
                ) : (
                  <Layers className="h-6 w-6" />
                )}
              </div>

              {/* Title & Description with reserved space on the right for badge */}
              <div className="space-y-1 min-w-0 flex-1 pr-16">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text)] truncate">
                    {track.title}
                  </h3>
                  {progress === 100 && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-1 truncate">
                  {track.description || "Core roadmap and interview preparation"}
                </p>
              </div>
            </div>

            {/* Bottom row: Uniform Progress Bar & Percentage */}
            <div className="mt-3.5 flex items-center gap-2.5 w-full pt-1">
              <div className="h-1.5 flex-1 max-w-[140px] overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSpring ? "bg-[#2E9E6B]" : "bg-[#4FB3C8]"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-semibold text-[var(--text)] shrink-0">
                {progress}% completed
              </span>
            </div>

            {/* Absolute Badge: positioned identically on both cards, zero layout shift */}
            <div className="absolute top-4 right-4 shrink-0">
              {isActive ? (
                <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--primary)]/20">
                  Active
                </span>
              ) : (
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Select
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
