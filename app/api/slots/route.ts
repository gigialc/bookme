import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { query, getUserByUsername, getTravelSchedules, EventType, AvailabilityRule } from "@/lib/db";
import { allBusy } from "@/lib/google";
import { computeSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  const slug = req.nextUrl.searchParams.get("slug");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD in visitor tz
  const tz = req.nextUrl.searchParams.get("tz") || "UTC";
  if (!username || !slug || !date) {
    return NextResponse.json({ error: "missing username, slug or date" }, { status: 400 });
  }

  const user = await getUserByUsername(username);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [eventType] = await query<EventType>(
    "SELECT * FROM event_types WHERE user_id = $1 AND slug = $2 AND active = TRUE",
    [user.id, slug]
  );
  if (!eventType) return NextResponse.json({ error: "not found" }, { status: 404 });

  const rules = await query<AvailabilityRule>(
    "SELECT * FROM availability WHERE user_id = $1",
    [user.id]
  );
  const travel = await getTravelSchedules(user.id);

  const dayStart = DateTime.fromISO(date, { zone: tz }).startOf("day");
  if (!dayStart.isValid) return NextResponse.json({ error: "bad date" }, { status: 400 });

  const busy = await allBusy(
    user.id,
    dayStart.minus({ days: 1 }).toUTC().toISO()!,
    dayStart.plus({ days: 2 }).toUTC().toISO()!
  );

  const slots = computeSlots({
    dateIso: date,
    visitorTz: tz,
    settings: user,
    eventType,
    rules,
    busy,
    travel,
  });

  return NextResponse.json({ slots });
}
