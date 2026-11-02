"use client";

// ============================================================================
// Sahil's Shore: Quick Note Widget
// Instant scratchpad with auto-save to notes table & timeline_events
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getDailyNote, upsertDailyNote } from "@/lib/notes";
import { todayIST } from "@/lib/date-utils";
import { useToast } from "@/components/ui/toast";
import type { WidgetId } from "@/lib/dashboard/types";
import { FileText, Save, Check, ArrowRight } from "lucide-react";

interface QuickNoteWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function QuickNoteWidget({ isEditMode, onRemove }: QuickNoteWidgetProps) {
  const [content, setContent] = useState("");
  const [savedStatus, setSavedStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [userId, setUserId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const loadNote = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      setUserId(data.user.id);

      const note = await getDailyNote(supabase, data.user.id, todayIST());
      if (note) {
        setContent(note.content || "");
        setSavedStatus("saved");
      }
    } catch (e) {
      console.warn("Failed loading daily note:", e);
    }
  }, []);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const handleSave = async (textToSave: string) => {
    if (!userId) return;
    setSavedStatus("saving");
    try {
      const supabase = createClient();
      const res = await upsertDailyNote(supabase, userId, todayIST(), textToSave);
      if (res) {
        setSavedStatus("saved");
      }
    } catch {
      setSavedStatus("unsaved");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setContent(nextVal);
    setSavedStatus("unsaved");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSave(nextVal);
    }, 1200);
  };

  return (
    <WidgetContainer
      id="quick_note"
      title="Quick Note"
      icon={FileText}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <span className="text-[10px] font-semibold text-text-muted flex items-center gap-1">
          {savedStatus === "saved" && (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Saved</span>
            </>
          )}
          {savedStatus === "saving" && <span className="text-primary animate-pulse">Saving...</span>}
          {savedStatus === "unsaved" && (
            <button
              onClick={() => handleSave(content)}
              className="text-primary font-bold hover:underline"
            >
              Save now
            </button>
          )}
        </span>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-2">
        <textarea
          rows={4}
          value={content}
          onChange={handleChange}
          placeholder="Jot down quick thoughts, ideas, or reflection for today..."
          className="w-full flex-1 p-2.5 text-xs rounded-xl border border-border/70 bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60 resize-none font-sans"
        />

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Auto-saves to notes</span>
          <Link href="/notes" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Second Brain</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
