import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserByUsername, query, EventType } from "@/lib/db";
import { getTheme, EVENT_COLORS } from "@/lib/themes";
import { ClockIcon, MapPinIcon, ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const eventTypes = await query<EventType>(
    "SELECT * FROM event_types WHERE user_id = $1 AND active = TRUE ORDER BY id ASC",
    [user.id]
  );
  const theme = getTheme(user.theme);
  const initial = (user.display_name || user.username).charAt(0).toUpperCase();

  return (
    <main className={`flex flex-1 flex-col items-center px-4 py-16 ${theme.pageBg}`}>
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold ${theme.accentBg} ${theme.accentText}`}
          >
            {initial}
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-stone-900">
            {user.display_name}
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">{user.welcome_message}</p>
        </div>

        {eventTypes.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-stone-500">Nothing bookable yet — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventTypes.map((et) => {
              const color = EVENT_COLORS[et.color] ?? EVENT_COLORS.rose;
              return (
                <Link
                  key={et.id}
                  href={`/${user.username}/${et.slug}`}
                  className="group block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${color.chip}`}>
                      {et.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-stone-900">{et.name}</h2>
                      {et.description && (
                        <p className="truncate text-sm text-stone-500">{et.description}</p>
                      )}
                      <p className="mt-1.5 flex items-center gap-3 text-xs font-medium text-stone-400">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" /> {et.duration_mins} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="h-3.5 w-3.5" /> {et.location}
                        </span>
                      </p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="mt-12 text-center text-xs text-stone-400">
          powered by{" "}
          <Link href="/" className="font-medium underline decoration-stone-300 underline-offset-2 hover:text-stone-600">
            bookme
          </Link>
        </p>
      </div>
    </main>
  );
}
