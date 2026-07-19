import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json();
  await saveSettings({
    display_name: b.display_name,
    welcome_message: b.welcome_message,
    timezone: b.timezone,
    min_notice_hours: b.min_notice_hours,
    booking_window_days: b.booking_window_days,
    theme: b.theme,
    slot_step_mins: b.slot_step_mins,
  });
  return NextResponse.json({ settings: await getSettings() });
}
