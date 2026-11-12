# DESIGN.md — Architecture & Engineering Specification

## 1. Executive Summary & Vision

**Minimi** is a production-grade AI Web Research and Temporal Analysis Agent built to solve the reliability, provenance, and temporal reasoning failures common in modern generative chatbots.

Rather than relying on one giant prompt or pretending that language models alone can recall historical conversations and verify time-sensitive facts, Minimi implements a **modular, deterministic-routed, multi-engine research system**. It guarantees verifiable citations, protects against external prompt injection, maintains persistent conversation history with isolated relational storage, and executes rigorous temporal comparisons between past discussions and live web ground truth.

---

## 2. Core Architecture & Component Boundaries

The system is organized into modular services with strict boundaries:

```
[ Frontend: Next.js App Router + React + Tailwind + SSE Stream ]
                              │
                    HTTP POST /api/chat (SSE)
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                 Conversation Orchestrator                     │
│  - Event stream coordinator (status, sources, comparison, text)│
│  - Token / search budget & timeout management                 │
└───────┬─────────────────────┬───────────────────┬─────────────┘
        │                     │                   │
        ▼                     ▼                   ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ Deterministic│      │  Historical  │     │   Temporal   │
│    Intent    │      │  Retriever   │     │  Comparator  │
│  Classifier  │      │  & Resolver  │     │    Engine    │
└──────────────┘      └──────┬───────┘     └──────┬───────┘
                             │                    │
              ┌──────────────┴────────────┐       │
              ▼                           ▼       ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ Persistence Layer │       │ Web Search Engine │
    │ (Postgres/Local)  │       │ (Tavily/Brave/DDG)│
    │ Full-text + JSONB │       │ + Page Retriever  │
    └───────────────────┘       └─────────┬─────────┘
                                          │
                                          ▼
                                ┌───────────────────┐
                                │ Evidence & Proven-│
                                │ ance Sanitization │
                                └─────────┬─────────┘
                                          │
                                          ▼
                                ┌───────────────────┐
                                │   LLM Provider    │
                                │(Gemini/OpenAI/etc)│
                                └───────────────────┘
```

1. **Frontend Application**: Modern streaming interface with real-time research step visualization, interactive numeric citation pills `[1]`, `[2]`, a slide-over Source & Evidence Inspector, and structured comparison matrices.
2. **Conversation Orchestrator**: Manages workflow state, enforces search budgets, streams lifecycle updates via Server-Sent Events (`text/event-stream`), and coordinates data flow.
3. **Deterministic Intent Classifier**: Fast, non-hallucinatory routing into 6 distinct workflows: `temporal_comparison`, `historical_retrieval`, `current_web_research`, `multi_entity_comparison`, `follow_up_research`, and `general_conversation`.
4. **Persistence Layer (`IDatabaseAdapter`)**: Relational PostgreSQL schema with `pg` connection pooling, JSONB evidence snapshots, full-text search, and indexed timestamps. Includes an embedded atomic local store fallback (`.data/minimi.db.json`) for zero-friction local onboarding.
5. **Temporal Resolver & Retriever**: Natural language date window calculator (resolving "on Monday", "last Tuesday", "3 November") anchored in the user's local timezone. Executes hybrid keyword, entity, and date-window database searches.
6. **Temporal Comparison Engine**: Structured comparative engine reconciling historical evidence against fresh live search results across entities and attributes. Classifies states into `changed`, `unchanged`, `conflicting_evidence`, `unable_to_verify`, or `historical_baseline_unavailable`.
7. **Web Search & Evidence Retrieval**: Multi-provider adapter (Tavily, Brave, Serper, DuckDuckGo) with deep HTML page retrieval, metadata parsing, and prompt injection isolation tags (`<untrusted_web_evidence>`).
8. **LLM Provider Adapter (`ILLMProvider`)**: Multi-model streaming interface (Google Gemini 2.5 Flash, OpenAI GPT-4o-mini, Groq) with structured output validation via Zod.

---

## 3. Memory & Retrieval Strategy

