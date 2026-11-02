"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type QuickCaptureTab = "task" | "expense" | "meal" | "note" | "timer";

interface QuickCaptureContextValue {
  isOpen: boolean;
  activeTab: QuickCaptureTab;
  open: (tab?: QuickCaptureTab) => void;
  close: () => void;
  setActiveTab: (tab: QuickCaptureTab) => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

export function QuickCaptureProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickCaptureTab>("task");

  const open = (tab?: QuickCaptureTab) => {
    if (tab) setActiveTab(tab);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  // Global keyboard shortcut ('q' when not typing in an input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "q" || e.key === "Q") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <QuickCaptureContext.Provider
      value={{
        isOpen,
        activeTab,
        open,
        close,
        setActiveTab,
      }}
    >
      {children}
    </QuickCaptureContext.Provider>
  );
}

export function useQuickCapture() {
  const ctx = useContext(QuickCaptureContext);
  if (!ctx) {
    throw new Error("useQuickCapture must be used within a QuickCaptureProvider");
  }
  return ctx;
}
