import { IDatabaseAdapter } from "../db/types";
import { HistoricalMatch, EvidenceSnapshot } from "@/types";
import { TemporalResolver, ResolvedDateRange } from "./resolver";

export interface HistoricalRetrievalResult {
  match: HistoricalMatch | null;
  resolvedDateRange: ResolvedDateRange | null;
  entities: string[];
  evidence: EvidenceSnapshot[];
  queryText: string;
}

export class HistoricalRetriever {
  private db: IDatabaseAdapter;

  constructor(db: IDatabaseAdapter) {
    this.db = db;
  }

  async retrieveContext(
    userPrompt: string,
    userId: string,
    referenceDate: Date = new Date(),
    timeZone: string = "UTC"
  ): Promise<HistoricalRetrievalResult> {
    // 1. Resolve date reference if any
    const resolvedDateRange = TemporalResolver.resolveDate(userPrompt, referenceDate, timeZone);

    // 2. Extract key topic terms
    const topicKeywords = this.extractTopicKeywords(userPrompt);

    // 3. Search database
    let matches: HistoricalMatch[] = [];

    if (resolvedDateRange) {
      // First attempt: exact date range search
      matches = await this.db.findHistoricalConversations({
        userId,
        startDate: resolvedDateRange.startDate,
        endDate: resolvedDateRange.endDate,
        query: topicKeywords.length > 0 ? topicKeywords[0] : undefined,
        limit: 3,
      });

      // If no exact match with query, try date range without query
      if (matches.length === 0) {
        matches = await this.db.findHistoricalConversations({
          userId,
          startDate: resolvedDateRange.startDate,
          endDate: resolvedDateRange.endDate,
          limit: 3,
        });
      }
    }

    // If still no matches or no date range, try semantic/keyword search
    if (matches.length === 0 && topicKeywords.length > 0) {
      matches = await this.db.findHistoricalConversations({
        userId,
        query: topicKeywords.join(" "),
        limit: 3,
      });
    }

    const bestMatch = matches[0] || null;
    let entities: string[] = [];
    let evidence: EvidenceSnapshot[] = [];

    if (bestMatch) {
      evidence = bestMatch.evidenceSnapshots;
      entities = Array.from(new Set(evidence.map((e) => e.entityName)));

      // If no pre-extracted entities in snapshots, extract from assistant messages
      if (entities.length === 0) {
        entities = this.extractEntitiesFromMessages(bestMatch.messages);
      }
    }

    return {
      match: bestMatch,
      resolvedDateRange,
      entities,
      evidence,
      queryText: topicKeywords.join(" "),
    };
  }

  private extractTopicKeywords(text: string): string[] {
    const stopwords = new Set([
      "on", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
      "yesterday", "last", "this", "what", "did", "i", "ask", "asked", "you", "we", "shortlisted",
      "has", "any", "of", "them", "changed", "pricing", "or", "shipped", "something",
      "big", "since", "is", "your", "answer", "still", "correct", "today", "about",
      "the", "for", "a", "an", "and", "in", "to", "can", "tell", "me", "then", "question"
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    return Array.from(new Set(words));
  }

  private extractEntitiesFromMessages(messages: Array<{ content: string; role: string }>): string[] {
    const entities: string[] = [];
    const text = messages.map((m) => m.content).join("\n");

    // Check for markdown headers like ### 1. HubSpot or 1. **Supabase**
    const headerRegex = /(?:###?\s*\d*\.?\s*|\d+\.\s+\*\*?)([A-Z][A-Za-z0-9\s-]{2,25}?)(?:\*\*|:|\s*\()/g;
    let match: RegExpExecArray | null;

    while ((match = headerRegex.exec(text)) !== null) {
      const e = match[1].trim();
      if (!entities.includes(e)) entities.push(e);
    }

    return entities;
  }
}
