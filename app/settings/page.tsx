"use client";

// ============================================================================
// Sahil's Shore: Settings Page
// Appearance, Module Management, and Privacy Security Hub
// ============================================================================

import React, { useState } from "react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { ModuleSettings } from "@/components/settings/ModuleSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { ThemePreviewPanel } from "@/components/settings/ThemePreviewPanel";
import { Palette, Grid, Shield, Sparkles } from "lucide-react";

type SettingsTab = "appearance" | "modules" | "privacy";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  const tabs = [
    { id: "appearance" as const, label: "Appearance & Theme", icon: Palette },
    { id: "modules" as const, label: "Modules & Sidebar", icon: Grid },
    { id: "privacy" as const, label: "Privacy & Vault", icon: Shield },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
    </div>
  );
}
