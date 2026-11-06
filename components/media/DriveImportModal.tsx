"use client";

// ============================================================================
// Sahil's Shore: Import Existing Drive Photos Modal
// Explains drive.file scope limitations & offers multi-select import flow
// ============================================================================

import React, { useRef } from "react";
import {
  X,
  UploadCloud,
  ShieldAlert,
  FolderSync,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface DriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: FileList) => void;
}

export function DriveImportModal({
  isOpen,
  onClose,
  onSelectFiles,
}: DriveImportModalProps) {
  useScrollLock(isOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderSync className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-text">Import Photos into Shore</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Informational Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-text">Why Can&apos;t Shore Auto-Scan My Entire Google Drive?</p>
              <p className="leading-relaxed text-text-muted">
                For complete privacy and security, Sahil&apos;s Shore connects with the strictly isolated{" "}
                <code className="text-primary font-mono text-[11px]">drive.file</code> scope. This intentionally prevents Shore
                from viewing any pre-existing files or personal documents on your Google Drive.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-muted/50 p-4 text-xs text-text-muted space-y-2">
            <p className="font-medium text-text flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent-warm" />
              One-Time Multi-Select Import
            </p>
            <p className="leading-relaxed">
              To bring photos and videos already in your Google Drive or computer into Shore&apos;s Media Vault, select
              them using the multi-file picker below. Shore will generate client-side thumbnails, extract EXIF date and GPS
              locations, and organize them chronologically into your Shore Drive vault.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onSelectFiles(e.target.files);
                onClose();
              }
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-semibold text-primary-foreground hover:opacity-90 active:scale-98 transition-all shadow-md"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Select Photos & Videos to Import</span>
          </button>
        </div>
      </div>
    </div>
  );
}
