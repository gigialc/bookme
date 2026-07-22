import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { requireUser } from "@/lib/admin";
import { allCalendarEvents, createScheduleEvent } from "@/lib/google";
import { query, Account } from "@/lib/db";

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

export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  const { accountEmail, calendarId, title, startIso, endIso, timezone, location, description, guests, withMeet } = body;

  if (typeof accountEmail !== "string" || typeof calendarId !== "string" || !calendarId) {
    return NextResponse.json({ error: "missing calendar" }, { status: 400 });
  }
  const start = DateTime.fromISO(typeof startIso === "string" ? startIso : "");
  const end = DateTime.fromISO(typeof endIso === "string" ? endIso : "");
  if (!start.isValid || !end.isValid || end <= start) {
    return NextResponse.json({ error: "bad time range" }, { status: 400 });
  }

  const accounts = await query<Account>(
    "SELECT * FROM accounts WHERE user_id = $1 AND email = $2",
    [userId, accountEmail]
  );
  const account = accounts[0];
  if (!account) {
    return NextResponse.json({ error: "unknown account" }, { status: 400 });
  }

  try {
    const created = await createScheduleEvent({
      account,
      calendarId,
      summary:
        typeof title === "string" && title.trim() ? title.trim().slice(0, 300) : "(No title)",
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      timezone: typeof timezone === "string" && timezone ? timezone : "UTC",
      location: typeof location === "string" && location.trim() ? location.trim().slice(0, 500) : undefined,
      description:
        typeof description === "string" && description.trim()
          ? description.trim().slice(0, 5000)
          : undefined,
      attendees: Array.isArray(guests)
        ? guests
            .filter((g): g is string => typeof g === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g))
            .slice(0, 30)
        : [],
      withMeet: withMeet === true,
    });
    return NextResponse.json({ ok: true, event: created });
  } catch {
    return NextResponse.json(
      { error: "Google Calendar rejected the event — check the calendar is writable." },
      { status: 502 }
    );
  }
}
