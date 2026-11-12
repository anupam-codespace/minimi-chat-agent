import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../src/lib/db";
import { HistoricalRetriever } from "../src/lib/temporal/retriever";
import { TemporalComparator } from "../src/lib/temporal/comparator";
import { TemporalResolver } from "../src/lib/temporal/resolver";
import { IWebSearchProvider, SearchResult } from "../src/lib/search/types";
import { LocalDatabaseAdapter } from "../src/lib/db/local";
import path from "path";
import fs from "fs";

describe("Comprehensive Edge Scenarios (Section 10 Requirements)", () => {
  const testDbPath = path.join(process.cwd(), ".data", "test_edge_cases.db.json");
  let db: LocalDatabaseAdapter;

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new LocalDatabaseAdapter(testDbPath);
    await db.init();
  });

  // ---------------------------------------------------------------------------
  // 1. Ambiguous Historical Date
  // ---------------------------------------------------------------------------
  it("handles ambiguous date references gracefully without crashing", async () => {
    // When date is ambiguous ("recently", "sometime ago"), resolver returns null
    const res = TemporalResolver.resolveDate("Did pricing change recently?");
    expect(res).toBeNull();

    // Retriever falls back to keyword/entity search
    await db.createConversation({
      id: "conv_rec",
      userId: "usr_edge",
      title: "CRM Tools Discussion",
    });
    const retriever = new HistoricalRetriever(db);
    const histContext = await retriever.retrieveContext(
      "Did pricing change recently for CRM?",
      "usr_edge",
      new Date(),
      "Asia/Kolkata"
    );

    expect(histContext.match).not.toBeNull();
    expect(histContext.match?.conversation.id).toBe("conv_rec");
  });

  // ---------------------------------------------------------------------------
  // 2. Multiple Matching Conversations (Ranking by Relevance & Date)
  // ---------------------------------------------------------------------------
  it("ranks multiple matching conversations by relevance score and recency", async () => {
    const userId = "usr_rank";

    // Create 3 conversations mentioning Postgres
    await db.createConversation({
      id: "conv_1",
      userId,
      title: "General Postgres queries",
      createdAt: "2026-11-01T10:00:00.000Z",
    });

    await db.createConversation({
      id: "conv_2",
      userId,
      title: "Postgres Hosting Comparison",
      createdAt: "2026-11-05T10:00:00.000Z",
    });

    // Add matching evidence snapshot to conv_2
    await db.addEvidenceSnapshots([
      {
        id: "ev_pg_match",
        conversationId: "conv_2",
        messageId: "msg_2",
        entityName: "Supabase Postgres",
        attributeName: "Pricing",
        extractedValue: "$25/mo",
        snapshotDate: "2026-11-05T10:00:00.000Z",
        evidenceQuality: "official",
        confidence: 0.95,
      },
    ]);

    const retriever = new HistoricalRetriever(db);
    const histContext = await retriever.retrieveContext(
      "Tell me about Postgres hosting pricing",
      userId,
      new Date(),
      "Asia/Kolkata"
    );

    expect(histContext.match).not.toBeNull();
    // Conv 2 must rank first because of title + evidence match
    expect(histContext.match?.conversation.id).toBe("conv_2");
  });

  // ---------------------------------------------------------------------------
  // 3. Search Provider Outage
  // ---------------------------------------------------------------------------
  it("handles search provider outage by classifying items as unable_to_verify without crashing", async () => {
    class FailingSearchProvider implements IWebSearchProvider {
      name = "FailingSearch";
      async search(): Promise<SearchResult[]> {
        throw new Error("HTTP 503 Service Unavailable: Search API rate limit exceeded");
      }
    }

    const comparator = new TemporalComparator(new FailingSearchProvider());
    const histContext = {
      match: {
        conversation: { id: "c1", userId: "u1", title: "CRM", createdAt: "2026-11-09T00:00:00.000Z", updatedAt: "2026-11-09T00:00:00.000Z" },
        messages: [],
        evidenceSnapshots: [
          {
            id: "ev_1",
            conversationId: "c1",
            messageId: "m1",
            entityName: "HubSpot",
            attributeName: "Price",
            extractedValue: "$90",
            snapshotDate: "2026-11-09T00:00:00.000Z",
            evidenceQuality: "official" as const,
            confidence: 0.9,
          },
        ],
        matchReason: "date",
        score: 1,
      },
      resolvedDateRange: null,
      entities: ["HubSpot"],
      evidence: [
        {
          id: "ev_1",
          conversationId: "c1",
          messageId: "m1",
          entityName: "HubSpot",
          attributeName: "Price",
          extractedValue: "$90",
          snapshotDate: "2026-11-09T00:00:00.000Z",
          evidenceQuality: "official" as const,
          confidence: 0.9,
        },
      ],
      queryText: "HubSpot",
    };

    const comp = await comparator.compare("conv_outage", "msg_outage", histContext);

    expect(comp.items).toHaveLength(1);
    expect(comp.items[0].status).toBe("unable_to_verify");
    expect(comp.items[0].notes).toContain("timed out");
  });

  // ---------------------------------------------------------------------------
  // 4. Conflicting Sources
  // ---------------------------------------------------------------------------
  it("identifies conflicting evidence when multiple live sources disagree on price", async () => {
    class ConflictingSearchProvider implements IWebSearchProvider {
      name = "ConflictingSearch";
      async search(): Promise<SearchResult[]> {
        return [
          {
            url: "https://sourceA.com/pricing",
            title: "Source A",
            snippet: "HubSpot Pro plan is $90/user/mo.",
            domain: "sourceA.com",
            evidenceQuality: "secondary",
            confidenceScore: 0.8,
          },
          {
            url: "https://sourceB.com/pricing",
            title: "Source B",
            snippet: "Recent price increase: HubSpot Pro plan is now $125/user/mo.",
            domain: "sourceB.com",
            evidenceQuality: "secondary",
            confidenceScore: 0.8,
          },
        ];
      }
    }

    const comparator = new TemporalComparator(new ConflictingSearchProvider());
    const histContext = {
      match: {
        conversation: { id: "c1", userId: "u1", title: "CRM", createdAt: "2026-11-09T00:00:00.000Z", updatedAt: "2026-11-09T00:00:00.000Z" },
        messages: [],
        evidenceSnapshots: [
          {
            id: "ev_1",
            conversationId: "c1",
            messageId: "m1",
            entityName: "HubSpot",
            attributeName: "Price",
            extractedValue: "$90/user/mo",
            snapshotDate: "2026-11-09T00:00:00.000Z",
            evidenceQuality: "official" as const,
            confidence: 0.9,
          },
        ],
        matchReason: "date",
        score: 1,
      },
      resolvedDateRange: null,
      entities: ["HubSpot"],
      evidence: [
        {
          id: "ev_1",
          conversationId: "c1",
          messageId: "m1",
          entityName: "HubSpot",
          attributeName: "Price",
          extractedValue: "$90/user/mo",
          snapshotDate: "2026-11-09T00:00:00.000Z",
          evidenceQuality: "official" as const,
          confidence: 0.9,
        },
      ],
      queryText: "HubSpot",
    };

    const comp = await comparator.compare("conv_conflict", "msg_conflict", histContext);

    expect(comp.items[0].status).toBe("conflicting_evidence");
    expect(comp.items[0].notes).toContain("Conflicting pricing evidence");
  });

  // ---------------------------------------------------------------------------
  // 5. Very Long Conversations (Pagination & High Volume)
  // ---------------------------------------------------------------------------
  it("supports large volumes of messages in a conversation without truncation or loss", async () => {
    const conv = await db.createConversation({
      id: "conv_long",
      userId: "usr_long",
      title: "Deep Iterative Research",
    });

    for (let i = 0; i < 50; i++) {
      await db.addMessage({
        id: `msg_long_${i}`,
        conversationId: conv.id,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Iteration step ${i} examining distributed consensus and raft log replication details.`,
        createdAt: new Date(Date.now() + i * 1000).toISOString(),
      });
    }

    const messages = await db.getMessages(conv.id);
    expect(messages).toHaveLength(50);
    expect(messages[0].id).toBe("msg_long_0");
    expect(messages[49].id).toBe("msg_long_49");
  });
});

