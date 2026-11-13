# MINIMI — Production-Grade AI Web Research & Temporal Agent

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-26%20Passing-emerald.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

Minimi is a production-quality, modular AI research assistant built with TypeScript, Next.js, and Node.js. It features live multi-provider web search, persistent relational conversation memory, and a temporal comparison engine capable of auditing time-sensitive claims, product shifts, and pricing updates across historical discussions.
---
## Key Capabilities

- **Natural Multi-Turn Conversational AI**: Streaming Server-Sent Events (SSE) interface with markdown rendering, interactive citation pills, and context-aware follow-ups.
- **Genuine Live Web Search**: Integrated multi-provider search adapter (Tavily AI, Brave Search, Serper/Google, and DuckDuckGo fallback) with deep page HTML retrieval, metadata extraction, and timestamp provenance.
- **Historical Conversation Memory**: Timezone-aware date parsing (resolving "on Monday", "last Tuesday", "3 November") and hybrid keyword/entity retrieval across historical discussions.
- **Structured Temporal Comparison Engine**: Answers complex temporal queries (e.g. *"Has any of the five shortlisted CRM tools changed pricing since Monday?"*) with side-by-side comparative matrices, verified live evidence, and explicit disclosures when data is unverified or baselines are missing.
- **Strict Evidence Provenance & Anti-Hallucination**: Employs application-validated source IDs `[1]`, `[2]` linking strictly to real retrieved pages with exact quoted snippets. Never fabricates prices or citations.
- **Enterprise-Grade Security**: Complete server-side isolation of API keys, safe HTML sanitization, and strict prompt injection boundary defenses (`<untrusted_web_evidence>`).
- **Dual-Engine Persistence**: Primary PostgreSQL relational architecture with an automatic embedded persistent store fallback (`.data/minimi.db.json`) for seamless zero-friction local development.

---

## Architecture Overview

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

