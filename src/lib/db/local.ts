import fs from "fs";
import path from "path";
import {
  IDatabaseAdapter,
  HistoricalSearchCriteria,
} from "./types";
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

interface StorageSchema {
  users: User[];
  conversations: Conversation[];
  messages: Array<Omit<Message, "sources" | "comparison">>;
  researchSessions: ResearchSession[];
  searchQueries: SearchQuery[];
  sources: Source[];
  evidenceSnapshots: EvidenceSnapshot[];
  comparisons: HistoricalComparison[];
}

export class LocalDatabaseAdapter implements IDatabaseAdapter {
  name = "LocalPersistentStore";
  private filePath: string;
  private data: StorageSchema = {
    users: [],
    conversations: [],
    messages: [],
    researchSessions: [],
    searchQueries: [],
    sources: [],
    evidenceSnapshots: [],
    comparisons: [],
  };
  private isLoaded = false;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), ".data", "minimi.db.json");
  }

  async init(): Promise<void> {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(raw);
      } catch {
        this.saveSync();
      }
    } else {
      this.saveSync();
    }
    this.isLoaded = true;
  }

  async close(): Promise<void> {
    this.saveSync();
  }

  private saveSync(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  async getUser(id: string): Promise<User | null> {
    return this.data.users.find((u) => u.id === id) || null;
  }

  async upsertUser(user: Partial<User> & { id: string; email: string }): Promise<User> {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    const existing = idx >= 0 ? this.data.users[idx] : null;
    const u: User = {
      id: user.id,
      email: user.email,
      name: user.name || existing?.name || "User",
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    if (idx >= 0) {
      this.data.users[idx] = u;
    } else {
      this.data.users.push(u);
    }
    this.saveSync();
    return u;
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getConversation(id: string, userId?: string): Promise<Conversation | null> {
    const conv = this.data.conversations.find(
      (c) => c.id === id && (!userId || c.userId === userId)
    );
    return conv || null;
  }

  async createConversation(data: {
    id?: string;
    userId: string;
    title: string;
    metadata?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<Conversation> {
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: data.id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: data.userId,
      title: data.title,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || data.createdAt || now,
      metadata: data.metadata || {},
    };
    this.data.conversations.unshift(conv);
    this.saveSync();
    return conv;
  }

  async updateConversation(
    id: string,
    data: Partial<Pick<Conversation, "title" | "metadata">>
  ): Promise<Conversation | null> {
    const conv = this.data.conversations.find((c) => c.id === id);
    if (!conv) return null;
    if (data.title !== undefined) conv.title = data.title;
    if (data.metadata !== undefined) conv.metadata = { ...conv.metadata, ...data.metadata };
    conv.updatedAt = new Date().toISOString();
    this.saveSync();
    return conv;
  }

  async deleteConversation(id: string, userId?: string): Promise<boolean> {
    const idx = this.data.conversations.findIndex(
      (c) => c.id === id && (!userId || c.userId === userId)
    );
    if (idx === -1) return false;
    this.data.conversations.splice(idx, 1);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    this.data.evidenceSnapshots = this.data.evidenceSnapshots.filter((e) => e.conversationId !== id);
    this.data.researchSessions = this.data.researchSessions.filter((s) => s.conversationId !== id);
    this.data.comparisons = this.data.comparisons.filter((comp) => comp.conversationId !== id);
    this.saveSync();
    return true;
  }

  async addMessage(msg: Omit<Message, "sources" | "comparison">): Promise<Message> {
    const fullMsg = {
      ...msg,
      createdAt: msg.createdAt || new Date().toISOString(),
    };
    this.data.messages.push(fullMsg);

    const conv = this.data.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }

    this.saveSync();
    return fullMsg;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const msgs = this.data.messages.filter((m) => m.conversationId === conversationId);
    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const result: Message[] = [];
    for (const m of msgs) {
      const sources = await this.getSourcesByMessage(m.id);
      const comparison = await this.getComparisonByMessageId(m.id);
      result.push({
        ...m,
        sources: sources.length > 0 ? sources : undefined,
        comparison: comparison || undefined,
      });
    }
    return result;
  }

  async createResearchSession(session: ResearchSession): Promise<ResearchSession> {
    const s: ResearchSession = {
      ...session,
      createdAt: session.createdAt || new Date().toISOString(),
    };
    this.data.researchSessions.push(s);
    this.saveSync();
    return s;
  }

  async addSearchQueries(queries: SearchQuery[]): Promise<void> {
    for (const q of queries) {
      if (!this.data.searchQueries.some((sq) => sq.id === q.id)) {
        this.data.searchQueries.push(q);
      }
    }
    this.saveSync();
  }

  async addSources(sources: Source[]): Promise<void> {
    for (const s of sources) {
      const idx = this.data.sources.findIndex((ex) => ex.id === s.id);
      if (idx >= 0) {
        this.data.sources[idx] = s;
      } else {
        this.data.sources.push(s);
      }
    }
    this.saveSync();
  }

  async getSourcesByMessage(messageId: string): Promise<Source[]> {
    const session = this.data.researchSessions.find((s) => s.messageId === messageId);
    if (!session) return [];
    return this.data.sources.filter((s) => s.sessionId === session.id);
  }

  async addEvidenceSnapshots(snapshots: EvidenceSnapshot[]): Promise<void> {
    for (const snap of snapshots) {
      if (!this.data.evidenceSnapshots.some((e) => e.id === snap.id)) {
        this.data.evidenceSnapshots.push(snap);
      }
    }
    this.saveSync();
  }

  async getEvidenceSnapshots(conversationId: string): Promise<EvidenceSnapshot[]> {
    return this.data.evidenceSnapshots
      .filter((e) => e.conversationId === conversationId)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
  }

  async findEvidenceByEntities(entities: string[], beforeDate?: Date): Promise<EvidenceSnapshot[]> {
    if (entities.length === 0) return [];
    const lowerEntities = entities.map((e) => e.toLowerCase());

    return this.data.evidenceSnapshots
      .filter((e) => {
        const matchesEntity = lowerEntities.some(
          (le) => e.entityName.toLowerCase().includes(le) || le.includes(e.entityName.toLowerCase())
        );
        if (!matchesEntity) return false;
        if (beforeDate) {
          return new Date(e.snapshotDate).getTime() <= beforeDate.getTime();
        }
        return true;
      })
      .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
  }

  async saveComparison(comp: HistoricalComparison): Promise<HistoricalComparison> {
    const idx = this.data.comparisons.findIndex((c) => c.id === comp.id);
    if (idx >= 0) {
      this.data.comparisons[idx] = comp;
    } else {
      this.data.comparisons.push(comp);
    }
    this.saveSync();
    return comp;
  }

  async getComparisonByMessageId(messageId: string): Promise<HistoricalComparison | null> {
    return this.data.comparisons.find((c) => c.messageId === messageId) || null;
  }

  async findHistoricalConversations(criteria: HistoricalSearchCriteria): Promise<HistoricalMatch[]> {
    const limit = criteria.limit || 5;
    const candidates = this.data.conversations.filter((c) => c.userId === criteria.userId);

    const matches: HistoricalMatch[] = [];

    for (const conv of candidates) {
      const convDate = new Date(conv.createdAt);
      let dateMatch = true;

      if (criteria.startDate && criteria.endDate) {
        dateMatch =
          convDate.getTime() >= criteria.startDate.getTime() &&
          convDate.getTime() <= criteria.endDate.getTime();
      }

      if (!dateMatch) continue;

      const messages = await this.getMessages(conv.id);
      const evidence = await this.getEvidenceSnapshots(conv.id);

      let textMatch = true;
      let score = 1.0;
      let reason = "date_filter_match";

      if (criteria.query) {
        const tokens = criteria.query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
        let matchCount = 0;
        for (const token of tokens) {
          const inTitle = conv.title.toLowerCase().includes(token);
          const inMessages = messages.some((m) => m.content.toLowerCase().includes(token));
          const inEvidence = evidence.some(
            (e) =>
              e.entityName.toLowerCase().includes(token) ||
              e.attributeName.toLowerCase().includes(token) ||
              e.extractedValue.toLowerCase().includes(token)
          );

          if (inTitle || inMessages || inEvidence) {
            matchCount++;
            if (inTitle) score += 0.5;
            if (inEvidence) score += 0.8;
            if (inMessages) score += 0.3;
          }
        }
        textMatch = tokens.length === 0 || matchCount > 0;
        reason = "keyword_and_concept_match";
      }

      if (textMatch) {
        matches.push({
          conversation: conv,
          messages,
          evidenceSnapshots: evidence,
          matchReason: reason,
          score,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score || new Date(b.conversation.createdAt).getTime() - new Date(a.conversation.createdAt).getTime());
    return matches.slice(0, limit);
  }
}
