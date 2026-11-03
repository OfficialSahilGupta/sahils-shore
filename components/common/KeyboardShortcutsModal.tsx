"use client";

// ============================================================================
// Sahil's Shore: Keyboard Shortcuts Reference Modal
// Triggered by pressing "?" anywhere or from the Command Palette
// ============================================================================

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const shortcutGroups = [
    {
      title: "Quick Capture & Creation",
      items: [
        { key: "n", desc: "Create a new Task / Todo" },
        { key: "e", desc: "Log a new Expense (INR)" },
        { key: "m", desc: "Log a Meal" },
        { key: "q", desc: "Open Quick Capture Sheet" },
      ],
    },
    {
      title: "Search & Command Bar",
      items: [
        { key: "Cmd + K", desc: "Open Command Palette & Global Search" },
        { key: "/", desc: "Focus Search & Command Palette" },
        { key: "Esc", desc: "Close open modal or palette" },
        { key: "?", desc: "Open this Shortcuts Cheatsheet" },
      ],
    },
    {
      title: "Go To Navigation (Press 'g' then key)",
      items: [
        { key: "g  t", desc: "Go to Today Dashboard" },
        { key: "g  d", desc: "Go to DSA Tracker" },
        { key: "g  e", desc: "Go to Expense Tracker" },
        { key: "g  l", desc: "Go to Learning Hub" },
        { key: "g  g", desc: "Go to German Hub & Lab" },
        { key: "g  c", desc: "Go to Career & Resume Hub" },
        { key: "g  n", desc: "Go to Notes (Second Brain)" },
        { key: "g  j", desc: "Go to Journal & Reflection" },
        { key: "g  m", desc: "Go to Media Vault & Memories" },
        { key: "g  p", desc: "Go to Places & Map" },
        { key: "g  s", desc: "Go to Settings & Backups" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl border border-border bg-surface p-6 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-text">
                Keyboard Shortcuts
              </DialogTitle>
              <p className="text-xs text-text-muted">
                Navigate and log anywhere on Sahil&apos;s Shore without touching your mouse
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-5 py-4 pr-1">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {group.title}
              </h4>
              <div className="rounded-2xl border border-border/60 bg-surface-muted/30 divide-y divide-border/40">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <span className="text-text-muted">{item.desc}</span>
                    <kbd className="inline-flex items-center rounded-lg border border-border bg-surface px-2 py-1 font-mono text-[11px] font-semibold text-text shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
