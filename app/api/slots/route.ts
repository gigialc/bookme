import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { query, getSettings, EventType, AvailabilityRule } from "@/lib/db";
import { allBusy } from "@/lib/google";
import { computeSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD in visitor tz
  const tz = req.nextUrl.searchParams.get("tz") || "UTC";
  if (!slug || !date) {
    return NextResponse.json({ error: "missing slug or date" }, { status: 400 });
  }

  const [eventType] = await query<EventType>(
    "SELECT * FROM event_types WHERE slug = $1 AND active = TRUE",
    [slug]
  );
  if (!eventType) return NextResponse.json({ error: "not found" }, { status: 404 });

  const settings = await getSettings();
  const rules = await query<AvailabilityRule>("SELECT * FROM availability");

  const dayStart = DateTime.fromISO(date, { zone: tz }).startOf("day");
  if (!dayStart.isValid) return NextResponse.json({ error: "bad date" }, { status: 400 });

  const busy = await allBusy(
    dayStart.minus({ days: 1 }).toUTC().toISO()!,
    dayStart.plus({ days: 2 }).toUTC().toISO()!
  );

  const slots = computeSlots({
    dateIso: date,
    visitorTz: tz,
    settings,
    eventType,
    rules,
    busy,
  });

  return NextResponse.json({ slots });
}
