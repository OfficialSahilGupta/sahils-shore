"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Quick-Add & Edit Expense Sheet
// Fast logging, large keypad, first-class bill/receipt capture (camera & gallery),
// full edit mode support, category icons, and responsive layout.
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Camera,
  ImagePlus,
  MapPin,
  Calendar,
  FileText,
  Tag,
  Utensils,
  Car,
  ShoppingCart,
  Zap,
  Heart,
  BookOpen,
  Tv,
  Dumbbell,
  ShoppingBag,
  Loader2,
  Receipt,
  Trash2,
} from "lucide-react";
import { ExpenseKeypad } from "./ExpenseKeypad";
import {
  formatINR,
  rupeesToPaise,
  paiseToRupees,
  type CreateExpenseInput,
} from "@/lib/expenses";
import type { Expense, ExpenseCategory } from "@/types/index.ts";

// ----------------------------------------------------------------------------
// Category Icon Mapping (Lucide Icons only — Zero Emojis)
// ----------------------------------------------------------------------------
export function getCategoryIcon(categoryName: string): React.ElementType {
  const name = (categoryName || "").toLowerCase();
  if (
    name.includes("food") ||
    name.includes("eat") ||
    name.includes("meal") ||
    name.includes("restaurant") ||
    name.includes("dining")
  ) {
    return Utensils;
  }
  if (
    name.includes("transport") ||
    name.includes("travel") ||
    name.includes("car") ||
    name.includes("fuel") ||
    name.includes("auto") ||
    name.includes("cab") ||
    name.includes("metro")
  ) {
    return Car;
  }
  if (name.includes("shopping")) return ShoppingCart;
  if (
    name.includes("bill") ||
    name.includes("utilit") ||
    name.includes("electric") ||
    name.includes("internet") ||
    name.includes("wifi") ||
    name.includes("phone")
  ) {
    return Zap;
  }
  if (
    name.includes("health") ||
    name.includes("medical") ||
    name.includes("doctor") ||
    name.includes("medicine") ||
    name.includes("pharmacy")
  ) {
    return Heart;
  }
  if (
    name.includes("education") ||
    name.includes("study") ||
    name.includes("learning") ||
    name.includes("course") ||
    name.includes("book")
  ) {
    return BookOpen;
  }
  if (
    name.includes("entertainment") ||
    name.includes("stream") ||
    name.includes("movie") ||
    name.includes("ott") ||
    name.includes("game")
  ) {
    return Tv;
  }
  if (
    name.includes("gym") ||
    name.includes("fitness") ||
    name.includes("workout") ||
    name.includes("sport")
  ) {
    return Dumbbell;
  }
  if (
    name.includes("grocer") ||
    name.includes("supermarket") ||
    name.includes("vegetable") ||
    name.includes("fruit")
  ) {
    return ShoppingBag;
  }
  return Tag;
}

