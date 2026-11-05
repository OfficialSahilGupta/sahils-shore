// ============================================================================
// Sahil's Shore: Unit Tests - Expenses & Food Diary
// Tests paise-accurate calculations, Indian numbering, budget thresholds,
// spending insights, and meal-expense synchronization.
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  formatINR,
  formatIndianNumber,
  rupeesToPaise,
  paiseToRupees,
  calculateBudgetStatus,
  calculateSpendInsights,
  generateExpensesCSV,
} from "../lib/expenses/index.ts";
import {
  buildWeeklyMealOverview,
  createMeal,
  updateMeal,
  deleteMeal,
  decodeMealFlags,
  getPlacesToEatAgain,
  getFavoriteMeals,
} from "../lib/food/index.ts";
import { processRecurringExpenses } from "../lib/expenses/index.ts";
import type { Expense, ExpenseCategory, Income, MealWithExpense } from "../types/index.ts";

describe("1. Currency, Paise Math & Indian Grouping", () => {
  test("formats numbers using Indian numbering grouping (lakhs & crores)", () => {
    assert.equal(formatIndianNumber(0), "0");
    assert.equal(formatIndianNumber(500), "500");
    assert.equal(formatIndianNumber(1250), "1,250");
    assert.equal(formatIndianNumber(12500), "12,500");
    assert.equal(formatIndianNumber(123456), "1,23,456");
    assert.equal(formatIndianNumber(10000000), "1,00,00,000"); // 1 Crore
  });

  test("formats paise to Indian Rupee string with 2-digit paise", () => {
    assert.equal(formatINR(0), "₹0.00");
    assert.equal(formatINR(50), "₹0.50");
    assert.equal(formatINR(1050), "₹10.50");
    assert.equal(formatINR(12345600), "₹1,23,456.00");
    assert.equal(formatINR(50000, { prefix: "Rs " }), "Rs 500.00");
    assert.equal(formatINR(50000, { showPaise: false }), "₹500");
    assert.equal(formatINR(-25000), "-₹250.00");
  });

  test("converts rupees to paise without floating-point precision loss", () => {
    assert.equal(rupeesToPaise(10.5), 1050);
    assert.equal(rupeesToPaise("10.50"), 1050);
    assert.equal(rupeesToPaise("0.05"), 5);
    assert.equal(rupeesToPaise("123456.78"), 12345678);
    assert.equal(rupeesToPaise(500), 50000);
    assert.equal(rupeesToPaise("₹ 1,500.25"), 150025);
    assert.equal(rupeesToPaise(""), 0);
  });

  test("converts paise to rupees accurately", () => {
    assert.equal(paiseToRupees(1050), 10.5);
    assert.equal(paiseToRupees(5), 0.05);
    assert.equal(paiseToRupees(50000), 500);
  });
});

describe("2. Budget Math & Status Color Thresholds", () => {
  const budgetPaise = 1000000; // ₹10,000.00

  test("returns 'normal' (green/teal) when spending is below 80%", () => {
    const status79 = calculateBudgetStatus(790000, budgetPaise); // 79%
    assert.equal(status79.percentage, 79);
    assert.equal(status79.remainingPaise, 210000);
    assert.equal(status79.overspendPaise, 0);
    assert.equal(status79.isOver, false);
    assert.equal(status79.statusColor, "normal");

    const status50 = calculateBudgetStatus(500000, budgetPaise); // 50%
    assert.equal(status50.statusColor, "normal");
  });

  test("turns 'amber' at exactly 80% and up to 99.9%", () => {
    const status80 = calculateBudgetStatus(800000, budgetPaise); // 80%
    assert.equal(status80.percentage, 80);
    assert.equal(status80.remainingPaise, 200000);
    assert.equal(status80.statusColor, "amber");

    const status95 = calculateBudgetStatus(950000, budgetPaise); // 95%
    assert.equal(status95.statusColor, "amber");
  });

  test("turns 'red' at exactly 100% and when over-budget", () => {
    const status100 = calculateBudgetStatus(1000000, budgetPaise); // 100%
    assert.equal(status100.percentage, 100);
    assert.equal(status100.remainingPaise, 0);
    assert.equal(status100.isOver, false);
    assert.equal(status100.statusColor, "red");

    const status120 = calculateBudgetStatus(1200000, budgetPaise); // 120%
    assert.equal(status120.percentage, 120);
    assert.equal(status120.remainingPaise, 0);
    assert.equal(status120.overspendPaise, 200000);
    assert.equal(status120.isOver, true);
    assert.equal(status120.statusColor, "red");
  });
});

