import { NextRequest, NextResponse } from "next/server";
import { query, EventType } from "@/lib/db";
import { requireAdmin, slugify } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const rows = await query<EventType>("SELECT * FROM event_types ORDER BY id ASC");
  return NextResponse.json({ eventTypes: rows });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json();

  let slug = slugify(b.name ?? "chat");
  const clash = await query("SELECT id FROM event_types WHERE slug = $1", [slug]);
  if (clash.length > 0) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const [row] = await query<EventType>(
    `INSERT INTO event_types (slug, name, emoji, description, duration_mins, buffer_before, buffer_after, color, location, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE) RETURNING *`,
    [
      slug,
      b.name || "New chat",
      b.emoji || "💬",
      b.description ?? "",
      Number(b.duration_mins) || 30,
      Number(b.buffer_before) || 0,
      Number(b.buffer_after) || 0,
      b.color || "rose",
      b.location || "Google Meet",
    ]
  );
  return NextResponse.json({ eventType: row });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const [row] = await query<EventType>(
    `UPDATE event_types SET
       name = $2, emoji = $3, description = $4, duration_mins = $5,
       buffer_before = $6, buffer_after = $7, color = $8, location = $9, active = $10
     WHERE id = $1 RETURNING *`,
    [
      b.id,
      b.name || "Chat",
      b.emoji || "💬",
      b.description ?? "",
      Number(b.duration_mins) || 30,
      Number(b.buffer_before) || 0,
      Number(b.buffer_after) || 0,
      b.color || "rose",
      b.location || "Google Meet",
      b.active !== false,
    ]
  );
  return NextResponse.json({ eventType: row });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await query("DELETE FROM event_types WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
