import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/db";
import { getLLMProvider } from "@/lib/llm";
import { getSearchProvider } from "@/lib/search";
import { ConversationOrchestrator, AgentEvent } from "@/lib/agent/orchestrator";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message, userId = config.defaultUserId, timeZone = config.defaultTimezone } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'message' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await getDatabase();
    let convId = conversationId;

    if (!convId) {
      // Auto-create new conversation
      const newConv = await db.createConversation({
        userId,
        title: message.slice(0, 40) + (message.length > 40 ? "..." : ""),
      });
      convId = newConv.id;
    }

    const llm = getLLMProvider();
    const search = getSearchProvider();
    const orchestrator = new ConversationOrchestrator(db, llm, search);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial conversation metadata
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "init", conversationId: convId })}\n\n`)
        );

        try {
          await orchestrator.processMessage(
            convId,
            message,
            userId,
            timeZone,
            (event: AgentEvent) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          );
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", errorMessage: errMsg })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

