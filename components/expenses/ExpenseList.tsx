"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Expense List Component
// Filter by date, category, payment method, search query, with inline edit/delete
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Tag,
  Repeat,
  MapPin,
  Calendar,
  X,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatINR, formatIndianNumber } from "@/lib/expenses";
import {
  getISTDateString,
  formatFriendlyISTDate,
  todayIST,
  isTodayIST,
  isPastIST,
} from "@/lib/date-utils";
import type { Expense, ExpenseCategory } from "@/types/index.ts";

interface ExpenseListProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

type DateFilter = "all" | "today" | "week" | "month";

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

  const categoryMap = useMemo(() => {
    const map = new Map<string, ExpenseCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Current IST month and week boundaries
  const today = todayIST();
  const currentMonthPrefix = today.slice(0, 7);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = getISTDateString(e.spent_at);

      // 1. Date filter
      if (dateFilter === "today") {
        if (expDate !== today) return false;
      } else if (dateFilter === "month") {
        if (!expDate.startsWith(currentMonthPrefix)) return false;
      } else if (dateFilter === "week") {
        // Simple 7-day window
        const now = new Date();
        const expenseTime = new Date(e.spent_at).getTime();
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (expenseTime < sevenDaysAgo) return false;
      }

      // 2. Category filter
      if (selectedCategoryId !== "all" && e.category_id !== selectedCategoryId) {
        return false;
      }

      // 3. Payment method filter
      if (selectedMethod !== "all" && e.payment_method !== selectedMethod) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = (e.category_id && categoryMap.get(e.category_id)?.name) || "";
        const matchesPlace = e.place?.toLowerCase().includes(q) ?? false;
        const matchesNotes = e.notes?.toLowerCase().includes(q) ?? false;
        const matchesCat = catName.toLowerCase().includes(q);
        const matchesAmount = (e.amount_paise / 100).toString().includes(q);
        if (!matchesPlace && !matchesNotes && !matchesCat && !matchesAmount) return false;
      }

      return true;
    });
  }, [
    expenses,
    dateFilter,
    selectedCategoryId,
    selectedMethod,
    searchQuery,
    today,
    currentMonthPrefix,
    categoryMap,
  ]);

  // Group filtered expenses by IST date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    filteredExpenses.forEach((exp) => {
      const dateStr = getISTDateString(exp.spent_at);
      const existing = groups.get(dateStr) || [];
      existing.push(exp);
      groups.set(dateStr, existing);
    });

    return Array.from(groups.entries()).map(([dateStr, items]) => {
      const totalDayPaise = items.reduce((acc, curr) => acc + curr.amount_paise, 0);
      return {
        dateStr,
        items,
        totalDayPaise,
      };
    });
  }, [filteredExpenses]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
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

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
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

      {/* Secondary Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs min-w-0 max-w-full">
        {/* Category Dropdown */}
        <Select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          containerClassName="w-auto max-w-[170px]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
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

        <span className="text-text-muted ml-auto font-mono text-[11px]">
          {filteredExpenses.length} {filteredExpenses.length === 1 ? "expense" : "expenses"}
        </span>
      </div>

      {/* Grouped Expense List */}
      {groupedByDate.length === 0 ? (
        <Card className="p-12 text-center bg-surface border border-border/70 rounded-2xl shadow-xs">
          <p className="text-sm font-medium text-text">No expenses match your filters</p>
          <p className="text-xs text-text-muted mt-1">
            Tap Quick Add to record a new expense in under 5 seconds.
          </p>
        </Card>
      ) : (
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

                  return (
                    <Card
                      key={item.id}
                      className="p-3 bg-surface border border-border/70 rounded-xl shadow-2xs hover:border-border transition-colors flex items-center justify-between gap-3 group"
                    >
                      {/* Left: Category Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat?.color || "#1F7A8C"}1A`,
                            color: cat?.color || "#1F7A8C",
                          }}
                        >
                          <Tag className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-text truncate">
                              {item.place || cat?.name || "Expense"}
                            </span>
                            {item.is_recurring && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                <Repeat className="h-2.5 w-2.5" /> Recurring
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-text-muted truncate mt-0.5">
                            {cat && <span>{cat.name}</span>}
                            <span>•</span>
                            <span className="font-medium text-[11px] px-1 rounded bg-surface-muted">
                              {item.payment_method}
                            </span>
                            {item.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px] sm:max-w-xs">
                                  {item.notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {item.receipt_url && (
                          <button
                            onClick={() => setPreviewReceiptUrl(item.receipt_url)}
                            aria-label="View receipt"
                            className="text-text-muted hover:text-primary p-1 rounded-md transition-colors"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        )}

                        <span className="text-sm sm:text-base font-bold text-text font-mono">
                          - {formatINR(item.amount_paise)}
                        </span>

                        <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Preview Lightbox */}
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
                <Receipt className="h-4 w-4 text-primary" />
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
