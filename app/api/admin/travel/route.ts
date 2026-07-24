import { NextRequest, NextResponse } from "next/server";
import { IANAZone } from "luxon";
import { query, getTravelSchedules } from "@/lib/db";
import { requireUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  return NextResponse.json({ travel: await getTravelSchedules(userId) });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type TripInput = {
  label?: string;
  start_date: string;
  end_date: string;
  timezone: string;
  rules?: { weekday: number; start_time: string; end_time: string }[];
};

export async function PUT(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();
  const travel: TripInput[] = b.travel ?? [];

  for (const t of travel) {
    if (
      !DATE_RE.test(t.start_date) || !DATE_RE.test(t.end_date) ||
      t.end_date < t.start_date || !IANAZone.isValidZone(t.timezone)
    ) {
      return NextResponse.json({ error: "invalid travel schedule" }, { status: 400 });
    }
    for (const r of t.rules ?? []) {
      if (
        !Number.isInteger(r.weekday) || r.weekday < 0 || r.weekday > 6 ||
        !TIME_RE.test(r.start_time) || !TIME_RE.test(r.end_time)
      ) {
        return NextResponse.json({ error: "invalid rule" }, { status: 400 });
      }
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
    const [row] = await query<{ id: number }>(
      "INSERT INTO travel_schedules (user_id, label, start_date, end_date, timezone) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [userId, (t.label ?? "").slice(0, 100), t.start_date, t.end_date, t.timezone]
    );
    for (const r of t.rules ?? []) {
      await query(
        "INSERT INTO travel_availability (travel_id, weekday, start_time, end_time) VALUES ($1, $2, $3, $4)",
        [row.id, r.weekday, r.start_time, r.end_time]
      );
    }
  }
  return NextResponse.json({ travel: await getTravelSchedules(userId) });
}
