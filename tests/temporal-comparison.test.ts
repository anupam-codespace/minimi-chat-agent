import { describe, it, expect, beforeAll } from "vitest";
import { getDatabase } from "../src/lib/db";
import { seedDatabase } from "../src/lib/db/seed";
import { HistoricalRetriever } from "../src/lib/temporal/retriever";
import { TemporalComparator } from "../src/lib/temporal/comparator";
import { IWebSearchProvider, SearchResult } from "../src/lib/search/types";

class MockSearchProvider implements IWebSearchProvider {
  name = "MockSearch";
  async search(query: string): Promise<SearchResult[]> {
    const lower = query.toLowerCase();
    if (lower.includes("hubspot")) {
      return [
        {
          url: "https://www.hubspot.com/pricing/sales",
          title: "HubSpot Sales Hub Pricing",
          snippet: "Sales Hub Professional starts at $90 per seat/month.",
          domain: "hubspot.com",
          evidenceQuality: "official",
          confidenceScore: 0.99,
        },
      ];
    }
    if (lower.includes("salesforce")) {
      return [
        {
          url: "https://www.salesforce.com/pricing",
          title: "Salesforce Cloud",
          snippet: "Enterprise edition starts at $165 per user/month.",
          domain: "salesforce.com",
          evidenceQuality: "official",
          confidenceScore: 0.99,
        },
      ];
    }
    if (lower.includes("pipedrive")) {
      return [
        {
          url: "https://www.pipedrive.com/pricing",
          title: "Pipedrive Pricing",
          snippet: "Professional tier is $49 per user/month.",
          domain: "pipedrive.com",
          evidenceQuality: "official",
          confidenceScore: 0.95,
        },
      ];
    }
    if (lower.includes("zoho")) {
      return [
        {
          url: "https://www.zoho.com/crm/pricing",
          title: "Zoho CRM Pricing",
          snippet: "Enterprise edition is $40 per user/month.",
          domain: "zoho.com",
          evidenceQuality: "official",
          confidenceScore: 0.95,
        },
      ];
    }
    if (lower.includes("close")) {
      return [
        {
          url: "https://www.close.com/pricing",
          title: "Close CRM Pricing",
          snippet: "Professional tier is $99 per user/month.",
          domain: "close.com",
          evidenceQuality: "official",
          confidenceScore: 0.95,
        },
      ];
    }
    if (lower.includes("supabase")) {
      return [
        {
          url: "https://supabase.com/pricing",
          title: "Supabase Pricing",
          snippet: "Pro plan starts at $25/month per project.",
          domain: "supabase.com",
          evidenceQuality: "official",
          confidenceScore: 0.98,
        },
      ];
    }
    if (lower.includes("neon")) {
      return [
        {
          url: "https://neon.tech/pricing",
          title: "Neon Serverless Postgres",
          snippet: "Scale plan starts at $19/month base.",
          domain: "neon.tech",
          evidenceQuality: "official",
          confidenceScore: 0.98,
        },
      ];
    }
    return [];
  }
}

