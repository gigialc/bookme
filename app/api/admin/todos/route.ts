import { NextRequest, NextResponse } from "next/server";
import { query, Todo } from "@/lib/db";
import { requireUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const rows = await query<Todo>(
    "SELECT * FROM todos WHERE user_id = $1 AND source != 'granola-empty' ORDER BY done ASC, created_at DESC LIMIT 300",
    [userId]
  );
  return NextResponse.json({ todos: rows });
}

export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();
  const text = String(b.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  const [todo] = await query<Todo>(
    "INSERT INTO todos (user_id, text, source) VALUES ($1, $2, 'manual') RETURNING *",
    [userId, text.slice(0, 500)]
  );
  return NextResponse.json({ todo });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const [todo] = await query<Todo>(
    "UPDATE todos SET done = NOT done WHERE id = $1 AND user_id = $2 RETURNING *",
    [b.id, userId]
  );
  return NextResponse.json({ todo: todo ?? null });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await query("DELETE FROM todos WHERE id = $1 AND user_id = $2", [id, userId]);
  return NextResponse.json({ ok: true });
}
