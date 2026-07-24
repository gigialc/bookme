import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { requireUser } from "@/lib/admin";
import {
  allCalendarEvents,
  createScheduleEvent,
  deleteScheduleEvent,
  updateScheduleEvent,
} from "@/lib/google";
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

export async function PATCH(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const body = await req.json().catch(() => null);
  const { accountEmail, calendarId, eventId, startIso, endIso, timezone, title, location, description, guests } =
    body ?? {};
  if (
    typeof accountEmail !== "string" ||
    typeof calendarId !== "string" ||
    typeof eventId !== "string" ||
    !calendarId ||
    !eventId
  ) {
    return NextResponse.json({ error: "missing event" }, { status: 400 });
  }
  const start = DateTime.fromISO(typeof startIso === "string" ? startIso : "");
  const end = DateTime.fromISO(typeof endIso === "string" ? endIso : "");
  if (!start.isValid || !end.isValid || end <= start) {
    return NextResponse.json({ error: "bad time range" }, { status: 400 });
  }

  const [account] = await query<Account>(
    "SELECT * FROM accounts WHERE user_id = $1 AND email = $2",
    [userId, accountEmail]
  );
  if (!account) return NextResponse.json({ error: "unknown account" }, { status: 400 });

  try {
    await updateScheduleEvent({
      account,
      calendarId,
      eventId,
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      timezone: typeof timezone === "string" && timezone ? timezone : "UTC",
      summary:
        typeof title === "string" ? title.trim().slice(0, 300) || "(No title)" : undefined,
      location: typeof location === "string" ? location.trim().slice(0, 500) : undefined,
      description: typeof description === "string" ? description.trim().slice(0, 5000) : undefined,
      attendees: Array.isArray(guests)
        ? guests
            .filter((g): g is string => typeof g === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g))
            .slice(0, 30)
        : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Google Calendar rejected the change — only events you organise can be moved." },
      { status: 502 }
    );
  }

  // If this event came from a bookme booking, keep our record in sync.
  await query(
    "UPDATE bookings SET start_ts = $1, end_ts = $2 WHERE user_id = $3 AND google_event_id = $4",
    [start.toUTC().toISO(), end.toUTC().toISO(), userId, eventId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const accountEmail = req.nextUrl.searchParams.get("accountEmail");
  const calendarId = req.nextUrl.searchParams.get("calendarId");
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!accountEmail || !calendarId || !eventId) {
    return NextResponse.json({ error: "missing event" }, { status: 400 });
  }

  const [account] = await query<Account>(
    "SELECT * FROM accounts WHERE user_id = $1 AND email = $2",
    [userId, accountEmail]
  );
  if (!account) return NextResponse.json({ error: "unknown account" }, { status: 400 });

  try {
    await deleteScheduleEvent(account, calendarId, eventId);
  } catch {
    return NextResponse.json(
      { error: "Google Calendar rejected the delete — only events you organise can be cancelled." },
      { status: 502 }
    );
  }

  await query(
    "UPDATE bookings SET status = 'cancelled' WHERE user_id = $1 AND google_event_id = $2",
    [userId, eventId]
  );
  return NextResponse.json({ ok: true });
}
