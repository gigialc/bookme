import { NextRequest, NextResponse } from "next/server";
import { query, Account, Booking } from "@/lib/db";
import { requireUser } from "@/lib/admin";
import { cancelBookingEvent } from "@/lib/google";

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
