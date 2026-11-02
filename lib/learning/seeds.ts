// ============================================================================
// Sahil's Shore: Full-Stack Learning Hub Curriculum Seeds
// Comprehensive Roadmaps, Interview Q&As, Mini-Projects, and Resources
// ============================================================================

export interface SeedRoadmapItem {
  topic: string;
  category: string;
  notes?: string;
  resources?: { title: string; url: string }[];
}

export interface SeedInterviewQa {
  technology: string;
  question: string;
  answer: string;
  difficulty: "Easy" | "Medium" | "Hard";
  confidence: number;
  tags: string[];
}

export interface SeedMiniProject {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  suggested_tech: string[];
}

export interface SeedResourceLink {
  title: string;
  url: string;
  category: "Documentation" | "Tutorial" | "Practice" | "Video";
  description: string;
}

export interface SeedTrackData {
  title: string;
  description: string;
  icon: string;
  color: string;
  slug: "spring" | "mern";
  roadmap: SeedRoadmapItem[];
  interviewQa: SeedInterviewQa[];
  miniProjects: SeedMiniProject[];
  resources: SeedResourceLink[];
}

export const SPRING_TRACK_SEED: SeedTrackData = {
  title: "Java and Spring Boot",
  description: "Enterprise Java backend engineering, Spring Boot ecosystem, Microservices, and Relational databases",
  icon: "Cpu",
  color: "#2E9E6B",
  slug: "spring",
  roadmap: [
    { topic: "Core Java", category: "Language Basics", notes: "JVM memory model (Heap, Stack, Metaspace), garbage collection algorithms (G1, ZGC), and immutability." },
    { topic: "OOP Principles & Design Patterns", category: "Software Architecture", notes: "SOLID principles, Creational (Factory, Builder, Singleton), Structural (Adapter, Decorator), Behavioral (Strategy, Observer)." },
    { topic: "Collections Framework", category: "Core Java", notes: "ArrayList vs LinkedList, HashMap internal collision handling (TreeNodes), ConcurrentHashMap, and PriorityQueue." },
    { topic: "Streams API & Lambdas", category: "Core Java", notes: "Functional interfaces (Predicate, Function, Consumer, Supplier), intermediate vs terminal operations, parallel streams." },
    { topic: "Spring Core & IoC / DI", category: "Spring Framework", notes: "ApplicationContext container, Bean lifecycle (@PostConstruct, InitializingBean), dependency injection types, and Bean scopes." },
    { topic: "Spring Boot & Auto-configuration", category: "Spring Framework", notes: "@SpringBootApplication, conditional annotations (@ConditionalOnClass, @ConditionalOnProperty), application.yml profiles, and Actuator." },
    { topic: "RESTful APIs & Spring MVC", category: "Web Services", notes: "REST conventions, @RestController, request mapping, DTO pattern with MapStruct, content negotiation, and OpenAPI 3.0." },
    { topic: "JPA / Hibernate & Spring Data JPA", category: "Persistence & Database", notes: "Entity lifecycle states, OneToMany / ManyToMany mapping, solving the N+1 problem with JOIN FETCH / EntityGraph, Spring Data repository methods." },
    { topic: "Spring Security & JWT Authentication", category: "Security", notes: "SecurityFilterChain, OncePerRequestFilter for JWT parsing, UserDetailsService, password hashing with BCrypt, role-based authorization." },
    { topic: "Request Validation & Bean Validation", category: "Web Services", notes: "@NotNull, @Size, @Pattern, custom constraint validators, validating nested DTOs with @Valid." },
    { topic: "Global Exception Handling & ProblemDetails", category: "Web Services", notes: "@RestControllerAdvice, @ExceptionHandler, RFC 7807 ProblemDetail format for consistent API error responses." },
    { topic: "Testing (JUnit 5, Mockito, MockMvc, Testcontainers)", category: "Quality Assurance", notes: "Unit testing services with Mockito (@Mock, @InjectMocks), integration testing with MockMvc and real Postgres via Testcontainers." },
    { topic: "Build Tools & Maven", category: "DevOps & Tooling", notes: "Maven lifecycle (compile, test, package), dependency management, exclusions, and multi-module parent POMs." },
    { topic: "Docker Basics for Java", category: "DevOps & Tooling", notes: "Multi-stage Dockerfile for Spring Boot with Eclipse Temurin / BellSoft Liberica distroless images and JVM cgroup memory tuning." },
    { topic: "Microservices Basics", category: "Distributed Systems", notes: "Service discovery (Eureka / Consul), API Gateway routing & rate limiting, distributed configuration (Spring Cloud Config), resilient communication (Resilience4j)." },
    { topic: "SQL & Relational Database Design", category: "Persistence & Database", notes: "Relational schema normalization, B-Tree indexes, composite indexes, transactions with ACID isolation levels, EXPLAIN ANALYZE." },
  ],
  interviewQa: [
    {
      technology: "Spring Boot",
      question: "How does Spring Boot auto-configuration work behind the scenes?",
      answer: "Spring Boot auto-configuration is driven by `@EnableAutoConfiguration` (included in `@SpringBootApplication`). It checks `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. Each auto-configuration class uses condition annotations like `@ConditionalOnClass`, `@ConditionalOnMissingBean`, and `@ConditionalOnProperty` to register default beans only if custom equivalents are not defined by the developer.",
      difficulty: "Medium",
      confidence: 4,
      tags: ["Spring Boot", "Auto-configuration", "Architecture"],
    },
    {
      technology: "JPA / Hibernate",
      question: "What causes the N+1 SELECT problem in JPA and how do you resolve it?",
      answer: "The N+1 problem occurs when fetching an entity with lazy relationships (like an Author with 10 Books). Loading N authors issues 1 query for authors and N subsequent queries to fetch each author's books. Fixes include: 1) JPQL `JOIN FETCH a.books`, 2) `@EntityGraph(attributePaths = {\"books\"})`, or 3) `@BatchSize(size = 25)` on the collection.",
      difficulty: "Hard",
      confidence: 4,
      tags: ["JPA", "Hibernate", "Performance", "SQL"],
    },
    {
      technology: "Core Java",
      question: "Explain the internal working of HashMap in Java 8+.",
      answer: "Java 8 HashMap uses an array of Node buckets. When putting an entry, `hash(key)` computes the bucket index. If collisions occur, entries form a linked list. Once a bucket's collision chain reaches `TREEIFY_THRESHOLD = 8` and table capacity is >= 64, the linked list is converted into a Red-Black Tree, improving lookup complexity from O(n) to O(log n).",
      difficulty: "Medium",
      confidence: 5,
      tags: ["Java", "Collections", "Data Structures"],
    },
    {
      technology: "Spring Security",
      question: "How does stateless JWT authentication integrate with Spring Security's SecurityFilterChain?",
      answer: "A custom `JwtAuthenticationFilter` extending `OncePerRequestFilter` extracts the `Authorization: Bearer <token>` header, verifies the signature and expiration, retrieves user details, creates an `Authentication` token (e.g., `UsernamePasswordAuthenticationToken`), and sets it in `SecurityContextHolder.getContext().setAuthentication(...)`. The session creation policy is configured as `SessionCreationPolicy.STATELESS`.",
      difficulty: "Hard",
      confidence: 3,
      tags: ["Spring Security", "JWT", "Security"],
    },
    {
      technology: "Java Concurrency",
      question: "What is the difference between `synchronized` block and `ReentrantLock`?",
      answer: "`synchronized` is implicit and managed by the JVM with automatic lock release, while `ReentrantLock` is an explicit class from `java.util.concurrent.locks`. `ReentrantLock` provides advanced features like `tryLock(timeout)`, interruptible lock acquisition, fairness policy support, and multiple `Condition` objects.",
      difficulty: "Medium",
      confidence: 3,
      tags: ["Java", "Concurrency", "Multithreading"],
    },
  ],
  miniProjects: [
    {
      title: "Production-Ready RESTful E-Commerce Catalog Service",
      description: "Build a Spring Boot service with PostgreSQL, JPA specifications for filtering, Redis caching for hot products, JWT auth, and OpenAPI documentation.",
      difficulty: "Intermediate",
      suggested_tech: ["Java 21", "Spring Boot 3", "PostgreSQL", "Redis", "Docker"],
    },
    {
      title: "Distributed Task Scheduler & Notification Engine",
      description: "An asynchronous worker service handling background jobs, retries with Exponential Backoff using Resilience4j, and email/webhook dispatching.",
      difficulty: "Intermediate",
      suggested_tech: ["Spring Boot", "RabbitMQ / Kafka", "PostgreSQL", "Testcontainers"],
    },
    {
      title: "Microservices Order & Payment Orchestration with Saga Pattern",
      description: "Implement distributed transactions across Order, Payment, and Inventory services using the Orchestrator Saga pattern, Eureka, and Spring Cloud Gateway.",
      difficulty: "Advanced",
      suggested_tech: ["Spring Cloud", "Kafka", "Docker Compose", "Postgres", "Prometheus"],
    },
    {
      title: "URL Shortener with Analytics & Rate Limiting",
      description: "Clean URL shortener with Base62 encoding, Redis Bucket4j rate limiting per IP, and click event streaming.",
      difficulty: "Beginner",
      suggested_tech: ["Spring Boot", "Redis", "H2 / PostgreSQL", "JUnit 5"],
    },
  ],
  resources: [
    {
      title: "Spring Boot Official Guides",
      url: "https://spring.io/guides",
      category: "Documentation",
      description: "Official hands-on walkthroughs for building web apps, data access, and microservices.",
    },
    {
      title: "Baeldung - Java & Spring Tutorials",
      url: "https://www.baeldung.com",
      category: "Tutorial",
      description: "In-depth reference articles covering every detail of Spring Boot, Security, JPA, and modern Java.",
    },
    {
      title: "Vlad Mihalcea - High-Performance Java Persistence",
      url: "https://vladmihalcea.com/tutorials",
      category: "Tutorial",
      description: "The gold standard for mastering Hibernate caching, batching, and query performance.",
    },
    {
      title: "Testcontainers for Java",
      url: "https://testcontainers.com/guides/getting-started-with-testcontainers-for-java",
      category: "Practice",
      description: "Learn how to run lightweight, disposable Docker instances of Postgres and Redis during tests.",
    },
  ],
};

