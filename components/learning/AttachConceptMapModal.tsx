"use client";

// ============================================================================
// Sahil's Shore: Attach Concept Map & Architecture Diagram Modal
// Allows inserting high-definition concept maps, architecture blueprints,
// and system flowcharts into study notes via multi-file batch upload,
// direct URLs, or built-in curated engineering architecture blueprints.
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized colors, and WCAG AA contrast.
// ============================================================================

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Image as ImageIcon,
  Check,
  Layers,
  ArrowRight,
  FileImage,
  Trash2,
  Plus,
  Database,
  ShieldCheck,
  Info,
  Loader2,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  prepareConceptMapImage,
  formatImageFileSize,
  CURATED_CONCEPT_MAP_PRESETS,
  type ConceptMapPreset,
  type ChapterConceptMap,
} from "@/lib/learning/concept-map";
import { uploadConceptMapImage } from "@/lib/drive/concept-map-uploader";

export interface QueuedUploadImage {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  width: number;
  height: number;
  sizeFormatted: string;
}

interface AttachConceptMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  module?: "learning" | "dsa";
  folderName?: string;
  onAttachConceptMaps?: (conceptMaps: ChapterConceptMap[]) => void;
  onAttachConceptMap?: (conceptMap: ChapterConceptMap) => void;
  onInsertImage?: (caption: string, url: string) => void;
}

