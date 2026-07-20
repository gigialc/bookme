import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { requireUser } from "@/lib/admin";
import { allCalendarEvents } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const start = DateTime.fromISO(req.nextUrl.searchParams.get("start") ?? "");
  const end = DateTime.fromISO(req.nextUrl.searchParams.get("end") ?? "");
  if (!start.isValid || !end.isValid || end <= start) {
    return NextResponse.json({ error: "bad range" }, { status: 400 });
  }
  if (end.diff(start, "days").days > 35) {
    return NextResponse.json({ error: "range too large" }, { status: 400 });
  }

  const { events, accounts, calendars } = await allCalendarEvents(
    userId,
    start.toUTC().toISO()!,
    end.toUTC().toISO()!
  );
  return NextResponse.json({ events, accounts, calendars });
}
