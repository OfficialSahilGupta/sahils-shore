"use client";

// ============================================================================
// Sahil's Shore: DSA Problem & Engineering Notes Modal
// Comprehensive, multi-pillar algorithm workspace with:
// - Specifications, Platform, Topic, Difficulty, and Pattern tagging
// - Live Split-View Markdown Editor & Real-Time Preview
// - Algorithmic Engineering Templates (Invariants, Edge Cases, Dry Run, Proofs)
// - Visual Concept Maps & Diagram Vault (Upload, Paste, Lightbox, Curated Presets)
// - Multi-Language CodeMirror Studio (Java, Python, TS, JS, C++, Go, Rust)
// - 1-Click Complexity Selectors & Interactive Test Case Runner
// - Spaced Repetition Revision Scheduler (1d, 3d, 7d, 14d, 30d)
// - 1-Click Markdown Document Export (.md & clipboard copy)
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized variables, custom Select menus, and WCAG AA contrast.
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Code2,
  ExternalLink,
  Clock,
  Sparkles,
  BookOpen,
  Star,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  FileText,
  Sliders,
  Image as ImageIcon,
  Plus,
  Trash2,
  Download,
  Eye,
  Columns,
  Edit3,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  CheckCircle2,
  Calendar,
  Layers,
  Tag,
  Upload,
  ArrowRight,
} from "lucide-react";
import type { DsaProblem, Json } from "@/types";
import {
  DSA_PLATFORMS,
  DSA_TOPICS,
  DSA_DIFFICULTIES,
  DSA_STATUSES,
  SUPPORTED_LANGUAGES,
  canonicalDsaTopic,
  type DsaDifficulty,
  type DsaStatus,
  type SupportedLanguage,
} from "@/lib/dsa/constants";
import type { CreateDsaProblemInput } from "@/lib/dsa";
import {
  parseDsaConceptMaps,
  packDsaNotesAndMaps,
  generateDsaMarkdownDocument,
  CURATED_DSA_PRESETS,
  type DsaConceptMap,
} from "@/lib/dsa/concept-map";
import {
  prepareMultipleConceptMapImages,
  prepareConceptMapImage,
  type ChapterConceptMap,
} from "@/lib/learning/concept-map";
import { CodeEditor } from "./CodeEditor";
import { Select } from "@/components/ui/select";
import { ModalPortal } from "@/components/ui/modal-portal";
import { MarkdownView } from "@/components/common/MarkdownView";

interface DsaProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (problemData: CreateDsaProblemInput, problemId?: string) => Promise<void>;
  initialProblem?: DsaProblem | null;
  prefill?: Partial<CreateDsaProblemInput> | null;
}

export interface DsaTestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
  actual?: string;
  notes?: string;
}

const COMMON_DSA_PATTERNS = [
  "Two Pointers",
  "Sliding Window",
  "Monotonic Stack",
  "Binary Search",
  "Fast & Slow Pointers",
  "Top 'K' Elements",
  "Merge Intervals",
  "Tree BFS / Level Order",
  "Tree DFS / Recursion",
  "Graph BFS / DFS",
  "Dijkstra / Shortest Path",
  "Dynamic Programming",
  "0/1 Knapsack",
  "Backtracking",
  "Trie / Prefix Tree",
  "Union-Find",
  "Bit Manipulation",
  "Greedy",
];

const TIME_COMPLEXITY_PRESETS = [
  "O(1)",
  "O(log N)",
  "O(N)",
  "O(N log N)",
  "O(N²)",
  "O(2^N)",
  "O(N!)",
];

const SPACE_COMPLEXITY_PRESETS = [
  "O(1)",
  "O(log N)",
  "O(N)",
  "O(N²)",
  "O(H) recursion",
];

const REVISION_INTERVALS = [
  { days: 1, label: "1 Day (Tomorrow)" },
  { days: 3, label: "3 Days" },
  { days: 7, label: "7 Days (1 Week)" },
  { days: 14, label: "14 Days (2 Weeks)" },
  { days: 30, label: "30 Days (1 Month)" },
];

