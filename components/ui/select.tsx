"use client";

// ============================================================================
// Sahil's Shore: Design-System Custom Select Component
// Reusable, theme-aware custom dropdown menu with SVG icons, search filter,
// active item checkmarks, zero OS native styling, and click-outside handling.
// ============================================================================

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useId,
} from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  options?: (SelectOption | string)[];
  placeholder?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  name?: string;
  id?: string;
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, CustomSelectProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      options,
      placeholder,
      icon,
      containerClassName = "",
      className = "",
      size = "sm",
      disabled = false,
      name,
      id,
      children,
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Extract options from either props.options OR React.Children (<option>)
    const parsedOptions = useMemo<SelectOption[]>(() => {
      if (options && options.length > 0) {
        return options.map((opt) => {
          if (typeof opt === "string") {
            return { value: opt, label: opt };
          }
          return opt;
        });
      }

      const extracted: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          const val = String(child.props.value ?? child.props.children ?? "");
          const label = String(child.props.children ?? val);
          extracted.push({ value: val, label });
        }
      });
      return extracted;
    }, [options, children]);

    // Track internal value if uncontrolled
    const [internalValue, setInternalValue] = useState<string>(
      String(value ?? defaultValue ?? (parsedOptions[0]?.value || ""))
    );

    const currentValue = value !== undefined ? String(value) : internalValue;

    // Selected option label
    const selectedOption = parsedOptions.find((opt) => opt.value === currentValue);
    const displayLabel = selectedOption ? selectedOption.label : placeholder || currentValue || "Select option";

    // Filtered options if search is active
    const filteredOptions = useMemo(() => {
      if (!searchFilter.trim()) return parsedOptions;
      const q = searchFilter.toLowerCase();
      return parsedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q)
      );
    }, [parsedOptions, searchFilter]);

    // Handle Option Selection
    const handleSelect = (optValue: string) => {
      setInternalValue(optValue);
      setIsOpen(false);
      setSearchFilter("");
      if (onChange) {
        onChange({ target: { value: optValue, name } });
      }
    };

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setSearchFilter("");
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          setSearchFilter("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    // Auto-focus search input when menu opens
    useEffect(() => {
      if (isOpen && parsedOptions.length > 8 && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, parsedOptions.length]);

    const sizeClasses = {
      sm: "h-8 px-2.5 text-xs rounded-xl",
      md: "h-9 px-3 text-xs rounded-xl",
      lg: "h-10 px-3.5 text-sm rounded-xl",
    }[size];

    return (
      <div
        ref={containerRef}
        className={`relative inline-block min-w-0 max-w-full text-left ${containerClassName}`}
      >
        {/* Hidden input for standard forms */}
        {name && <input type="hidden" name={name} value={currentValue} />}

        {/* Custom Dropdown Trigger Button */}
        <button
          ref={ref}
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`
            w-full flex items-center justify-between gap-2 cursor-pointer truncate
            border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]
            font-medium transition-all duration-150 shadow-xs
            hover:border-[var(--text-muted)]/40 hover:bg-[var(--surface-muted)]/30
            focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
            ${sizeClasses}
            ${isOpen ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/30" : ""}
            ${className}
          `}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            {icon && (
              <span className="text-[var(--text-muted)] shrink-0 flex items-center justify-center">
                {icon}
              </span>
            )}
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            <span
              className={`truncate ${
                !selectedOption && placeholder ? "text-[var(--text-muted)] font-normal" : ""
              }`}
            >
              {displayLabel}
            </span>
          </div>

          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[var(--primary)]" : "opacity-70"
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Custom Floating Menu */}
        {isOpen && (
          <div
            role="listbox"
            tabIndex={-1}
            className="absolute left-0 mt-1.5 w-full min-w-[160px] max-w-xs z-50 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 space-y-1"
            style={{ maxHeight: "280px" }}
          >
            {/* Search Filter for large lists (e.g. Topics) */}
            {parsedOptions.length > 8 && (
              <div className="relative px-1 pb-1 pt-0.5 border-b border-[var(--border)]/60 mb-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter options..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 pl-7 pr-6 py-1 text-[11px] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-center text-xs text-[var(--text-muted)]">
                  No matches found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === currentValue;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-xl font-medium cursor-pointer text-left transition-colors
                        ${
                          isSelected
                            ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                            : "text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                      </div>

                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
