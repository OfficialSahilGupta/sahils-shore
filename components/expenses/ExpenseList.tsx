"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Expense List Component
// Filter, gallery view, bulk select/delete, amount range, category icons
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  Pencil,
  Tag,
  Repeat,
  X,
  Receipt,
  Utensils,
  Car,
  ShoppingCart,
  Zap,
  Heart,
  BookOpen,
  Tv,
  Dumbbell,
  ShoppingBag,
  AlignLeft,
  LayoutGrid,
  CheckSquare,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatINR } from "@/lib/expenses";
import {
  getISTDateString,
  formatFriendlyISTDate,
  todayIST,
} from "@/lib/date-utils";
import type { Expense, ExpenseCategory } from "@/types/index.ts";

// ---------------------------------------------------------------------------
// Category icon helper
// ---------------------------------------------------------------------------
function getCategoryIcon(categoryName: string): React.ElementType {
  const name = (categoryName || "").toLowerCase();
  if (name.includes("food") || name.includes("eat") || name.includes("meal") || name.includes("restaurant")) return Utensils;
  if (name.includes("transport") || name.includes("travel") || name.includes("car") || name.includes("fuel") || name.includes("auto") || name.includes("cab")) return Car;
  if (name.includes("shopping")) return ShoppingCart;
  if (name.includes("bill") || name.includes("utilit") || name.includes("electric") || name.includes("internet") || name.includes("phone")) return Zap;
  if (name.includes("health") || name.includes("medical") || name.includes("doctor") || name.includes("medicine")) return Heart;
  if (name.includes("education") || name.includes("study") || name.includes("learning") || name.includes("course") || name.includes("book")) return BookOpen;
  if (name.includes("entertainment") || name.includes("stream") || name.includes("movie") || name.includes("ott")) return Tv;
  if (name.includes("gym") || name.includes("fitness") || name.includes("workout") || name.includes("sport")) return Dumbbell;
  if (name.includes("grocer") || name.includes("supermarket") || name.includes("vegetable") || name.includes("fruit")) return ShoppingBag;
  return Tag;
}

interface ExpenseListProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

type DateFilter = "all" | "today" | "week" | "month";
type ViewMode = "list" | "gallery";

