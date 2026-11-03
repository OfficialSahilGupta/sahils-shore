"use client";

// ============================================================================
// Sahil's Shore: Settings Page
// Appearance, Module Management, Privacy Security, and Google Drive Cloud Sync
// ============================================================================

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { ModuleSettings } from "@/components/settings/ModuleSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { DriveSettings } from "@/components/settings/DriveSettings";
import { CoachSettings } from "@/components/settings/CoachSettings";
import { BackupSettings } from "@/components/settings/BackupSettings";
import { ThemePreviewPanel } from "@/components/settings/ThemePreviewPanel";
import { Palette, Grid, Shield, HardDrive, Sparkles, RefreshCw, Bot, Database } from "lucide-react";

type SettingsTab = "appearance" | "modules" | "privacy" | "drive" | "coach" | "backups";

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  // Automatically activate Drive tab or Backups tab if requested in URL
  useEffect(() => {
    if (searchParams?.get("tab") === "backups") {
      setActiveTab("backups");
    } else if (
      searchParams?.get("tab") === "drive" ||
      searchParams?.has("drive") ||
      searchParams?.has("drive_error")
    ) {
      setActiveTab("drive");
    }
  }, [searchParams]);

  const tabs = [
    { id: "appearance" as const, label: "Appearance & Theme", icon: Palette },
    { id: "modules" as const, label: "Modules & Sidebar", icon: Grid },
    { id: "privacy" as const, label: "Privacy & Vault", icon: Shield },
    { id: "drive" as const, label: "Google Drive Sync", icon: HardDrive },
    { id: "coach" as const, label: "AI Coach", icon: Bot },
    { id: "backups" as const, label: "Backups & Restore", icon: Database },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
          <span>Workspace Settings</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Preferences & Customization
        </h1>
        <p className="text-xs text-text-muted sm:text-sm">
          Tailor Sahil&apos;s Shore to your exact visual aesthetics, workflow order, and security preferences.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-text-muted hover:bg-surface-muted hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "appearance" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Controls (7 cols on desktop) */}
          <div className="lg:col-span-7">
            <AppearanceSettings />
          </div>

          {/* Sticky Live Preview Panel (5 cols on desktop) */}
          <div className="lg:col-span-5">
            <ThemePreviewPanel />
          </div>
        </div>
      )}

      {activeTab === "modules" && (
        <div className="max-w-4xl">
          <ModuleSettings />
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="max-w-3xl">
          <PrivacySettings />
        </div>
      )}

      {activeTab === "drive" && (
        <div className="max-w-3xl">
          <DriveSettings />
        </div>
      )}

      {activeTab === "coach" && (
        <div className="max-w-3xl">
          <CoachSettings />
        </div>
      )}

      {activeTab === "backups" && (
        <div className="max-w-5xl">
          <BackupSettings />
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
