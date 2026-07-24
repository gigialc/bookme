import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { query, Account, Booking, EventType, User } from "@/lib/db";
import { requireUser } from "@/lib/admin";
import { cancelBookingEvent, updateScheduleEvent } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const rows = await query(
    `SELECT b.*, e.name AS event_name, e.emoji AS event_emoji
     FROM bookings b LEFT JOIN event_types e ON e.id = b.event_type_id
     WHERE b.user_id = $1
     ORDER BY b.start_ts DESC LIMIT 200`,
    [userId]
  );
  return NextResponse.json({ bookings: rows });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const body = await req.json().catch(() => null);
  const { id, startIso } = body ?? {};
  if (!id || typeof startIso !== "string") {
    return NextResponse.json({ error: "missing id or startIso" }, { status: 400 });
  }
  const start = DateTime.fromISO(startIso);
  if (!start.isValid) return NextResponse.json({ error: "bad time" }, { status: 400 });

  const [booking] = await query<Booking>(
    "SELECT * FROM bookings WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "booking is cancelled" }, { status: 400 });
  }

  // Keep the original meeting length.
  const [eventType] = await query<EventType>("SELECT * FROM event_types WHERE id = $1", [
    booking.event_type_id,
  ]);
  const durationMins =
    eventType?.duration_mins ??
    Math.max(5, DateTime.fromISO(booking.end_ts).diff(DateTime.fromISO(booking.start_ts), "minutes").minutes);
  const end = start.plus({ minutes: durationMins });

  if (booking.google_event_id && booking.google_account_email) {
    const [account] = await query<Account>(
      "SELECT * FROM accounts WHERE email = $1 AND user_id = $2",
      [booking.google_account_email, userId]
    );
    const [user] = await query<User>("SELECT * FROM users WHERE id = $1", [userId]);
    if (account) {
      try {
        await updateScheduleEvent({
          account,
          calendarId: "primary",
          eventId: booking.google_event_id,
          startIso: start.toUTC().toISO()!,
          endIso: end.toUTC().toISO()!,
          timezone: user?.timezone || "UTC",
        });
      } catch (err) {
        console.error("Could not move Google event:", err);
        return NextResponse.json(
          { error: "Google Calendar rejected the change — try again." },
          { status: 502 }
        );
      }
    }
  }

  await query(
    "UPDATE bookings SET start_ts = $1, end_ts = $2 WHERE id = $3 AND user_id = $4",
    [start.toUTC().toISO(), end.toUTC().toISO(), id, userId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const [booking] = await query<Booking>(
    "SELECT * FROM bookings WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (booking.google_event_id && booking.google_account_email) {
    const [account] = await query<Account>(
      "SELECT * FROM accounts WHERE email = $1 AND user_id = $2",
      [booking.google_account_email, userId]
    );
    if (account) {
      try {
        await cancelBookingEvent(account, booking.google_event_id);
      } catch (err) {
        console.error("Could not delete Google event (continuing):", err);
      }
    }
  }

  await query("UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2", [
    id,
    userId,
  ]);
  return NextResponse.json({ ok: true });
}