export function AttachConceptMapModal({
  isOpen,
  onClose,
  topicTitle,
  module = "learning",
  folderName,
  onAttachConceptMaps,
  onAttachConceptMap,
  onInsertImage,
}: AttachConceptMapModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">("upload");

  // Multi-image batch queue
  const [queuedImages, setQueuedImages] = useState<QueuedUploadImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveUploadProgress, setDriveUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL tab state
  const [directUrl, setDirectUrl] = useState("");
  const [urlCaption, setUrlCaption] = useState("");

  if (!isOpen) return null;

  // Multi-file batch processing
  const handleFilesAdded = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.name.endsWith(".svg")
    );
    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: validFiles.length });

    try {
      const newItems: QueuedUploadImage[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setProcessingProgress({ current: i + 1, total: validFiles.length });
        const prepared = await prepareConceptMapImage(file);
        newItems.push({
          id: `queue-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          previewUrl: prepared.dataUrl,
          caption: prepared.caption,
          width: prepared.width,
          height: prepared.height,
          sizeFormatted: formatImageFileSize(file.size),
        });
      }
      setQueuedImages((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error("Failed to process batch concept map images:", err);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFilesAdded(files);
    }
  };

  const handleUpdateCaption = (id: string, newCaption: string) => {
    setQueuedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption: newCaption } : img))
    );
  };

  const handleRemoveQueuedImage = (id: string) => {
    setQueuedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleClearQueue = () => {
    setQueuedImages([]);
  };

  // Submit batch uploads with Google Drive & IndexedDB synchronization
  const handleInsertBatchUpload = async () => {
    if (queuedImages.length === 0) return;

    setIsUploadingToDrive(true);
    setDriveUploadProgress({ current: 0, total: queuedImages.length });

    const newMaps: ChapterConceptMap[] = [];

    try {
      for (let i = 0; i < queuedImages.length; i++) {
        const q = queuedImages[i];
        setDriveUploadProgress({ current: i + 1, total: queuedImages.length });
        const cleanCaption = q.caption.trim() || `Concept Map: ${q.file.name}`;

        const uploadRes = await uploadConceptMapImage(q.previewUrl, {
          module,
          folderName: folderName || topicTitle,
          caption: cleanCaption,
          fileName: q.file.name,
        });

        newMaps.push(uploadRes.map);
      }
    } catch (err) {
      console.error("[AttachConceptMapModal] Batch upload error:", err);
    } finally {
      setIsUploadingToDrive(false);
      setDriveUploadProgress(null);
    }

    if (onAttachConceptMaps && newMaps.length > 0) {
      onAttachConceptMaps(newMaps);
    } else if (onAttachConceptMap && newMaps.length > 0) {
      newMaps.forEach((m) => onAttachConceptMap(m));
    }

    if (onInsertImage && newMaps.length > 0) {
      newMaps.forEach((m) => onInsertImage(m.title, m.url));
    }

    resetAndClose();
  };

  const handleInsertUrl = async () => {
    if (!directUrl.trim()) return;
    const cleanCaption = urlCaption.trim() || `Concept Map: ${topicTitle}`;

    setIsUploadingToDrive(true);
    let finalMap: ChapterConceptMap;

    try {
      const uploadRes = await uploadConceptMapImage(directUrl.trim(), {
        module,
        folderName: folderName || topicTitle,
        caption: cleanCaption,
      });
      finalMap = uploadRes.map;
    } catch {
      finalMap = {
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: cleanCaption,
        caption: cleanCaption,
        url: directUrl.trim(),
        createdAt: new Date().toISOString(),
      };
    } finally {
      setIsUploadingToDrive(false);
    }

    if (onAttachConceptMaps) {
      onAttachConceptMaps([finalMap]);
    } else if (onAttachConceptMap) {
      onAttachConceptMap(finalMap);
    }
    if (onInsertImage) {
      onInsertImage(cleanCaption, finalMap.url);
    }
    resetAndClose();
  };

  const handleInsertPreset = async (preset: ConceptMapPreset) => {
    const cleanCaption = `Concept Map: ${preset.title}`;

    setIsUploadingToDrive(true);
    let finalMap: ChapterConceptMap;

    try {
      const uploadRes = await uploadConceptMapImage(preset.svgDataUrl, {
        module,
        folderName: folderName || topicTitle,
        caption: cleanCaption,
        fileName: `${preset.id}.svg`,
      });
      finalMap = uploadRes.map;
    } catch {
      finalMap = {
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: cleanCaption,
        caption: cleanCaption,
        url: preset.svgDataUrl,
        createdAt: new Date().toISOString(),
      };
    } finally {
      setIsUploadingToDrive(false);
    }

    if (onAttachConceptMaps) {
      onAttachConceptMaps([finalMap]);
    } else if (onAttachConceptMap) {
      onAttachConceptMap(finalMap);
    }
    if (onInsertImage) {
      onInsertImage(cleanCaption, finalMap.url);
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setQueuedImages([]);
    setDirectUrl("");
    setUrlCaption("");
    setIsProcessing(false);
    setProcessingProgress(null);
    setIsUploadingToDrive(false);
    setDriveUploadProgress(null);
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={resetAndClose}
      >
        <div
          className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 bg-[var(--surface)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">
                  Attach Concept Maps & Architecture Diagrams
                </h3>
                <p className="text-xs text-[var(--text-muted)] truncate max-w-sm sm:max-w-md">
                  Upload multiple diagrams at once for &ldquo;{topicTitle}&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]/30 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "upload"
                  ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Images (Batch Supported)</span>
              {queuedImages.length > 0 && (
                <span className="rounded-full bg-[var(--primary)] text-white px-1.5 py-0.2 text-[10px] font-bold">
                  {queuedImages.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "url"
                  ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Direct Image URL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "presets"
                  ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Curated Blueprints</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* TAB 1: UPLOAD FILES (BATCH SUPPORTED) */}
            {activeTab === "upload" && (
              <div className="space-y-4">
                {/* Drag-and-drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] hover:border-[var(--primary)]/60 bg-[var(--surface-muted)]/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        void handleFilesAdded(e.target.files);
                      }
                      // Reset file input so re-selecting same files triggers change
                      e.target.value = "";
                    }}
                  />

                  <FileImage className="h-8 w-8 text-[var(--primary)] mx-auto mb-2 opacity-80" />
                  <p className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    Click to select multiple images or drag & drop all files here
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Multi-select enabled: choose 1, 5, 10, or more images at once (PNG, JPG, WebP, SVG vector diagrams)
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--primary)] border border-[var(--primary)]/20">
                    <Plus className="h-3 w-3" />
                    <span>Select multiple files (<kbd className="font-mono text-[10px]">Cmd</kbd>/<kbd className="font-mono text-[10px]">Ctrl</kbd> + click or drag a folder)</span>
                  </div>
                </div>

                {/* Processing Indicator */}
                {isProcessing && processingProgress && (
                  <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3 flex items-center justify-between text-xs text-[var(--primary)]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-semibold">
                        Optimizing diagram {processingProgress.current} of {processingProgress.total}...
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">
                      {Math.round((processingProgress.current / processingProgress.total) * 100)}%
                    </span>
                  </div>
                )}

                {/* Queued Images List */}
                {queuedImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                        <span>Ready to attach ({queuedImages.length} {queuedImages.length === 1 ? "diagram" : "diagrams"})</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add More</span>
                        </button>
                        <span className="text-[var(--border)]">•</span>
                        <button
                          type="button"
                          onClick={handleClearQueue}
                          className="text-[11px] font-semibold text-[var(--danger)] hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                      {queuedImages.map((img, idx) => (
                        <div
                          key={img.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-2.5 flex items-center gap-3 transition-all hover:border-[var(--primary)]/40"
                        >
                          {/* Thumbnail */}
                          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)]/70 p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.previewUrl}
                              alt={img.caption}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

                          {/* Editable Caption & Metadata */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              value={img.caption}
                              onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
                              placeholder="Diagram title / caption..."
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] font-semibold placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
                            />
                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono truncate">
                              <span>#{idx + 1}</span>
                              <span>•</span>
                              <span className="truncate">{img.file.name}</span>
                              <span>•</span>
                              <span>{img.width}×{img.height}</span>
                              <span>•</span>
                              <span>{img.sizeFormatted}</span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveQueuedImage(img.id)}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors shrink-0"
                            title="Remove from upload queue"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage Transparency Banner */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-3 flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
                  <Database className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[var(--text)] text-[11px]">
                      Where are these images saved?
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      All images are automatically synchronized to your <span className="font-semibold text-[var(--text)]">Google Drive</span> under <code className="font-mono text-[10px] text-[var(--primary)]">Shore/{module === "dsa" ? "DSA" : "Learning"}/{folderName || topicTitle}/</code>, and backed up in your local IndexedDB vault. They are also securely persisted to your cloud database under <code className="font-mono text-[10px] text-[var(--primary)]">resources.concept_maps</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE URL */}
            {activeTab === "url" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder="https://example.com/architecture-diagram.png"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Direct link to a PNG, SVG, or WebP diagram (e.g. from GitHub, Draw.io, or Excalidraw)
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Caption / Title
                  </label>
                  <input
                    type="text"
                    value={urlCaption}
                    onChange={(e) => setUrlCaption(e.target.value)}
                    placeholder={`Concept Map: ${topicTitle}`}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  />
                </div>

                {directUrl.trim() && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-3 space-y-2">
                    <span className="text-[11px] font-bold text-[var(--text)]">URL Image Preview:</span>
                    <div className="max-h-48 overflow-hidden rounded-lg bg-[var(--background)] flex items-center justify-center p-2 border border-[var(--border)]/70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={directUrl}
                        alt="Preview"
                        className="max-h-40 w-auto max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CURATED ARCHITECTURE PRESETS */}
            {activeTab === "presets" && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Pick from battle-tested architecture blueprints. Preserved as 100% vector SVG blueprints for razor-sharp clarity:
                </p>

                <div className="space-y-3">
                  {CURATED_CONCEPT_MAP_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--primary)]/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--primary)]/20">
                            {preset.category}
                          </span>
                          <h4 className="text-xs font-bold text-[var(--text)] truncate">
                            {preset.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInsertPreset(preset)}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-opacity shrink-0"
                      >
                        <span>Attach Blueprint</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-[var(--border)] px-5 py-3.5 bg-[var(--surface-muted)]/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)] shrink-0" />
              <span>Multi-select active: select multiple files with Cmd/Ctrl + click</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                Cancel
              </button>

              {activeTab === "upload" && (
                <button
                  type="button"
                  onClick={handleInsertBatchUpload}
                  disabled={queuedImages.length === 0 || isProcessing || isUploadingToDrive}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {isUploadingToDrive ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>
                        Syncing {driveUploadProgress?.current ?? 1}/{driveUploadProgress?.total ?? queuedImages.length}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>
                        {queuedImages.length <= 1
                          ? "Attach Diagram"
                          : `Attach All (${queuedImages.length} Diagrams)`}
                      </span>
                    </>
                  )}
                </button>
              )}

              {activeTab === "url" && (
                <button
                  type="button"
                  onClick={handleInsertUrl}
                  disabled={!directUrl.trim() || isUploadingToDrive}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {isUploadingToDrive ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Attach from URL</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
