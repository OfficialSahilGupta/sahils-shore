"use client";

// ============================================================================
// Sahil's Shore: Timeline Event Detail Modal
// Displays source record metadata and provides 1-tap navigation to the source module
// ============================================================================

import React from "react";
import Link from "next/link";
import type { TimelineEvent } from "@/types";
import { getEventTypeConfig, formatTimelineEventTime } from "@/lib/timeline";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import { formatINR } from "@/lib/expenses";
import {
  X,
  ExternalLink,
  Clock,
  Database,
  Calendar,
  Layers,
  CheckCircle2,
  BookOpen,
  Wallet,
  Utensils,
  MapPin,
  Image as ImageIcon,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
} from "lucide-react";

interface TimelineDetailModalProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

export function TimelineDetailModal({ event, onClose }: TimelineDetailModalProps) {
  if (!event) return null;

  const config = getEventTypeConfig(event.type);
  const meta = (event.meta || {}) as Record<string, unknown>;

  const getIcon = () => {
    switch (config.iconName) {
      case "check":
        return <CheckCircle2 className={`w-5 h-5 ${config.colorClass}`} />;
      case "book":
        return <BookOpen className={`w-5 h-5 ${config.colorClass}`} />;
      case "wallet":
        return <Wallet className={`w-5 h-5 ${config.colorClass}`} />;
      case "trending-up":
        return <TrendingUp className={`w-5 h-5 ${config.colorClass}`} />;
      case "utensils":
        return <Utensils className={`w-5 h-5 ${config.colorClass}`} />;
      case "pin":
        return <MapPin className={`w-5 h-5 ${config.colorClass}`} />;
      case "image":
        return <ImageIcon className={`w-5 h-5 ${config.colorClass}`} />;
      case "zap":
        return <Zap className={`w-5 h-5 ${config.colorClass}`} />;
      case "file-text":
        return <FileText className={`w-5 h-5 ${config.colorClass}`} />;
      default:
        return <Sparkles className={`w-5 h-5 ${config.colorClass}`} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface-muted/40">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${config.bgClass} border ${config.borderClass}`}>
              {getIcon()}
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {config.label}
              </span>
              <h3 className="text-sm font-bold text-text truncate max-w-[240px]">
                {event.summary}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Content */}
        <div className="p-5 space-y-4">
          {/* Time & Date */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-border bg-surface-muted/30">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">IST Date</span>
              </div>
              <div className="font-medium text-text">
                {formatFriendlyISTDate(event.occurred_at)}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface-muted/30">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">IST Time</span>
              </div>
              <div className="font-bold text-text">
                {formatTimelineEventTime(event.occurred_at)}
              </div>
            </div>
          </div>

          {/* Reference Entity Info */}
          {(event.ref_table || event.ref_id) && (
            <div className="p-3 rounded-xl border border-border bg-surface-muted/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-text-muted">
                <Database className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Source Database Record</span>
              </div>
              <div className="flex items-center justify-between text-text font-mono text-[11px]">
                <span className="text-text-muted">Table:</span>
                <span className="font-semibold text-primary">{event.ref_table}</span>
              </div>
              {event.ref_id && (
                <div className="flex items-center justify-between text-text font-mono text-[11px]">
                  <span className="text-text-muted">ID:</span>
                  <span className="truncate max-w-[200px]" title={event.ref_id}>
                    {event.ref_id}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Meta Properties */}
          {Object.keys(meta).length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Event Metadata
              </span>
              <div className="p-3 rounded-xl border border-border bg-surface-muted/20 text-xs space-y-1.5 font-mono max-h-36 overflow-y-auto">
                {Object.entries(meta).map(([key, value]) => {
                  let displayVal = String(value);
                  if (key === "amount_paise" && typeof value === "number") {
                    displayVal = formatINR(value);
                  }
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-text-muted">{key}:</span>
                      <span className="font-semibold text-text truncate max-w-[220px]">
                        {displayVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Button: Navigate to Source Module */}
          <Link
            href={config.route}
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Open in {config.label.split(" ")[0]} Module</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