export function DsaProblemModal({
  isOpen,
  onClose,
  onSave,
  initialProblem,
  prefill,
}: DsaProblemModalProps) {
  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState<
    "specs" | "notes" | "visuals" | "code" | "tests"
  >("notes");
  const [notesSubMode, setNotesSubMode] = useState<"write" | "split" | "preview">("split");
  const [isDualSplitWorkspace, setIsDualSplitWorkspace] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Core Problem Fields
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [platform, setPlatform] = useState("LeetCode");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState<DsaDifficulty>("Medium");
  const [status, setStatus] = useState<DsaStatus>("Solved");
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(30);
  const [timeComplexity, setTimeComplexity] = useState("O(N)");
  const [spaceComplexity, setSpaceComplexity] = useState("O(1)");
  const [approachNotes, setApproachNotes] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("java");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<string>("");

  // Spaced Repetition Scheduling
  const [revisionIntervalDays, setRevisionIntervalDays] = useState<number>(1);
  const [nextRevisionDate, setNextRevisionDate] = useState<string>("");

  // Visual Diagrams & Concept Maps
  const [conceptMaps, setConceptMaps] = useState<ChapterConceptMap[]>([]);
  const [activeLightboxImage, setActiveLightboxImage] = useState<ChapterConceptMap | null>(null);

  // Test Cases
  const [testCases, setTestCases] = useState<DsaTestCase[]>([
    {
      id: "tc-1",
      name: "Example 1",
      input: "nums = [2, 7, 11, 15], target = 9",
      expected: "[0, 1]",
      actual: "[0, 1]",
    },
  ]);

  // Operational State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Calculate Next Revision Date preview
  const formattedNextRevision = useMemo(() => {
    const targetDate = new Date(Date.now() + revisionIntervalDays * 86400000);
    return targetDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [revisionIntervalDays]);

  // Sync state on open / initialProblem change
  useEffect(() => {
    setErrorMessage(null);
    if (initialProblem) {
      setTitle(initialProblem.title || "");
      setLink(initialProblem.link || "");
      setPlatform(initialProblem.platform || "LeetCode");
      setTopic(canonicalDsaTopic(initialProblem.topic || "Arrays"));
      setDifficulty((initialProblem.difficulty as DsaDifficulty) || "Medium");
      setStatus(
        (initialProblem.status as DsaStatus) ||
          (initialProblem.status === "solved" ? "Solved" : "Needs revision")
      );
      setTimeSpentMinutes(initialProblem.time_spent_minutes || 0);
      setTimeComplexity(initialProblem.time_complexity || "O(N)");
      setSpaceComplexity(initialProblem.space_complexity || "O(1)");
      setApproachNotes(initialProblem.approach_notes || "");
      setCodeSnippet(initialProblem.code_snippet || "");
      setLanguage((initialProblem.language as SupportedLanguage) || "java");
      setIsFavorite(Boolean(initialProblem.is_favorite));
      setRevisionIntervalDays(initialProblem.revision_interval_days || 1);
      setNextRevisionDate(
        initialProblem.next_revision_at ||
          new Date(Date.now() + 86400000).toISOString()
      );

      // Parse concept maps from both notes and metadata
      const parsedMaps = parseDsaConceptMaps(initialProblem);
      setConceptMaps(parsedMaps);

      // Parse test cases if stored in revision_history
      if (
        initialProblem.revision_history &&
        typeof initialProblem.revision_history === "object" &&
        !Array.isArray(initialProblem.revision_history)
      ) {
        const hist = initialProblem.revision_history as Record<string, unknown>;
        if (Array.isArray(hist.test_cases)) {
          setTestCases(hist.test_cases as DsaTestCase[]);
        }
        if (typeof hist.pattern === "string") {
          setSelectedPattern(hist.pattern);
        }
      }
    } else if (prefill) {
      setTitle(prefill.title || "");
      setLink(prefill.link || "");
      setPlatform(prefill.platform || "LeetCode");
      setTopic(canonicalDsaTopic(prefill.topic || "Arrays"));
      setDifficulty((prefill.difficulty as DsaDifficulty) || "Medium");
      setStatus((prefill.status as DsaStatus) || "Solved");
      setTimeSpentMinutes(prefill.time_spent_minutes || 30);
      setTimeComplexity(prefill.time_complexity || "O(N)");
      setSpaceComplexity(prefill.space_complexity || "O(1)");
      setApproachNotes(prefill.approach_notes || "");
      setCodeSnippet(prefill.code_snippet || "");
      setLanguage((prefill.language as SupportedLanguage) || "java");
      setIsFavorite(Boolean(prefill.is_favorite));
      setRevisionIntervalDays(1);
      setConceptMaps([]);
      setTestCases([
        {
          id: `tc-${Date.now()}`,
          name: "Sample Test 1",
          input: "input = []",
          expected: "0",
        },
      ]);
    } else {
      // Clean new problem defaults
      setTitle("");
      setLink("");
      setPlatform("LeetCode");
      setTopic("Arrays");
      setDifficulty("Medium");
      setStatus("Solved");
      setTimeSpentMinutes(30);
      setTimeComplexity("O(N)");
      setSpaceComplexity("O(1)");
      setApproachNotes("");
      setCodeSnippet("");
      setLanguage("java");
      setIsFavorite(false);
      setSelectedPattern("");
      setRevisionIntervalDays(1);
      setConceptMaps([]);
      setTestCases([
        {
          id: `tc-${Date.now()}`,
          name: "Example 1",
          input: "nums = [2, 7, 11, 15], target = 9",
          expected: "[0, 1]",
          actual: "[0, 1]",
        },
      ]);
    }
  }, [initialProblem, prefill, isOpen]);

  // Insert markdown engineering template into notes
  const insertNoteTemplate = (template: string) => {
    setApproachNotes((prev) => (prev ? `${prev.trim()}\n\n${template}` : template));
    setActiveTab("notes");
  };

  // Markdown formatting helpers
  const handleFormatMarkdown = (prefix: string, suffix = "") => {
    const textarea = notesTextareaRef.current;
    if (!textarea) {
      setApproachNotes((prev) => `${prev}\n${prefix}text${suffix}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = approachNotes.substring(start, end) || "text";
    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextContent =
      approachNotes.substring(0, start) +
      replacement +
      approachNotes.substring(end);
    setApproachNotes(nextContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  // Multi-image upload handler
  const handleImageFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const preparedMaps = await prepareMultipleConceptMapImages(Array.from(files));
      const formatted: ChapterConceptMap[] = preparedMaps.map((item, idx) => ({
        id: `dsa-map-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        title: item.caption || `Diagram: ${title || "Algorithm Pattern"}`,
        caption: item.caption,
        url: item.dataUrl,
        createdAt: new Date().toISOString(),
      }));
      setConceptMaps((prev) => [...prev, ...formatted]);
      setActiveTab("visuals");
    } catch (err) {
      console.error("Failed to prepare diagrams:", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Clipboard paste image directly into notes or visuals
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        try {
          const prepared = await prepareConceptMapImage(file);
          const newMap: ChapterConceptMap = {
            id: `dsa-map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: prepared.caption || `Pasted Diagram: ${title || "Blueprint"}`,
            caption: prepared.caption,
            url: prepared.dataUrl,
            createdAt: new Date().toISOString(),
          };
          setConceptMaps((prev) => [...prev, newMap]);
          setActiveTab("visuals");
        } catch (err) {
          console.error("Failed to paste image:", err);
        }
        return;
      }
    }
  };

  // Attach curated SVG preset
  const handleAttachPreset = (preset: (typeof CURATED_DSA_PRESETS)[0]) => {
    if (conceptMaps.some((m) => m.url === preset.svgDataUrl)) return;
    const newMap: ChapterConceptMap = {
      id: `preset-${preset.id}-${Date.now()}`,
      title: preset.title,
      caption: preset.description,
      url: preset.svgDataUrl,
      createdAt: new Date().toISOString(),
    };
    setConceptMaps((prev) => [...prev, newMap]);
    setActiveTab("visuals");
  };

  // Embed diagram markdown tag into notes
  const handleEmbedDiagram = (map: ChapterConceptMap) => {
    const embedTag = `\n\n![${map.caption || map.title}](${map.url})\n\n`;
    setApproachNotes((prev) => prev.trim() + embedTag);
    setActiveTab("notes");
    setNotesSubMode("split");
  };

  // Copy code helper
  const handleCopyCode = async () => {
    if (!codeSnippet) return;
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn("Failed to copy code snippet:", e);
    }
  };

  // Export full markdown document
  const handleCopyMarkdown = async () => {
    const synthProblem: DsaProblem = {
      id: initialProblem?.id || "temp",
      user_id: initialProblem?.user_id || "preview",
      title: title || "DSA Problem",
      link: link || null,
      platform,
      topic,
      difficulty,
      status,
      time_spent_minutes: timeSpentMinutes,
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      approach_notes: approachNotes,
      code_snippet: codeSnippet,
      language,
      revision_interval_days: revisionIntervalDays,
      next_revision_at: new Date(Date.now() + revisionIntervalDays * 86400000).toISOString(),
      revision_count: initialProblem?.revision_count || 0,
      last_revised_at: null,
      revision_history: [],
      rating: null,
      is_favorite: isFavorite,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const md = generateDsaMarkdownDocument(synthProblem, approachNotes, conceptMaps);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch (e) {
      console.warn("Failed to copy markdown:", e);
    }
  };

  // Download .md file
  const handleDownloadMarkdown = () => {
    const synthProblem: DsaProblem = {
      id: initialProblem?.id || "temp",
      user_id: initialProblem?.user_id || "preview",
      title: title || "DSA Problem",
      link: link || null,
      platform,
      topic,
      difficulty,
      status,
      time_spent_minutes: timeSpentMinutes,
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      approach_notes: approachNotes,
      code_snippet: codeSnippet,
      language,
      revision_interval_days: revisionIntervalDays,
      next_revision_at: new Date(Date.now() + revisionIntervalDays * 86400000).toISOString(),
      revision_count: initialProblem?.revision_count || 0,
      last_revised_at: null,
      revision_history: [],
      rating: null,
      is_favorite: isFavorite,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const md = generateDsaMarkdownDocument(synthProblem, approachNotes, conceptMaps);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "dsa-notes"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Test case actions
  const handleAddTestCase = () => {
    const newCase: DsaTestCase = {
      id: `tc-${Date.now()}`,
      name: `Test Case ${testCases.length + 1}`,
      input: "",
      expected: "",
    };
    setTestCases((prev) => [...prev, newCase]);
  };

  const handleUpdateTestCase = (id: string, updates: Partial<DsaTestCase>) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc))
    );
  };

  const handleDeleteTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const handleExportTestCasesToNotes = () => {
    let md = "\n\n### Dry Run & Test Cases\n";
    md += "| Test Case | Input | Expected Output | Actual Output |\n";
    md += "| :--- | :--- | :--- | :--- |\n";
    testCases.forEach((tc) => {
      md += `| **${tc.name}** | \`${tc.input || "n/a"}\` | \`${tc.expected || "n/a"}\` | \`${tc.actual || tc.expected || "pass"}\` |\n`;
    });
    setApproachNotes((prev) => prev.trim() + md);
    setActiveTab("notes");
    setNotesSubMode("split");
  };

  // Language starter template boilerplate
  const handleApplyBoilerplate = () => {
    let boilerplate = "";
    switch (language as string) {
      case "java":
        boilerplate = `class Solution {\n    public int solve() {\n        // Invariant: \n        return 0;\n    }\n}`;
        break;
      case "python":
        boilerplate = `class Solution:\n    def solve(self) -> int:\n        # Invariant: \n        return 0`;
        break;
      case "typescript":
      case "javascript":
        boilerplate = `function solve(): number {\n    // Invariant: \n    return 0;\n}`;
        break;
      case "cpp":
        boilerplate = `class Solution {\npublic:\n    int solve() {\n        // Invariant: \n        return 0;\n    }\n};`;
        break;
      default:
        boilerplate = `// Solution implementation`;
    }
    setCodeSnippet(boilerplate);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a problem title.");
      setActiveTab("specs");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Pack notes and concept maps together cleanly
      const existingHistory = initialProblem?.revision_history;
      const { approach_notes: cleanNotes, revision_history: updatedHistory } =
        packDsaNotesAndMaps(approachNotes, conceptMaps, existingHistory);

      // Attach test cases & pattern to revision_history JSON
      const historyObj = (updatedHistory as Record<string, unknown>) || {};
      historyObj.test_cases = testCases;
      if (selectedPattern) {
        historyObj.pattern = selectedPattern;
      }

      const nextRevISO = new Date(
        Date.now() + revisionIntervalDays * 86400000
      ).toISOString();

      await onSave(
        {
          title: title.trim(),
          link: link.trim() || null,
          platform,
          topic: canonicalDsaTopic(topic),
          difficulty,
          status,
          time_spent_minutes: Number(timeSpentMinutes) || 0,
          time_complexity: timeComplexity.trim() || null,
          space_complexity: spaceComplexity.trim() || null,
          approach_notes: cleanNotes || null,
          code_snippet: codeSnippet || null,
          language,
          is_favorite: isFavorite,
          revision_interval_days: revisionIntervalDays,
          next_revision_at: nextRevISO,
          revision_history: historyObj as Json,
        },
        initialProblem?.id
      );

      onClose();
    } catch (err: any) {
      console.error("Error saving DSA problem:", err);
      setErrorMessage(
        err?.message || "Failed to save problem. Please check fields and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        onPaste={handlePaste}
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div
          className={`relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-2xl transition-all flex flex-col ${
            isFullscreen
              ? "max-w-[98vw] h-[96vh]"
              : "max-w-6xl max-h-[94vh]"
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5 mb-3.5 gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-xs shrink-0">
                <Code2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
                    {initialProblem ? `Edit: ${initialProblem.title}` : "DSA Problem & Engineering Notes"}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      difficulty === "Easy"
                        ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30"
                        : difficulty === "Hard"
                        ? "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30"
                        : "bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] border border-[var(--accent-warm)]/30"
                    }`}
                  >
                    {difficulty}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  Algorithmic intuition, loop invariants, whiteboard diagrams, test cases, and solution code
                </p>
              </div>
            </div>

            {/* Header Right Quick Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Star Button */}
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  isFavorite
                    ? "border-[var(--accent-warm)] bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                }`}
                title={isFavorite ? "Favorited Problem" : "Add to Favorites"}
              >
                <Star
                  className={`h-3.5 w-3.5 ${
                    isFavorite ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]" : ""
                  }`}
                />
                <span className="hidden md:inline">{isFavorite ? "Starred" : "Star"}</span>
              </button>

              {/* Copy Markdown */}
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                title="Copy formatted Markdown notes & code to clipboard"
              >
                {copiedMarkdown ? (
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedMarkdown ? "Copied" : "Copy MD"}</span>
              </button>

              {/* Download Markdown */}
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                title="Download documentation as .md file"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">.md</span>
              </button>

              {/* Dual Split Workspace Toggle (Desktop only) */}
              <button
                type="button"
                onClick={() => setIsDualSplitWorkspace(!isDualSplitWorkspace)}
                className={`hidden lg:flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isDualSplitWorkspace
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                }`}
                title="Dual Split: Keep Notes and Code side-by-side simultaneously"
              >
                <Columns className="h-3.5 w-3.5" />
                <span>Side-by-Side</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-xl border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors hidden sm:flex"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Workspace"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)] shrink-0 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="hover:underline font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Top Workspace Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2 mb-3 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "specs"
                    ? "bg-[var(--primary)] text-white shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Specs & Platform</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "notes"
                    ? "bg-[var(--primary)] text-white shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Engineering Notes</span>
                {approachNotes && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      activeTab === "notes" ? "bg-white/20 text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                    }`}
                  >
                    {approachNotes.trim().split(/\s+/).filter(Boolean).length}w
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("visuals")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "visuals"
                    ? "bg-[var(--primary)] text-white shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Visual Diagrams</span>
                {conceptMaps.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      activeTab === "visuals" ? "bg-white/20 text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                    }`}
                  >
                    {conceptMaps.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "code"
                    ? "bg-[var(--primary)] text-white shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Solution Code</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    activeTab === "code" ? "bg-white/20 text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                  }`}
                >
                  {language}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tests")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "tests"
                    ? "bg-[var(--primary)] text-white shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Complexity & Tests</span>
                {testCases.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      activeTab === "tests" ? "bg-white/20 text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                    }`}
                  >
                    {testCases.length}
                  </span>
                )}
              </button>
            </div>

            {/* In Notes Tab: Sub-mode Selector (Write / Split / Preview) */}
            {activeTab === "notes" && (
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-0.5 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setNotesSubMode("write")}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    notesSubMode === "write"
                      ? "bg-[var(--surface)] text-[var(--text)] shadow-2xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Full-width Write Editor"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotesSubMode("split")}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    notesSubMode === "split"
                      ? "bg-[var(--surface)] text-[var(--text)] shadow-2xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Side-by-side Live Split Editor"
                >
                  <Columns className="h-3 w-3" />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotesSubMode("preview")}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    notesSubMode === "preview"
                      ? "bg-[var(--surface)] text-[var(--text)] shadow-2xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Rendered Notion-style Preview"
                >
                  <Eye className="h-3 w-3" />
                  <span>Preview</span>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
            {/* TAB 1: Specs & Problem Metadata */}
            {activeTab === "specs" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Title & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">
                      Problem Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Trapping Rain Water, Course Schedule, LRU Cache..."
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2.5 text-xs text-[var(--text)] font-semibold placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-[var(--primary)]" /> Problem URL / LeetCode Link
                    </label>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://leetcode.com/problems/..."
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Platform, Topic, Difficulty, Status */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Platform
                    </label>
                    <Select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      size="sm"
                      containerClassName="w-full"
                    >
                      {DSA_PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Primary Topic
                    </label>
                    <Select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      size="sm"
                      containerClassName="w-full"
                    >
                      {DSA_TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Difficulty Level
                    </label>
                    <Select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DsaDifficulty)}
                      size="sm"
                      containerClassName="w-full"
                    >
                      {DSA_DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Current Status
                    </label>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as DsaStatus)}
                      size="sm"
                      containerClassName="w-full"
                    >
                      {DSA_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Solving Time Spent with Quick Adders */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[var(--primary)]" />
                      <span>Time Spent on Solution (Minutes)</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-[var(--primary)]">
                      {timeSpentMinutes} min{timeSpentMinutes === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min="0"
                      value={timeSpentMinutes}
                      onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
                      className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                    />
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTimeSpentMinutes((prev) => (prev || 0) + mins)}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                      >
                        +{mins}m
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTimeSpentMinutes(0)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Algorithmic Pattern Tags */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 space-y-2.5">
                  <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-[var(--primary)]" />
                    <span>Algorithmic Pattern & Paradigm</span>
                  </label>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Tag the core architectural pattern used to solve this problem:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {COMMON_DSA_PATTERNS.map((pattern) => {
                      const isSelected = selectedPattern === pattern;
                      return (
                        <button
                          key={pattern}
                          type="button"
                          onClick={() =>
                            setSelectedPattern(isSelected ? "" : pattern)
                          }
                          className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-all ${
                            isSelected
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-2xs font-semibold"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                          }`}
                        >
                          {pattern}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Spaced Repetition Scheduling Ladder */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[var(--primary)]" />
                      <span>Spaced Repetition Review Interval</span>
                    </label>
                    <span className="text-xs text-[var(--text-muted)]">
                      Scheduled: <strong className="text-[var(--text)] font-mono">{formattedNextRevision}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {REVISION_INTERVALS.map((item) => (
                      <button
                        key={item.days}
                        type="button"
                        onClick={() => setRevisionIntervalDays(item.days)}
                        className={`rounded-xl border p-2.5 text-center transition-all ${
                          revisionIntervalDays === item.days
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-2xs"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        }`}
                      >
                        <span className="block text-xs">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Notes & Invariants (Write / Split / Preview) */}
            {activeTab === "notes" && (
              <div className="flex-1 flex flex-col space-y-3 min-h-[400px]">
                {/* Markdown Formatting Toolbar & Quick Engineering Templates */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-1.5 shrink-0">
                  {/* Markdown Syntax Tools */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("**", "**")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Bold (**text**)"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("*", "*")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Italic (*text*)"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("# ")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Heading 1"
                    >
                      <Heading1 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("## ")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Heading 2"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("### ")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Heading 3"
                    >
                      <Heading3 className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-4 w-px bg-[var(--border)] mx-1" />
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("- ")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Bullet List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("1. ")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Numbered List"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatMarkdown("> ")}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Quote Block"
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleFormatMarkdown(
                          "\n| Step | Pointers / State | Invariant Status |\n| :--- | :--- | :--- |\n| 1 | L=0, R=n-1 | arr[L]+arr[R] < target |\n"
                        )
                      }
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                      title="Insert Table"
                    >
                      <TableIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Engineering Template Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        insertNoteTemplate(
                          "### Key Intuition & Invariant\n- **Core Pattern:** " +
                            (selectedPattern || topic) +
                            "\n- **Loop Invariant:** Maintain the invariant that...\n- **Why this guarantees optimality:** "
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                    >
                      + Invariant
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertNoteTemplate(
                          "### Edge Cases Considered\n- Empty array or string (`length == 0`)\n- Single element (`length == 1`)\n- Duplicate values causing boundary issues\n- Integer overflow bounds (`Integer.MAX_VALUE`)\n- Negative numbers / zero"
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-warm)] hover:bg-[var(--accent-warm)]/10 transition-colors"
                    >
                      + Edge Cases
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertNoteTemplate(
                          "### Dry Run Test Trace\n- Input: `nums = [2, 7, 11, 15], target = 9`\n- Execution Trace:\n  1. Pointer init: L=0, R=3\n  2. Evaluation: 2 + 15 = 17 > 9 -> Contract right pointer: R=2\n  3. Evaluation: 2 + 11 = 13 > 9 -> Contract right pointer: R=1\n  4. Evaluation: 2 + 7 = 9 == target -> Return indices [0, 1]"
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                    >
                      + Dry Run
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertNoteTemplate(
                          "### Complexity Proof\n- **Time Complexity:** `" +
                            timeComplexity +
                            "` because each element is traversed at most constant times.\n- **Space Complexity:** `" +
                            spaceComplexity +
                            "` requiring only auxiliary pointer registers."
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                    >
                      + Proof
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertNoteTemplate(
                          "### DP Recurrence Relation\n- **State Definition:** `dp[i]` represents...\n- **Transition Formula:** `dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i])`\n- **Base Cases:** `dp[0] = nums[0]`, `dp[1] = Math.max(nums[0], nums[1])`"
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                    >
                      + DP State
                    </button>
                  </div>
                </div>

                {/* Workspace Body: Write / Split / Preview */}
                <div className="flex-1 min-h-[360px] flex gap-3 overflow-hidden">
                  {/* Editor Column (Shown in write or split) */}
                  {(notesSubMode === "write" || notesSubMode === "split") && (
                    <div
                      className={`flex flex-col flex-1 min-w-0 ${
                        notesSubMode === "split" ? "w-1/2" : "w-full"
                      }`}
                    >
                      <textarea
                        ref={notesTextareaRef}
                        value={approachNotes}
                        onChange={(e) => setApproachNotes(e.target.value)}
                        placeholder="Write your mental model, core algorithm pattern, invariant rules, and dry-run steps here... (Markdown supported, paste screenshots directly via Cmd/Ctrl+V)"
                        className="w-full flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 text-xs text-[var(--text)] font-sans leading-relaxed placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none"
                      />
                    </div>
                  )}

                  {/* Real-time Rendered Markdown Preview (Shown in split or preview) */}
                  {(notesSubMode === "preview" || notesSubMode === "split") && (
                    <div
                      className={`flex flex-col flex-1 min-w-0 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 ${
                        notesSubMode === "split" ? "w-1/2" : "w-full"
                      }`}
                    >
                      {approachNotes.trim() ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-[var(--text)]">
                          <MarkdownView content={approachNotes} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[var(--text-muted)]">
                          <BookOpen className="h-8 w-8 stroke-[1.5] text-[var(--text-muted)]/40 mb-2" />
                          <p className="text-xs font-semibold">Live Markdown Preview</p>
                          <p className="text-[11px] mt-1 text-[var(--text-muted)]">
                            Type your intuition notes or insert invariant templates to see the live rendering here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Visual Diagrams & Concept Maps */}
            {activeTab === "visuals" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Upload & Paste Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-[var(--primary)]" />
                      <span>Attach Algorithm Diagrams & Whiteboards</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Add whiteboard drawings, recursion tree sketches, or paste screenshots directly (`Cmd/Ctrl+V`)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFilesUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Images</span>
                    </button>
                  </div>
                </div>

                {/* Curated DSA Architectural Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent-warm)]" />
                      <span>Curated Algorithmic Blueprints (Instant Insert)</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Vector SVG</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {CURATED_DSA_PRESETS.map((preset) => {
                      const isAlreadyAttached = conceptMaps.some(
                        (m) => m.url === preset.svgDataUrl
                      );
                      return (
                        <div
                          key={preset.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col justify-between hover:border-[var(--primary)]/50 transition-all group"
                        >
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--primary)] uppercase tracking-wider">
                              {preset.category}
                            </span>
                            <h5 className="text-xs font-bold text-[var(--text)] mt-0.5 group-hover:text-[var(--primary)] transition-colors">
                              {preset.title}
                            </h5>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1">
                              {preset.description}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleAttachPreset(preset)}
                              disabled={isAlreadyAttached}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                isAlreadyAttached
                                  ? "bg-[var(--surface-muted)] text-[var(--text-muted)] opacity-60 cursor-default"
                                  : "bg-[var(--primary)] text-white hover:opacity-90"
                              }`}
                            >
                              <Plus className="h-3 w-3" />
                              <span>{isAlreadyAttached ? "Attached" : "Attach"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attached Diagrams Gallery */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Attached Diagrams ({conceptMaps.length})</span>
                  </span>

                  {conceptMaps.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {conceptMaps.map((map) => (
                        <div
                          key={map.id}
                          className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs group flex flex-col"
                        >
                          {/* Image Thumbnail */}
                          <div
                            onClick={() => setActiveLightboxImage(map)}
                            className="relative h-44 w-full bg-black/10 cursor-pointer overflow-hidden flex items-center justify-center"
                          >
                            <img
                              src={map.url}
                              alt={map.title}
                              className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Eye className="h-4 w-4" />
                              <span>Zoom View</span>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="p-3 border-t border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--surface)]">
                            <span className="text-xs font-bold text-[var(--text)] truncate">
                              {map.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEmbedDiagram(map)}
                                className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                                title="Embed into Markdown Notes"
                              >
                                Embed in Notes
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConceptMaps((prev) =>
                                    prev.filter((m) => m.id !== map.id)
                                  )
                                }
                                className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                                title="Delete diagram"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center">
                      <ImageIcon className="h-8 w-8 stroke-[1.5] text-[var(--text-muted)]/40 mb-2" />
                      <p className="text-xs font-semibold">No diagrams attached yet</p>
                      <p className="text-[11px] mt-1 text-[var(--text-muted)]">
                        Upload recursion trees, whiteboard photos, or attach a curated blueprint above.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Solution Code Studio */}
            {activeTab === "code" && (
              <div className="flex-1 flex flex-col space-y-3 min-h-[400px]">
                {/* Code Toolbar */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                      <Code2 className="h-4 w-4 text-[var(--primary)]" />
                      <span>Language:</span>
                    </span>
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                      size="sm"
                      containerClassName="w-auto min-w-[120px]"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.label}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={handleApplyBoilerplate}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors hidden sm:inline"
                    >
                      + Starter Template
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      disabled={!codeSnippet}
                      className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-40"
                    >
                      {copiedCode ? (
                        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>

                {/* Code Editor Body */}
                <div className="flex-1 min-h-[360px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                  <CodeEditor
                    value={codeSnippet}
                    onChange={(val) => setCodeSnippet(val)}
                    language={language}
                    minHeight="360px"
                    maxHeight={isFullscreen ? "72vh" : "480px"}
                  />
                </div>
              </div>
            )}

            {/* TAB 5: Complexity Analysis & Test Cases */}
            {activeTab === "tests" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1-Click Complexity Chips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time Complexity */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                        <span>Time Complexity</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-[var(--primary)]">
                        {timeComplexity || "O(N)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {TIME_COMPLEXITY_PRESETS.map((tc) => (
                        <button
                          key={tc}
                          type="button"
                          onClick={() => setTimeComplexity(tc)}
                          className={`rounded-xl border px-2.5 py-1 text-xs font-mono transition-all ${
                            timeComplexity === tc
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-2xs font-bold"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                          }`}
                        >
                          {tc}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={timeComplexity}
                      onChange={(e) => setTimeComplexity(e.target.value)}
                      placeholder="Custom e.g. O(N log K)"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>

                  {/* Space Complexity */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[var(--accent-warm)]" />
                        <span>Space Complexity</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-[var(--accent-warm)]">
                        {spaceComplexity || "O(1)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {SPACE_COMPLEXITY_PRESETS.map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => setSpaceComplexity(sc)}
                          className={`rounded-xl border px-2.5 py-1 text-xs font-mono transition-all ${
                            spaceComplexity === sc
                              ? "border-[var(--accent-warm)] bg-[var(--accent-warm)] text-white shadow-2xs font-bold"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                          }`}
                        >
                          {sc}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={spaceComplexity}
                      onChange={(e) => setSpaceComplexity(e.target.value)}
                      placeholder="Custom e.g. O(min(M, N))"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Interactive Test Case Runner & Dry Run Table */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <TableIcon className="h-4 w-4 text-[var(--primary)]" />
                        <span>Dry Run & Test Cases ({testCases.length})</span>
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Add sample inputs and expected outputs to verify logic correctness
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportTestCasesToNotes}
                        className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                        title="Render test cases as a Markdown table in notes"
                      >
                        Export to Notes
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTestCase}
                        className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Test Case</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {testCases.map((tc, idx) => (
                      <div
                        key={tc.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={tc.name}
                            onChange={(e) =>
                              handleUpdateTestCase(tc.id, { name: e.target.value })
                            }
                            placeholder="Test name"
                            className="font-bold text-xs text-[var(--text)] bg-transparent focus:outline-none focus:underline"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteTestCase(tc.id)}
                            className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1"
                            title="Remove test case"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                              Input
                            </span>
                            <input
                              type="text"
                              value={tc.input}
                              onChange={(e) =>
                                handleUpdateTestCase(tc.id, { input: e.target.value })
                              }
                              placeholder="e.g. nums = [2,7,11,15], target = 9"
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                            />
                          </div>

                          <div>
                            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                              Expected Output
                            </span>
                            <input
                              type="text"
                              value={tc.expected}
                              onChange={(e) =>
                                handleUpdateTestCase(tc.id, { expected: e.target.value })
                              }
                              placeholder="e.g. [0, 1]"
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3.5 shrink-0 gap-2">
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="hidden sm:inline">
                  Topic: <strong className="text-[var(--text)]">{topic}</strong>
                </span>
                <span className="hidden md:inline">
                  Pattern: <strong className="text-[var(--text)]">{selectedPattern || "General"}</strong>
                </span>
                <span className="hidden lg:inline">
                  Next Review: <strong className="text-[var(--text)]">{formattedNextRevision}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isSubmitting
                      ? "Saving..."
                      : initialProblem
                      ? "Update Problem & Notes"
                      : "Save Problem & Engineering Notes"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Lightbox Modal for Visual Diagrams */}
        {activeLightboxImage && (
          <div
            onClick={() => setActiveLightboxImage(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            >
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={activeLightboxImage.url}
                alt={activeLightboxImage.title}
                className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              <p className="mt-3 text-xs text-white/90 font-medium text-center">
                {activeLightboxImage.title}
              </p>
            </div>
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
