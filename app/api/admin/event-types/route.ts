import { NextRequest, NextResponse } from "next/server";
import { query, EventType } from "@/lib/db";
import { requireUser, slugify } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const rows = await query<EventType>(
    "SELECT * FROM event_types WHERE user_id = $1 ORDER BY id ASC",
    [userId]
  );
  return NextResponse.json({ eventTypes: rows });
}

export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();

  let slug = slugify(b.name ?? "chat");
  const clash = await query(
    "SELECT id FROM event_types WHERE user_id = $1 AND slug = $2",
    [userId, slug]
  );
  if (clash.length > 0) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const [row] = await query<EventType>(
    `INSERT INTO event_types (user_id, slug, name, emoji, description, duration_mins, buffer_before, buffer_after, color, location, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE) RETURNING *`,
    [
      userId,
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
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const [row] = await query<EventType>(
    `UPDATE event_types SET
       name = $3, emoji = $4, description = $5, duration_mins = $6,
       buffer_before = $7, buffer_after = $8, color = $9, location = $10, active = $11
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [
      b.id,
      userId,
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
  return NextResponse.json({ eventType: row ?? null });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await query("DELETE FROM event_types WHERE id = $1 AND user_id = $2", [id, userId]);
  return NextResponse.json({ ok: true });
}
