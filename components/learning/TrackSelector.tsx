"use client";

// ============================================================================
// Sahil's Shore: Learning Track Selector (Multi-Track & Custom Tracks)
// ============================================================================

import React, { useState } from "react";
import {
  Cpu,
  Layers,
  CheckCircle2,
  Server,
  Cloud,
  Terminal,
  Database,
  Globe,
  Shield,
  Plus,
  Trash2,
} from "lucide-react";
import type { LearningTrack } from "@/types";
import { SafeDeleteModal } from "./SafeDeleteModal";

interface TrackSelectorProps {
  tracks: LearningTrack[];
  activeTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  progressMap: Record<string, number>; // trackId -> dynamic mastery percentage
  onOpenCreateTrack: () => void;
  onDeleteTrack?: (trackId: string) => Promise<void>;
}

function getTrackIcon(iconName?: string | null, title?: string) {
  const name = (iconName || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (name.includes("server") || t.includes("system design") || t.includes("distributed")) return Server;
  if (name.includes("cloud") || t.includes("devops") || t.includes("aws") || t.includes("docker")) return Cloud;
  if (name.includes("terminal") || t.includes("golang") || t.includes("go") || t.includes("cli")) return Terminal;
  if (name.includes("database") || t.includes("sql") || t.includes("data")) return Database;
  if (name.includes("globe") || t.includes("web") || t.includes("network")) return Globe;
  if (name.includes("shield") || t.includes("security")) return Shield;
  if (name.includes("cpu") || t.includes("spring") || t.includes("java")) return Cpu;
  return Layers;
}

export function TrackSelector({
  tracks,
  activeTrackId,
  onSelectTrack,
  progressMap,
  onOpenCreateTrack,
  onDeleteTrack,
}: TrackSelectorProps) {
  const [trackToDelete, setTrackToDelete] = useState<LearningTrack | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {tracks.map((track) => {
        const isActive = track.id === activeTrackId;
        const progress = progressMap[track.id] || 0;
        const IconComponent = getTrackIcon(track.icon, track.title);
        const isCoreTrack = track.slug === "spring" || track.slug === "mern";

        return (
          <div
            key={track.id}
            className={`group relative flex flex-col justify-between w-full min-w-0 h-full rounded-2xl border p-4 sm:p-5 text-left transition-all ${
              isActive
                ? "border-[var(--primary)] bg-[var(--surface)] shadow-md ring-2 ring-[var(--primary)]/20"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40 hover:shadow-xs"
            }`}
          >
            {/* Clickable Card Body */}
            <button
              type="button"
              onClick={() => onSelectTrack(track.id)}
              className="w-full text-left flex flex-col justify-between flex-1"
            >
              <div className="flex items-start gap-3.5 w-full min-w-0">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                      : "bg-[var(--surface-muted)]/60 text-[var(--text-muted)] group-hover:text-[var(--text)]"
                  }`}
                  style={track.color && isActive ? { color: track.color } : undefined}
                >
                  <IconComponent className="h-6 w-6" />
                </div>

                <div className="space-y-1 min-w-0 flex-1 pr-16">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text)] truncate">
                      {track.title}
                    </h3>
                    {progress === 100 && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1 truncate font-sans">
                    {track.description || "Core roadmap and interview preparation"}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="mt-4 flex items-center gap-2.5 w-full pt-1">
                <div className="h-1.5 flex-1 max-w-[150px] overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-[var(--primary)]"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: track.color || undefined,
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono font-semibold text-[var(--text)] shrink-0">
                  {progress}% Mastery
                </span>
              </div>
            </button>

            {/* Badges & Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 shrink-0">
              {isActive ? (
                <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--primary)]/20">
                  Active
                </span>
              ) : null}

              {/* Delete button for custom user tracks */}
              {!isCoreTrack && onDeleteTrack && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTrackToDelete(track);
                  }}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Track"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* + New Track Card */}
      <button
        type="button"
        onClick={onOpenCreateTrack}
        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)]/10 hover:border-[var(--primary)] hover:bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:text-[var(--text)] transition-all min-h-[120px] group"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] group-hover:border-[var(--primary)]/50 group-hover:text-[var(--primary)] transition-colors mb-2">
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold">Create New Track</span>
        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
          System Design, DevOps, Golang, AI...
        </span>
      </button>

      {/* Safe Delete Track Modal with Type Confirmation */}
      {trackToDelete && onDeleteTrack && (
        <SafeDeleteModal
          isOpen={Boolean(trackToDelete)}
          onClose={() => setTrackToDelete(null)}
          onConfirm={async () => {
            if (trackToDelete) {
              await onDeleteTrack(trackToDelete.id);
              setTrackToDelete(null);
            }
          }}
          title="Delete Learning Track"
          itemName={trackToDelete.title}
          itemType="track"
          requireTyping={true}
          warningText={`This will permanently delete the entire "${trackToDelete.title}" track and all its roadmap topics, sub-sections, notes, and code snippets.`}
        />
      )}
    </div>
  );
}
