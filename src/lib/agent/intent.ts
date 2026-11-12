import { IntentType } from "@/types";

export class IntentClassifier {
  static classify(text: string): IntentType {
    const lower = text.toLowerCase();

    // 1. Temporal comparison: combination of date/prior reference + change/freshness check
    const temporalMarkers = [
      "since", "changed", "still correct", "still valid", "any change",
      "updated since", "pricing changed", "shipped something", "difference since",
      "compared to"
    ];
    const dateMarkers = [
      "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
      "yesterday", "last week", "last month", "november", "december", "january",
      "october", "september", "august", "july", "june", "may", "april", "march", "february"
    ];

    const hasTemporalMarker = temporalMarkers.some((m) => lower.includes(m));
    const hasDateMarker = dateMarkers.some((m) => lower.includes(m));

    if (hasTemporalMarker && hasDateMarker) {
      return "temporal_comparison";
    }

    // Specific temporal comparison queries like "Is your answer still correct today?"
    if (lower.includes("still correct today") || lower.includes("changed since")) {
      return "temporal_comparison";
    }

    // 2. Historical conversation retrieval (seeking past conversation without fresh comparison)
    const retrievalMarkers = [
      "what did i ask", "what did we discuss", "show me our previous",
      "what was my question", "find previous conversation", "retrieve conversation"
    ];
    if (retrievalMarkers.some((m) => lower.includes(m))) {
      return "historical_retrieval";
    }

    // 3. Multi-entity comparison
    if (
      (lower.includes("compare") || lower.includes("versus") || lower.includes(" vs ")) &&
      (lower.includes("pricing") || lower.includes("features") || lower.includes("tools"))
    ) {
      return "multi_entity_comparison";
    }

    // 4. Current web research (pricing, news, current specs, latest documentation)
    const researchMarkers = [
      "price", "pricing", "cost", "features", "shortlist", "latest",
      "current", "news", "today", "api", "hosting", "release", "benchmark",
      "who is", "what is", "how much", "how does"
    ];
    if (researchMarkers.some((m) => lower.includes(m))) {
      return "current_web_research";
    }

    // 5. General conversation (greetings, simple queries)
    const greetings = ["hi", "hello", "hey", "good morning", "good evening", "how are you", "who are you"];
    if (greetings.includes(lower.trim()) || lower.length < 15) {
      return "general_conversation";
    }

    return "general_conversation";
  }
}

