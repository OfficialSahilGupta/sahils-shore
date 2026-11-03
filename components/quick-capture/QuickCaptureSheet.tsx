"use client";

// ============================================================================
// Sahil's Shore: Global Quick Capture Sheet
// Single unified bottom sheet (mobile) / modal (desktop) for 1-tap capture:
// Task, Expense, Meal, Note, and Timer.
// ============================================================================

import React, { useState, useEffect } from "react";
import { useQuickCapture, QuickCaptureTab } from "@/lib/quick-capture/QuickCaptureContext";
import { useOfflineQueue } from "@/lib/offline/OfflineContext";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { createTask, parseNaturalLanguageTask } from "@/lib/todos";
import { createExpense, rupeesToPaise, getExpenseCategories } from "@/lib/expenses";
import { createMeal } from "@/lib/food";
import { createNote } from "@/lib/notes";
import { getActivities, logActivityTime } from "@/lib/tracker";
import { todayIST } from "@/lib/date-utils";
import type { ExpenseCategory, Activity } from "@/types";
import {
  CheckSquare,
  Wallet,
  Utensils,
  FileText,
  Clock,
  X,
  Plus,
  Sparkles,
  Star,
  Tag,
  Calendar,
  AlertCircle,
  Play,
} from "lucide-react";

