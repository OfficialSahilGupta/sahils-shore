// ============================================================================
// Sahil's Shore: DSA Visual Diagram & Concept Map Engine
// Supports attaching whiteboard drawings, architecture diagrams, recursion trees,
// and state graphs to DSA problems via file uploads, clipboard paste, or curated SVG presets.
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized colors, and WCAG AA contrast.
// ============================================================================

import type { DsaProblem, Json } from "../../types/index.ts";
import {
  prepareConceptMapImage,
  prepareMultipleConceptMapImages,
  extractConceptMapsFromMarkdown,
  sanitizeNotesExtractingImages,
  formatImageFileSize,
  type ChapterConceptMap,
  type ConceptMapPreset,
} from "../learning/concept-map.ts";

export type { ChapterConceptMap as DsaConceptMap };

/**
 * Extracts all concept maps and diagrams attached to a DSA problem,
 * checking both markdown image syntax in approach_notes and revision_history metadata.
 */
export function parseDsaConceptMaps(problem?: DsaProblem | null): ChapterConceptMap[] {
  if (!problem) return [];

  const mapsFromNotes = extractConceptMapsFromMarkdown(problem.approach_notes);

  let mapsFromHistory: ChapterConceptMap[] = [];
  const historyData = problem.revision_history as any;
  if (historyData && typeof historyData === "object" && !Array.isArray(historyData)) {
    if (Array.isArray(historyData.concept_maps)) {
      mapsFromHistory = historyData.concept_maps;
    }
  }

  const all = [...mapsFromHistory, ...mapsFromNotes];
  const seen = new Set<string>();
  const deduplicated: ChapterConceptMap[] = [];

  for (const m of all) {
    if (m && m.url && !seen.has(m.url)) {
      seen.add(m.url);
      deduplicated.push({
        id: m.id || `dsa-map-${deduplicated.length + 1}`,
        title: m.title || m.caption || "DSA Diagram",
        caption: m.caption || m.title || "DSA Diagram",
        url: m.url,
        createdAt: m.createdAt || new Date().toISOString(),
      });
    }
  }

  return deduplicated;
}

/**
 * Packs DSA notes and concept maps into persistence payload.
 */
export function packDsaNotesAndMaps(
  cleanNotes: string,
  conceptMaps: ChapterConceptMap[],
  existingHistory?: Json
): { approach_notes: string; revision_history: Json } {
  let baseHistoryObj: Record<string, any> = {};
  if (Array.isArray(existingHistory)) {
    baseHistoryObj = { events: existingHistory };
  } else if (existingHistory && typeof existingHistory === "object") {
    baseHistoryObj = { ...(existingHistory as any) };
  }

  baseHistoryObj.concept_maps = conceptMaps;

  return {
    approach_notes: cleanNotes.trim(),
    revision_history: baseHistoryObj as unknown as Json,
  };
}

/**
 * Generates an exportable, self-contained Markdown file for a DSA problem.
 */
