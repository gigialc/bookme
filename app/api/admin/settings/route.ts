import { NextRequest, NextResponse } from "next/server";
import { query, getUserById, RESERVED_USERNAMES, USERNAME_RE, User } from "@/lib/db";
import { requireUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

function publicSettings(user: User) {
  return {
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    welcome_message: user.welcome_message,
    timezone: user.timezone,
    min_notice_hours: user.min_notice_hours,
    booking_window_days: user.booking_window_days,
    theme: user.theme,
    slot_step_mins: user.slot_step_mins,
    avatar_url: user.avatar_url,
  };
}

export async function GET() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ settings: publicSettings(user) });
}

export async function PUT(req: NextRequest) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const b = await req.json();

  if (b.username !== undefined) {
    const username = String(b.username).toLowerCase().trim();
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "Usernames are 3–30 chars: lowercase letters, numbers, dashes" },
        { status: 400 }
      );
    }
    if (RESERVED_USERNAMES.has(username)) {
      return NextResponse.json({ error: "That username is reserved 🙈" }, { status: 400 });
    }
    const clash = await query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [username, userId]
    );
    if (clash.length > 0) {
      return NextResponse.json({ error: "That username is taken 🥺" }, { status: 409 });
    }
    await query("UPDATE users SET username = $2 WHERE id = $1", [userId, username]);
  }

  await query(
    `UPDATE users SET
       display_name = COALESCE($2, display_name),
       welcome_message = COALESCE($3, welcome_message),
       timezone = COALESCE($4, timezone),
       min_notice_hours = COALESCE($5, min_notice_hours),
       booking_window_days = COALESCE($6, booking_window_days),
       theme = COALESCE($7, theme),
       slot_step_mins = COALESCE($8, slot_step_mins)
     WHERE id = $1`,
    [
      userId,
      b.display_name ?? null,
      b.welcome_message ?? null,
      b.timezone ?? null,
      b.min_notice_hours !== undefined ? Number(b.min_notice_hours) : null,
      b.booking_window_days !== undefined ? Number(b.booking_window_days) : null,
      b.theme ?? null,
      b.slot_step_mins !== undefined ? Number(b.slot_step_mins) : null,
    ]
  );

  const user = await getUserById(userId);
  return NextResponse.json({ settings: publicSettings(user!) });
}
