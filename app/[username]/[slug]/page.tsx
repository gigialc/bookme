import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserByUsername, query, EventType, AvailabilityRule } from "@/lib/db";
import { getTheme } from "@/lib/themes";
import BookingClient from "./BookingClient";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  const user = await getUserByUsername(username);
  if (!user) notFound();

  const [eventType] = await query<EventType>(
    "SELECT * FROM event_types WHERE user_id = $1 AND slug = $2 AND active = TRUE",
    [user.id, slug]
  );
  if (!eventType) notFound();

  const rules = await query<AvailabilityRule>(
    "SELECT * FROM availability WHERE user_id = $1",
    [user.id]
  );
  const theme = getTheme(user.theme);
  const availableWeekdays = [...new Set(rules.map((r) => r.weekday))];

  return (
    <main className={`flex flex-1 flex-col items-center px-4 py-10 ${theme.pageBg}`}>
      <div className="w-full max-w-2xl">
        <Link
          href={`/${user.username}`}
          className="mb-4 inline-block text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          ← back
        </Link>
        <BookingClient
          username={user.username}
          eventType={{
            slug: eventType.slug,
            name: eventType.name,
            emoji: eventType.emoji,
            description: eventType.description,
            duration_mins: eventType.duration_mins,
            location: eventType.location,
          }}
          displayName={user.display_name}
          themeKey={user.theme}
          bookingWindowDays={user.booking_window_days}
          availableWeekdays={availableWeekdays}
          ownerTimezone={user.timezone}
        />
      </div>
    </main>
  );
}
