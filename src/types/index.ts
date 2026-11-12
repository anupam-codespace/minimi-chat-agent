export type IntentType =
  | "general_conversation"
  | "current_web_research"
  | "historical_retrieval"
  | "temporal_comparison"
  | "follow_up_research"
  | "multi_entity_comparison";

export type ComparisonStatus =
  | "changed"
  | "unchanged"
  | "conflicting_evidence"
  | "unable_to_verify"
  | "historical_baseline_unavailable";

export type EvidenceQuality = "official" | "primary" | "secondary" | "unverified";

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string; // ISO UTC
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  intent?: IntentType;
  createdAt: string; // ISO UTC
  sources?: Source[];
  comparison?: HistoricalComparison;
  metadata?: Record<string, unknown>;
}

export interface ResearchSession {
  id: string;
  conversationId: string;
  messageId: string;
  query: string;
  intent: IntentType;
  createdAt: string; // ISO UTC
}

export interface SearchQuery {
  id: string;
  sessionId: string;
  queryText: string;
  executedAt: string; // ISO UTC
  resultCount: number;
}

export interface Source {
  id: string;
  sessionId?: string;
  url: string;
  domain: string;
  title: string;
  snippet: string;
  retrievalTimestamp: string; // ISO UTC
  publicationDate?: string; // ISO UTC or YYYY-MM-DD
  evidenceQuality: EvidenceQuality;
  confidenceScore?: number;
}

export interface EvidenceSnapshot {
  id: string;
  conversationId: string;
  messageId: string;
  entityName: string;
  attributeName: string;
  extractedValue: string;
  snapshotDate: string; // ISO UTC
  sourceUrl?: string;
  sourceId?: string;
  evidenceQuality: EvidenceQuality;
  rawQuote?: string;
  confidence: number;
}

export interface ComparisonItem {
  entity: string;
  attribute: string;
  historicalValue: string | null;
  historicalDate: string | null;
  historicalSource: string | null;
  historicalQuality: EvidenceQuality | null;
  currentValue: string | null;
  currentDate: string | null;
  currentSource: string | null;
  currentQuality: EvidenceQuality | null;
  status: ComparisonStatus;
  notes?: string;
}

export interface HistoricalComparison {
  id: string;
  conversationId: string;
  messageId: string;
  targetDatePhrase: string;
  resolvedDate: string; // ISO UTC
  status: ComparisonStatus;
  summary: string;
  items: ComparisonItem[];
  missingBaselineDisclosed: boolean;
  createdAt: string; // ISO UTC
}

export interface HistoricalMatch {
  conversation: Conversation;
  messages: Message[];
  evidenceSnapshots: EvidenceSnapshot[];
  matchReason: string;
  score: number;
}

