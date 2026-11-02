"use client";

// ============================================================================
// Sahil's Shore: Module Settings Component
// Toggle on/off, rename, and reorder modules (drag-and-drop + accessible controls)
// ============================================================================

import React, { useState } from "react";
import { useModules } from "@/lib/modules/ModuleContext";
import { ModuleIcon } from "@/components/common/ModuleIcon";
import { CATEGORY_LABELS } from "@/lib/modules";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  RotateCcw,
  Save,
  CheckCircle2,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

export function ModuleSettings() {
  const {
    modules,
    isSaving,
    toggleModule,
    renameModule,
    reorderModules,
    moveModule,
    resetModules,
    saveModulesToSupabase,
  } = useModules();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const startEditing = (id: string, name: string, shortName: string) => {
    setEditingId(id);
    setEditName(name);
    setEditShortName(shortName);
  };

  const saveEdit = (id: string) => {
    renameModule(id, editName, editShortName);
    setEditingId(null);
  };

  const handleSaveToCloud = async () => {
    const success = await saveModulesToSupabase();
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // HTML5 Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...modules];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);

    setDraggedIndex(index);
    reorderModules(updated.map((m) => m.id));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            Modules & Sidebar Customizer
          </h2>
          <p className="text-xs text-text-muted">
            Toggle modules on/off, customize their names, and drag or move to reorder.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetModules}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                <span>Saved to Cloud</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Notice */}
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-text-muted">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span>
          Changes made here immediately update your desktop sidebar, mobile navigation bar, and command palette.
        </span>
      </div>

      {/* Module List with Drag & Drop */}
      <div className="space-y-2">
        {modules.map((mod, index) => {
          const isEditing = editingId === mod.id;
          const isDragging = draggedIndex === index;

          return (
            <div
              key={mod.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                isDragging
                  ? "border-primary bg-primary/10 shadow-md opacity-60"
                  : mod.enabled
                  ? "border-border bg-surface shadow-sm hover:border-primary/40"
                  : "border-border/60 bg-surface-muted/40 opacity-70"
              }`}
            >
              {/* Drag Handle & Icon */}
              <div className="flex items-center gap-2.5">
                <button
                  aria-label="Drag to reorder"
                  className="cursor-grab text-text-muted transition-colors hover:text-text active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    mod.enabled
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-surface-muted text-text-muted"
                  }`}
                >
                  <ModuleIcon name={mod.iconName} className="h-4 w-4" />
                </div>

                {/* Module Details or Inline Editor */}
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Module Name"
                        className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-text outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={editShortName}
                        onChange={(e) => setEditShortName(e.target.value)}
                        placeholder="Short Name"
                        className="h-8 w-24 rounded-lg border border-border bg-surface px-2.5 text-xs text-text outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => saveEdit(mod.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text">
                          {mod.name}
                        </span>
                        <span className="rounded border border-border bg-surface-muted px-1.5 py-0.2 text-[10px] text-text-muted font-mono">
                          {mod.shortName}
                        </span>
                        <span className="rounded bg-surface-muted px-1.5 py-0.2 text-[10px] text-text-muted">
                          {CATEGORY_LABELS[mod.category]}
                        </span>
                        {mod.inMobileNav && (
                          <span
                            title="Included in bottom navigation"
                            className="flex items-center gap-0.5 text-[10px] text-primary"
                          >
                            <Smartphone className="h-3 w-3" />
                            <span>Nav</span>
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {mod.tagline}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1.5">
                {/* Rename Button */}
                {!isEditing && (
                  <button
                    onClick={() => startEditing(mod.id, mod.name, mod.shortName)}
                    title="Rename module"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-muted/60 text-text-muted transition-colors hover:bg-surface hover:text-text"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                )}

                {/* Accessible Reorder Arrows */}
                <button
                  onClick={() => moveModule(mod.id, "up")}
                  disabled={index === 0}
                  title="Move Up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-muted/60 text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => moveModule(mod.id, "down")}
                  disabled={index === modules.length - 1}
                  title="Move Down"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-muted/60 text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {/* Enable / Disable Toggle Switch */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  title={mod.enabled ? "Disable module" : "Enable module"}
                  className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all ${
                    mod.enabled
                      ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                      : "border border-border bg-surface text-text-muted hover:bg-surface-muted hover:text-text"
                  }`}
                >
                  {mod.enabled ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Active</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
