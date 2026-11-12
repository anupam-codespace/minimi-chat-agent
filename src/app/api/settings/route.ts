import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();

    return NextResponse.json({
      runtime: "Node.js",
      nodeVersion: process.version,
      persistence: {
        adapter: db.name,
        isPostgres: db.name === "PostgreSQL",
      },
      llm: {
        provider: config.llmProvider,
        geminiConfigured: !!config.geminiApiKey,
        openaiConfigured: !!config.openaiApiKey,
        groqConfigured: !!config.groqApiKey,
        model: config.llmProvider === "gemini" ? config.geminiModel : config.openaiModel,
      },
      search: {
        provider: config.searchProvider,
        tavilyConfigured: !!config.tavilyApiKey,
        braveConfigured: !!config.braveApiKey,
        serperConfigured: !!config.serperApiKey,
      },
      limits: {
        maxSearchQueries: config.maxSearchQueries,
        maxSourcesPerQuery: config.maxSourcesPerQuery,
        searchTimeoutMs: config.searchTimeoutMs,
      },
      user: {
        defaultUserId: config.defaultUserId,
        defaultTimezone: config.defaultTimezone,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