For complete architectural decisions, trade-offs, and design rationale, see [DESIGN.md](file:///Users/anupamsaha/Desktop/minimi-chat-agent/minimi-chat-agent/DESIGN.md).

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (tested on v20 and v26).
- **npm**: v9.0.0 or later.
- Optional: PostgreSQL database (Minimi automatically falls back to an embedded store if PostgreSQL is unset).

### 1. Installation

```bash
git clone https://github.com/anupam-codespace/minimi-chat-agent.git
cd minimi-chat-agent
npm install
```

### 2. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your API keys:

```env
# Persistence (Optional - falls back to .data/minimi.db.json if unset)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/minimi

# LLM Provider (gemini, openai, anthropic, or groq)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Web Search Provider (tavily, brave, serper, or duckduckgo)
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=your_tavily_api_key_here
```

> **Note**: Even if no external API keys are configured, Minimi boots cleanly using its built-in zero-key DuckDuckGo search adapter and deterministic research synthesis modes.

### 3. Seed Benchmark Scenarios

Populate the database with the pre-configured hiring challenge historical discussions:

```bash
npm run db:seed
```

This seeds:
- **Conversation 1 (Monday)**: Shortlist of 5 CRM platforms for a 20-person sales team (HubSpot, Salesforce, Pipedrive, Zoho, Close) with exact recorded prices and sources.
- **Conversation 2 (3 November)**: AI model pricing for GPT-4o mini, Gemini 1.5 Flash, and Claude 3.5 Sonnet upgrades.
- **Conversation 3 (Last Tuesday)**: Postgres hosting comparison across Supabase, Neon, AWS RDS, and Render.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Technical Hiring Challenge: Verification & Testing

Minimi is equipped with an automated test suite covering all mandatory challenge scenarios and edge cases.

### Run Automated Tests

```bash
npm test
```

### Test Scenarios Breakdown

#### TEST 1: CRM Shortlist Since Monday
- **Prompt**: `"On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"`
- **Agent Behavior**:
  1. Resolves `On Monday` to the preceding Monday calendar date.
  2. Queries conversation storage and recovers the 5 shortlisted entities: *HubSpot, Salesforce, Pipedrive, Zoho CRM, Close CRM*.
  3. Recovers historical pricing: HubSpot ($90/seat/mo), Salesforce ($165/user/mo), Pipedrive ($49/user/mo), Zoho ($40/user/mo), Close ($99/user/mo).
  4. Executes live web search for each tool's current pricing.
  5. Computes structured comparison statuses (`unchanged`, `changed`, `unable_to_verify`).
  6. Renders the interactive comparison matrix with source links and citations.

#### TEST 2: 3 November Conversation & Current Validity
- **Prompt**: `"What did I ask you on 3 November? Is your answer still correct today?"`
- **Agent Behavior**:
  1. Parses calendar date `3 November` in the user's timezone.
  2. Retrieves the historical discussion about AI API pricing (GPT-4o mini, Gemini 1.5 Flash).
  3. Verifies time-sensitive claims against live documentation.
  4. Explains what remains accurate and confirms active rate limits and pricing tiers.

#### TEST 3: Postgres Hosting Last Tuesday
- **Prompt**: `"Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"`
- **Agent Behavior**:
  1. Resolves `Last Tuesday` relative to the current calendar date.
  2. Retrieves the Postgres hosting comparison (Supabase, Neon, AWS RDS, Render).
  3. Verifies current base plan prices and storage add-ons.
  4. Explicitly discloses when baseline details were unrecorded or unverified.

#### Edge Cases Tested
- **New user with no history**: Discloses `historical_baseline_unavailable` without hallucinating a past conversation.
- **Search provider outage / zero results**: Classifies status as `unable_to_verify` with explicit disclosure that *lack of conflicting evidence is not proof that nothing changed*.
- **Prompt injection in retrieved web pages**: External HTML text is sanitized and quarantined in `<untrusted_web_evidence>` boundary blocks.
- **User data isolation**: Cross-user conversation requests return 404/null at the storage boundary.

---

## Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port 3000 |
| `npm run build` | Compiles the production build with full TypeScript checks |
| `npm run start` | Runs the compiled production application |
| `npm test` | Runs the full Vitest automated test suite |
| `npm run db:seed` | Populates the database with historical benchmark conversations |

---

## Project Structure

```
minimi-chat-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts              # Streaming SSE agent route
│   │   │   ├── conversations/route.ts     # Conversation list & create
│   │   │   ├── conversations/[id]/route.ts# Conversation detail, patch & delete
│   │   │   ├── seed/route.ts              # 1-click test benchmark seed API
│   │   │   └── settings/route.ts          # Server telemetry & health status
│   │   ├── globals.css                    # Design system tokens & typography
│   │   ├── layout.tsx                     # Root HTML layout & fonts
│   │   └── page.tsx                       # Full-stack research workspace UI
│   ├── components/
│   │   ├── ChatArea.tsx                   # Message feed & streaming indicator
│   │   ├── ComparisonMatrix.tsx           # Structured temporal comparison table
│   │   ├── Header.tsx                     # Navigation bar with intent badge
│   │   ├── InputArea.tsx                  # Auto-resizing textarea with hotkeys
│   │   ├── MarkdownView.tsx               # Markdown renderer with citation pills
│   │   ├── SettingsModal.tsx              # System architecture telemetry modal
│   │   ├── Sidebar.tsx                    # Chronological history & benchmark list
│   │   └── SourceDrawer.tsx               # Slide-over source & evidence inspector
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── intent.ts                  # Deterministic intent classifier
│   │   │   └── orchestrator.ts            # Research workflow event coordinator
│   │   ├── db/
│   │   │   ├── index.ts                   # Database singleton factory
│   │   │   ├── local.ts                   # Embedded atomic persistent fallback
│   │   │   ├── postgres.ts                # Primary PostgreSQL adapter (pg pool)
│   │   │   ├── seed.ts                    # Benchmark scenarios seed script
│   │   │   └── types.ts                   # IDatabaseAdapter interfaces
│   │   ├── llm/
│   │   │   ├── gemini.ts                  # Google Gemini API adapter
│   │   │   ├── openai.ts                  # OpenAI & Groq adapter
│   │   │   ├── types.ts                   # ILLMProvider interface
│   │   │   └── index.ts                   # LLM provider factory
│   │   ├── search/
│   │   │   ├── evidence.ts                # Sanitizer, XML formatter & claim parser
│   │   │   ├── providers.ts               # Tavily, Brave, Serper, DuckDuckGo
│   │   │   ├── retriever.ts               # HTML page fetcher & DOM text extractor
│   │   │   ├── types.ts                   # IWebSearchProvider interface
│   │   │   └── index.ts                   # Search provider factory
│   │   ├── temporal/
│   │   │   ├── comparator.ts              # Temporal comparison engine
│   │   │   ├── retriever.ts               # Hybrid historical conversation retriever
│   │   │   └── resolver.ts                # Timezone-aware date window calculator
│   │   └── config.ts                      # Zod-validated environment config
│   └── types/
│       └── index.ts                       # Domain TypeScript interfaces
├── tests/
│   ├── database.test.ts                   # Data isolation & cascade tests
│   ├── evidence-manager.test.ts           # Citations & XML sanitization tests
│   ├── intent-classifier.test.ts          # Deterministic routing tests
│   ├── security.test.ts                   # Prompt injection & XSS tests
│   ├── temporal-comparison.test.ts        # Test 1, Test 2, Test 3 & edge cases
│   └── temporal-resolver.test.ts          # Calendar & relative day parser tests
├── DESIGN.md                              # Comprehensive architectural specification
├── .env.example                           # Documented configuration template
├── package.json                           # NPM dependencies & scripts
├── tailwind.config.ts                     # Design tokens & color system
├── tsconfig.json                          # Strict TypeScript configuration
└── vitest.config.ts                       # Automated testing configuration
```

---

## License

This project is licensed under the MIT License.

