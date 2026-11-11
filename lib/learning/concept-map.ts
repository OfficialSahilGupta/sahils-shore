// ============================================================================
// Sahil's Shore: Concept Map & Visual Diagram Engine for Study Notes
// Enables developers to attach detailed concept maps, architecture blueprints,
// and system flowcharts to their study notes via file upload, clipboard paste,
// image URLs, or built-in engineering architecture SVG blueprints.
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized colors, and WCAG AA contrast.
// ============================================================================

export interface ConceptMapImage {
  caption: string;
  url: string;
  id?: string;
}

export interface ConceptMapPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  svgDataUrl: string;
}

/**
 * Prepares an image file (PNG, JPG, SVG, WebP) into a high-res, optimized data URL
 * suited for complex architecture diagrams and detailed concept maps.
 * SVGs are preserved as vector data URLs to keep text and arrows razor sharp.
 */
export async function prepareConceptMapImage(
  file: File,
  maxDimension = 1800
): Promise<{ dataUrl: string; caption: string; width: number; height: number }> {
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  const caption = cleanName ? `Concept Map: ${cleanName}` : "Architecture Concept Map";

  // 1. Preserve vector SVGs without lossy rasterization
  if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const svgContent = reader.result as string;
        resolve({
          dataUrl: svgContent,
          caption,
          width: 1200,
          height: 800,
        });
      };
      reader.onerror = () => reject(new Error("Failed to read SVG file."));
      reader.readAsDataURL(file);
    });
  }

  // 2. High-res canvas compression for raster images (PNG, JPEG, WebP)
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: origW, naturalHeight: origH } = img;

      let targetW = origW;
      let targetH = origH;

      if (origW > origH && origW > maxDimension) {
        targetW = maxDimension;
        targetH = Math.round((origH * maxDimension) / origW);
      } else if (origH > maxDimension) {
        targetH = maxDimension;
        targetW = Math.round((origW * maxDimension) / origH);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback to FileReader
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            dataUrl: reader.result as string,
            caption,
            width: origW,
            height: origH,
          });
        reader.onerror = () => reject(new Error("Failed to read image."));
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Use WebP with 0.88 quality for sharp diagram lines & text
      const dataUrl = canvas.toDataURL("image/webp", 0.88);
      resolve({
        dataUrl,
        caption,
        width: targetW,
        height: targetH,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image file."));
    };

    img.src = objectUrl;
  });
}

/**
 * Extracts all markdown image tags `![alt](url)` from notes content.
 */