export function QuickCaptureSheet() {
  const { isOpen, activeTab, close, setActiveTab } = useQuickCapture();
  const { enqueueMutation, isOnline } = useOfflineQueue();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Reference data
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - Task
  const [taskInput, setTaskInput] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [taskDueDate, setTaskDueDate] = useState(todayIST());

  // Form states - Expense
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expensePaymentMethod, setExpensePaymentMethod] = useState("UPI");
  const [expensePlace, setExpensePlace] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  // Form states - Meal
  const [mealSlot, setMealSlot] = useState<"breakfast" | "lunch" | "snack" | "dinner">("lunch");
  const [mealItems, setMealItems] = useState("");
  const [mealRestaurant, setMealRestaurant] = useState("");
  const [mealCost, setMealCost] = useState("");
  const [mealRating, setMealRating] = useState(5);

  // Form states - Note
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [notePinned, setNotePinned] = useState(false);

  // Form states - Timer
  const [timerActivityId, setTimerActivityId] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("25");
  const [timerNotes, setTimerNotes] = useState("");

  // Fetch user and reference data
  useEffect(() => {
    if (!isOpen) return;

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const uid = data.user.id;
          setUserId(uid);

          getExpenseCategories(supabase, uid).then((cats) => {
            setCategories(cats);
            if (cats.length > 0 && !expenseCategoryId) {
              setExpenseCategoryId(cats[0].id);
            }
          });

          getActivities(supabase, uid).then((acts) => {
            setActivities(acts);
            if (acts.length > 0 && !timerActivityId) {
              setTimerActivityId(acts[0].id);
            }
          });
        }
      });
    } catch (err) {
      console.warn("Error initializing quick capture reference data:", err);
    }
  }, [isOpen, expenseCategoryId, timerActivityId]);

  if (!isOpen) return null;

  const notifyChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shore:data-updated"));
    }
  };

  // Submissions
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setIsSubmitting(true);
    const parsed = parseNaturalLanguageTask(taskInput.trim());

    // Offline branch
    if (!isOnline) {
      await enqueueMutation("task", {
        title: parsed.title,
        priority: (parsed.priority || taskPriority) as any,
        due_date: parsed.dueDate || taskDueDate,
        due_time: parsed.dueTime,
        tags: parsed.tags.length > 0 ? parsed.tags : ["inbox"],
        status: "todo",
      });
      setTaskInput("");
      notifyChange();
      setIsSubmitting(false);
      close();
      return;
    }

    try {
      const supabase = createClient();
      const res = await createTask(supabase, userId || "anonymous", {
        title: parsed.title,
        priority: (parsed.priority || taskPriority) as any,
        due_date: parsed.dueDate || taskDueDate,
        due_time: parsed.dueTime,
        tags: parsed.tags.length > 0 ? parsed.tags : ["inbox"],
      });

      if (res) {
        toast({
          title: "Task created",
          description: `"${parsed.title}" added to your day.`,
          type: "success",
        });
        setTaskInput("");
        notifyChange();
        close();
      } else {
        toast({ title: "Failed to create task", type: "error" });
      }
    } catch {
      // Fallback to offline queue on network error
      await enqueueMutation("task", {
        title: parsed.title,
        priority: (parsed.priority || taskPriority) as any,
        due_date: parsed.dueDate || taskDueDate,
        due_time: parsed.dueTime,
        tags: parsed.tags.length > 0 ? parsed.tags : ["inbox"],
        status: "todo",
      });
      setTaskInput("");
      notifyChange();
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(expenseAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast({ title: "Please enter a valid amount", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const paise = rupeesToPaise(amountVal);

    if (!isOnline) {
      await enqueueMutation("expense", {
        amount_paise: paise,
        category_id: expenseCategoryId || null,
        payment_method: expensePaymentMethod,
        place_name: expensePlace.trim() || undefined,
        notes: expenseNote.trim() || undefined,
      });
      setExpenseAmount("");
      setExpensePlace("");
      setExpenseNote("");
      notifyChange();
      setIsSubmitting(false);
      close();
      return;
    }

    try {
      const supabase = createClient();
      const res = await createExpense(supabase, userId || "anonymous", {
        amount_paise: paise,
        category_id: expenseCategoryId || null,
        payment_method: expensePaymentMethod,
        place: expensePlace.trim() || undefined,
        notes: expenseNote.trim() || undefined,
      });

      if (res) {
        toast({
          title: "Expense logged",
          description: `₹${amountVal.toFixed(2)} recorded successfully.`,
          type: "success",
        });
        setExpenseAmount("");
        setExpensePlace("");
        setExpenseNote("");
        notifyChange();
        close();
      } else {
        toast({ title: "Failed to log expense", type: "error" });
      }
    } catch {
      await enqueueMutation("expense", {
        amount_paise: paise,
        category_id: expenseCategoryId || null,
        payment_method: expensePaymentMethod,
        place_name: expensePlace.trim() || undefined,
        notes: expenseNote.trim() || undefined,
      });
      setExpenseAmount("");
      setExpensePlace("");
      setExpenseNote("");
      notifyChange();
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealItems.trim()) {
      toast({ title: "Please enter what you ate", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const parsedCost = parseFloat(mealCost);
    const costPaise = !isNaN(parsedCost) && parsedCost > 0 ? rupeesToPaise(parsedCost) : 0;

    if (!isOnline) {
      await enqueueMutation("meal", {
        meal_type: mealSlot,
        description: mealItems.trim(),
        restaurant_name: mealRestaurant.trim() || null,
        cost_paise: costPaise,
        rating: mealRating,
      });
      setMealItems("");
      setMealRestaurant("");
      setMealCost("");
      notifyChange();
      setIsSubmitting(false);
      close();
      return;
    }

    try {
      const supabase = createClient();
      const res = await createMeal(supabase, userId || "anonymous", {
        meal_type: mealSlot,
        description: mealItems.trim(),
        restaurant_name: mealRestaurant.trim() || null,
        cost_paise: costPaise,
        rating: mealRating,
      });

      if (res) {
        toast({
          title: "Meal logged",
          description: `${mealSlot.toUpperCase()} entry saved.`,
          type: "success",
        });
        setMealItems("");
        setMealRestaurant("");
        setMealCost("");
        notifyChange();
        close();
      } else {
        toast({ title: "Failed to log meal", type: "error" });
      }
    } catch {
      await enqueueMutation("meal", {
        meal_type: mealSlot,
        description: mealItems.trim(),
        restaurant_name: mealRestaurant.trim() || null,
        cost_paise: costPaise,
        rating: mealRating,
      });
      setMealItems("");
      setMealRestaurant("");
      setMealCost("");
      notifyChange();
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      toast({ title: "Please enter a note title", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const tags = noteTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!isOnline) {
      await enqueueMutation("note", {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags,
        is_pinned: notePinned,
      });
      setNoteTitle("");
      setNoteContent("");
      setNoteTags("");
      notifyChange();
      setIsSubmitting(false);
      close();
      return;
    }

    try {
      const supabase = createClient();
      const res = await createNote(supabase, {
        userId: userId || "anonymous",
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags,
        is_pinned: notePinned,
      });

      if (res) {
        toast({
          title: "Note saved",
          description: `"${noteTitle}" recorded.`,
          type: "success",
        });
        setNoteTitle("");
        setNoteContent("");
        setNoteTags("");
        notifyChange();
        close();
      } else {
        toast({ title: "Failed to save note", type: "error" });
      }
    } catch {
      await enqueueMutation("note", {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags,
        is_pinned: notePinned,
      });
      setNoteTitle("");
      setNoteContent("");
      setNoteTags("");
      notifyChange();
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(timerMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      toast({ title: "Please enter valid minutes", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const res = await logActivityTime(supabase, userId || "anonymous", {
        activity_id: timerActivityId,
        duration_seconds: duration * 60,
        notes: timerNotes.trim() || undefined,
      });

      if (res) {
        toast({
          title: "Activity logged",
          description: `${duration} mins recorded toward your practice.`,
          type: "success",
        });
        setTimerNotes("");
        notifyChange();
        close();
      } else {
        toast({ title: "Failed to log activity", type: "error" });
      }
    } catch {
      toast({ title: "Error logging activity", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: QuickCaptureTab; label: string; icon: React.ElementType }[] = [
    { id: "task", label: "Task", icon: CheckSquare },
    { id: "expense", label: "Expense", icon: Wallet },
    { id: "meal", label: "Meal", icon: Utensils },
    { id: "note", label: "Note", icon: FileText },
    { id: "timer", label: "Timer", icon: Clock },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-surface border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface-muted/40">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-text-muted hover:text-text hover:bg-surface-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={close}
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          {/* 1. TASK TAB */}
          {activeTab === "task" && (
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  What needs to be done?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Revise dynamic programming graphs tomorrow !high #dsa"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-text-muted/60"
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  Tip: Type naturally with <span className="font-mono text-primary">!high</span>,{" "}
                  <span className="font-mono text-primary">#tag</span>, or{" "}
                  <span className="font-mono text-primary">tomorrow 7pm</span>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["low", "medium", "high", "urgent"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTaskPriority(p)}
                        className={`py-1 text-[11px] font-medium capitalize rounded-lg border text-center transition-all ${
                          taskPriority === p
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border text-text-muted hover:bg-surface-muted"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-36">
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !taskInput.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </form>
          )}

          {/* 2. EXPENSE TAB */}
          {activeTab === "expense" && (
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Amount in INR (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    autoFocus
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-border bg-surface text-text text-lg font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-text-muted/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-border/60 rounded-xl bg-surface-muted/30">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setExpenseCategoryId(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        expenseCategoryId === c.id
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-surface text-text-muted border border-border hover:text-text"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Payment Method
                  </label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Place / Merchant
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy, Metro, DMart"
                    value={expensePlace}
                    onChange={(e) => setExpensePlace(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">
                  Note / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quick team coffee or monthly groceries"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !expenseAmount}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log Expense</span>
              </button>
            </form>
          )}

          {/* 3. MEAL TAB */}
          {activeTab === "meal" && (
            <form onSubmit={handleSubmitMeal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1.5">
                  Meal Slot
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["breakfast", "lunch", "snack", "dinner"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMealSlot(s)}
                      className={`py-1.5 text-xs font-semibold capitalize rounded-xl border text-center transition-all ${
                        mealSlot === s
                          ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                          : "border-border text-text-muted hover:bg-surface-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  What did you eat?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oats with banana, peanut butter, and almonds"
                  value={mealItems}
                  onChange={(e) => setMealItems(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-text-muted/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Cost in INR (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00 (syncs to Food expense)"
                    value={mealCost}
                    onChange={(e) => setMealCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Rating (1-5)
                  </label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMealRating(star)}
                        className="p-1 text-accent-warm hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= mealRating ? "fill-accent-warm text-accent-warm" : "text-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">
                  Restaurant / Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Home, Cafe Coffee Day, Kitchen"
                  value={mealRestaurant}
                  onChange={(e) => setMealRestaurant(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !mealItems.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log Meal</span>
              </button>
            </form>
          )}

          {/* 4. NOTE TAB */}
          {activeTab === "note" && (
            <form onSubmit={handleSubmitNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spring Security JWT Architecture Notes"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-text-muted/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Content / Scratchpad
                </label>
                <textarea
                  rows={4}
                  placeholder="Jot down notes, markdown thoughts, or code snippets..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-text-muted/60 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="spring, backend, ideas"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={notePinned}
                    onChange={(e) => setNotePinned(e.target.checked)}
                    className="rounded text-primary focus:ring-primary border-border"
                  />
                  <span className="text-xs font-medium text-text">Pin Note</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !noteTitle.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Save Note</span>
              </button>
            </form>
          )}

          {/* 5. TIMER TAB */}
          {activeTab === "timer" && (
            <form onSubmit={handleSubmitTimer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Select Activity
                </label>
                <select
                  value={timerActivityId}
                  onChange={(e) => setTimerActivityId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary font-medium"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                  {activities.length === 0 && <option value="">No custom activities yet</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Duration (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {["15", "25", "45", "60"].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimerMinutes(mins)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                        timerMinutes === mins
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border text-text-muted hover:bg-surface-muted"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="720"
                  placeholder="Custom minutes"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solved 2 LeetCode Mediums on Graphs (Dijkstra)"
                  value={timerNotes}
                  onChange={(e) => setTimerNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !timerMinutes}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Clock className="w-4 h-4" />
                <span>Log Focus Session</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
