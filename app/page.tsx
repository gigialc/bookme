import Link from "next/link";
import { getSettings, query, EventType } from "@/lib/db";
import { getTheme, EVENT_COLORS } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function Home() {
  let settings, eventTypes: EventType[];
  try {
    settings = await getSettings();
    eventTypes = await query<EventType>(
      "SELECT * FROM event_types WHERE active = TRUE ORDER BY id ASC"
    );
  } catch {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-3 text-5xl">🛠️</div>
          <h1 className="mb-2 text-xl font-bold">Almost there!</h1>
          <p className="text-sm text-neutral-500">
            The database isn&apos;t connected yet. Add <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code> to{" "}
            <code className="rounded bg-neutral-100 px-1">.env.local</code> and restart — the README has the full setup.
          </p>
        </div>
      </main>
    );
  }

  const theme = getTheme(settings.theme);

  return (
    <main className={`flex flex-1 flex-col items-center px-4 py-16 ${theme.pageBg}`}>
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <div className="animate-floaty mb-4 inline-block text-6xl">🗓️</div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Book time with {settings.display_name}
          </h1>
          <p className="text-neutral-600">{settings.welcome_message}</p>
        </div>

        {eventTypes.length === 0 ? (
          <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg backdrop-blur">
            <div className="mb-2 text-4xl">🌱</div>
            <p className="text-neutral-500">
              No bookable events yet — check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventTypes.map((et) => {
              const color = EVENT_COLORS[et.color] ?? EVENT_COLORS.rose;
              return (
                <Link
                  key={et.id}
                  href={`/book/${et.slug}`}
                  className="group block rounded-3xl bg-white/90 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${color.chip}`}>
                      {et.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold">{et.name}</h2>
                      {et.description && (
                        <p className="truncate text-sm text-neutral-500">{et.description}</p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-neutral-400">
                        ⏱️ {et.duration_mins} min · 📍 {et.location}
                      </p>
                    </div>
                    <span className={`text-2xl transition group-hover:translate-x-1 ${theme.accentTextColor}`}>
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="mt-12 text-center text-xs text-neutral-400">
          made with 💖 · <Link href="/login" className="underline decoration-dotted hover:text-neutral-600">owner login</Link>
        </p>
      </div>
    </main>
  );
}
