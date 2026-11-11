import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractConceptMapsFromMarkdown,
  sanitizeNotesExtractingImages,
  parseTopicConceptMaps,
  CURATED_CONCEPT_MAP_PRESETS,
  formatImageFileSize,
} from "../lib/learning/concept-map.ts";
import { packTopicSubSections, parseTopicSubSections } from "../lib/learning/index.ts";

describe("Concept Map & Visual Diagrams Engine", () => {
  it("extracts single concept map image from markdown correctly", () => {
    const md = `# Spring Boot Architecture\n\n![Concept Map: Request Pipeline](https://example.com/spring.png)\n\nCore notes here.`;
    const maps = extractConceptMapsFromMarkdown(md);

    assert.equal(maps.length, 1);
    assert.equal(maps[0].caption, "Concept Map: Request Pipeline");
    assert.equal(maps[0].url, "https://example.com/spring.png");
  });

  it("extracts multiple concept maps and handles SVG data URLs", () => {
    const md = `
# System Design
![Concept Map: Kafka Partitioning](data:image/svg+xml;utf8,<svg>test</svg>)
Some detailed text.
![Concept Map: Redis Cache Aside](https://cdn.example.com/cache.webp)
`;
    const maps = extractConceptMapsFromMarkdown(md);

    assert.equal(maps.length, 2);
    assert.equal(maps[0].caption, "Concept Map: Kafka Partitioning");
    assert.ok(maps[0].url.startsWith("data:image/svg+xml"));
    assert.equal(maps[1].caption, "Concept Map: Redis Cache Aside");
    assert.equal(maps[1].url, "https://cdn.example.com/cache.webp");
  });

  it("returns empty array when no images exist in markdown", () => {
    const md = `# Regular Markdown\n- Bullet 1\n- Bullet 2\n[Link text](https://example.com)`;
    const maps = extractConceptMapsFromMarkdown(md);
    assert.deepEqual(maps, []);
  });

  it("handles null and undefined markdown gracefully", () => {
    assert.deepEqual(extractConceptMapsFromMarkdown(null), []);
    assert.deepEqual(extractConceptMapsFromMarkdown(undefined), []);
    assert.deepEqual(extractConceptMapsFromMarkdown(""), []);
  });

  it("sanitizes markdown notes by stripping huge base64 strings and extracting concept maps", () => {
    const hugeBase64 = "data:image/webp;base64,UklGRhDqAABXRUJQVlA4WAoAAAAgAAAACQUAWwMASUNDUMgBAAAAAAHIAAAAAA";
    const dirtyNotes = `# Client Server Architecture

![Concept Map: Client Server Architecture](${hugeBase64})

### Overview
In this architecture, clients send HTTP requests to the upstream server.
`;

    const { cleanNotes, extractedMaps } = sanitizeNotesExtractingImages(dirtyNotes);

    // Markdown text must NOT contain base64 characters
    assert.ok(!cleanNotes.includes("data:image/webp;base64"));
    assert.ok(!cleanNotes.includes("![Concept Map:"));
    assert.ok(cleanNotes.includes("# Client Server Architecture"));
    assert.ok(cleanNotes.includes("In this architecture, clients send HTTP requests"));

    // Extracted maps must contain the image with full data URL safely preserved
    assert.equal(extractedMaps.length, 1);
    assert.equal(extractedMaps[0].caption, "Concept Map: Client Server Architecture");
    assert.equal(extractedMaps[0].url, hugeBase64);
  });

  it("parses concept maps from resources.concept_maps, subsections, and legacy notes", () => {
    const item = {
      notes: "Clean notes text.\n\n![Legacy Map](https://example.com/legacy.png)",
      resources: {
        category: "Backend",
        concept_maps: [
          {
            id: "cm-1",
            title: "Spring Request Lifecycle",
            url: "https://example.com/spring-lifecycle.png",
          },
        ],
        subsections: [
          {
            id: "sub-1",
            title: "DispatcherServlet",
            notes: "Sub notes",
            conceptMaps: [
              {
                id: "cm-sub-1",
                title: "Servlet Filter Chain",
                url: "https://example.com/filter-chain.png",
              },
            ],
          },
        ],
      },
    };

    const maps = parseTopicConceptMaps(item);
    assert.equal(maps.length, 3);
    assert.equal(maps[0].title, "Spring Request Lifecycle");
    assert.equal(maps[1].title, "Servlet Filter Chain");
    assert.equal(maps[2].title, "Legacy Map");
  });

  it("packTopicSubSections stores concept maps in resources and keeps notes pure text", () => {
    const subSections = [
      {
        id: "sub-1",
        title: "Architecture & Data Flow",
        notes: "Detailed notes on MVC.\n\n![Sub Map](data:image/webp;base64,ABCDEF123456)",
        codeSnippet: "public class App {}",
        codeLanguage: "java",
        resources: [],
      },
    ];

    const chapterMaps = [
      {
        id: "cm-chap-1",
        title: "System Blueprint",
        url: "https://example.com/system-blueprint.png",
        createdAt: new Date().toISOString(),
      },
    ];

    const { notes, resources } = packTopicSubSections(subSections, "Spring Boot", chapterMaps);

    // Synthesized markdown notes must be completely free of base64
    assert.ok(!notes.includes("data:image/webp;base64"));
    assert.ok(notes.includes("Detailed notes on MVC."));

    // Resources must contain the concept maps array
    const packedObj = resources as any;
    assert.ok(Array.isArray(packedObj.concept_maps));
    assert.equal(packedObj.concept_maps.length, 2);
    assert.equal(packedObj.concept_maps[0].title, "System Blueprint");
    assert.equal(packedObj.concept_maps[1].caption, "Sub Map");
  });

  it("curated presets contain valid SVG blueprints for core engineering stacks", () => {
    assert.ok(CURATED_CONCEPT_MAP_PRESETS.length >= 3);

    const springPreset = CURATED_CONCEPT_MAP_PRESETS.find(
      (p) => p.id === "spring-request-lifecycle"
    );
    assert.ok(springPreset, "Spring Boot preset must exist");
    assert.ok(springPreset.svgDataUrl.startsWith("data:image/svg+xml"));
    assert.ok(springPreset.title.includes("Spring Boot"));

    const mernPreset = CURATED_CONCEPT_MAP_PRESETS.find(
      (p) => p.id === "mern-data-flow"
    );
    assert.ok(mernPreset, "MERN stack preset must exist");
    assert.ok(mernPreset.svgDataUrl.startsWith("data:image/svg+xml"));

    const microservicesPreset = CURATED_CONCEPT_MAP_PRESETS.find(
      (p) => p.id === "microservices-outbox"
    );
    assert.ok(microservicesPreset, "Microservices preset must exist");
    assert.ok(microservicesPreset.svgDataUrl.startsWith("data:image/svg+xml"));
  });

  it("formats image file size into human-readable strings (B, KB, MB)", () => {
    assert.equal(formatImageFileSize(512), "512 B");
    assert.equal(formatImageFileSize(1024), "1.0 KB");
    assert.equal(formatImageFileSize(150 * 1024), "150.0 KB");
    assert.equal(formatImageFileSize(2.5 * 1024 * 1024), "2.5 MB");
  });
});