export function generateDsaMarkdownDocument(
  problem: DsaProblem,
  notesContent?: string,
  conceptMaps: ChapterConceptMap[] = []
): string {
  const title = problem.title || "DSA Problem";
  const platform = problem.platform || "LeetCode";
  const topic = problem.topic || "Algorithms";
  const difficulty = problem.difficulty || "Medium";
  const timeComplexity = problem.time_complexity || "O(N)";
  const spaceComplexity = problem.space_complexity || "O(1)";
  const language = problem.language || "java";
  const notes = (notesContent || problem.approach_notes || "").trim();
  const code = (problem.code_snippet || "").trim();

  let doc = `# ${title}\n\n`;
  doc += `> **Platform:** ${platform} | **Topic:** ${topic} | **Difficulty:** ${difficulty}\n`;
  doc += `> **Time Complexity:** ${timeComplexity} | **Space Complexity:** ${spaceComplexity}\n`;
  if (problem.link) {
    doc += `> **Problem Link:** [${problem.link}](${problem.link})\n`;
  }
  doc += `\n---\n\n`;

  if (notes) {
    doc += `## Approach & Intuition\n\n${notes}\n\n`;
  }

  if (conceptMaps.length > 0) {
    doc += `## Architecture & Algorithm Diagrams\n\n`;
    for (const map of conceptMaps) {
      doc += `### ${map.title || "Diagram"}\n\n`;
      doc += `![${map.caption || map.title}](${map.url})\n\n`;
    }
  }

  if (code) {
    doc += `## Solution Implementation (${language})\n\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  }

  return doc;
}

// ----------------------------------------------------------------------------
// Curated DSA Algorithm SVG Diagram Presets
// ----------------------------------------------------------------------------

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const CURATED_DSA_PRESETS: ConceptMapPreset[] = [
  {
    id: "dsa-two-pointers",
    title: "Two Pointers Convergence",
    category: "Two Pointers",
    description: "Sorted array left/right pointer convergence with sum invariant.",
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" width="100%" height="100%">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B1620" />
            <stop offset="100%" stop-color="#14232E" />
          </linearGradient>
          <linearGradient id="primaryG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1F7A8C" />
            <stop offset="100%" stop-color="#4FB3C8" />
          </linearGradient>
        </defs>
        <rect width="900" height="500" rx="20" fill="url(#bg)" stroke="#1A2E40" stroke-width="2"/>
        <text x="450" y="45" text-anchor="middle" fill="#E6EEF3" font-size="20" font-family="system-ui, sans-serif" font-weight="700">Two Pointers Convergence Blueprint</text>
        <text x="450" y="70" text-anchor="middle" fill="#8FA3B0" font-size="12" font-family="system-ui, sans-serif">Array is sorted: arr[L] + arr[R] compared against target</text>

        <!-- Array Elements -->
        <g transform="translate(100, 150)">
          <!-- Cell 0 -->
          <rect x="0" y="0" width="80" height="70" rx="10" fill="#122231" stroke="#4FB3C8" stroke-width="2"/>
          <text x="40" y="42" text-anchor="middle" fill="#4FB3C8" font-size="20" font-weight="bold" font-family="monospace">2</text>
          <text x="40" y="95" text-anchor="middle" fill="#4FB3C8" font-size="13" font-family="monospace" font-weight="bold">L (Left)</text>
          <path d="M 40,80 L 40,72" stroke="#4FB3C8" stroke-width="2" marker-end="url(#arrow)"/>

          <!-- Cell 1 -->
          <rect x="100" y="0" width="80" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="2"/>
          <text x="140" y="42" text-anchor="middle" fill="#E6EEF3" font-size="20" font-weight="bold" font-family="monospace">7</text>

          <!-- Cell 2 -->
          <rect x="200" y="0" width="80" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="2"/>
          <text x="240" y="42" text-anchor="middle" fill="#E6EEF3" font-size="20" font-weight="bold" font-family="monospace">11</text>

          <!-- Cell 3 -->
          <rect x="300" y="0" width="80" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="2"/>
          <text x="340" y="42" text-anchor="middle" fill="#E6EEF3" font-size="20" font-weight="bold" font-family="monospace">15</text>

          <!-- Cell 4 -->
          <rect x="400" y="0" width="80" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="2"/>
          <text x="440" y="42" text-anchor="middle" fill="#E6EEF3" font-size="20" font-weight="bold" font-family="monospace">20</text>

          <!-- Cell 5 -->
          <rect x="500" y="0" width="80" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="2"/>
          <text x="540" y="42" text-anchor="middle" fill="#E6EEF3" font-size="20" font-weight="bold" font-family="monospace">24</text>

          <!-- Cell 6 (Right) -->
          <rect x="600" y="0" width="80" height="70" rx="10" fill="#122231" stroke="#E8B26A" stroke-width="2"/>
          <text x="640" y="42" text-anchor="middle" fill="#E8B26A" font-size="20" font-weight="bold" font-family="monospace">30</text>
          <text x="640" y="95" text-anchor="middle" fill="#E8B26A" font-size="13" font-family="monospace" font-weight="bold">R (Right)</text>
        </g>

        <!-- Invariant Rules Box -->
        <g transform="translate(100, 290)">
          <rect width="700" height="150" rx="12" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="25" y="35" fill="#4FB3C8" font-size="14" font-weight="bold" font-family="system-ui, sans-serif">Pointer Transition Rules (O(N) Time, O(1) Space):</text>
          <text x="25" y="70" fill="#E6EEF3" font-size="13" font-family="system-ui, sans-serif">1. If sum &lt; target: Increment L++ (need a larger value since array is monotonically sorted)</text>
          <text x="25" y="100" fill="#E6EEF3" font-size="13" font-family="system-ui, sans-serif">2. If sum &gt; target: Decrement R-- (need a smaller value to reduce sum)</text>
          <text x="25" y="130" fill="#2E9E6B" font-size="13" font-weight="bold" font-family="system-ui, sans-serif">3. If sum == target: Return indices [L, R] (optimal pair located)</text>
        </g>
      </svg>
    `),
  },
  {
    id: "dsa-sliding-window",
    title: "Dynamic Sliding Window Invariant",
    category: "Sliding Window",
    description: "Expand right to satisfy constraint, shrink left to optimize window.",
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" width="100%" height="100%">
        <rect width="900" height="500" rx="20" fill="#0B1620" stroke="#1A2E40" stroke-width="2"/>
        <text x="450" y="45" text-anchor="middle" fill="#E6EEF3" font-size="20" font-family="system-ui, sans-serif" font-weight="700">Dynamic Sliding Window Pattern</text>
        <text x="450" y="70" text-anchor="middle" fill="#8FA3B0" font-size="12" font-family="system-ui, sans-serif">Subarray / substring window with monotonic pointer advancement</text>

        <!-- Window Visual -->
        <g transform="translate(100, 130)">
          <rect x="160" y="-15" width="370" height="100" rx="16" fill="rgba(31, 122, 140, 0.15)" stroke="#4FB3C8" stroke-width="2" stroke-dasharray="6,6"/>
          <text x="345" y="-25" text-anchor="middle" fill="#4FB3C8" font-size="12" font-weight="bold" font-family="monospace">ACTIVE VALID WINDOW [L...R]</text>

          <g transform="translate(0, 0)">
            <rect x="0" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
            <text x="32" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">A</text>

            <rect x="85" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
            <text x="117" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">B</text>

            <rect x="170" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#4FB3C8" stroke-width="2"/>
            <text x="202" y="42" text-anchor="middle" fill="#4FB3C8" font-size="18" font-weight="bold" font-family="monospace">C</text>
            <text x="202" y="105" text-anchor="middle" fill="#4FB3C8" font-size="13" font-family="monospace" font-weight="bold">L</text>

            <rect x="255" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#4FB3C8" stroke-width="1.5"/>
            <text x="287" y="42" text-anchor="middle" fill="#E6EEF3" font-size="18" font-family="monospace">A</text>

            <rect x="340" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#4FB3C8" stroke-width="1.5"/>
            <text x="372" y="42" text-anchor="middle" fill="#E6EEF3" font-size="18" font-family="monospace">B</text>

            <rect x="425" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#E8B26A" stroke-width="2"/>
            <text x="457" y="42" text-anchor="middle" fill="#E8B26A" font-size="18" font-weight="bold" font-family="monospace">D</text>
            <text x="457" y="105" text-anchor="middle" fill="#E8B26A" font-size="13" font-family="monospace" font-weight="bold">R</text>

            <rect x="510" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
            <text x="542" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">C</text>

            <rect x="595" y="0" width="65" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
            <text x="627" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">E</text>
          </g>
        </g>

        <!-- Template Card -->
        <g transform="translate(100, 275)">
          <rect width="700" height="170" rx="12" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="25" y="30" fill="#E8B26A" font-size="13" font-family="monospace" font-weight="bold">Standard Template (O(N) Amortized Time):</text>
          <text x="25" y="60" fill="#8FA3B0" font-size="12" font-family="monospace">int l = 0, maxLen = 0;</text>
          <text x="25" y="85" fill="#8FA3B0" font-size="12" font-family="monospace">for (int r = 0; r &lt; n; r++) {</text>
          <text x="45" y="110" fill="#8FA3B0" font-size="12" font-family="monospace">add(nums[r]); // Expand right boundary</text>
          <text x="45" y="130" fill="#8FA3B0" font-size="12" font-family="monospace">while (invalid()) remove(nums[l++]); // Contract left until valid</text>
          <text x="45" y="150" fill="#2E9E6B" font-size="12" font-family="monospace">maxLen = Math.max(maxLen, r - l + 1);</text>
          <text x="25" y="165" fill="#8FA3B0" font-size="12" font-family="monospace">}</text>
        </g>
      </svg>
    `),
  },
  {
    id: "dsa-binary-search",
    title: "Binary Search Invariant Boundary",
    category: "Binary Search",
    description: "Search space halving with inclusive [L, R] boundaries.",
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" width="100%" height="100%">
        <rect width="900" height="500" rx="20" fill="#0B1620" stroke="#1A2E40" stroke-width="2"/>
        <text x="450" y="45" text-anchor="middle" fill="#E6EEF3" font-size="20" font-family="system-ui, sans-serif" font-weight="700">Binary Search Invariant Space</text>
        <text x="450" y="70" text-anchor="middle" fill="#8FA3B0" font-size="12" font-family="system-ui, sans-serif">O(log N) Search space halving: mid = L + (R - L) / 2</text>

        <!-- Array Split -->
        <g transform="translate(100, 140)">
          <!-- Left boundary -->
          <rect x="0" y="0" width="75" height="70" rx="10" fill="#122231" stroke="#4FB3C8" stroke-width="2"/>
          <text x="37" y="42" text-anchor="middle" fill="#4FB3C8" font-size="18" font-weight="bold" font-family="monospace">1</text>
          <text x="37" y="100" text-anchor="middle" fill="#4FB3C8" font-size="13" font-family="monospace" font-weight="bold">L=0</text>

          <rect x="90" y="0" width="75" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="127" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">3</text>

          <rect x="180" y="0" width="75" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="217" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">8</text>

          <!-- Mid point -->
          <rect x="270" y="0" width="85" height="70" rx="10" fill="rgba(232, 178, 106, 0.15)" stroke="#E8B26A" stroke-width="2.5"/>
          <text x="312" y="42" text-anchor="middle" fill="#E8B26A" font-size="20" font-weight="bold" font-family="monospace">14</text>
          <text x="312" y="100" text-anchor="middle" fill="#E8B26A" font-size="13" font-family="monospace" font-weight="bold">MID=3</text>

          <rect x="370" y="0" width="75" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="407" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">22</text>

          <rect x="460" y="0" width="75" height="70" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="497" y="42" text-anchor="middle" fill="#8FA3B0" font-size="18" font-family="monospace">35</text>

          <!-- Right boundary -->
          <rect x="550" y="0" width="75" height="70" rx="10" fill="#122231" stroke="#4FB3C8" stroke-width="2"/>
          <text x="587" y="42" text-anchor="middle" fill="#4FB3C8" font-size="18" font-weight="bold" font-family="monospace">49</text>
          <text x="587" y="100" text-anchor="middle" fill="#4FB3C8" font-size="13" font-family="monospace" font-weight="bold">R=6</text>
        </g>

        <!-- Boundary Invariant Rules -->
        <g transform="translate(100, 280)">
          <rect width="700" height="160" rx="12" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="25" y="32" fill="#4FB3C8" font-size="14" font-weight="bold" font-family="system-ui, sans-serif">Overflow-Safe Calculation & Invariant:</text>
          <text x="25" y="65" fill="#E6EEF3" font-size="13" font-family="monospace">int mid = l + (r - l) / 2; // Prevents integer overflow</text>
          <text x="25" y="95" fill="#8FA3B0" font-size="13" font-family="system-ui, sans-serif">If arr[mid] &lt; target: Search right half -> l = mid + 1</text>
          <text x="25" y="125" fill="#8FA3B0" font-size="13" font-family="system-ui, sans-serif">If arr[mid] &gt; target: Search left half -> r = mid - 1</text>
          <text x="25" y="150" fill="#2E9E6B" font-size="13" font-weight="bold" font-family="system-ui, sans-serif">Loop condition: while (l &lt;= r) guarantees all elements are verified</text>
        </g>
      </svg>
    `),
  },
  {
    id: "dsa-monotonic-stack",
    title: "Monotonic Stack (Next Greater Element)",
    category: "Stack",
    description: "Monotonically decreasing stack storing unresolved element indices.",
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" width="100%" height="100%">
        <rect width="900" height="500" rx="20" fill="#0B1620" stroke="#1A2E40" stroke-width="2"/>
        <text x="450" y="45" text-anchor="middle" fill="#E6EEF3" font-size="20" font-family="system-ui, sans-serif" font-weight="700">Monotonic Stack Pattern (O(N) Time)</text>
        <text x="450" y="70" text-anchor="middle" fill="#8FA3B0" font-size="12" font-family="system-ui, sans-serif">Each element pushed and popped at most once</text>

        <!-- Stack Container -->
        <g transform="translate(140, 130)">
          <path d="M 0,0 L 0,160 L 140,160 L 140,0" fill="none" stroke="#4FB3C8" stroke-width="3" stroke-linecap="round"/>
          <text x="70" y="190" text-anchor="middle" fill="#4FB3C8" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">Stack (Indices)</text>

          <!-- Stack items -->
          <rect x="15" y="115" width="110" height="35" rx="6" fill="#1F7A8C" stroke="#4FB3C8" stroke-width="1.5"/>
          <text x="70" y="138" text-anchor="middle" fill="#FFF" font-size="14" font-mono font-weight="bold">idx: 0 (val: 7)</text>

          <rect x="15" y="70" width="110" height="35" rx="6" fill="#1F7A8C" stroke="#4FB3C8" stroke-width="1.5"/>
          <text x="70" y="93" text-anchor="middle" fill="#FFF" font-size="14" font-mono font-weight="bold">idx: 1 (val: 3)</text>

          <rect x="15" y="25" width="110" height="35" rx="6" fill="#1F7A8C" stroke="#4FB3C8" stroke-width="1.5"/>
          <text x="70" y="48" text-anchor="middle" fill="#FFF" font-size="14" font-mono font-weight="bold">idx: 2 (val: 1)</text>
        </g>

        <!-- Current Incoming Element -->
        <g transform="translate(340, 150)">
          <rect width="130" height="70" rx="12" fill="rgba(232, 178, 106, 0.15)" stroke="#E8B26A" stroke-width="2"/>
          <text x="65" y="32" text-anchor="middle" fill="#8FA3B0" font-size="11" font-family="system-ui, sans-serif">Incoming element:</text>
          <text x="65" y="58" text-anchor="middle" fill="#E8B26A" font-size="20" font-weight="bold" font-family="monospace">val: 4</text>
        </g>

        <!-- Pop Decision -->
        <g transform="translate(510, 130)">
          <rect width="260" height="160" rx="12" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
          <text x="20" y="35" fill="#E6EEF3" font-size="13" font-weight="bold" font-family="system-ui, sans-serif">Stack Resolution Action:</text>
          <text x="20" y="65" fill="#D1495B" font-size="12" font-family="system-ui, sans-serif">1. 4 &gt; 1 -> Pop idx 2. Result[2] = 4</text>
          <text x="20" y="95" fill="#D1495B" font-size="12" font-family="system-ui, sans-serif">2. 4 &gt; 3 -> Pop idx 1. Result[1] = 4</text>
          <text x="20" y="125" fill="#2E9E6B" font-size="12" font-family="system-ui, sans-serif">3. 4 &lt; 7 -> Stop popping.</text>
          <text x="20" y="145" fill="#4FB3C8" font-size="12" font-weight="bold" font-family="system-ui, sans-serif">4. Push idx 3 (val 4) onto stack.</text>
        </g>
      </svg>
    `),
  },
];

export const DSA_CONCEPT_MAP_PRESETS = CURATED_DSA_PRESETS;
