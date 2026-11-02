"use client";

// ============================================================================
// Sahil's Shore: Expense Keypad Component
// Large amount keypad (INR) with quick increment buttons and tactile interaction
// ============================================================================

import React from "react";
import { Delete } from "lucide-react";
import { formatIndianNumber } from "@/lib/expenses";

interface ExpenseKeypadProps {
  value: string; // e.g. "250.50" or "0"
  onChange: (val: string) => void;
  maxAmountRupees?: number;
}

export function ExpenseKeypad({
  value,
  onChange,
  maxAmountRupees = 10000000, // Max 1 Crore
}: ExpenseKeypadProps) {
  const handleDigit = (digit: string) => {
    // Prevent multiple decimals
    if (digit === "." && value.includes(".")) return;

    // Limit decimal precision to 2 places
    if (value.includes(".")) {
      const parts = value.split(".");
      if (parts[1] && parts[1].length >= 2) return;
    }

    let next = value === "0" && digit !== "." ? digit : value + digit;
    if (parseFloat(next) > maxAmountRupees) return;
    onChange(next);
  };

  const handleBackspace = () => {
    if (value.length <= 1) {
      onChange("0");
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange("0");
  };

  const handleAddIncrement = (amount: number) => {
    const current = parseFloat(value) || 0;
    const next = Math.min(current + amount, maxAmountRupees);
    onChange(next.toString());
  };

  // Format current value display
  const displayParts = value.split(".");
  const wholePart = displayParts[0] || "0";
  const formattedWhole = formatIndianNumber(parseInt(wholePart, 10) || 0);
  const fracPart = displayParts.length > 1 ? `.${displayParts[1]}` : "";

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none">
      {/* Large Amount Display */}
      <div className="w-full text-center py-3 px-4 mb-2 bg-surface-muted/50 rounded-2xl border border-border/50">
        <span className="text-sm font-medium text-text-muted mr-1.5">INR</span>
        <span className="text-4xl sm:text-5xl font-extrabold text-text tracking-tight font-mono">
          ₹ {formattedWhole}
          <span className="text-3xl text-text-muted">{fracPart}</span>
        </span>
      </div>

      {/* Quick Add Pills */}
      <div className="grid grid-cols-4 gap-2 w-full mb-3">
        {[50, 100, 500, 1000].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleAddIncrement(amt)}
            className="py-1.5 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-muted border border-border/60 text-primary transition-all active:scale-95 shadow-2xs"
          >
            +₹{amt}
          </button>
        ))}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleDigit(key)}
            className="h-13 rounded-xl bg-surface hover:bg-surface-muted border border-border/50 text-xl font-semibold text-text active:scale-95 transition-all shadow-2xs flex items-center justify-center"
          >
            {key}
          </button>
        ))}

        {/* Bottom row: Decimal, 0, Backspace */}
        <button
          type="button"
          onClick={() => handleDigit(".")}
          className="h-13 rounded-xl bg-surface hover:bg-surface-muted border border-border/50 text-2xl font-bold text-text active:scale-95 transition-all shadow-2xs flex items-center justify-center"
        >
          .
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="h-13 rounded-xl bg-surface hover:bg-surface-muted border border-border/50 text-xl font-semibold text-text active:scale-95 transition-all shadow-2xs flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          onDoubleClick={handleClear}
          aria-label="Delete"
          className="h-13 rounded-xl bg-surface hover:bg-surface-muted border border-border/50 text-text-muted hover:text-danger active:scale-95 transition-all shadow-2xs flex items-center justify-center"
        >
          <Delete className="h-6 w-6 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