interface QuickAddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onSave: (input: CreateExpenseInput, categoryName?: string) => Promise<void>;
  editingExpense?: Expense | null;
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
  editingExpense,
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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize form states on open or when editingExpense changes
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        // Edit Mode: populate with existing values
        const inRupees = paiseToRupees(editingExpense.amount_paise);
        setAmountStr(inRupees.toString());
        setSelectedCategoryId(editingExpense.category_id || "");
        setPaymentMethod(editingExpense.payment_method || "UPI");
        setPlace(editingExpense.place || "");
        setNotes(editingExpense.notes || "");
        setReceiptUrl(editingExpense.receipt_url || null);

        // Convert UTC spent_at to local datetime input string
        const expDate = new Date(editingExpense.spent_at);
        const tzOffset = expDate.getTimezoneOffset() * 60000;
        const localISOTime = new Date(expDate.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setSpentAtDate(localISOTime);
      } else {
        // Create Mode: initialize fresh defaults
        setAmountStr("0");
        setPlace(defaultPlace || "");
        setNotes("");
        setPaymentMethod("UPI");
        setReceiptUrl(null);

        if (defaultCategoryId) {
          setSelectedCategoryId(defaultCategoryId);
        } else if (categories.length > 0) {
          const foodCat = categories.find((c) => c.name.toLowerCase() === "food");
          setSelectedCategoryId(foodCat ? foodCat.id : categories[0].id);
        }

        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setSpentAtDate(localISOTime);
      }
    }
  }, [isOpen, editingExpense, defaultCategoryId, defaultPlace, categories]);

  if (!isOpen) return null;

  const currentPaise = rupeesToPaise(amountStr);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleSave = async () => {
    if (currentPaise <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const utcIso = spentAtDate
        ? new Date(spentAtDate).toISOString()
        : new Date().toISOString();

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
      // 1. Generate client-side thumbnail data URL for instant feedback
      const { generateImageThumbnail } = await import("@/lib/media/thumbnail");
      const thumb = await generateImageThumbnail(file, 800);
      setReceiptUrl(thumb.dataUrl || URL.createObjectURL(file));

      // 2. Upload to Google Drive Receipts/ folder in background
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
        .catch((err) => console.warn("Receipt background Drive sync:", err));
    } catch (err) {
      console.warn("Receipt thumbnail fallback:", err);
      const url = URL.createObjectURL(file);
      setReceiptUrl(url);
    } finally {
      setIsUploadingReceipt(false);
      // Reset input value so same file can be re-selected if removed
      e.target.value = "";
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
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-surface border border-border/70 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom duration-250 min-w-0">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-surface shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-8 bg-border rounded-full mx-auto sm:hidden absolute top-2 left-1/2 -translate-x-1/2" />
            <h2 className="text-base font-semibold text-text flex items-center gap-2 pt-1 sm:pt-0 truncate">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
              {editingExpense ? "Edit Expense" : "Log Expense"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-muted transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-w-0">
          {/* Keypad */}
          <ExpenseKeypad value={amountStr} onChange={setAmountStr} />

          {/* First-Class Bill / Receipt Section */}
          <div className="p-3.5 bg-surface-muted/40 border border-border/70 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-primary shrink-0" />
                Bill / Receipt Photo
              </span>
              {receiptUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">
                  <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                  Bill attached
                </span>
              )}
            </div>

            {/* Hidden native inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptUpload}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="hidden"
            />

            {receiptUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/80 bg-surface shadow-xs">
                <img
                  src={receiptUrl}
                  alt="Captured Bill"
                  className="w-full max-h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  aria-label="Remove receipt"
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-danger text-white transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUploadingReceipt}
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted active:scale-98 transition-all shadow-2xs disabled:opacity-50"
                >
                  {isUploadingReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span>Take Photo</span>
                </button>

                <button
                  type="button"
                  disabled={isUploadingReceipt}
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted active:scale-98 transition-all shadow-2xs disabled:opacity-50"
                >
                  {isUploadingReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-accent-warm shrink-0" />
                  )}
                  <span>Choose Gallery</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Chips with Lucide Icons */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const CatIcon = getCategoryIcon(cat.name);
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
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || "#1F7A8C" }}
                    />
                    <CatIcon className="h-3 w-3 shrink-0" />
                    <span>{cat.name}</span>
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
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

          {/* Place & Vendor with Quick Suggestions */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Place / Vendor (Optional)
            </label>
            <div className="relative mb-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Swiggy, Starbucks, DMart, Metro..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-muted/60 border border-border/50 text-text placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
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

          {/* Notes Input */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Notes / Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Team lunch, weekly groceries, monthly bill"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-muted/60 border border-border/50 text-text placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Date & Time (IST) */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Date & Time (IST)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted shrink-0" />
              <input
                type="datetime-local"
                value={spentAtDate}
                onChange={(e) => setSpentAtDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-muted/60 border border-border/50 text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Footer: One-Tap Save Action */}
        <div className="p-4 border-t border-border/50 bg-surface shrink-0">
          <button
            type="button"
            disabled={currentPaise <= 0 || isSubmitting}
            onClick={handleSave}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg hover:opacity-95 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5 stroke-[2.5]" />
            )}
            <span>
              {currentPaise > 0
                ? `${editingExpense ? "Update Expense" : "Save Expense"} • ${formatINR(
                    currentPaise
                  )}`
                : "Enter an Amount"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
