"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Quick-Add Expense Bottom Sheet / Modal
// Fast logging (< 5s on mobile), large amount keypad, category chips,
// payment method selector, place suggestions, and receipt attachment.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Camera,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Tag,
  Sparkles,
} from "lucide-react";
import { ExpenseKeypad } from "./ExpenseKeypad";
import { formatINR, rupeesToPaise, type CreateExpenseInput } from "@/lib/expenses";
import type { ExpenseCategory } from "@/types/index.ts";
import { todayIST } from "@/lib/date-utils";

interface QuickAddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onSave: (input: CreateExpenseInput, categoryName?: string) => Promise<void>;
  defaultCategoryId?: string;
  defaultPlace?: string;
}

const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking", "Other"];

const QUICK_PLACES = [
  "Swiggy",
  "Zomato",
  "Blinkit",
  "Amazon",
  "Metro",
  "DMart",
  "Apollo",
  "Zepto",
];

export function QuickAddExpenseSheet({
  isOpen,
  onClose,
  categories,
  onSave,
  defaultCategoryId,
  defaultPlace,
}: QuickAddExpenseSheetProps) {
  const [amountStr, setAmountStr] = useState("0");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");
  const [spentAtDate, setSpentAtDate] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      setAmountStr("0");
      setPlace(defaultPlace || "");
      setNotes("");
      setPaymentMethod("UPI");
      setReceiptUrl(null);
      setShowMoreDetails(false);

      // Default category
      if (defaultCategoryId) {
        setSelectedCategoryId(defaultCategoryId);
      } else if (categories.length > 0) {
        // Prefer Food or first category
        const foodCat = categories.find((c) => c.name.toLowerCase() === "food");
        setSelectedCategoryId(foodCat ? foodCat.id : categories[0].id);
      }

      // Default date: now (IST)
      const now = new Date();
      // Format to YYYY-MM-DDTHH:mm for datetime-local input
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
      setSpentAtDate(localISOTime);
    }
  }, [isOpen, defaultCategoryId, defaultPlace, categories]);

  if (!isOpen) return null;

  const currentPaise = rupeesToPaise(amountStr);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleSave = async () => {
    if (currentPaise <= 0) return;
    setIsSubmitting(true);
    try {
      const utcIso = spentAtDate ? new Date(spentAtDate).toISOString() : new Date().toISOString();

      await onSave(
        {
          amount_paise: currentPaise,
          category_id: selectedCategoryId || null,
          payment_method: paymentMethod,
          place: place.trim() || null,
          notes: notes.trim() || null,
          receipt_url: receiptUrl || null,
          spent_at: utcIso,
        },
        selectedCategory?.name
      );
      onClose();
    } catch (err) {
      console.error("Error saving expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    try {
      // 1. Generate client-side thumbnail data URL for instant display
      const { generateImageThumbnail } = await import("@/lib/media/thumbnail");
      const thumb = await generateImageThumbnail(file, 600);
      setReceiptUrl(thumb.dataUrl || URL.createObjectURL(file));

      // 2. Initiate direct upload to Google Drive Receipts/ folder
      fetch("/api/drive/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `receipt_${Date.now()}_${file.name}`,
          mimeType: file.type || "image/jpeg",
          size: file.size,
          folderType: "receipts",
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.uploadUrl) {
              const xhr = new XMLHttpRequest();
              xhr.open("PUT", data.uploadUrl, true);
              xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
              xhr.send(file);
            }
          }
        })
        .catch((err) => console.warn("Receipt Drive sync background upload:", err));
    } catch (err) {
      console.warn("Receipt thumbnail fallback:", err);
      const url = URL.createObjectURL(file);
      setReceiptUrl(url);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs duration-200 animate-in fade-in p-0 sm:p-4"
    >
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Modal Body */}
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-surface border border-border/70 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Handle (Mobile) & Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-surface">
          <div className="flex items-center gap-2">
            <div className="h-2 w-8 bg-border rounded-full mx-auto sm:hidden absolute top-2 left-1/2 -translate-x-1/2" />
            <h2 className="text-base font-semibold text-text flex items-center gap-2 pt-1 sm:pt-0">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Quick Add Expense
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {/* Keypad */}
          <ExpenseKeypad value={amountStr} onChange={setAmountStr} />

          {/* Category Chips */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm scale-102"
                        : "bg-surface-muted text-text-muted hover:text-text hover:bg-border/60"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color || "#1F7A8C" }}
                    />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Chips */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-text text-surface font-semibold shadow-xs"
                        : "bg-surface-muted text-text-muted hover:text-text"
                    }`}
                  >
                    {pm}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Place & Quick Suggestions */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Place / Vendor (Optional)
            </label>
            <div className="relative mb-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Swiggy, Starbucks, DMart..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-muted/60 border border-border/50 text-text placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1">
              {QUICK_PLACES.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => setPlace(qp)}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-surface-muted hover:bg-border/50 text-text-muted hover:text-text transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible More Details Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {showMoreDetails ? "− Hide extra details" : "+ Add note, date, or receipt photo"}
            </button>
          </div>

          {showMoreDetails && (
            <div className="space-y-3 pt-2 border-t border-border/40 animate-in fade-in duration-150">
              {/* Note */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-1 block">
                  Notes
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Lunch with team, monthly groceries"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-muted/60 border border-border/50 text-text placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-1 block">
                  Date & Time (IST)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="datetime-local"
                    value={spentAtDate}
                    onChange={(e) => setSpentAtDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-muted/60 border border-border/50 text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Receipt Attachment */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-1 block">
                  Receipt Photo
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-muted hover:bg-border/50 border border-border/60 text-xs font-medium text-text transition-colors">
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    <span>Attach Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                  {receiptUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={receiptUrl}
                        alt="Receipt preview"
                        className="h-10 w-10 object-cover rounded-lg border border-border shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptUrl(null)}
                        className="text-xs text-danger hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: One-Tap Save Action */}
        <div className="p-4 border-t border-border/50 bg-surface">
          <button
            type="button"
            disabled={currentPaise <= 0 || isSubmitting}
            onClick={handleSave}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg hover:opacity-95 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5 stroke-[2.5]" />
            <span>
              {currentPaise > 0
                ? `Save Expense • ${formatINR(currentPaise)}`
                : "Enter an Amount"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
