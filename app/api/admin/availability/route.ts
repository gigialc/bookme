import { NextRequest, NextResponse } from "next/server";
import { query, AvailabilityRule } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const rows = await query<AvailabilityRule>(
    "SELECT * FROM availability ORDER BY weekday, start_time"
  );
  return NextResponse.json({ rules: rows });
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json();
  const rules: { weekday: number; start_time: string; end_time: string }[] = b.rules ?? [];

  for (const r of rules) {
    if (
      !Number.isInteger(r.weekday) || r.weekday < 0 || r.weekday > 6 ||
      !TIME_RE.test(r.start_time) || !TIME_RE.test(r.end_time)
    ) {
      return NextResponse.json({ error: "invalid rule" }, { status: 400 });
    }
  }

  await query("DELETE FROM availability");
  for (const r of rules) {
    await query(
      "INSERT INTO availability (weekday, start_time, end_time) VALUES ($1, $2, $3)",
      [r.weekday, r.start_time, r.end_time]
    );
  }
  const rows = await query<AvailabilityRule>(
    "SELECT * FROM availability ORDER BY weekday, start_time"
  );
  return NextResponse.json({ rules: rows });
}
