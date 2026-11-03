// ============================================================================
// Sahil's Shore: Phase 9 Unit Tests - Resume & Career Hub
// Action-verb checker, metric regex, paise currency math, follow-up categorizer,
// weekly career stats, and STAR practice logic.
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  analyzeBulletPoint,
  salaryPaiseToRupees,
  rupeesToSalaryPaise,
  formatSalaryRange,
  categorizeFollowUps,
  calculateCareerStats,
  STRONG_ACTION_VERBS,
  STAR_PROMPT_QUESTIONS,
} from "../lib/career/index.ts";
import { todayIST, addDaysIST } from "../lib/date-utils.ts";
import type { Application } from "../types/career.ts";

describe("1. Action-Verb & Metric Quality Analyzer", () => {
  test("identifies strong power verbs at start of bullet", () => {
    const analysis1 = analyzeBulletPoint(
      "Architected a distributed event-driven microservices architecture using Spring Boot and Kafka."
    );
    assert.strictEqual(analysis1.hasActionVerb, true);
    assert.strictEqual(analysis1.actionVerb?.toLowerCase(), "architected");

    const analysis2 = analyzeBulletPoint(
      "Optimized PostgreSQL connection pool and query indexing, reducing average p99 response times."
    );
    assert.strictEqual(analysis2.hasActionVerb, true);
    assert.strictEqual(analysis2.actionVerb?.toLowerCase(), "optimized");
  });

  test("flags weak starting phrases like 'Worked on' or 'Responsible for'", () => {
    const analysis1 = analyzeBulletPoint(
      "Worked on backend APIs using Java and MySQL database for payment service."
    );
    assert.strictEqual(analysis1.hasActionVerb, false);
    assert.ok(analysis1.suggestions.some((s) => s.includes("Avoid starting with \"worked on\"")));

    const analysis2 = analyzeBulletPoint(
      "Responsible for deploying containers to AWS ECS clusters."
    );
    assert.strictEqual(analysis2.hasActionVerb, false);
    assert.ok(analysis2.suggestions.some((s) => s.includes("Avoid starting with \"responsible for\"")));
  });

  test("accurately detects quantifiable metrics and numbers", () => {
    // Percentage
    const a1 = analyzeBulletPoint(
      "Reduced CPU utilization by 42% across 8 production container nodes."
    );
    assert.strictEqual(a1.hasMetric, true);
    assert.ok(a1.metricsFound.some((m) => m.includes("42%")));

    // Currency in INR and USD
    const a2 = analyzeBulletPoint(
      "Automated serverless AWS Lambda pipelines, saving ₹1.5L monthly in infrastructure overhead."
    );
    assert.strictEqual(a2.hasMetric, true);
    assert.ok(a2.metricsFound.some((m) => m.includes("₹1.5L")));

    // Latency and throughput metrics
    const a3 = analyzeBulletPoint(
      "Scaled Redis caching layer to sustain 15k QPS with sub-25ms response latency."
    );
    assert.strictEqual(a3.hasMetric, true);
    assert.ok(a3.metricsFound.some((m) => m.includes("15k") || m.includes("25ms")));

    // Scale multiplier
    const a4 = analyzeBulletPoint(
      "Refactored React bundle splitting and Webpack loaders, speeding up page load time 3x."
    );
    assert.strictEqual(a4.hasMetric, true);
    assert.ok(a4.metricsFound.some((m) => m.includes("3x")));
  });

  test("rates strong bullet when action verb, metric, and 10-35 words are met", () => {
    const analysis = analyzeBulletPoint(
      "Engineered an idempotent payment processing service with Redis locking, processing ₹45L daily transactions at 99.99% uptime."
    );
    assert.strictEqual(analysis.hasActionVerb, true);
    assert.strictEqual(analysis.hasMetric, true);
    assert.strictEqual(analysis.strength, "strong");
  });

  test("prompts to add a number when metric is missing", () => {
    const analysis = analyzeBulletPoint(
      "Architected clean multi-module Maven microservices architecture implementing DDD principles."
    );
    assert.strictEqual(analysis.hasActionVerb, true);
    assert.strictEqual(analysis.hasMetric, false);
    assert.strictEqual(analysis.strength, "good");
    assert.ok(analysis.suggestions.some((s) => s.includes("Add a number or measurable metric")));
  });
});

describe("2. Money in Paise Math & Salary Formatting (INR)", () => {
  test("converts rupees to paise and vice versa without floating precision loss", () => {
    const rupees = 2400000; // 24 Lakhs
    const paise = rupeesToSalaryPaise(rupees);
    assert.strictEqual(paise, 240000000); // 24 cr paise
    assert.strictEqual(salaryPaiseToRupees(paise), 2400000);
  });

  test("formats salary range using Indian numbering grouping", () => {
    const minPaise = 180000000; // 18,00,000 INR
    const maxPaise = 240000000; // 24,00,000 INR

    const formatted = formatSalaryRange(minPaise, maxPaise);
    assert.ok(formatted.includes("18,00,000"));
    assert.ok(formatted.includes("24,00,000"));

    // Single bound
    const singleMin = formatSalaryRange(minPaise, null);
    assert.ok(singleMin.startsWith("From"));
    assert.ok(singleMin.includes("18,00,000"));

    const singleMax = formatSalaryRange(null, maxPaise);
    assert.ok(singleMax.startsWith("Up to"));
    assert.ok(singleMax.includes("24,00,000"));
  });

  test("falls back to text or 'Not specified' when values are null", () => {
    assert.strictEqual(formatSalaryRange(null, null, "Competitive"), "Competitive");
    assert.strictEqual(formatSalaryRange(null, null), "Not specified");
  });
});

