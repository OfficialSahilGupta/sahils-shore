"use client";

// ============================================================================
// Sahil's Shore: Resume Version Upload Dialog
// Direct Google Drive upload (Shore/Resumes/) with metadata & master flag
// ============================================================================

import React, { useState, useRef } from "react";
import type { CreateResumeInput, Resume } from "@/types/career";
import { todayIST } from "@/lib/date-utils";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (input: CreateResumeInput) => Promise<void>;
}

export function ResumeUploadDialog({
  isOpen,
  onClose,
  onUploadSuccess,
}: ResumeUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [notes, setNotes] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setErrorMessage("Please select a PDF file.");
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, ""));
      }
      if (!versionLabel) {
        setVersionLabel(`v${new Date().toISOString().slice(2, 10).replace(/-/g, ".")}`);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setErrorMessage("Please select a PDF file.");
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
      if (!versionLabel) setVersionLabel(`v${new Date().toISOString().slice(2, 10).replace(/-/g, ".")}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !versionLabel.trim() || !title.trim()) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);
      setErrorMessage(null);

      let driveFileId: string | null = null;
      let fileUrl: string | null = null;

      // 1. Try initiating Drive upload session
      try {
        const sessionRes = await fetch("/api/drive/upload-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `resume_${Date.now()}_${selectedFile.name}`,
            mimeType: "application/pdf",
            size: selectedFile.size,
            folderType: "resumes",
          }),
        });

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setUploadProgress(40);

          if (sessionData.uploadUrl) {
            // Upload directly to Google Drive
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("PUT", sessionData.uploadUrl, true);
              xhr.setRequestHeader("Content-Type", "application/pdf");

              xhr.upload.onprogress = (pe) => {
                if (pe.lengthComputable) {
                  const pct = 40 + Math.round((pe.loaded / pe.total) * 55);
                  setUploadProgress(pct);
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const driveObj = JSON.parse(xhr.responseText);
                    driveFileId = driveObj.id;
                    fileUrl = driveObj.webViewLink || `https://drive.google.com/file/d/${driveObj.id}/view`;
                  } catch {
                    driveFileId = `drive_${Date.now()}`;
                  }
                  resolve();
                } else {
                  console.warn("Drive upload returned non-200, continuing with local fallback");
                  resolve();
                }
              };

              xhr.onerror = () => {
                console.warn("Drive upload error, continuing with fallback");
                resolve();
              };

              xhr.send(selectedFile);
            });
          } else if (sessionData.fileId) {
            driveFileId = sessionData.fileId;
          }
        }
      } catch (driveErr) {
        console.warn("Google Drive upload session skipped or failed:", driveErr);
      }

      setUploadProgress(95);

      // Fallback fileUrl if Drive was not connected
      if (!fileUrl) {
        fileUrl = URL.createObjectURL(selectedFile);
      }

      const input: CreateResumeInput = {
        title: title.trim(),
        version_label: versionLabel.trim(),
        target_role: targetRole.trim() || null,
        file_url: fileUrl,
        drive_file_id: driveFileId,
        is_primary: isPrimary,
        notes: notes.trim() || null,
        file_size: selectedFile.size,
        uploaded_date: todayIST(),
      };

      await onUploadSuccess(input);
      setUploadProgress(100);
      onClose();
    } catch (err: any) {
      console.error("Resume upload error:", err);
      setErrorMessage(err.message || "Failed to upload resume.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text">Upload Resume Version</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              selectedFile
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-surface-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3 text-text">
                <FileCheck className="w-8 h-8 text-primary shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-[11px] text-text-muted">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · PDF Document
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-text-muted">
                <Upload className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-text">Click or drag & drop PDF resume</p>
                <p className="text-[11px]">PDF up to 15MB (synced to Google Drive / Shore / Resumes)</p>
              </div>
            )}
          </div>

          {/* Version Label & Target Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Version Tag / Label <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Backend v2.1"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Target Role</label>
              <input
                type="text"
                placeholder="e.g. Java / Spring Boot"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Resume Name / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sahil_FullStack_2026_Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Notes / Tailoring changes</label>
            <textarea
              rows={2}
              placeholder="Key differences in this version (e.g. highlighted microservices & distributed cache projects)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Mark as Master Resume Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-xs font-semibold text-text flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Set as Master / Default Resume
            </span>
          </label>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>Uploading to Shore & Drive...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isUploading || !selectedFile || !versionLabel.trim() || !title.trim()}
            >
              {isUploading ? "Uploading..." : "Save Resume Version"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