- **Hybrid Relational Retrieval**: Prioritizes exact date-window filtering (`startDate` to `endDate` in user timezone converted to UTC) and tokenized full-text scoring (`to_tsvector` / token matches) over noisy embedding-only approaches.
- **Evidence Snapshots**: Whenever research is conducted, key numerical claims (prices, limits, dates) are extracted and persisted in `evidence_snapshots` linked to the original message, entity, attribute, source URL, and timestamp.
- **Strict Data Isolation**: All database operations partition data by `user_id`. Cross-user access is impossible at the database query level.

---

## 4. Research & Temporal Comparison Strategy

When comparing historical claims against current live data:
1. **Never Assume**: Missing current evidence is never interpreted as proof that nothing changed.
2. **Explicit Disclosures**: If no prior discussion exists, Minimi flags `historical_baseline_unavailable` and explains the lack of baseline rather than inventing historical numbers.
3. **Structured Verification Matrix**: Every entity produces a 5-tuple:
   - Historical value, date, source, quality.
   - Current value, date, source, quality.
   - Verified status (`changed`, `unchanged`, `unable_to_verify`, `conflicting_evidence`, `historical_baseline_unavailable`).
   - Audit notes and caveats.

---

## 5. Security & Threat Model

- **Zero Client-Side Keys**: API keys never reach the browser bundle. All requests flow through Next.js server-side route handlers.
- **Prompt Injection Defense**: Retrieved web content is treated as untrusted data. External snippets are strictly sandboxed inside XML boundary tags (`<untrusted_web_evidence>`) with system prompt directives forbidding external instruction overrides.
- **Safe HTML Sanitization**: `PageRetriever` scrubs `<script>`, `<style>`, `<iframe>`, `<svg>`, and event handler attributes before converting DOM text into sanitized paragraphs.

---

## 6. Alternatives Considered & Rejected

| Decision | Selected Approach | Rejected Alternative | Reason for Rejection |
| :--- | :--- | :--- | :--- |
| **Persistence** | Relational SQL + Embedded Local Fallback | Pure Vector DB (Pinecone / Chroma only) | Vector similarity alone cannot answer "What did I ask on Monday?" or exact date math; relational timestamps and entity indexing are mandatory. |
| **Agent Routing** | Deterministic Intent Classifier | ReAct / LLM-in-the-loop tool calling for every turn | LLM tool routing introduces unpredictable latency (1-3 extra LLM hops), hallucinates tool arguments, and burns unnecessary tokens on trivial greetings. |
| **Citations** | Numeric Application IDs `[1]`, `[2]` validated against session sources | LLM-generated URLs in free text | LLMs frequently hallucinate broken or dead URLs. Enforcing application-level source provenance ensures 100% of links resolve to real retrieved sites. |
| **Date Resolution** | Timezone-aware Temporal Resolver | LLM date calculation | LLMs struggle with relative calendar offsets ("last Tuesday" relative to a specific Thursday in UTC vs local time). Code-based calendar math is deterministic and bug-free. |

---

## 7. Trade-offs

1. **Precision vs. Scraping Breadth**: Minimi bounds web page retrieval to the top 1-2 pages per query with a 5000ms timeout to keep streaming response times under 3 seconds. For deeply obscured pricing gated behind enterprise sales forms, Minimi safely reports `unable_to_verify` rather than stalling.
2. **Zero-Setup Local Dev vs. PostgreSQL Exclusivity**: Primary support is built for PostgreSQL with pgvector, but an atomic file-backed adapter (`LocalDatabaseAdapter`) is bundled so developers can run `npm install && npm run dev` immediately without needing Docker or a local PostgreSQL cluster.

---

## 8. What Would Be Improved With Another Week

1. **Autonomous Headless Browser Worker**: Integrate Playwright to render single-page JavaScript applications (SPAs) that gate pricing behind interactive calculators or currency toggles.
2. **Active RSS / Webhook Change Monitoring**: Background cron jobs to periodically re-evaluate shortlisted entity pricing and alert users via push notifications when prices fluctuate.
3. **Cross-Encoder Re-Ranking**: Integrate a local re-ranker (e.g. Cohere or BGE Reranker) for ultra-dense evidence passages before passing them to the synthesis model.
4. **Export to Research Reports**: 1-click export of comparison matrices and research sessions to structured PDF, CSV, and Markdown briefs.

