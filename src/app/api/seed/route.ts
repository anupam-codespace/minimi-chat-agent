import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: "Database re-seeded successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

