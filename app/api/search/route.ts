// ============================================================================
// Sahil's Shore: Global Search API Endpoint
// Searches across tasks, notes, dsa_problems, vocab_cards, places, expenses, journal
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface SearchResultItem {
  id: string;
  type: "task" | "note" | "dsa" | "vocab" | "place" | "expense" | "journal";
  title: string;
  subtitle: string;
  url: string;
  tag?: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: SearchResultItem[] = [];
    const searchPattern = `%${query}%`;

    // 1. Search Tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, priority, due_date, status")
      .eq("user_id", user.id)
      .ilike("title", searchPattern)
      .limit(5);

    if (tasks) {
      tasks.forEach((t) => {
        results.push({
          id: t.id,
          type: "task",
          title: t.title,
          subtitle: `Priority: ${t.priority} • Status: ${t.status}`,
          url: "/todos",
          tag: "Task",
        });
      });
    }

    // 2. Search Notes
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, folder, content")
      .eq("user_id", user.id)
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
      .limit(5);

    if (notes) {
      notes.forEach((n) => {
        results.push({
          id: n.id,
          type: "note",
          title: n.title,
          subtitle: `Folder: ${n.folder} • ${n.content.slice(0, 60)}...`,
          url: "/notes",
          tag: "Note",
        });
      });
    }

    // 3. Search DSA Problems
    const { data: dsa } = await supabase
      .from("dsa_problems")
      .select("id, title, topic, difficulty, platform")
      .eq("user_id", user.id)
      .or(`title.ilike.${searchPattern},topic.ilike.${searchPattern}`)
      .limit(5);

    if (dsa) {
      dsa.forEach((d) => {
        results.push({
          id: d.id,
          type: "dsa",
          title: d.title,
          subtitle: `${d.platform} • ${d.topic} (${d.difficulty})`,
          url: "/dsa",
          tag: "DSA",
        });
      });
    }

    // 4. Search German Vocab
    const { data: vocab } = await supabase
      .from("vocab_cards")
      .select("id, german_text, english_meaning, cefr_level")
      .eq("user_id", user.id)
      .or(`german_text.ilike.${searchPattern},english_meaning.ilike.${searchPattern}`)
      .limit(5);

    if (vocab) {
      vocab.forEach((v) => {
        results.push({
          id: v.id,
          type: "vocab",
          title: v.german_text,
          subtitle: `${v.english_meaning} • ${v.cefr_level || "A1"}`,
          url: "/german",
          tag: "German",
        });
      });
    }

    // 5. Search Places
    const { data: places } = await supabase
      .from("places")
      .select("id, name, category, notes")
      .eq("user_id", user.id)
      .or(`name.ilike.${searchPattern},notes.ilike.${searchPattern}`)
      .limit(5);

    if (places) {
      places.forEach((p) => {
        results.push({
          id: p.id,
          type: "place",
          title: p.name,
          subtitle: `${p.category || "Place"} • ${p.notes?.slice(0, 45) || ""}`,
          url: `/places/${p.id}`,
          tag: "Place",
        });
      });
    }

    // 6. Search Expenses
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, place, amount_paise, notes, spent_at")
      .eq("user_id", user.id)
      .or(`place.ilike.${searchPattern},notes.ilike.${searchPattern}`)
      .limit(5);

    if (expenses) {
      expenses.forEach((e) => {
        const amt = (e.amount_paise / 100).toFixed(2);
        results.push({
          id: e.id,
          type: "expense",
          title: `₹${amt} at ${e.place || "Expense"}`,
          subtitle: `${e.notes?.slice(0, 50) || "Expense"}`,
          url: "/expenses",
          tag: "Expense",
        });
      });
    }

    // 7. Search Journal Entries
    const { data: journal } = await supabase
      .from("journal_entries")
      .select("id, entry_date, content")
      .eq("user_id", user.id)
      .ilike("content", searchPattern)
      .limit(5);

    if (journal) {
      journal.forEach((j) => {
        results.push({
          id: j.id,
          type: "journal",
          title: `Journal: ${j.entry_date}`,
          subtitle: `${(j.content || "").slice(0, 60)}...`,
          url: "/journal",
          tag: "Journal",
        });
      });
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[/api/search] Search error:", err);
    return NextResponse.json(
      { error: err?.message || "Search failed" },
      { status: 500 }
    );
  }
}
