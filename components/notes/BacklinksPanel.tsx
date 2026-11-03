"use client";

// ============================================================================
// Sahil's Shore: Backlinks Panel
// Displays incoming references ("Linked References") pointing to the active note
// ============================================================================

import React from "react";
import type { BacklinkReference } from "@/lib/notes";
import { Link2, ArrowUpRight, Folder, FileText } from "lucide-react";

interface BacklinksPanelProps {
  currentNoteTitle: string;
  backlinks: BacklinkReference[];
  onSelectNote: (noteId: string) => void;
}

export function BacklinksPanel({
  currentNoteTitle,
  backlinks,
  onSelectNote,
}: BacklinksPanelProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold text-text">
            Linked References ({backlinks.length})
          </h3>
        </div>
        <span className="text-[10px] text-text-muted">
          Notes referencing [[{currentNoteTitle}]]
        </span>
      </div>

      {backlinks.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted">
          No other notes link to this note yet. Use{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-primary font-mono text-[11px]">
            [[{currentNoteTitle}]]
          </code>{" "}
          in any note to connect them.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {backlinks.map((link) => (
            <div
              key={link.sourceNoteId}
              onClick={() => onSelectNote(link.sourceNoteId)}
              className="group cursor-pointer rounded-2xl border border-border/70 bg-surface-muted/30 p-3 transition-all hover:border-primary/40 hover:bg-surface hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-text group-hover:text-primary transition-colors">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{link.sourceNoteTitle}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[9px] font-medium text-text-muted">
                    {link.folder}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {link.contextExcerpt && (
                <p className="mt-1.5 text-[11px] text-text-muted/80 line-clamp-2 leading-relaxed pl-5 border-l-2 border-primary/30">
                  {link.contextExcerpt}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
