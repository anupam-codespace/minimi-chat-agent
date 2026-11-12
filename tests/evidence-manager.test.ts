import { describe, it, expect } from "vitest";
import { EvidenceManager } from "../src/lib/search/evidence";
import { SearchResult } from "../src/lib/search/types";

describe("EvidenceManager", () => {
  const dummyResults: SearchResult[] = [
    {
      url: "https://www.hubspot.com/pricing/sales",
      title: "HubSpot Sales Hub Official Pricing",
      snippet: "Sales Hub Professional starts at $90 per seat/month.",
      domain: "hubspot.com",
      evidenceQuality: "official",
      confidenceScore: 0.98,
    },
    {
      url: "https://www.salesforce.com/pricing",
      title: "Salesforce Pricing",
      snippet: "Enterprise edition is $165 per user/month.",
      domain: "salesforce.com",
      evidenceQuality: "official",
      confidenceScore: 0.98,
    },
  ];

  it("builds sources with sequential numeric IDs", () => {
    const sources = EvidenceManager.buildSources(dummyResults, "session_123");
    expect(sources).toHaveLength(2);
    expect(sources[0].id).toBe("source_1");
    expect(sources[1].id).toBe("source_2");
    expect(sources[0].domain).toBe("hubspot.com");
  });

  it("formats untrusted evidence block with prompt injection defense tags", () => {
    const sources = EvidenceManager.buildSources(dummyResults, "session_123");
    const formatted = EvidenceManager.formatEvidenceBlock(sources);

    expect(formatted).toContain("<untrusted_web_evidence>");
    expect(formatted).toContain("</untrusted_web_evidence>");
    expect(formatted).toContain("SECURITY NOTE:");
    expect(formatted).toContain('<source id="[1]">');
    expect(formatted).toContain('<source id="[2]">');
  });

  it("extracts entity and price snapshots from text", () => {
    const text =
      "HubSpot Sales Hub starts at $90/seat/mo while Salesforce Sales Cloud starts at $165/user/month.";
    const sources = EvidenceManager.buildSources(dummyResults);
    const snapshots = EvidenceManager.extractSnapshotsFromText(text, "conv_1", "msg_1", sources);

    expect(snapshots.length).toBeGreaterThanOrEqual(1);
    expect(snapshots.some((s) => s.extractedValue.includes("$90"))).toBe(true);
  });
});

