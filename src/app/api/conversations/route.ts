import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || config.defaultUserId;

    const db = await getDatabase();
    const conversations = await db.listConversations(userId);

    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = "New Research Session", userId = config.defaultUserId, metadata } = body;

    const db = await getDatabase();
    const conv = await db.createConversation({
      userId,
      title,
      metadata,
    });

    return NextResponse.json({ conversation: conv }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