export const MERN_TRACK_SEED: SeedTrackData = {
  title: "MERN and TypeScript",
  description: "Modern full-stack web development with MongoDB, Express, React, Node.js, Next.js, and TypeScript",
  icon: "Layers",
  color: "#4FB3C8",
  slug: "mern",
  roadmap: [
    { topic: "HTML5 & Modern CSS / Tailwind", category: "Frontend Core", notes: "Semantic markup, responsive layout systems (CSS Grid & Flexbox), CSS custom variables, and Tailwind JIT compiler." },
    { topic: "JavaScript Fundamentals", category: "Language Basics", notes: "ES6+ syntax, closures, event loop, microtask vs macrotask queue, prototypes, async/await, and promises under the hood." },
    { topic: "TypeScript Essentials", category: "Language Basics", notes: "Generics, conditional types, mapped types, discriminated unions, `keyof`/`typeof`, and strict compiler flags." },
    { topic: "React Core & Hooks", category: "Frontend Core", notes: "Virtual DOM reconciliation (Fiber), lifecycle, rules of hooks, `useMemo` & `useCallback` optimization, custom hooks." },
    { topic: "State Management", category: "Frontend Architecture", notes: "Client state with Zustand / Redux Toolkit vs server state caching with TanStack React Query or SWR." },
    { topic: "Next.js App Router", category: "Full-Stack Framework", notes: "React Server Components (RSC), streaming with Suspense, Server Actions, Route Handlers, ISR / SSG / dynamic rendering." },
    { topic: "Node.js Architecture", category: "Backend Core", notes: "Single-threaded event loop, libuv thread pool, Buffer and Stream APIs, cluster module, child processes." },
    { topic: "Express.js & Middleware", category: "Backend Core", notes: "Middleware pipeline, error propagation, request sanitization, CORS, security headers with Helmet, rate limiting." },
    { topic: "MongoDB & Mongoose", category: "Persistence & Database", notes: "Document modeling, embedding vs referencing, compound indexes, aggregation pipelines ($lookup, $group, $facet), transactions." },
    { topic: "Authentication & Authorization", category: "Security", notes: "JWT vs session cookies, HTTP-only secure cookie storage, CSRF mitigation, RBAC, OAuth2 flow." },
    { topic: "RESTful APIs & GraphQL Basics", category: "Web Services", notes: "API versioning, status codes, pagination (cursor vs offset), GraphQL schemas, resolvers, and N+1 DataLoader." },
    { topic: "Testing (Vitest, RTL, Playwright)", category: "Quality Assurance", notes: "Unit tests with Vitest, React Testing Library component tests using user-event, end-to-end integration with Playwright." },
    { topic: "Deployment & DevOps", category: "DevOps & Tooling", notes: "Docker containerization for Node.js, CI/CD with GitHub Actions, edge deployment on Vercel, production database tuning." },
  ],
  interviewQa: [
    {
      technology: "React",
      question: "Explain the React Fiber reconciliation algorithm and how concurrency works.",
      answer: "React Fiber replaces the old recursive stack reconciler with an interruptible, incremental work loop based on linked lists. Fiber nodes represent components and their virtual DOM state. Work is split into units that can be paused, prioritized, or discarded. The render phase is asynchronous and can yield to the browser for high-priority input events, while the commit phase is synchronous and applies mutations to the actual DOM.",
      difficulty: "Hard",
      confidence: 4,
      tags: ["React", "Performance", "Virtual DOM"],
    },
    {
      technology: "Next.js",
      question: "What is the difference between React Server Components (RSC) and standard Client Components?",
      answer: "Server Components execute exclusively on the server and render into an intermediate JSON format without sending their JavaScript bundle to the browser. They can directly access databases, secrets, and the filesystem with zero client bundle overhead. Client Components (`'use client'`) are pre-rendered on the server and hydrated on the client, enabling interactive state (`useState`, `useEffect`) and browser APIs.",
      difficulty: "Medium",
      confidence: 5,
      tags: ["Next.js", "React", "SSR"],
    },
    {
      technology: "Node.js",
      question: "Describe the phases of the Node.js Event Loop.",
      answer: "The event loop has six main phases executed in order: 1) Timers (`setTimeout`, `setInterval`), 2) Pending callbacks (I/O callbacks deferred to the next loop), 3) Idle/prepare (internal), 4) Poll (retrieves new I/O events and executes scripts), 5) Check (`setImmediate` callbacks), 6) Close callbacks (e.g. `socket.on('close')`). Between each phase, `process.nextTick` and microtask queues (resolved promises) drain immediately.",
      difficulty: "Hard",
      confidence: 4,
      tags: ["Node.js", "Event Loop", "Asynchronous"],
    },
    {
      technology: "TypeScript",
      question: "What are Discriminated Unions in TypeScript and why are they useful?",
      answer: "A Discriminated Union (tagged union) is a pattern where multiple types share a common literal property (the discriminant). TypeScript's type checker narrows the union inside `switch` or `if` blocks based on the discriminant value. Combined with the `never` type, it provides compile-time exhaustiveness checking.",
      difficulty: "Medium",
      confidence: 5,
      tags: ["TypeScript", "Type System"],
    },
    {
      technology: "MongoDB",
      question: "When should you embed documents vs reference them in MongoDB?",
      answer: "Embed when: 1) Data has a 'contains' 1:1 or 1:few relationship, 2) Related data is always queried together, 3) Document size won't exceed 16MB. Reference when: 1) Data has 1:many or many:many relationships that grow unboundedly, 2) Related documents are queried independently, 3) Frequently updated fields need to avoid document growth rewrites.",
      difficulty: "Medium",
      confidence: 4,
      tags: ["MongoDB", "Database", "Architecture"],
    },
  ],
  miniProjects: [
    {
      title: "Real-Time Collaborative Whiteboard / Workspace",
      description: "A collaborative canvas with canvas drawing, Liveblocks / Socket.io multi-cursor presence, and persistent MongoDB document state.",
      difficulty: "Advanced",
      suggested_tech: ["Next.js", "TypeScript", "Socket.io", "MongoDB", "Tailwind CSS"],
    },
    {
      title: "Modern Job Application Tracker with Drag-and-Drop Kanban",
      description: "A full-featured Kanban board with optimistic updates, interview reminders, resume upload to cloud storage, and stats analytics.",
      difficulty: "Intermediate",
      suggested_tech: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "@dnd-kit"],
    },
    {
      title: "Markdown Second Brain with Bidirectional [[Backlinks]]",
      description: "Interactive note-taking web app supporting graph view visualization of connected notes, full-text search, and tagging.",
      difficulty: "Intermediate",
      suggested_tech: ["Next.js", "TypeScript", "PostgreSQL / MongoDB", "Tailwind CSS"],
    },
    {
      title: "RESTful API Rate Limiter & Caching Gateway",
      description: "Express middleware package implementing Sliding Window log rate limiting with Redis and automated route response caching.",
      difficulty: "Beginner",
      suggested_tech: ["Node.js", "TypeScript", "Express", "Redis", "Jest"],
    },
  ],
  resources: [
    {
      title: "Next.js App Router Documentation",
      url: "https://nextjs.org/docs/app",
      category: "Documentation",
      description: "The definitive documentation for Server Components, Routing, Data Fetching, and Server Actions.",
    },
    {
      title: "Total TypeScript by Matt Pocock",
      url: "https://www.totaltypescript.com/tutorials",
      category: "Tutorial",
      description: "World-class TypeScript tutorials from beginner generics to advanced conditional and mapped types.",
    },
    {
      title: "React.dev Official Interactive Tutorials",
      url: "https://react.dev/learn",
      category: "Documentation",
      description: "Official modern React documentation with visual diagrams and in-browser interactive sandboxes.",
    },
    {
      title: "MongoDB University",
      url: "https://learn.mongodb.com",
      category: "Practice",
      description: "Free structured certification courses on schema design, aggregation pipelines, and indexing.",
    },
  ],
};
