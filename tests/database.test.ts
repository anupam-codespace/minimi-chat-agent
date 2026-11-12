import { describe, it, expect, beforeEach } from "vitest";
import { LocalDatabaseAdapter } from "../src/lib/db/local";
import path from "path";
import fs from "fs";

describe("Database Adapter Isolation & Persistence", () => {
  const testDbPath = path.join(process.cwd(), ".data", "test_minimi.db.json");
  let db: LocalDatabaseAdapter;

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new LocalDatabaseAdapter(testDbPath);
    await db.init();
  });

  it("enforces strict user data isolation", async () => {
    await db.upsertUser({ id: "user_a", email: "a@test.com" });
    await db.upsertUser({ id: "user_b", email: "b@test.com" });

    await db.createConversation({ id: "conv_a", userId: "user_a", title: "User A Discussion" });
    await db.createConversation({ id: "conv_b", userId: "user_b", title: "User B Discussion" });

    const listA = await db.listConversations("user_a");
    const listB = await db.listConversations("user_b");

    expect(listA).toHaveLength(1);
    expect(listA[0].id).toBe("conv_a");
    expect(listB).toHaveLength(1);
    expect(listB[0].id).toBe("conv_b");

    // Cross-user fetch returns null
    const crossFetch = await db.getConversation("conv_a", "user_b");
    expect(crossFetch).toBeNull();
  });

  it("cascades deletion of messages and evidence upon conversation deletion", async () => {
    const conv = await db.createConversation({ id: "conv_del", userId: "user_a", title: "To Delete" });
    await db.addMessage({
      id: "msg_1",
      conversationId: conv.id,
      role: "user",
      content: "Hello",
      createdAt: new Date().toISOString(),
    });
    await db.addEvidenceSnapshots([
      {
        id: "ev_1",
        conversationId: conv.id,
        messageId: "msg_1",
        entityName: "HubSpot",
        attributeName: "Price",
        extractedValue: "$90",
        snapshotDate: new Date().toISOString(),
        evidenceQuality: "official",
        confidence: 0.9,
      },
    ]);

    const deleted = await db.deleteConversation(conv.id, "user_a");
    expect(deleted).toBe(true);

    const msgs = await db.getMessages(conv.id);
    expect(msgs).toHaveLength(0);

    const evs = await db.getEvidenceSnapshots(conv.id);
    expect(evs).toHaveLength(0);
  });
});
