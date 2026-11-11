import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractConceptMapsFromMarkdown,
  CURATED_CONCEPT_MAP_PRESETS,
} from "../lib/learning/concept-map.ts";

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
});