describe("3. Spending Insights Algorithms", () => {
  const dummyCategories: ExpenseCategory[] = [
    {
      id: "cat-food",
      user_id: "user-1",
      name: "Food",
      icon: "Utensils",
      color: "#E0A458",
      is_default: true,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
    {
      id: "cat-transport",
      user_id: "user-1",
      name: "Transport",
      icon: "Car",
      color: "#1F7A8C",
      is_default: true,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
  ];

  const dummyExpenses: Expense[] = [
    // 2026-11-01 was Sunday (Weekend)
    {
      id: "exp-1",
      user_id: "user-1",
      category_id: "cat-food",
      amount_paise: 50000, // ₹500
      spent_at: "2026-11-01T08:00:00Z",
      payment_method: "UPI",
      place: "Starbucks",
      notes: "Coffee & bagel",
      receipt_url: null,
      drive_file_id: null,
      is_recurring: false,
      recurrence_rule: null,
      created_at: "2026-11-01T08:00:00Z",
      updated_at: "2026-11-01T08:00:00Z",
    },
    // 2026-11-02 was Monday (Weekday)
    {
      id: "exp-2",
      user_id: "user-1",
      category_id: "cat-food",
      amount_paise: 30000, // ₹300
      spent_at: "2026-11-02T08:00:00Z",
      payment_method: "UPI",
      place: "Swiggy",
      notes: "Lunch bowl",
      receipt_url: null,
      drive_file_id: null,
      is_recurring: false,
      recurrence_rule: null,
      created_at: "2026-11-02T08:00:00Z",
      updated_at: "2026-11-02T08:00:00Z",
    },
    // 2026-11-02 Monday (Weekday)
    {
      id: "exp-3",
      user_id: "user-1",
      category_id: "cat-transport",
      amount_paise: 20000, // ₹200
      spent_at: "2026-11-02T12:00:00Z",
      payment_method: "Card",
      place: "Metro",
      notes: "Smart card recharge",
      receipt_url: null,
      drive_file_id: null,
      is_recurring: false,
      recurrence_rule: null,
      created_at: "2026-11-02T12:00:00Z",
      updated_at: "2026-11-02T12:00:00Z",
    },
  ];

  test("calculates weekend vs weekday spend accurately", () => {
    // Current IST date: 2026-11-02 (Monday, day 2 of Nov 2026)
    const insights = calculateSpendInsights(dummyExpenses, dummyCategories, "2026-11-02");

    assert.equal(insights.weekendSpendPaise, 50000); // 1st Nov was Sun
    assert.equal(insights.weekdaySpendPaise, 50000); // 2nd Nov (30000 + 20000)
  });

  test("identifies biggest spending category this month", () => {
    const insights = calculateSpendInsights(dummyExpenses, dummyCategories, "2026-11-02");

    assert.ok(insights.biggestCategory);
    assert.equal(insights.biggestCategory.name, "Food");
    assert.equal(insights.biggestCategory.amountPaise, 80000); // ₹800
    assert.equal(insights.biggestCategory.percentage, 80); // 800 / 1000 = 80%
  });

  test("projects month-end spend based on days elapsed in IST", () => {
    // On Day 2 of Nov (30 days total), spent ₹1,000 so far -> daily avg ₹500 -> projected ₹15,000
    const insights = calculateSpendInsights(dummyExpenses, dummyCategories, "2026-11-02");

    assert.equal(insights.projectedMonthEnd.daysPassed, 2);
    assert.equal(insights.projectedMonthEnd.daysInMonth, 30);
    assert.equal(insights.projectedMonthEnd.currentSpentPaise, 100000);
    assert.equal(insights.projectedMonthEnd.dailyAvgPaise, 50000);
    assert.equal(insights.projectedMonthEnd.projectedTotalPaise, 1500000); // ₹15,000
  });

  test("ranks top places by spend", () => {
    const insights = calculateSpendInsights(dummyExpenses, dummyCategories, "2026-11-02");

    assert.equal(insights.topPlaces.length, 3);
    assert.equal(insights.topPlaces[0].place, "Starbucks");
    assert.equal(insights.topPlaces[0].amountPaise, 50000);
    assert.equal(insights.topPlaces[1].place, "Swiggy");
    assert.equal(insights.topPlaces[1].amountPaise, 30000);
  });
});

describe("4. CSV Export Generator", () => {
  test("generates valid CSV format with INR amounts and headers", () => {
    const dummyExpense: Expense = {
      id: "exp-1",
      user_id: "user-1",
      category_id: "cat-1",
      amount_paise: 25050, // ₹250.50
      spent_at: "2026-11-02T10:00:00Z",
      payment_method: "UPI",
      place: "Cafe Coffee Day",
      notes: "Cold coffee, sandwich",
      receipt_url: null,
      drive_file_id: null,
      is_recurring: false,
      recurrence_rule: null,
      created_at: "2026-11-02T10:00:00Z",
      updated_at: "2026-11-02T10:00:00Z",
    };

    const dummyCategory: ExpenseCategory = {
      id: "cat-1",
      user_id: "user-1",
      name: "Food",
      icon: "Utensils",
      color: "#E0A458",
      is_default: true,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    };

    const dummyIncome: Income = {
      id: "inc-1",
      user_id: "user-1",
      source: "Freelance",
      amount_paise: 500000, // ₹5,000.00
      received_at: "2026-11-01T10:00:00Z",
      notes: "Landing page design",
      created_at: "2026-11-01T10:00:00Z",
      updated_at: "2026-11-01T10:00:00Z",
    };

    const csv = generateExpensesCSV([dummyExpense], [dummyIncome], [dummyCategory]);
    assert.ok(csv.includes('"Type","Date (IST)","Amount (INR)","Category / Source"'));
    assert.ok(csv.includes('"Expense"'));
    assert.ok(csv.includes('"250.50"'));
    assert.ok(csv.includes('"Cafe Coffee Day"'));
    assert.ok(csv.includes('"Income"'));
    assert.ok(csv.includes('"5000.00"'));
  });
});

describe("5. Food Diary Weekly Grid & Sync Math", () => {
  test("builds 7-day weekly meal overview with correct slots and spend", () => {
    const mondayIST = "2026-11-02"; // Monday
    const dummyMeals: MealWithExpense[] = [
      {
        id: "m-1",
        user_id: "user-1",
        meal_type: "breakfast",
        description: "Poha + Chai",
        location_type: "home",
        restaurant_name: null,
        expense_id: "exp-m1",
        rating: 5,
        photo_url: null,
        notes_taste: "Crispy peanuts",
        notes_health: "Light breakfast",
        is_favorite: true,
        eat_again: true,
        eaten_at: "2026-11-02T03:00:00Z", // 8:30 AM IST on Mon 2 Nov
        created_at: "2026-11-02T03:00:00Z",
        updated_at: "2026-11-02T03:00:00Z",
        expense: {
          id: "exp-m1",
          user_id: "user-1",
          category_id: "cat-food",
          amount_paise: 5000, // ₹50
          spent_at: "2026-11-02T03:00:00Z",
          payment_method: "UPI",
          place: "Home",
          notes: "Meal (breakfast): Poha + Chai",
          receipt_url: null,
          drive_file_id: null,
          is_recurring: false,
          recurrence_rule: null,
          created_at: "2026-11-02T03:00:00Z",
          updated_at: "2026-11-02T03:00:00Z",
        },
      },
      {
        id: "m-2",
        user_id: "user-1",
        meal_type: "dinner",
        description: "Paneer Tikka Roll",
        location_type: "restaurant",
        restaurant_name: "Rolls King",
        expense_id: "exp-m2",
        rating: 4,
        photo_url: null,
        notes_taste: "Spicy",
        notes_health: "High protein",
        is_favorite: false,
        eat_again: true,
        eaten_at: "2026-11-02T15:00:00Z", // 8:30 PM IST on Mon 2 Nov
        created_at: "2026-11-02T15:00:00Z",
        updated_at: "2026-11-02T15:00:00Z",
        expense: {
          id: "exp-m2",
          user_id: "user-1",
          category_id: "cat-food",
          amount_paise: 18000, // ₹180
          spent_at: "2026-11-02T15:00:00Z",
          payment_method: "UPI",
          place: "Rolls King",
          notes: "Meal (dinner): Paneer Tikka Roll",
          receipt_url: null,
          drive_file_id: null,
          is_recurring: false,
          recurrence_rule: null,
          created_at: "2026-11-02T15:00:00Z",
          updated_at: "2026-11-02T15:00:00Z",
        },
      },
    ];

    const weekly = buildWeeklyMealOverview(dummyMeals, mondayIST);

    assert.equal(weekly.length, 7);
    assert.equal(weekly[0].dayOfWeek, "mon");
    assert.equal(weekly[0].breakfast.length, 1);
    assert.equal(weekly[0].dinner.length, 1);
    assert.equal(weekly[0].lunch.length, 0);
    assert.equal(weekly[0].totalFoodSpendPaise, 23000); // ₹50 + ₹180 = ₹230 (23000 paise)
    assert.equal(weekly[1].totalFoodSpendPaise, 0); // Tuesday empty
  });
});

describe("6. Meal-Expense Link Synchronization", () => {
  function createMockSupabase() {
    const store = {
      expense_categories: [
        {
          id: "cat-food-123",
          user_id: "user-test",
          name: "Food",
          icon: "Utensils",
          color: "#E0A458",
          is_default: true,
        },
      ],
      expenses: [] as any[],
      meals: [] as any[],
      timeline_events: [] as any[],
    };

    const client: any = {
      from: (table: string) => {
        let currentTable = table;
        let insertedRow: any = null;
        let updatePayload: any = null;
        let filterId: string | null = null;
        let isDelete = false;

        const chain: any = {
          select: () => chain,
          insert: (data: any) => {
            insertedRow = {
              id: `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data,
            };
            (store as any)[currentTable]?.push(insertedRow);
            return chain;
          },
          update: (data: any) => {
            updatePayload = data;
            return chain;
          },
          delete: () => {
            isDelete = true;
            return chain;
          },
          eq: (col: string, val: any) => {
            if (col === "id") filterId = val;
            if (isDelete && col === "id") {
              const arr = (store as any)[currentTable] || [];
              const idx = arr.findIndex((x: any) => x.id === val);
              if (idx >= 0) arr.splice(idx, 1);
            }
            return chain;
          },
          ilike: () => chain,
          limit: () => chain,
          order: () => chain,
          maybeSingle: async () => {
            if (currentTable === "expense_categories") {
              return { data: store.expense_categories[0], error: null };
            }
            return { data: null, error: null };
          },
          single: async () => {
            if (insertedRow) {
              return { data: insertedRow, error: null };
            }
            if (updatePayload && filterId) {
              const arr = (store as any)[currentTable] || [];
              const idx = arr.findIndex((x: any) => x.id === filterId);
              if (idx >= 0) {
                arr[idx] = { ...arr[idx], ...updatePayload };
                return { data: arr[idx], error: null };
              }
            }
            return { data: insertedRow || {}, error: null };
          },
        };
        return chain;
      },
      _store: store,
    };

    return client;
  }

  test("auto-creates linked expense and timeline events when meal has cost > 0", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    const createdMeal = await createMeal(supabase, userId, {
      meal_type: "lunch",
      description: "Chole Bhature + Lassi",
      location_type: "restaurant",
      restaurant_name: "Haldiram's",
      cost_paise: 24000, // ₹240
      rating: 5,
    });

    assert.ok(createdMeal);
    assert.ok(createdMeal.expense_id, "Meal should have linked expense_id");
    assert.equal(createdMeal.expense?.amount_paise, 24000);
    assert.equal(createdMeal.expense?.place, "Haldiram's");

    // Verify expenses table in store
    assert.equal(supabase._store.expenses.length, 1);
    assert.equal(supabase._store.expenses[0].id, createdMeal.expense_id);
    assert.equal(supabase._store.expenses[0].category_id, "cat-food-123");

    // Verify timeline events written
    assert.ok(
      supabase._store.timeline_events.some((e: any) => e.type === "meal_logged"),
      "Should log meal_logged timeline event"
    );
    assert.ok(
      supabase._store.timeline_events.some((e: any) => e.type === "expense_logged"),
      "Should log expense_logged timeline event"
    );
  });

  test("does not create expense when meal has zero or omitted cost", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    const createdMeal = await createMeal(supabase, userId, {
      meal_type: "breakfast",
      description: "Oats with Honey",
      location_type: "home",
      rating: 4,
    });

    assert.ok(createdMeal);
    assert.equal(createdMeal.expense_id, null);
    assert.equal(createdMeal.expense, null);
    assert.equal(supabase._store.expenses.length, 0);
  });

  test("updates linked expense when meal cost is updated", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    const createdMeal = await createMeal(supabase, userId, {
      meal_type: "dinner",
      description: "Paneer Pulao",
      location_type: "restaurant",
      restaurant_name: "Spice Garden",
      cost_paise: 15000, // ₹150
    });

    assert.ok(createdMeal?.expense_id);
    const originalExpId = createdMeal.expense_id;

    const updatedMeal = await updateMeal(
      supabase,
      userId,
      createdMeal.id,
      {
        cost_paise: 20000, // ₹200
        description: "Paneer Pulao with Extra Raita",
      },
      createdMeal
    );

    assert.ok(updatedMeal);
    assert.equal(updatedMeal.expense_id, originalExpId);
    assert.equal(supabase._store.expenses[0].amount_paise, 20000);
  });

  test("deletes linked expense when meal is deleted", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    const createdMeal = await createMeal(supabase, userId, {
      meal_type: "snack",
      description: "Samosa + Chai",
      cost_paise: 4000, // ₹40
    });

    assert.equal(supabase._store.meals.length, 1);
    assert.equal(supabase._store.expenses.length, 1);

    const deleted = await deleteMeal(
      supabase,
      userId,
      createdMeal!.id,
      createdMeal!.expense_id
    );

    assert.equal(deleted, true);
    assert.equal(supabase._store.meals.length, 0);
    assert.equal(supabase._store.expenses.length, 0);
  });
});

describe("7. Amrita Mess, Logical Zero Cost, Decoupled Favorites & Multi-Photo", () => {
  function createMockSupabase() {
    const store = {
      expense_categories: [
        {
          id: "cat-food-123",
          user_id: "user-test",
          name: "Food",
          icon: "Utensils",
          color: "#E0A458",
          is_default: true,
        },
      ],
      expenses: [] as any[],
      meals: [] as any[],
      timeline_events: [] as any[],
    };

    const client: any = {
      from: (table: string) => {
        let currentTable = table;
        let insertedRow: any = null;
        let updatePayload: any = null;
        let filterId: string | null = null;
        let isDelete = false;

        const chain: any = {
          select: () => chain,
          insert: (data: any) => {
            insertedRow = {
              id: `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data,
            };
            (store as any)[currentTable]?.push(insertedRow);
            return chain;
          },
          update: (data: any) => {
            updatePayload = data;
            return chain;
          },
          delete: () => {
            isDelete = true;
            return chain;
          },
          eq: (col: string, val: any) => {
            if (col === "id") filterId = val;
            if (isDelete && col === "id") {
              const arr = (store as any)[currentTable] || [];
              const idx = arr.findIndex((x: any) => x.id === val);
              if (idx >= 0) arr.splice(idx, 1);
            }
            return chain;
          },
          ilike: () => chain,
          limit: () => chain,
          order: () => chain,
          gte: () => chain,
          lte: () => chain,
          in: () => chain,
          maybeSingle: async () => {
            if (currentTable === "expense_categories") {
              return { data: store.expense_categories[0], error: null };
            }
            return { data: null, error: null };
          },
          single: async () => {
            if (insertedRow) {
              return { data: insertedRow, error: null };
            }
            if (updatePayload && filterId) {
              const arr = (store as any)[currentTable] || [];
              const idx = arr.findIndex((x: any) => x.id === filterId);
              if (idx >= 0) {
                arr[idx] = { ...arr[idx], ...updatePayload };
                return { data: arr[idx], error: null };
              }
            }
            return { data: insertedRow || {}, error: null };
          },
          then: (resolve: any) => {
            const arr = (store as any)[currentTable] || [];
            return Promise.resolve(resolve({ data: arr, error: null }));
          },
        };
        return chain;
      },
      _store: store,
    };

    return client;
  }

  test("Amrita Mess meal strictly zeroes cost and skips expense creation", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    const meal = await createMeal(supabase, userId, {
      meal_type: "lunch",
      description: "Amrita South Indian Thali with Sambhar",
      location_type: "amrita_mess",
      cost_paise: 5000, // Should be ignored and zeroed!
      rating: 4,
    });

    assert.ok(meal);
    assert.equal(meal.location_type, "amrita_mess");
    assert.equal(meal.restaurant_name, "Amrita Mess");
    assert.equal(meal.expense_id, null, "Should not have linked expense");
    assert.equal(meal.expense, null);
    assert.equal(supabase._store.expenses.length, 0, "No expense row should be written");
  });

  test("Home meal strictly zeroes cost and skips expense creation", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    const meal = await createMeal(supabase, userId, {
      meal_type: "dinner",
      description: "Home Cooked Khichdi",
      location_type: "home",
      cost_paise: 3000, // Should be ignored and zeroed!
    });

    assert.ok(meal);
    assert.equal(meal.location_type, "home");
    assert.equal(meal.expense_id, null);
    assert.equal(supabase._store.expenses.length, 0);
  });

  test("Updating meal to Amrita Mess deletes previously linked restaurant expense", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    // First, create a paid restaurant meal
    const meal = await createMeal(supabase, userId, {
      meal_type: "dinner",
      description: "Biryani",
      location_type: "restaurant",
      restaurant_name: "Biryani Zone",
      cost_paise: 25000, // ₹250
    });

    assert.ok(meal?.expense_id);
    assert.equal(supabase._store.expenses.length, 1);

    // Switch location to amrita_mess
    const updated = await updateMeal(
      supabase,
      userId,
      meal.id,
      {
        location_type: "amrita_mess",
      },
      meal
    );

    assert.ok(updated);
    assert.equal(updated.location_type, "amrita_mess");
    assert.equal(updated.expense_id, null);
    assert.equal(updated.expense, null);
    assert.equal(supabase._store.expenses.length, 0, "Previous expense must be deleted");
  });

  test("Decoupled favorites: rating does not automatically force is_favorite to true", () => {
    // 5-star rating without is_favorite
    const flags1 = decodeMealFlags({
      notes_taste: "Crispy dosa",
      rating: 5,
      is_favorite: false,
    });
    assert.equal(flags1.is_favorite, false, "5-star rating should not override explicit is_favorite false");

    // 4-star rating without is_favorite
    const flags2 = decodeMealFlags({
      notes_taste: "Nice meal",
      rating: 4,
      is_favorite: false,
    });
    assert.equal(flags2.is_favorite, false);

    // Explicit favorite
    const flags3 = decodeMealFlags({
      notes_taste: "Loved this",
      rating: 3,
      is_favorite: true,
    });
    assert.equal(flags3.is_favorite, true);
  });

  test("Multi-photo parsing normalizes arrays, JSON strings, and single photo_url", () => {
    const flags1 = decodeMealFlags({
      photo_urls: ["https://example.com/p1.webp", "https://example.com/p2.webp"],
    });
    assert.deepEqual(flags1.photo_urls, ["https://example.com/p1.webp", "https://example.com/p2.webp"]);

    const flags2 = decodeMealFlags({
      photo_urls: '["https://example.com/json.webp"]',
    });
    assert.deepEqual(flags2.photo_urls, ["https://example.com/json.webp"]);

    const flags3 = decodeMealFlags({
      photo_url: "https://example.com/legacy.webp",
    });
    assert.deepEqual(flags3.photo_urls, ["https://example.com/legacy.webp"]);
  });

  test("Places to Eat Again excludes Amrita Mess and Home entries", async () => {
    const supabase = createMockSupabase();
    const userId = "user-test";

    // Add 1 restaurant, 1 amrita mess, 1 home
    await createMeal(supabase, userId, {
      meal_type: "lunch",
      description: "Thali",
      location_type: "amrita_mess",
      rating: 5,
      eat_again: true,
    });
    await createMeal(supabase, userId, {
      meal_type: "dinner",
      description: "Roti Sabzi",
      location_type: "home",
      rating: 5,
      eat_again: true,
    });
    await createMeal(supabase, userId, {
      meal_type: "dinner",
      description: "Woodfired Pizza",
      location_type: "restaurant",
      restaurant_name: "Toscano",
      cost_paise: 45000,
      rating: 5,
      eat_again: true,
    });

    const places = await getPlacesToEatAgain(supabase, userId);
    assert.equal(places.length, 1);
    assert.equal(places[0].restaurant_name, "Toscano");
  });
});
