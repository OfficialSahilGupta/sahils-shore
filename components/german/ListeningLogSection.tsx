"use client";

// ============================================================================
// Sahil's Shore: German Listening Log
// Track podcasts, YouTube, audiobooks, DW, with automatic Daily Tracker sync
// ============================================================================

import React, { useState } from "react";
import { Headphones, Plus, Clock, BookOpen, CheckCircle2, Check } from "lucide-react";
import type { GermanListeningLog } from "@/types";
import { type CreateListeningLogInput } from "@/lib/german";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/german/constants";
import { getISTDateString } from "@/lib/date-utils";

interface ListeningLogSectionProps {
  logs: GermanListeningLog[];
  onCreateLog: (input: CreateListeningLogInput, syncStudyTime: boolean) => Promise<void>;
}

export function ListeningLogSection({
  logs,
  onCreateLog,
}: ListeningLogSectionProps) {
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState("Podcast");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [level, setLevel] = useState<CefrLevel>("A2");
  const [notes, setNotes] = useState("");
  const [vocabInput, setVocabInput] = useState("");
  const [syncStudyTime, setSyncStudyTime] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const totalMinutes = logs.reduce((acc, l) => acc + l.duration_minutes, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || durationMinutes <= 0) return;

    setIsSaving(true);
    try {
      const vocab = vocabInput
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      await onCreateLog(
        {
          title: title.trim(),
          media_type: mediaType,
          duration_minutes: durationMinutes,
          cefr_level: level,
          notes: notes.trim() || null,
          vocabulary_learned: vocab,
        },
        syncStudyTime
      );

      setTitle("");
      setNotes("");
      setVocabInput("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Log Entry Form (5 columns) */}
      <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-4 self-start">
        <div className="flex items-center gap-2 text-primary">
          <Headphones className="w-5 h-5" />
          <h3 className="text-base font-bold text-text">Log Listening Session</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Episode / Video Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Easy German Ep 412: Berlin Cafes"
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Media Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Podcast">Podcast</option>
                <option value="Easy German">Easy German</option>
                <option value="Deutsche Welle">Deutsche Welle</option>
                <option value="Audiobook">Audiobook</option>
                <option value="YouTube">YouTube</option>
                <option value="Film / Series">Film / Series</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 15)}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CefrLevel)}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CEFR_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              New Vocabulary Learned (comma separated)
            </label>
            <input
              type="text"
              value={vocabInput}
              onChange={(e) => setVocabInput(e.target.value)}
              placeholder="e.g. der Schiedsrichter, verhandeln"
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Reflections & Comprehension Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Understood 80% without subtitles, tricky spoken rhythm..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Sync study time checkbox */}
          <div
            onClick={() => setSyncStudyTime(!syncStudyTime)}
            className="flex items-center gap-2 cursor-pointer pt-1"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                syncStudyTime
                  ? "bg-primary border-primary text-white"
                  : "bg-surface-muted border-surface-muted text-transparent"
              }`}
            >
              <Check className="w-3 h-3" />
            </div>
            <span className="text-xs font-medium text-text select-none">
              Sync minutes into Daily Tracker (&quot;German&quot; activity)
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-primary hover:opacity-90 text-white font-semibold shadow-sm transition-all disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Log Listening Session"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Listening History & Stats (7 columns) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Total stats banner */}
        <div className="p-4 rounded-2xl bg-surface border border-surface-muted flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Listening Immersion
            </span>
            <div className="text-xl font-bold text-text">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m Total
            </div>
          </div>
          <span className="text-xs text-text-muted">
            {logs.length} logged session{logs.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* List of past logs */}
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-surface border border-surface-muted space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                    {log.media_type}
                  </span>
                  <span className="text-xs font-semibold text-text-muted">
                    {log.cefr_level}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-muted font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{log.duration_minutes} min</span>
                  <span>•</span>
                  <span>{getISTDateString(log.logged_at)}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-text">{log.title}</h4>

              {log.notes && (
                <p className="text-xs text-text-muted">{log.notes}</p>
              )}

              {log.vocabulary_learned && log.vocabulary_learned.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {log.vocabulary_learned.map((word) => (
                    <span
                      key={word}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-surface-muted text-primary font-mono font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-8 text-center text-xs text-text-muted bg-surface rounded-2xl border border-surface-muted">
              No listening sessions logged yet. Record your German podcasts or YouTube listening practice here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
