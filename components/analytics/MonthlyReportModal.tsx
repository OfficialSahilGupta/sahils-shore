"use client";

// ============================================================================
// Sahil's Shore: Monthly Report Modal Component
// Full-page retrospective viewer with Markdown, CSV, and Print/PDF export
// ============================================================================

import React, { useState } from "react";
import type { AnalyticsBundle } from "@/lib/analytics/types";
import {
  generateMonthlyMarkdownReport,
  generateDailyAnalyticsCsv,
} from "@/lib/analytics/export";
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface MonthlyReportModalProps {
  bundle: AnalyticsBundle;
  isOpen: boolean;
  onClose: () => void;
}

export function MonthlyReportModal({
  bundle,
  isOpen,
  onClose,
}: MonthlyReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownContent = generateMonthlyMarkdownReport(bundle);
  const csvContent = generateDailyAnalyticsCsv(bundle);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report:", err);
    }
  };

  const handleDownloadMarkdown = () => {
    const filename = `shore-monthly-report-${bundle.dateRange.startDate}-to-${bundle.dateRange.endDate}.md`;
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const filename = `shore-daily-metrics-${bundle.dateRange.startDate}-to-${bundle.dateRange.endDate}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:static print:bg-transparent">
      <div className="flex flex-col h-[90vh] w-full max-w-4xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden print:border-none print:shadow-none print:h-auto print:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text sm:text-lg">
                Monthly Executive Report
              </h2>
              <p className="text-xs text-text-muted">
                {bundle.dateRange.startDate} to {bundle.dateRange.endDate} ({bundle.dateRange.label})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
              title="Copy Markdown to Clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
              title="Download as Markdown file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>.MD</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
              title="Download daily metrics CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>.CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-opacity"
              title="Print or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="ml-2 rounded-xl p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 font-sans text-text text-sm leading-relaxed space-y-6">
          <div className="whitespace-pre-wrap font-mono text-xs text-text bg-surface-muted/40 p-5 rounded-xl border border-border select-all">
            {markdownContent}
          </div>
        </div>
      </div>
    </div>
  );
}
