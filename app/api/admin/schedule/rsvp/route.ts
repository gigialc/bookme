import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { rsvpScheduleEvent } from "@/lib/google";
import { query, Account } from "@/lib/db";

export const dynamic = "force-dynamic";

const RESPONSES = ["accepted", "declined", "tentative"] as const;

export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const body = await req.json().catch(() => null);
  const { accountEmail, calendarId, eventId, response } = body ?? {};
  if (
    typeof accountEmail !== "string" ||
    typeof calendarId !== "string" ||
    typeof eventId !== "string" ||
    !calendarId ||
    !eventId
  ) {
    return NextResponse.json({ error: "missing event" }, { status: 400 });
  }
  if (!RESPONSES.includes(response)) {
    return NextResponse.json({ error: "bad response" }, { status: 400 });
  }

  const [account] = await query<Account>(
    "SELECT * FROM accounts WHERE user_id = $1 AND email = $2",
    [userId, accountEmail]
  );
  if (!account) return NextResponse.json({ error: "unknown account" }, { status: 400 });

  try {
    await rsvpScheduleEvent({ account, calendarId, eventId, response });
  } catch {
    return NextResponse.json(
      { error: "Google Calendar rejected the RSVP — you may not be on the guest list." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
