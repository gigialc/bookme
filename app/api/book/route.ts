import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { query, getUserByUsername, EventType, AvailabilityRule, TravelSchedule } from "@/lib/db";
import { allBusy, createBookingEvent, getPrimaryAccount } from "@/lib/google";
import { computeSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { username, slug, startIso, name, email, notes, tz } = body ?? {};
  if (!username || !slug || !startIso || !name || !email) {
    return NextResponse.json({ error: "Please fill in your name and email 💌" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look quite right 🤔" }, { status: 400 });
  }

  const owner = await getUserByUsername(username);
  if (!owner) return NextResponse.json({ error: "This booking page no longer exists" }, { status: 404 });

  const [eventType] = await query<EventType>(
    "SELECT * FROM event_types WHERE user_id = $1 AND slug = $2 AND active = TRUE",
    [owner.id, slug]
  );
  if (!eventType) return NextResponse.json({ error: "This event type no longer exists" }, { status: 404 });

  const start = DateTime.fromISO(startIso, { zone: "utc" });
  if (!start.isValid) return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  const end = start.plus({ minutes: eventType.duration_mins });

  const rules = await query<AvailabilityRule>(
    "SELECT * FROM availability WHERE user_id = $1",
    [owner.id]
  );
  const travel = await query<TravelSchedule>(
    "SELECT * FROM travel_schedules WHERE user_id = $1 ORDER BY start_date",
    [owner.id]
  );
  const visitorTz = typeof tz === "string" && tz ? tz : owner.timezone;

  // Re-verify the slot is still free right before booking.
  const busy = await allBusy(
    owner.id,
    start.minus({ days: 1 }).toISO()!,
    end.plus({ days: 1 }).toISO()!
  );
  const validSlots = computeSlots({
    dateIso: start.setZone(visitorTz).toISODate()!,
    visitorTz,
    settings: owner,
    eventType,
    rules,
    busy,
    travel,
  });
  if (!validSlots.some((s) => s.startIso === start.toISO())) {
    return NextResponse.json(
      { error: "Oh no — someone just grabbed that time! Please pick another slot 🥺" },
      { status: 409 }
    );
  }

  const account = await getPrimaryAccount(owner.id);
  if (!account) {
    return NextResponse.json({ error: "No calendar is connected yet" }, { status: 500 });
  }

  const withMeet = /meet/i.test(eventType.location);
  let eventId = "";
  let meetLink: string | null = null;
  try {
    const created = await createBookingEvent({
      account,
      summary: `${eventType.emoji} ${eventType.name} — ${name}`,
      description: [
        `Booked via ${owner.display_name}'s booking page 💖`,
        ``,
        `Guest: ${name} <${email}>`,
        notes ? `Notes: ${notes}` : null,
      ]
        .filter((l) => l !== null)
        .join("\n"),
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      attendeeEmail: email,
      attendeeName: name,
      timezone: owner.timezone,
      withMeet,
    });
    eventId = created.eventId;
    meetLink = created.meetLink;
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err);
    return NextResponse.json(
      { error: "Couldn't create the calendar event — please try again in a moment" },
      { status: 500 }
    );
  }

  await query(
    `INSERT INTO bookings (user_id, event_type_id, name, email, notes, start_ts, end_ts, google_event_id, google_account_email, meet_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [owner.id, eventType.id, name, email, notes ?? "", start.toISO(), end.toISO(), eventId, account.email, meetLink]
  );

  return NextResponse.json({
    ok: true,
    meetLink,
    startIso: start.toISO(),
    endIso: end.toISO(),
    eventName: eventType.name,
    emoji: eventType.emoji,
  });
}
