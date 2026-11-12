import { Pool, PoolClient } from "pg";
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

export class PostgresAdapter implements IDatabaseAdapter {
  name = "PostgreSQL";
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Optional pgvector extension
      try {
        await client.query("CREATE EXTENSION IF NOT EXISTS vector");
      } catch {
        // pgvector optional; full-text search and date indexing remain available
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS conversations (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );

        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(64) PRIMARY KEY,
          conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role VARCHAR(32) NOT NULL,
          content TEXT NOT NULL,
          intent VARCHAR(64),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );

        CREATE TABLE IF NOT EXISTS research_sessions (
          id VARCHAR(64) PRIMARY KEY,
          conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          query TEXT NOT NULL,
          intent VARCHAR(64) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS search_queries (
          id VARCHAR(64) PRIMARY KEY,
          session_id VARCHAR(64) NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
          query_text TEXT NOT NULL,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          result_count INT NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sources (
          id VARCHAR(64) PRIMARY KEY,
          session_id VARCHAR(64) REFERENCES research_sessions(id) ON DELETE SET NULL,
          url TEXT NOT NULL,
          domain VARCHAR(255) NOT NULL,
          title TEXT NOT NULL,
          snippet TEXT NOT NULL,
          retrieval_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          publication_date TEXT,
          evidence_quality VARCHAR(32) NOT NULL DEFAULT 'secondary',
          confidence_score REAL DEFAULT 0.8
        );

        CREATE TABLE IF NOT EXISTS evidence_snapshots (
          id VARCHAR(64) PRIMARY KEY,
          conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          entity_name VARCHAR(255) NOT NULL,
          attribute_name VARCHAR(255) NOT NULL,
          extracted_value TEXT NOT NULL,
          snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          source_url TEXT,
          source_id VARCHAR(64),
          evidence_quality VARCHAR(32) NOT NULL DEFAULT 'secondary',
          raw_quote TEXT,
          confidence REAL DEFAULT 0.8
        );

        CREATE TABLE IF NOT EXISTS historical_comparisons (
          id VARCHAR(64) PRIMARY KEY,
          conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          target_date_phrase TEXT NOT NULL,
          resolved_date TIMESTAMPTZ NOT NULL,
          status VARCHAR(64) NOT NULL,
          summary TEXT NOT NULL,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          missing_baseline_disclosed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Indexes for high-performance temporal retrieval and full-text queries
        CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_evidence_entity ON evidence_snapshots(entity_name);
        CREATE INDEX IF NOT EXISTS idx_evidence_date ON evidence_snapshots(snapshot_date);
        CREATE INDEX IF NOT EXISTS idx_sources_url ON sources(url);
      `);

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getUser(id: string): Promise<User | null> {
    const res = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      createdAt: r.created_at.toISOString(),
    };
  }

  async upsertUser(user: Partial<User> & { id: string; email: string }): Promise<User> {
    const res = await this.pool.query(
      `INSERT INTO users (id, email, name, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, users.name)
       RETURNING *`,
      [user.id, user.email, user.name || "User"]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      createdAt: r.created_at.toISOString(),
    };
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const res = await this.pool.query(
      `SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      metadata: r.metadata,
    }));
  }

  async getConversation(id: string, userId?: string): Promise<Conversation | null> {
    const sql = userId
      ? `SELECT * FROM conversations WHERE id = $1 AND user_id = $2`
      : `SELECT * FROM conversations WHERE id = $1`;
    const params = userId ? [id, userId] : [id];
    const res = await this.pool.query(sql, params);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      title: r.title,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      metadata: r.metadata,
    };
  }

  async createConversation(data: {
    id?: string;
    userId: string;
    title: string;
    metadata?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<Conversation> {
    const id = data.id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdDate = data.createdAt ? new Date(data.createdAt) : new Date();
    const updatedDate = data.updatedAt ? new Date(data.updatedAt) : createdDate;
    const res = await this.pool.query(
      `INSERT INTO conversations (id, user_id, title, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.userId, data.title, JSON.stringify(data.metadata || {}), createdDate, updatedDate]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      title: r.title,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      metadata: r.metadata,
    };
  }

  async updateConversation(
    id: string,
    data: Partial<Pick<Conversation, "title" | "metadata">>
  ): Promise<Conversation | null> {
    const sets: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [id];

    if (data.title !== undefined) {
      params.push(data.title);
      sets.push(`title = $${params.length}`);
    }
    if (data.metadata !== undefined) {
      params.push(JSON.stringify(data.metadata));
      sets.push(`metadata = $${params.length}`);
    }

    const res = await this.pool.query(
      `UPDATE conversations SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
      params
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      title: r.title,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      metadata: r.metadata,
    };
  }

  async deleteConversation(id: string, userId?: string): Promise<boolean> {
    const sql = userId
      ? `DELETE FROM conversations WHERE id = $1 AND user_id = $2`
      : `DELETE FROM conversations WHERE id = $1`;
    const params = userId ? [id, userId] : [id];
    const res = await this.pool.query(sql, params);
    return (res.rowCount ?? 0) > 0;
  }

  async addMessage(msg: Omit<Message, "sources" | "comparison">): Promise<Message> {
    const res = await this.pool.query(
      `INSERT INTO messages (id, conversation_id, role, content, intent, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        msg.id,
        msg.conversationId,
        msg.role,
        msg.content,
        msg.intent || "general_conversation",
        JSON.stringify(msg.metadata || {}),
        msg.createdAt ? new Date(msg.createdAt) : new Date(),
      ]
    );
    await this.pool.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [msg.conversationId]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role,
      content: r.content,
      intent: r.intent,
      createdAt: r.created_at.toISOString(),
      metadata: r.metadata,
    };
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const msgRes = await this.pool.query(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );

    const messages: Message[] = [];
    for (const r of msgRes.rows) {
      const sources = await this.getSourcesByMessage(r.id);
      const comparison = await this.getComparisonByMessageId(r.id);
      messages.push({
        id: r.id,
        conversationId: r.conversation_id,
        role: r.role,
        content: r.content,
        intent: r.intent,
        createdAt: r.created_at.toISOString(),
        metadata: r.metadata,
        sources: sources.length > 0 ? sources : undefined,
        comparison: comparison || undefined,
      });
    }
    return messages;
  }

  async createResearchSession(session: ResearchSession): Promise<ResearchSession> {
    const res = await this.pool.query(
      `INSERT INTO research_sessions (id, conversation_id, message_id, query, intent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        session.id,
        session.conversationId,
        session.messageId,
        session.query,
        session.intent,
        session.createdAt ? new Date(session.createdAt) : new Date(),
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      conversationId: r.conversation_id,
      messageId: r.message_id,
      query: r.query,
      intent: r.intent,
      createdAt: r.created_at.toISOString(),
    };
  }

  async addSearchQueries(queries: SearchQuery[]): Promise<void> {
    for (const q of queries) {
      await this.pool.query(
        `INSERT INTO search_queries (id, session_id, query_text, executed_at, result_count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [q.id, q.sessionId, q.queryText, new Date(q.executedAt), q.resultCount]
      );
    }
  }

  async addSources(sources: Source[]): Promise<void> {
    for (const s of sources) {
      await this.pool.query(
        `INSERT INTO sources (id, session_id, url, domain, title, snippet, retrieval_timestamp, publication_date, evidence_quality, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, snippet = EXCLUDED.snippet`,
        [
          s.id,
          s.sessionId || null,
          s.url,
          s.domain,
          s.title,
          s.snippet,
          new Date(s.retrievalTimestamp),
          s.publicationDate || null,
          s.evidenceQuality,
          s.confidenceScore || 0.8,
        ]
      );
    }
  }

  async getSourcesByMessage(messageId: string): Promise<Source[]> {
    const res = await this.pool.query(
      `SELECT s.* FROM sources s
       JOIN research_sessions rs ON s.session_id = rs.id
       WHERE rs.message_id = $1
       ORDER BY s.confidence_score DESC`,
      [messageId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      url: r.url,
      domain: r.domain,
      title: r.title,
      snippet: r.snippet,
      retrievalTimestamp: r.retrieval_timestamp.toISOString(),
      publicationDate: r.publication_date || undefined,
      evidenceQuality: r.evidence_quality,
      confidenceScore: r.confidence_score,
    }));
  }

  async addEvidenceSnapshots(snapshots: EvidenceSnapshot[]): Promise<void> {
    for (const s of snapshots) {
      await this.pool.query(
        `INSERT INTO evidence_snapshots (id, conversation_id, message_id, entity_name, attribute_name, extracted_value, snapshot_date, source_url, source_id, evidence_quality, raw_quote, confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [
          s.id,
          s.conversationId,
          s.messageId,
          s.entityName,
          s.attributeName,
          s.extractedValue,
          new Date(s.snapshotDate),
          s.sourceUrl || null,
          s.sourceId || null,
          s.evidenceQuality,
          s.rawQuote || null,
          s.confidence,
        ]
      );
    }
  }

  async getEvidenceSnapshots(conversationId: string): Promise<EvidenceSnapshot[]> {
    const res = await this.pool.query(
      `SELECT * FROM evidence_snapshots WHERE conversation_id = $1 ORDER BY snapshot_date ASC`,
      [conversationId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      messageId: r.message_id,
      entityName: r.entity_name,
      attributeName: r.attribute_name,
      extractedValue: r.extracted_value,
      snapshotDate: r.snapshot_date.toISOString(),
      sourceUrl: r.source_url,
      sourceId: r.source_id,
      evidenceQuality: r.evidence_quality,
      rawQuote: r.raw_quote,
      confidence: r.confidence,
    }));
  }

  async findEvidenceByEntities(entities: string[], beforeDate?: Date): Promise<EvidenceSnapshot[]> {
    if (entities.length === 0) return [];
    let sql = `SELECT * FROM evidence_snapshots WHERE LOWER(entity_name) = ANY($1)`;
    const params: unknown[] = [entities.map((e) => e.toLowerCase())];

    if (beforeDate) {
      params.push(beforeDate);
      sql += ` AND snapshot_date <= $2`;
    }
    sql += ` ORDER BY snapshot_date DESC`;

    const res = await this.pool.query(sql, params);
    return res.rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      messageId: r.message_id,
      entityName: r.entity_name,
      attributeName: r.attribute_name,
      extractedValue: r.extracted_value,
      snapshotDate: r.snapshot_date.toISOString(),
      sourceUrl: r.source_url,
      sourceId: r.source_id,
      evidenceQuality: r.evidence_quality,
      rawQuote: r.raw_quote,
      confidence: r.confidence,
    }));
  }

  async saveComparison(comp: HistoricalComparison): Promise<HistoricalComparison> {
    const res = await this.pool.query(
      `INSERT INTO historical_comparisons (id, conversation_id, message_id, target_date_phrase, resolved_date, status, summary, items, missing_baseline_disclosed, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        comp.id,
        comp.conversationId,
        comp.messageId,
        comp.targetDatePhrase,
        new Date(comp.resolvedDate),
        comp.status,
        comp.summary,
        JSON.stringify(comp.items),
        comp.missingBaselineDisclosed,
        new Date(comp.createdAt),
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      conversationId: r.conversation_id,
      messageId: r.message_id,
      targetDatePhrase: r.target_date_phrase,
      resolvedDate: r.resolved_date.toISOString(),
      status: r.status,
      summary: r.summary,
      items: r.items,
      missingBaselineDisclosed: r.missing_baseline_disclosed,
      createdAt: r.created_at.toISOString(),
    };
  }

  async getComparisonByMessageId(messageId: string): Promise<HistoricalComparison | null> {
    const res = await this.pool.query(
      `SELECT * FROM historical_comparisons WHERE message_id = $1`,
      [messageId]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      conversationId: r.conversation_id,
      messageId: r.message_id,
      targetDatePhrase: r.target_date_phrase,
      resolvedDate: r.resolved_date.toISOString(),
      status: r.status,
      summary: r.summary,
      items: r.items,
      missingBaselineDisclosed: r.missing_baseline_disclosed,
      createdAt: r.created_at.toISOString(),
    };
  }

  async findHistoricalConversations(criteria: HistoricalSearchCriteria): Promise<HistoricalMatch[]> {
    const limit = criteria.limit || 5;
    const conditions: string[] = ["c.user_id = $1"];
    const params: unknown[] = [criteria.userId];

    if (criteria.startDate && criteria.endDate) {
      params.push(criteria.startDate);
      const startIdx = params.length;
      params.push(criteria.endDate);
      const endIdx = params.length;
      conditions.push(`c.created_at >= $${startIdx} AND c.created_at <= $${endIdx}`);
    }

    if (criteria.query) {
      params.push(`%${criteria.query.toLowerCase()}%`);
      const qIdx = params.length;
      conditions.push(`(LOWER(c.title) LIKE $${qIdx} OR EXISTS (
        SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND LOWER(m.content) LIKE $${qIdx}
      ))`);
    }

    const sql = `
      SELECT c.* FROM conversations c
      WHERE ${conditions.join(" AND ")}
      ORDER BY c.created_at DESC
      LIMIT ${limit}
    `;

    const res = await this.pool.query(sql, params);
    const matches: HistoricalMatch[] = [];

    for (const row of res.rows) {
      const conv: Conversation = {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        metadata: row.metadata,
      };

      const messages = await this.getMessages(conv.id);
      const evidence = await this.getEvidenceSnapshots(conv.id);

      matches.push({
        conversation: conv,
        messages,
        evidenceSnapshots: evidence,
        matchReason: criteria.startDate ? "date_filter_match" : "keyword_match",
        score: 1.0,
      });
    }

    return matches;
  }
}
