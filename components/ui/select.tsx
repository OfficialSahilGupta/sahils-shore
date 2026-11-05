"use client";

// ============================================================================
// Sahil's Shore: Design-System Select Component
// Reusable, theme-aware select dropdown with custom chevron,
// zero container-outflow, truncation, and dark-mode safe options.
// ============================================================================

import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options?: (SelectOption | string)[];
  placeholder?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  size?: "sm" | "md" | "lg";
}

export const Select = forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    {
      options,
      placeholder,
      icon,
      className = "",
      containerClassName = "",
      size = "sm",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-8 px-2.5 pr-7 text-xs rounded-xl",
      md: "h-9 px-3 pr-8 text-xs rounded-xl",
      lg: "h-10 px-3.5 pr-9 text-sm rounded-xl",
    }[size];

    return (
      <div
        className={`relative inline-flex items-center min-w-0 max-w-full ${containerClassName}`}
      >
        {icon && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] flex items-center justify-center">
            {icon}
          </span>
        )}

        <select
          ref={ref}
          disabled={disabled}
          className={`
            w-full appearance-none cursor-pointer truncate
            border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]
            font-medium transition-all duration-150
            focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 focus:outline-none
            hover:border-[var(--text-muted)]/40 hover:bg-[var(--surface-muted)]/30
            disabled:cursor-not-allowed disabled:opacity-50
            ${sizeClasses}
            ${icon ? "pl-8" : ""}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-[var(--surface)] text-[var(--text-muted)]">
              {placeholder}
            </option>
          )}

          {options
            ? options.map((opt) => {
                const val = typeof opt === "string" ? opt : opt.value;
                const lab = typeof opt === "string" ? opt : opt.label;
                return (
                  <option
                    key={val}
                    value={val}
                    className="bg-[var(--surface)] text-[var(--text)] py-1.5 font-normal"
                  >
                    {lab}
                  </option>
                );
              })
            : children}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] opacity-70"
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = "Select";
