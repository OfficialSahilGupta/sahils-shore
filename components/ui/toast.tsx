"use client";

// ============================================================================
// Sahil's Shore: Toast Notification Provider with Undo Action Support
// Used for optimistic updates, undoing deletes/completions, and system alerts
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  durationMs?: number;
  onUndo?: () => void;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      type = "info",
      durationMs = 5000,
      onUndo,
    }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        title,
        description,
        type,
        durationMs,
        onUndo,
      };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismiss(id);
        }, durationMs);
      }

      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast floating container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-lg backdrop-blur-md"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {t.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                )}
                {t.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                )}
                {t.type === "info" && (
                  <Info className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight truncate">{t.title}</p>
                  {t.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {t.onUndo && (
                  <button
                    onClick={() => {
                      t.onUndo?.();
                      dismiss(t.id);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-90 transition-opacity"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Undo
                  </button>
                )}
                <button
                  onClick={() => dismiss(t.id)}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
