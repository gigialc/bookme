import { NextRequest, NextResponse } from "next/server";
import { query, Account } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const rows = await query<Account>(
    "SELECT id, email, is_primary, include_in_busy, created_at FROM accounts ORDER BY id ASC"
  );
  return NextResponse.json({ accounts: rows });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  if (b.action === "make_primary") {
    await query("UPDATE accounts SET is_primary = FALSE");
    await query("UPDATE accounts SET is_primary = TRUE WHERE id = $1", [b.id]);
  } else if (b.action === "toggle_busy") {
    await query("UPDATE accounts SET include_in_busy = NOT include_in_busy WHERE id = $1", [b.id]);
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await query("DELETE FROM accounts WHERE id = $1", [id]);
  // If the primary was removed, promote the oldest remaining account.
  const primaries = await query("SELECT id FROM accounts WHERE is_primary = TRUE");
  if (primaries.length === 0) {
    await query(
      "UPDATE accounts SET is_primary = TRUE WHERE id = (SELECT id FROM accounts ORDER BY id ASC LIMIT 1)"
    );
  }
  return NextResponse.json({ ok: true });
}