export function ExpenseList({
  expenses,
  categories,
  onEditExpense,
  onDeleteExpense,
}: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const categoryMap = useMemo(() => {
    const map = new Map<string, ExpenseCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Current IST day / month
  const today = todayIST();
  const currentMonthPrefix = today.slice(0, 7);

  // ---------------------------------------------------------------------------
  // Filter
  // ---------------------------------------------------------------------------
  const filteredExpenses = useMemo(() => {
    const minPaise = minAmount ? Math.round(parseFloat(minAmount) * 100) : null;
    const maxPaise = maxAmount ? Math.round(parseFloat(maxAmount) * 100) : null;

    return expenses.filter((e) => {
      const expDate = getISTDateString(e.spent_at);

      if (dateFilter === "today") {
        if (expDate !== today) return false;
      } else if (dateFilter === "month") {
        if (!expDate.startsWith(currentMonthPrefix)) return false;
      } else if (dateFilter === "week") {
        const now = new Date();
        const expenseTime = new Date(e.spent_at).getTime();
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (expenseTime < sevenDaysAgo) return false;
      }

      if (selectedCategoryId !== "all" && e.category_id !== selectedCategoryId) return false;
      if (selectedMethod !== "all" && e.payment_method !== selectedMethod) return false;

      if (minPaise !== null && e.amount_paise < minPaise) return false;
      if (maxPaise !== null && e.amount_paise > maxPaise) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = (e.category_id && categoryMap.get(e.category_id)?.name) || "";
        if (
          !(e.place?.toLowerCase().includes(q) ?? false) &&
          !(e.notes?.toLowerCase().includes(q) ?? false) &&
          !catName.toLowerCase().includes(q) &&
          !(e.amount_paise / 100).toString().includes(q)
        ) return false;
      }

      return true;
    });
  }, [
    expenses, dateFilter, selectedCategoryId, selectedMethod,
    searchQuery, today, currentMonthPrefix, categoryMap, minAmount, maxAmount,
  ]);

  // Group by IST date (list view)
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    filteredExpenses.forEach((exp) => {
      const dateStr = getISTDateString(exp.spent_at);
      const existing = groups.get(dateStr) || [];
      existing.push(exp);
      groups.set(dateStr, existing);
    });
    return Array.from(groups.entries()).map(([dateStr, items]) => ({
      dateStr,
      items,
      totalDayPaise: items.reduce((acc, curr) => acc + curr.amount_paise, 0),
    }));
  }, [filteredExpenses]);

  // ---------------------------------------------------------------------------
  // Bulk select helpers
  // ---------------------------------------------------------------------------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedIds)) {
      await onDeleteExpense(id);
    }
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* ---- Top Filter Bar ---- */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search place, notes, category, amount..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-border/70 text-text placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 md:pb-0 shrink-0">
          {(["all", "today", "week", "month"] as DateFilter[]).map((df) => (
            <button
              key={df}
              type="button"
              onClick={() => setDateFilter(df)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                dateFilter === df
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-text-muted hover:text-text border border-border/60"
              }`}
            >
              {df === "all" ? "All Time" : df === "week" ? "This Week" : df === "month" ? "This Month" : "Today"}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Secondary Filter Row ---- */}
      <div className="flex flex-wrap items-center gap-2 text-xs min-w-0 max-w-full">
        {/* Category Dropdown */}
        <Select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          containerClassName="w-auto max-w-[170px]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

        {/* Payment Method Dropdown */}
        <Select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          containerClassName="w-auto max-w-[170px]"
        >
          <option value="all">All Payment Methods</option>
          <option value="UPI">UPI</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Net Banking">Net Banking</option>
          <option value="Other">Other</option>
        </Select>

        {/* Amount Range */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-text-muted shrink-0">₹</span>
          <input
            type="number"
            min="0"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="Min"
            className="w-16 px-2 py-1.5 rounded-lg bg-surface border border-border/70 text-text text-xs focus:outline-hidden focus:ring-1 focus:ring-primary font-mono"
          />
          <span className="text-text-muted shrink-0">—</span>
          <input
            type="number"
            min="0"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="Max"
            className="w-16 px-2 py-1.5 rounded-lg bg-surface border border-border/70 text-text text-xs focus:outline-hidden focus:ring-1 focus:ring-primary font-mono"
          />
        </div>

        {/* Count + View toggles + Select toggle */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span className="text-text-muted font-mono text-[11px]">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? "expense" : "expenses"}
          </span>

          {/* List / Gallery toggle */}
          <div className="flex items-center rounded-lg border border-border/60 overflow-hidden bg-surface">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-text-muted hover:text-text"}`}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("gallery")}
              aria-label="Gallery view"
              className={`p-1.5 transition-colors ${viewMode === "gallery" ? "bg-primary text-primary-foreground" : "text-text-muted hover:text-text"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Select mode toggle */}
          <button
            type="button"
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              selectMode
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-surface text-text-muted hover:text-text border-border/60"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{selectMode ? "Cancel" : "Select"}</span>
          </button>
        </div>
      </div>

      {/* ---- Empty State ---- */}
      {filteredExpenses.length === 0 ? (
        <Card className="p-12 text-center bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col items-center gap-3">
          <Receipt className="h-12 w-12 text-text-muted/40" />
          <div>
            <h3 className="text-sm font-semibold text-text">No expenses found</h3>
            <p className="text-xs text-text-muted mt-1">
              Tap Quick Add to record a new expense in under 5 seconds, or adjust your filters.
            </p>
          </div>
        </Card>
      ) : viewMode === "gallery" ? (
        /* ---- Gallery View ---- */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredExpenses.map((item) => {
            const cat = item.category_id ? categoryMap.get(item.category_id) : null;
            const catColor = cat?.color || "#1F7A8C";
            const CatIcon = getCategoryIcon(cat?.name || "");
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  isSelected ? "border-primary" : "border-transparent"
                }`}
                onClick={() => {
                  if (selectMode) {
                    toggleSelect(item.id);
                  } else if (item.receipt_url) {
                    setPreviewReceiptUrl(item.receipt_url);
                  }
                }}
              >
                {/* Bulk-select checkbox overlay */}
                {selectMode && (
                  <div className={`absolute top-2 left-2 z-10 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "bg-primary border-primary" : "bg-black/40 border-white/60"
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                )}

                {item.receipt_url ? (
                  <>
                    <img
                      src={item.receipt_url}
                      alt="Receipt"
                      className="w-full aspect-square object-cover"
                    />
                    {/* Amount overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-end justify-between">
                      <span className="text-xs font-bold text-white font-mono">
                        {formatINR(item.amount_paise)}
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                    </div>
                  </>
                ) : (
                  /* Placeholder card */
                  <div
                    className="aspect-square flex flex-col items-center justify-center gap-2 p-3"
                    style={{ backgroundColor: `${catColor}22` }}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${catColor}33`, color: catColor }}
                    >
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-text truncate w-full text-center" style={{ color: catColor }}>
                      {cat?.name || "Expense"}
                    </span>
                    <span className="text-xs font-bold text-text font-mono">
                      {formatINR(item.amount_paise)}
                    </span>
                    {item.place && (
                      <span className="text-[10px] text-text-muted truncate w-full text-center">{item.place}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ---- List View ---- */
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.dateStr} className="space-y-1.5">
              {/* Day Header */}
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {formatFriendlyISTDate(group.dateStr)}
                </span>
                <span className="text-xs font-bold text-text font-mono">
                  {formatINR(group.totalDayPaise)}
                </span>
              </div>

              {/* Day Items */}
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const cat = item.category_id ? categoryMap.get(item.category_id) : null;
                  const CatIcon = getCategoryIcon(cat?.name || "");
                  const catColor = cat?.color || "#1F7A8C";
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <Card
                      key={item.id}
                      className={`p-3 bg-surface border rounded-xl shadow-2xs hover:border-border transition-colors flex items-center gap-3 group ${
                        isSelected ? "border-primary/60 bg-primary/5" : "border-border/70"
                      }`}
                    >
                      {/* Bulk-select checkbox */}
                      {selectMode && (
                        <button
                          type="button"
                          aria-label={isSelected ? "Deselect" : "Select"}
                          onClick={() => toggleSelect(item.id)}
                          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-primary border-primary" : "border-border hover:border-primary"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </button>
                      )}

                      {/* Receipt thumbnail (if exists) */}
                      {item.receipt_url && (
                        <img
                          src={item.receipt_url}
                          alt="Receipt"
                          onClick={() => setPreviewReceiptUrl(item.receipt_url)}
                          className="h-9 w-9 object-cover rounded-lg border border-border shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      )}

                      {/* Category icon */}
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${catColor}1A`, color: catColor }}
                      >
                        <CatIcon className="h-4 w-4" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-semibold text-text truncate">
                            {item.place || cat?.name || "Expense"}
                          </span>
                          {item.is_recurring && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary shrink-0">
                              <Repeat className="h-2.5 w-2.5 shrink-0" /> Recurring
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted truncate mt-0.5 min-w-0">
                          {cat && <span className="truncate">{cat.name}</span>}
                          <span>•</span>
                          <span className="font-medium text-[11px] px-1 rounded bg-surface-muted shrink-0">
                            {item.payment_method}
                          </span>
                          {item.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[140px] sm:max-w-xs">{item.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount + Edit/Delete */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm sm:text-base font-bold text-text font-mono">
                          - {formatINR(item.amount_paise)}
                        </span>

                        {!selectMode && (
                          <div className="flex items-center gap-0.5 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditExpense(item)}
                              aria-label="Edit expense"
                              className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(item.id)}
                              aria-label="Delete expense"
                              className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-surface-muted transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Bulk Delete Sticky Bar ---- */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-surface border border-border shadow-xl rounded-2xl px-4 py-3 max-w-sm w-full">
            <span className="text-sm text-text font-medium min-w-0 truncate flex-1">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={exitSelectMode}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-border/60 text-text transition-colors shrink-0"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-danger text-white hover:opacity-90 transition-opacity shrink-0"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ---- Receipt Preview Lightbox ---- */}
      {previewReceiptUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div
            className="relative max-w-lg w-full bg-surface rounded-2xl overflow-hidden p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-primary shrink-0" />
                Receipt Attachment (Google Drive)
              </span>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="p-1 rounded-lg text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={previewReceiptUrl}
              alt="Receipt"
              className="w-full max-h-[70vh] object-contain rounded-xl bg-surface-muted"
            />
          </div>
        </div>
      )}
    </div>
  );
}
