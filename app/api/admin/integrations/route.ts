import { NextRequest, NextResponse } from "next/server";
import { query, getUserById } from "@/lib/db";
import { requireUser } from "@/lib/admin";
import { testGranolaKey } from "@/lib/granola";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const user = await getUserById(userId);
  return NextResponse.json({
    granola_connected: Boolean(user?.granola_access_token || user?.granola_api_key),
    claude_extraction: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}

export async function PUT(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();
  const key = String(b.granola_api_key ?? "").trim();

  if (!key) {
    // Disconnect entirely: clear both the OAuth tokens and any API key.
    await query(
      `UPDATE users SET granola_api_key = NULL, granola_access_token = NULL,
       granola_refresh_token = NULL, granola_token_expires = NULL WHERE id = $1`,
      [userId]
    );
    return NextResponse.json({ granola_connected: false });
  }

  if (!key.startsWith("grn_")) {
    return NextResponse.json(
      { error: "Granola API keys start with grn_ — check the key and try again" },
      { status: 400 }
    );
  }
  try {
    const ok = await testGranolaKey(key);
    if (!ok) {
      return NextResponse.json(
        { error: "Granola rejected that key — generate a fresh one in the Granola app" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Granola to verify the key — try again in a moment" },
      { status: 502 }
    );
  }

  await query("UPDATE users SET granola_api_key = $2 WHERE id = $1", [userId, key]);
  return NextResponse.json({ granola_connected: true });
}