export function extractConceptMapsFromMarkdown(markdown?: string | null): ConceptMapImage[] {
  if (!markdown) return [];

  const results: ConceptMapImage[] = [];
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const rawCaption = match[1]?.trim() || "Concept Map Diagram";
    const rawUrl = match[2]?.trim() || "";
    if (rawUrl) {
      results.push({
        caption: rawCaption,
        url: rawUrl,
        id: `img-${results.length}-${rawCaption.slice(0, 16)}`,
      });
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// Curated Architecture Concept Map Presets (Vector SVG Blueprints)
// ----------------------------------------------------------------------------

function createSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

const SPRING_BOOT_REQUEST_LIFECYCLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 360" width="100%" height="100%">
  <rect width="1000" height="360" fill="#0E1726" rx="16"/>
  <text x="30" y="42" fill="#4FB3C8" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Spring Boot Request Processing & Filter Chain Lifecycle</text>
  <text x="30" y="66" fill="#8FA3B0" font-family="system-ui, sans-serif" font-size="12">Client HTTP Request -> Servlet Container -> DispatcherServlet -> Controller -> Persistence</text>

  <!-- Step 1: Client -->
  <g transform="translate(30, 110)">
    <rect width="120" height="90" rx="12" fill="#1A2E40" stroke="#4FB3C8" stroke-width="2"/>
    <text x="60" y="40" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Client HTTP</text>
    <text x="60" y="62" fill="#8FA3B0" font-family="monospace" font-size="11" text-anchor="middle">GET /api/v1/res</text>
  </g>

  <!-- Arrow 1 -->
  <path d="M 155 155 L 185 155" stroke="#4FB3C8" stroke-width="2" marker-end="url(#arr)"/>

  <!-- Step 2: Filter Chain -->
  <g transform="translate(190, 110)">
    <rect width="140" height="90" rx="12" fill="#1A2E40" stroke="#E0A458" stroke-width="2"/>
    <text x="70" y="35" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Security Filter</text>
    <text x="70" y="55" fill="#E0A458" font-family="monospace" font-size="10" text-anchor="middle">OncePerRequest</text>
    <text x="70" y="73" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">JWT Auth Header</text>
  </g>

  <!-- Arrow 2 -->
  <path d="M 335 155 L 365 155" stroke="#4FB3C8" stroke-width="2"/>

  <!-- Step 3: DispatcherServlet -->
  <g transform="translate(370, 95)">
    <rect width="150" height="120" rx="12" fill="#1D4558" stroke="#4FB3C8" stroke-width="2.5"/>
    <text x="75" y="35" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">DispatcherServlet</text>
    <text x="75" y="58" fill="#4FB3C8" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Front Controller</text>
    <line x1="15" y1="70" x2="135" y2="70" stroke="#4FB3C8" stroke-opacity="0.3"/>
    <text x="75" y="90" fill="#E6EEF3" font-family="monospace" font-size="10" text-anchor="middle">HandlerMapping</text>
    <text x="75" y="106" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">HandlerAdapter</text>
  </g>

  <!-- Arrow 3 -->
  <path d="M 525 155 L 555 155" stroke="#4FB3C8" stroke-width="2"/>

  <!-- Step 4: Controller -->
  <g transform="translate(560, 110)">
    <rect width="125" height="90" rx="12" fill="#1A2E40" stroke="#2E9E6B" stroke-width="2"/>
    <text x="62" y="38" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">@RestController</text>
    <text x="62" y="60" fill="#2E9E6B" font-family="monospace" font-size="10" text-anchor="middle">@GetMapping</text>
    <text x="62" y="76" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">DTO Binding</text>
  </g>

  <!-- Arrow 4 -->
  <path d="M 690 155 L 720 155" stroke="#4FB3C8" stroke-width="2"/>

  <!-- Step 5: Service -->
  <g transform="translate(725, 110)">
    <rect width="115" height="90" rx="12" fill="#1A2E40" stroke="#4FB3C8" stroke-width="2"/>
    <text x="57" y="38" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">@Service</text>
    <text x="57" y="60" fill="#E0A458" font-family="monospace" font-size="10" text-anchor="middle">@Transactional</text>
    <text x="57" y="76" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">Business Logic</text>
  </g>

  <!-- Arrow 5 -->
  <path d="M 845 155 L 870 155" stroke="#4FB3C8" stroke-width="2"/>

  <!-- Step 6: Repo & DB -->
  <g transform="translate(875, 105)">
    <rect width="105" height="100" rx="12" fill="#1A2E40" stroke="#4FB3C8" stroke-width="2"/>
    <text x="52" y="32" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">Repository</text>
    <text x="52" y="52" fill="#4FB3C8" font-family="monospace" font-size="10" text-anchor="middle">Spring Data</text>
    <line x1="12" y1="62" x2="93" y2="62" stroke="#4FB3C8" stroke-opacity="0.3"/>
    <text x="52" y="80" fill="#2E9E6B" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">PostgreSQL</text>
  </g>

  <!-- Bottom Trade-offs pill strip -->
  <rect x="30" y="275" width="940" height="50" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
  <text x="45" y="305" fill="#4FB3C8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Key Architectural Invariants:</text>
  <text x="260" y="305" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="12">1. Filters run outside Spring Context • 2. Controller is stateless singleton • 3. Service handles transaction boundaries</text>
</svg>
`;

const MERN_STACK_DATA_FLOW_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 360" width="100%" height="100%">
  <rect width="1000" height="360" fill="#0B1620" rx="16"/>
  <text x="30" y="42" fill="#4FB3C8" font-family="system-ui, sans-serif" font-size="18" font-weight="700">MERN & Next.js Architecture Data & Authentication Flow</text>
  <text x="30" y="66" fill="#8FA3B0" font-family="system-ui, sans-serif" font-size="12">React Client -> SSR / Server Actions -> Express API -> Middleware -> MongoDB ODM</text>

  <!-- 1. Next.js / React -->
  <g transform="translate(30, 105)">
    <rect width="170" height="110" rx="12" fill="#122231" stroke="#4FB3C8" stroke-width="2"/>
    <text x="85" y="36" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">Next.js 14 / React</text>
    <text x="85" y="58" fill="#4FB3C8" font-family="monospace" font-size="11" text-anchor="middle">Client Component</text>
    <text x="85" y="78" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">TanStack / SWR Cache</text>
    <text x="85" y="96" fill="#2E9E6B" font-family="monospace" font-size="10" text-anchor="middle">Optimistic Update</text>
  </g>

  <!-- Arrow -->
  <path d="M 205 160 L 255 160" stroke="#4FB3C8" stroke-width="2"/>

  <!-- 2. Auth Gateway -->
  <g transform="translate(260, 105)">
    <rect width="170" height="110" rx="12" fill="#122231" stroke="#E0A458" stroke-width="2"/>
    <text x="85" y="36" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">Auth Middleware</text>
    <text x="85" y="58" fill="#E0A458" font-family="monospace" font-size="11" text-anchor="middle">verifyToken(JWT)</text>
    <text x="85" y="78" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">Bearer Token Header</text>
    <text x="85" y="96" fill="#D1495B" font-family="monospace" font-size="10" text-anchor="middle">401 Unauthorized</text>
  </g>

  <!-- Arrow -->
  <path d="M 435 160 L 485 160" stroke="#4FB3C8" stroke-width="2"/>

  <!-- 3. Express Controller -->
  <g transform="translate(490, 105)">
    <rect width="180" height="110" rx="12" fill="#122231" stroke="#4FB3C8" stroke-width="2"/>
    <text x="90" y="36" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">Express / Node.js</text>
    <text x="90" y="58" fill="#4FB3C8" font-family="monospace" font-size="11" text-anchor="middle">asyncHandler(req, res)</text>
    <text x="90" y="78" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">Zod / Joi Validation</text>
    <text x="90" y="96" fill="#2E9E6B" font-family="monospace" font-size="10" text-anchor="middle">Business Layer</text>
  </g>

  <!-- Arrow -->
  <path d="M 675 160 L 725 160" stroke="#4FB3C8" stroke-width="2"/>

  <!-- 4. MongoDB -->
  <g transform="translate(730, 100)">
    <rect width="230" height="120" rx="12" fill="#1D4558" stroke="#2E9E6B" stroke-width="2.5"/>
    <text x="115" y="36" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">MongoDB + Mongoose</text>
    <text x="115" y="58" fill="#2E9E6B" font-family="monospace" font-size="11" text-anchor="middle">Schema & Indexing</text>
    <line x1="20" y1="70" x2="210" y2="70" stroke="#4FB3C8" stroke-opacity="0.3"/>
    <text x="115" y="90" fill="#E6EEF3" font-family="monospace" font-size="10" text-anchor="middle">Compound Indexes (user_id, date)</text>
    <text x="115" y="106" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">Replica Set • WiredTiger Engine</text>
  </g>

  <!-- Bottom Tip Banner -->
  <rect x="30" y="275" width="930" height="50" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
  <text x="45" y="305" fill="#4FB3C8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Production Gotchas:</text>
  <text x="180" y="305" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="12">Always use connection pooling in serverless • Avoid unbounded .find() • Hash passwords with bcrypt work-factor >= 12</text>
</svg>
`;

const MICROSERVICES_EVENT_DRIVEN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 360" width="100%" height="100%">
  <rect width="1000" height="360" fill="#0B1620" rx="16"/>
  <text x="30" y="42" fill="#E0A458" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Microservices Event-Driven & Transactional Outbox Blueprint</text>
  <text x="30" y="66" fill="#8FA3B0" font-family="system-ui, sans-serif" font-size="12">Reliable distributed messaging without two-phase commit (2PC) bottlenecks</text>

  <!-- Service A -->
  <g transform="translate(30, 100)">
    <rect width="240" height="130" rx="12" fill="#122231" stroke="#4FB3C8" stroke-width="2"/>
    <text x="120" y="32" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">Order Service (Producer)</text>
    <rect x="15" y="45" width="100" height="30" rx="6" fill="#1A2E40"/>
    <text x="65" y="65" fill="#4FB3C8" font-family="monospace" font-size="10" text-anchor="middle">orders table</text>
    <rect x="125" y="45" width="100" height="30" rx="6" fill="#1A2E40" stroke="#E0A458" stroke-width="1.5"/>
    <text x="175" y="65" fill="#E0A458" font-family="monospace" font-size="10" text-anchor="middle">outbox table</text>
    <text x="120" y="105" fill="#2E9E6B" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Atomic DB Transaction</text>
  </g>

  <!-- Outbox to Broker Arrow -->
  <path d="M 275 165 L 350 165" stroke="#E0A458" stroke-width="2"/>

  <!-- CDC / Broker -->
  <g transform="translate(355, 95)">
    <rect width="250" height="140" rx="12" fill="#1D4558" stroke="#E0A458" stroke-width="2.5"/>
    <text x="125" y="35" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">Apache Kafka / Debezium</text>
    <text x="125" y="58" fill="#E0A458" font-family="monospace" font-size="11" text-anchor="middle">topic: order.created.v1</text>
    <line x1="20" y1="70" x2="230" y2="70" stroke="#4FB3C8" stroke-opacity="0.3"/>
    <text x="125" y="92" fill="#E6EEF3" font-family="monospace" font-size="10" text-anchor="middle">Partitioned by order_id (ordering)</text>
    <text x="125" y="112" fill="#8FA3B0" font-family="monospace" font-size="10" text-anchor="middle">At-least-once delivery guarantee</text>
  </g>

  <!-- Broker to Service B Arrow -->
  <path d="M 610 165 L 685 165" stroke="#4FB3C8" stroke-width="2"/>

  <!-- Service B -->
  <g transform="translate(690, 100)">
    <rect width="270" height="130" rx="12" fill="#122231" stroke="#2E9E6B" stroke-width="2"/>
    <text x="135" y="32" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">Payment / Inventory (Consumer)</text>
    <text x="135" y="58" fill="#2E9E6B" font-family="monospace" font-size="11" text-anchor="middle">Consumer Group: payment-svc</text>
    <rect x="20" y="70" width="230" height="40" rx="6" fill="#1A2E40" stroke="#2E9E6B" stroke-width="1.5"/>
    <text x="135" y="95" fill="#E6EEF3" font-family="monospace" font-size="10" text-anchor="middle">Idempotent Consumer (processed_events)</text>
  </g>

  <!-- Bottom Strip -->
  <rect x="30" y="275" width="930" height="50" rx="10" fill="#122231" stroke="#1A2E40" stroke-width="1.5"/>
  <text x="45" y="305" fill="#E0A458" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Interview Invariant:</text>
  <text x="185" y="305" fill="#E6EEF3" font-family="system-ui, sans-serif" font-size="12">Dual-write problem solved via Outbox Table. Consumers MUST be idempotent using unique idempotency keys.</text>
</svg>
`;

export const CURATED_CONCEPT_MAP_PRESETS: ConceptMapPreset[] = [
  {
    id: "spring-request-lifecycle",
    title: "Spring Boot Request & Filter Chain Lifecycle",
    category: "Java / Spring Boot",
    description: "Detailed trace from client HTTP through Security Filters, DispatcherServlet, HandlerAdapter to Persistence.",
    svgDataUrl: createSvgDataUrl(SPRING_BOOT_REQUEST_LIFECYCLE_SVG),
  },
  {
    id: "mern-data-flow",
    title: "MERN Stack Data & Auth Flow",
    category: "Full-Stack Web",
    description: "Complete flow: Next.js Client, JWT Middleware, Express Router, Controller, and MongoDB Compound Indexing.",
    svgDataUrl: createSvgDataUrl(MERN_STACK_DATA_FLOW_SVG),
  },
  {
    id: "microservices-outbox",
    title: "Transactional Outbox & Event-Driven Blueprint",
    category: "System Design",
    description: "Distributed transactions without 2PC: Orders Table + Outbox Table, Kafka Partitioning, and Idempotent Consumers.",
    svgDataUrl: createSvgDataUrl(MICROSERVICES_EVENT_DRIVEN_SVG),
  },
];
