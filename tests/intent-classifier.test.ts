import { describe, it, expect } from "vitest";
import { IntentClassifier } from "../src/lib/agent/intent";

describe("IntentClassifier", () => {
  it("classifies Test 1 as temporal_comparison", () => {
    const query =
      "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?";
    expect(IntentClassifier.classify(query)).toBe("temporal_comparison");
  });

  it("classifies Test 2 as temporal_comparison", () => {
    const query = "What did I ask you on 3 November? Is your answer still correct today?";
    expect(IntentClassifier.classify(query)).toBe("temporal_comparison");
  });

  it("classifies Test 3 as temporal_comparison", () => {
    const query = "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?";
    expect(IntentClassifier.classify(query)).toBe("temporal_comparison");
  });

  it("classifies pure historical retrieval without comparison", () => {
    const query = "What did I ask you on 3 November?";
    expect(IntentClassifier.classify(query)).toBe("historical_retrieval");
  });

  it("classifies fresh web research queries", () => {
    const query = "What is the current pricing of AWS RDS db.t4g.medium in us-east-1?";
    expect(IntentClassifier.classify(query)).toBe("current_web_research");
  });

  it("classifies multi-entity comparisons", () => {
    const query = "Compare Supabase vs Neon pricing and features";
    expect(IntentClassifier.classify(query)).toBe("multi_entity_comparison");
  });

  it("classifies greetings as general_conversation", () => {
    expect(IntentClassifier.classify("Hello")).toBe("general_conversation");
    expect(IntentClassifier.classify("hi there")).toBe("general_conversation");
  });
});

