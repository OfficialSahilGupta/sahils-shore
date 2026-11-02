"use client";

// ============================================================================
// Sahil's Shore: Module Configuration Context
// Drives sidebar, mobile navigation, module ordering, renaming, and toggling
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { MODULES, AppModule, ModuleCategory } from "@/lib/modules";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export interface UserModuleOverride {
  id: string;
  customName?: string;
  customShortName?: string;
  enabled: boolean;
  order: number;
  inMobileNav?: boolean;
}

export type UserModulesMap = Record<string, UserModuleOverride>;

interface ModuleContextValue {
  modules: AppModule[];
  enabledModules: AppModule[];
  mobileNavModules: AppModule[];
  isSaving: boolean;
  toggleModule: (id: string) => void;
  renameModule: (id: string, name: string, shortName?: string) => void;
  reorderModules: (orderedIds: string[]) => void;
  moveModule: (id: string, direction: "up" | "down") => void;
  resetModules: () => void;
  saveModulesToSupabase: () => Promise<boolean>;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

const STORAGE_KEY = "shore_modules_config";

export function ModuleConfigProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<UserModulesMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage and Supabase on mount
  useEffect(() => {
    setMounted(true);
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setOverrides(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Failed to read modules config from localStorage:", e);
    }

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase
            .from("settings")
            .select("modules_config")
            .eq("user_id", data.user.id)
            .single()
            .then(({ data: settingsData }) => {
              if (
                settingsData?.modules_config &&
                typeof settingsData.modules_config === "object"
              ) {
                const sbConfig = settingsData.modules_config as unknown as UserModulesMap;
                setOverrides(sbConfig);
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(sbConfig));
                } catch {}
              }
            });
        }
      });
    } catch {}
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (mounted && Object.keys(overrides).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
      } catch (e) {
        console.warn("Failed to save modules config to localStorage:", e);
      }
    }
  }, [overrides, mounted]);

  // Compute merged module list
  const modules: AppModule[] = MODULES.map((base) => {
    const override = overrides[base.id];
    if (!override) return base;
    return {
      ...base,
      name: override.customName || base.name,
      shortName: override.customShortName || base.shortName,
      enabled: override.enabled !== undefined ? override.enabled : base.enabled,
      order: override.order !== undefined ? override.order : base.order,
      inMobileNav:
        override.inMobileNav !== undefined ? override.inMobileNav : base.inMobileNav,
    };
  }).sort((a, b) => a.order - b.order);

  const enabledModules = modules.filter((m) => m.enabled);
  const mobileNavModules = modules.filter((m) => m.enabled && m.inMobileNav);

  const toggleModule = useCallback((id: string) => {
    setOverrides((prev) => {
      const current = prev[id] || {
        id,
        enabled: MODULES.find((m) => m.id === id)?.enabled ?? true,
        order: MODULES.find((m) => m.id === id)?.order ?? 0,
      };
      return {
        ...prev,
        [id]: {
          ...current,
          enabled: !current.enabled,
        },
      };
    });
  }, []);

  const renameModule = useCallback((id: string, name: string, shortName?: string) => {
    setOverrides((prev) => {
      const current = prev[id] || {
        id,
        enabled: MODULES.find((m) => m.id === id)?.enabled ?? true,
        order: MODULES.find((m) => m.id === id)?.order ?? 0,
      };
      return {
        ...prev,
        [id]: {
          ...current,
          customName: name.trim() || undefined,
          customShortName: shortName?.trim() || undefined,
        },
      };
    });
  }, []);

  const reorderModules = useCallback((orderedIds: string[]) => {
    setOverrides((prev) => {
      const next = { ...prev };
      orderedIds.forEach((id, index) => {
        const current = next[id] || {
          id,
          enabled: MODULES.find((m) => m.id === id)?.enabled ?? true,
          order: index + 1,
        };
        next[id] = {
          ...current,
          order: index + 1,
        };
      });
      return next;
    });
  }, []);

  const moveModule = useCallback(
    (id: string, direction: "up" | "down") => {
      const currentIdx = modules.findIndex((m) => m.id === id);
      if (currentIdx === -1) return;

      const targetIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
      if (targetIdx < 0 || targetIdx >= modules.length) return;

      const newModuleList = [...modules];
      const [moved] = newModuleList.splice(currentIdx, 1);
      newModuleList.splice(targetIdx, 0, moved);

      reorderModules(newModuleList.map((m) => m.id));
    },
    [modules, reorderModules]
  );

  const resetModules = useCallback(() => {
    setOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const saveModulesToSupabase = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsSaving(false);
        return false;
      }

      const { error } = await supabase
        .from("settings")
        .update({
          modules_config: overrides as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      setIsSaving(false);
      return !error;
    } catch (err) {
      console.error("Failed to save modules config to Supabase:", err);
      setIsSaving(false);
      return false;
    }
  }, [overrides]);

  return (
    <ModuleContext.Provider
      value={{
        modules,
        enabledModules,
        mobileNavModules,
        isSaving,
        toggleModule,
        renameModule,
        reorderModules,
        moveModule,
        resetModules,
        saveModulesToSupabase,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) {
    throw new Error("useModules must be used within a ModuleConfigProvider");
  }
  return ctx;
}
