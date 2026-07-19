import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings, query, EventType, AvailabilityRule } from "@/lib/db";
import { getTheme } from "@/lib/themes";
import BookingClient from "./BookingClient";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [eventType] = await query<EventType>(
    "SELECT * FROM event_types WHERE slug = $1 AND active = TRUE",
    [slug]
  );
  if (!eventType) notFound();

  const settings = await getSettings();
  const rules = await query<AvailabilityRule>("SELECT * FROM availability");
  const theme = getTheme(settings.theme);
  const availableWeekdays = [...new Set(rules.map((r) => r.weekday))];

  return (
    <main className={`flex flex-1 flex-col items-center px-4 py-10 ${theme.pageBg}`}>
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          ← back
        </Link>
        <BookingClient
          eventType={{
            slug: eventType.slug,
            name: eventType.name,
            emoji: eventType.emoji,
            description: eventType.description,
            duration_mins: eventType.duration_mins,
            location: eventType.location,
          }}
          displayName={settings.display_name}
          themeKey={settings.theme}
          bookingWindowDays={settings.booking_window_days}
          availableWeekdays={availableWeekdays}
          ownerTimezone={settings.timezone}
        />
      </div>
    </main>
  );
}
