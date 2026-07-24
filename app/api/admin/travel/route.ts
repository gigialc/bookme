import { NextRequest, NextResponse } from "next/server";
import { IANAZone } from "luxon";
import { query, TravelSchedule } from "@/lib/db";
import { requireUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const rows = await query<TravelSchedule>(
    "SELECT * FROM travel_schedules WHERE user_id = $1 ORDER BY start_date",
    [userId]
  );
  return NextResponse.json({ travel: rows });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PUT(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();
  const travel: { label?: string; start_date: string; end_date: string; timezone: string }[] =
    b.travel ?? [];

  for (const t of travel) {
    if (
      !DATE_RE.test(t.start_date) || !DATE_RE.test(t.end_date) ||
      t.end_date < t.start_date || !IANAZone.isValidZone(t.timezone)
    ) {
      return NextResponse.json({ error: "invalid travel schedule" }, { status: 400 });
    }
  }
  for (const a of travel) {
    for (const other of travel) {
      if (a === other) continue;
      if (a.start_date <= other.end_date && other.start_date <= a.end_date) {
        return NextResponse.json({ error: "overlapping travel schedules" }, { status: 400 });
      }
    }
  }

  await query("DELETE FROM travel_schedules WHERE user_id = $1", [userId]);
  for (const t of travel) {
    await query(
      "INSERT INTO travel_schedules (user_id, label, start_date, end_date, timezone) VALUES ($1, $2, $3, $4, $5)",
      [userId, (t.label ?? "").slice(0, 100), t.start_date, t.end_date, t.timezone]
    );
  }
  const rows = await query<TravelSchedule>(
    "SELECT * FROM travel_schedules WHERE user_id = $1 ORDER BY start_date",
    [userId]
  );
  return NextResponse.json({ travel: rows });
}
