import {
  User,
  Conversation,
  Message,
  ResearchSession,
  SearchQuery,
  Source,
  EvidenceSnapshot,
  HistoricalComparison,
  HistoricalMatch,
} from "@/types";

export interface HistoricalSearchCriteria {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  query?: string;
  entityNames?: string[];
  limit?: number;
}

export interface IDatabaseAdapter {
  name: string;
  init(): Promise<void>;
  close(): Promise<void>;

  // Users
  getUser(id: string): Promise<User | null>;
  upsertUser(user: Partial<User> & { id: string; email: string }): Promise<User>;

  // Conversations
  listConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string, userId?: string): Promise<Conversation | null>;
  createConversation(data: { id?: string; userId: string; title: string; metadata?: Record<string, unknown>; createdAt?: string; updatedAt?: string }): Promise<Conversation>;
  updateConversation(id: string, data: Partial<Pick<Conversation, "title" | "metadata">>): Promise<Conversation | null>;
  deleteConversation(id: string, userId?: string): Promise<boolean>;

  // Messages
  addMessage(message: Omit<Message, "sources" | "comparison">): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;

  // Research Sessions & Sources
  createResearchSession(session: ResearchSession): Promise<ResearchSession>;
  addSearchQueries(queries: SearchQuery[]): Promise<void>;
  addSources(sources: Source[]): Promise<void>;
  getSourcesByMessage(messageId: string): Promise<Source[]>;

  // Evidence Snapshots
  addEvidenceSnapshots(snapshots: EvidenceSnapshot[]): Promise<void>;
  getEvidenceSnapshots(conversationId: string): Promise<EvidenceSnapshot[]>;
  findEvidenceByEntities(entities: string[], beforeDate?: Date): Promise<EvidenceSnapshot[]>;

  // Comparisons
  saveComparison(comparison: HistoricalComparison): Promise<HistoricalComparison>;
  getComparisonByMessageId(messageId: string): Promise<HistoricalComparison | null>;

  // Hybrid Historical Retrieval
  findHistoricalConversations(criteria: HistoricalSearchCriteria): Promise<HistoricalMatch[]>;
}