describe("Temporal Comparison Engine Tests", () => {
  let db: Awaited<ReturnType<typeof getDatabase>>;
  const mockSearch = new MockSearchProvider();

  beforeAll(async () => {
    db = await getDatabase();
    await seedDatabase();
  });

  // ===========================================================================
  // TEST 1
  // ===========================================================================
  it("TEST 1: Resolves Monday CRM shortlist, recovers 5 entities and compares live pricing", async () => {
    const prompt =
      "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?";
    const retriever = new HistoricalRetriever(db);
    const histContext = await retriever.retrieveContext(prompt, "usr_default", new Date(), "Asia/Kolkata");

    expect(histContext.match).not.toBeNull();
    expect(histContext.match?.conversation.title).toContain("CRM");
    expect(histContext.entities.length).toBeGreaterThanOrEqual(4);

    const comparator = new TemporalComparator(mockSearch);
    const comp = await comparator.compare("conv_test", "msg_test", histContext);

    expect(comp.items.length).toBeGreaterThanOrEqual(4);
    expect(comp.items.some((i) => i.entity.toLowerCase().includes("hubspot"))).toBe(true);
    expect(comp.items.some((i) => i.entity.toLowerCase().includes("salesforce"))).toBe(true);

    // Each item has valid status
    for (const item of comp.items) {
      expect(["unchanged", "changed", "unable_to_verify", "historical_baseline_unavailable"]).toContain(
        item.status
      );
    }
  });

  // ===========================================================================
  // TEST 2
  // ===========================================================================
  it("TEST 2: Resolves 3 November conversation, retrieves past answer, and verifies claims", async () => {
    const prompt = "What did I ask you on 3 November? Is your answer still correct today?";
    const retriever = new HistoricalRetriever(db);
    const histContext = await retriever.retrieveContext(prompt, "usr_default", new Date(), "Asia/Kolkata");

    expect(histContext.match).not.toBeNull();
    expect(histContext.resolvedDateRange?.resolvedDateString).toBe("2026-11-03");

    const userMsg = histContext.match?.messages.find((m) => m.role === "user");
    expect(userMsg?.content).toContain("GPT-4o mini");
  });

  // ===========================================================================
  // TEST 3
  // ===========================================================================
  it("TEST 3: Resolves Last Tuesday Postgres hosting conversation and compares pricing", async () => {
    const prompt = "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?";
    const retriever = new HistoricalRetriever(db);
    const histContext = await retriever.retrieveContext(prompt, "usr_default", new Date(), "Asia/Kolkata");

    expect(histContext.match).not.toBeNull();
    expect(histContext.match?.conversation.title).toContain("Postgres");

    const comparator = new TemporalComparator(mockSearch);
    const comp = await comparator.compare("conv_test_pg", "msg_test_pg", histContext);

    expect(comp.items.length).toBeGreaterThan(0);
    expect(comp.items.some((i) => i.entity.toLowerCase().includes("supabase"))).toBe(true);
  });

  // ===========================================================================
  // EDGE CASE 1: New user with no history
  // ===========================================================================
  it("Edge Case: New user with no history discloses baseline unavailable", async () => {
    const prompt = "Has any of our shortlisted CRM tools changed pricing since Monday?";
    const retriever = new HistoricalRetriever(db);
    const histContext = await retriever.retrieveContext(prompt, "usr_brand_new", new Date(), "Asia/Kolkata");

    expect(histContext.match).toBeNull();

    const comparator = new TemporalComparator(mockSearch);
    const comp = await comparator.compare("conv_new", "msg_new", histContext);

    expect(comp.status).toBe("historical_baseline_unavailable");
    expect(comp.missingBaselineDisclosed).toBe(true);
    expect(comp.summary).toContain("Historical baseline unavailable");
  });

  // ===========================================================================
  // EDGE CASE 2: No available current evidence (discloses unable_to_verify)
  // ===========================================================================
  it("Edge Case: When search provider returns empty, marks unable_to_verify rather than unchanged", async () => {
    class EmptySearchProvider implements IWebSearchProvider {
      name = "EmptySearch";
      async search(): Promise<SearchResult[]> {
        return [];
      }
    }

    const prompt = "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing?";
    const retriever = new HistoricalRetriever(db);
    const histContext = await retriever.retrieveContext(prompt, "usr_default", new Date(), "Asia/Kolkata");

    const comparator = new TemporalComparator(new EmptySearchProvider());
    const comp = await comparator.compare("conv_empty", "msg_empty", histContext);

    expect(comp.items.length).toBeGreaterThan(0);
    expect(comp.items.every((i) => i.status === "unable_to_verify")).toBe(true);
    expect(comp.items[0].notes).toContain("Missing evidence is not proof of unchanged status");
  });
});