describe("3. Follow-Up Reminders Categorization", () => {
  test("categorizes overdue, due today, and upcoming follow-ups accurately", () => {
    const today = todayIST();
    const yesterday = addDaysIST(today, -1);
    const tomorrow = addDaysIST(today, 1);
    const futureDate = addDaysIST(today, 4);

    const apps: Application[] = [
      {
        id: "app-1",
        user_id: "user-1",
        company: "Swiggy",
        role: "Backend Engineer",
        stage: "applied",
        next_follow_up: `${yesterday}T09:00:00Z`,
        location: null,
        applied_at: null,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "app-2",
        user_id: "user-1",
        company: "Google",
        role: "Software Engineer III",
        stage: "interview",
        next_follow_up: `${today}T09:00:00Z`,
        location: null,
        applied_at: null,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "app-3",
        user_id: "user-1",
        company: "Razorpay",
        role: "Senior Full Stack Dev",
        stage: "applied",
        next_follow_up: `${tomorrow}T09:00:00Z`,
        location: null,
        applied_at: null,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "app-4",
        user_id: "user-1",
        company: "Zomato",
        role: "Platform Engineer",
        stage: "rejected", // Should be ignored because already closed
        next_follow_up: `${yesterday}T09:00:00Z`,
        location: null,
        applied_at: null,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const result = categorizeFollowUps(apps);

    assert.strictEqual(result.overdue.length, 1);
    assert.strictEqual(result.overdue[0].company, "Swiggy");

    assert.strictEqual(result.today.length, 1);
    assert.strictEqual(result.today[0].company, "Google");

    assert.strictEqual(result.upcoming.length, 1);
    assert.strictEqual(result.upcoming[0].company, "Razorpay");
  });
});

describe("4. Weekly Career Stats & Funnel Analytics", () => {
  test("calculates applications sent, response rate, and funnel percentages", () => {
    const today = todayIST();

    const mockApps: Application[] = [
      {
        id: "1",
        user_id: "u1",
        company: "Company A",
        role: "Backend Engineer",
        stage: "wishlist",
        applied_at: null,
        created_at: `${today}T08:00:00Z`,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        location: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        next_follow_up: null,
        updated_at: "",
      },
      {
        id: "2",
        user_id: "u1",
        company: "Company B",
        role: "Full Stack Engineer",
        stage: "applied",
        applied_at: `${today}T08:00:00Z`,
        created_at: `${today}T08:00:00Z`,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        location: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        next_follow_up: null,
        updated_at: "",
      },
      {
        id: "3",
        user_id: "u1",
        company: "Company C",
        role: "Java Specialist",
        stage: "interview",
        applied_at: `${today}T08:00:00Z`,
        created_at: `${today}T08:00:00Z`,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        location: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        next_follow_up: null,
        updated_at: "",
      },
      {
        id: "4",
        user_id: "u1",
        company: "Company D",
        role: "Backend Dev",
        stage: "offer",
        applied_at: `${today}T08:00:00Z`,
        created_at: `${today}T08:00:00Z`,
        salary_range: null,
        salary_min_paise: null,
        salary_max_paise: null,
        job_url: null,
        location: null,
        source: null,
        resume_id: null,
        contacts: [],
        notes: null,
        next_follow_up: null,
        updated_at: "",
      },
    ];

    const stats = calculateCareerStats(mockApps);

    assert.strictEqual(stats.totalApplications, 4);
    assert.strictEqual(stats.activeInterviews, 1);
    assert.strictEqual(stats.offersCount, 1);

    // Non-wishlist = 3 (Company B, C, D). Positive = 2 (Company C in interview + Company D in offer).
    // Response rate = 2/3 = 67%
    assert.strictEqual(stats.responseRatePct, 67);

    // Funnel stages exist
    assert.strictEqual(stats.funnel.length, 5);
    const wishlistStep = stats.funnel.find((s) => s.stage === "wishlist");
    assert.strictEqual(wishlistStep?.count, 1);
    assert.strictEqual(wishlistStep?.pct, 25);
  });
});

describe("5. STAR Behavioral Prompt Bank", () => {
  test("contains curated questions across critical behavioral categories", () => {
    assert.ok(STAR_PROMPT_QUESTIONS.length >= 6);

    const categories = STAR_PROMPT_QUESTIONS.map((q) => q.category);
    assert.ok(categories.includes("Conflict"));
    assert.ok(categories.includes("Failure & Resilience"));
    assert.ok(categories.includes("Leadership"));
    assert.ok(categories.includes("High Impact"));
  });
});
