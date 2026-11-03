"use client";

// ============================================================================
// Sahil's Shore: PWA Web Share Target Receiver
// Captures shared links, notes, and photos from other apps via OS Share Sheet
// ============================================================================

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import { useOfflineQueue } from "@/lib/offline/OfflineContext";
import { Share2, ArrowRight, CheckCircle2, FileText, CheckSquare } from "lucide-react";

function ShareTargetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { open: openQuickCapture } = useQuickCapture();
  const { enqueueMutation } = useOfflineQueue();

  const title = searchParams?.get("title") || "";
  const text = searchParams?.get("text") || "";
  const url = searchParams?.get("url") || "";

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sharedContent = [title, text, url].filter(Boolean).join("\n\n");

  const handleSaveAsNote = async () => {
    setSaving(true);
    try {
      await enqueueMutation("note", {
        title: title || "Shared from Device",
        content: sharedContent,
        folder: "Inbox",
        tags: ["shared"],
      });
      setSaved(true);
      setTimeout(() => router.push("/notes"), 1200);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTask = async () => {
    setSaving(true);
    try {
      await enqueueMutation("task", {
        title: title || text.slice(0, 80) || "Shared item to review",
        priority: "medium",
        tags: ["shared"],
        status: "todo",
      });
      setSaved(true);
      setTimeout(() => router.push("/todos"), 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Shared with Shore</h2>
            <p className="text-xs text-text-muted">Quick capture shared item from your device</p>
          </div>
        </div>

        {/* Content Preview Box */}
        <div className="mb-6 rounded-2xl bg-surface-muted/60 p-4 border border-border/50 text-xs">
          {title && (
            <div className="font-semibold text-text mb-1">{title}</div>
          )}
          {text && (
            <div className="text-text-muted line-clamp-3 mb-1">{text}</div>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline break-all"
            >
              {url}
            </a>
          )}
          {!title && !text && !url && (
            <div className="text-text-muted italic">No text received.</div>
          )}
        </div>

        {saved ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span>Captured to Shore! Redirecting...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              disabled={saving}
              onClick={handleSaveAsNote}
              className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Save to Second Brain Notes</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              disabled={saving}
              onClick={handleSaveAsTask}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-xs font-semibold text-text hover:bg-surface-muted disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span>Save as Action Task</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-xs text-text-muted">
          Loading shared content...
        </div>
      }
    >
      <ShareTargetContent />
    </Suspense>
  );
}
