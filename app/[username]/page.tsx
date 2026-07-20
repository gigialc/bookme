import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserByUsername, query, EventType } from "@/lib/db";
import { getTheme, EVENT_COLORS } from "@/lib/themes";
import { ClockIcon, MapPinIcon, ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  try {
    const { username } = await params;
    const user = await getUserByUsername(username);
    if (!user) return { title: "bookme" };
    const title = `Book time with ${user.display_name}`;
    return {
      title: `${title} — bookme`,
      description: user.welcome_message,
      openGraph: { title, description: user.welcome_message },
    };
  } catch {
    return { title: "bookme" };
  }
}

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
    <main className="flex flex-1 flex-col items-center bg-cream px-4 py-14">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-ink object-cover"
              style={{ boxShadow: "4px 4px 0 #1a1a1a" }}
            />
          ) : (
            <div
              className={`card mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${theme.accentBg} ${theme.accentText}`}
              style={{ borderRadius: "9999px" }}
            >
              {initial}
            </div>
          )}
          <h1 className="mb-2 text-2xl font-bold tracking-tight">{user.display_name}</h1>
          <p className="text-sm leading-relaxed text-ink/60">{user.welcome_message}</p>
        </div>

        <div className="card overflow-hidden">
          <div className="titlebar">
            <span className="titlebar-box" />
            <span className="titlebar-label">book a time</span>
          </div>

          {eventTypes.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-ink/50">Nothing bookable yet — check back soon.</p>
            </div>
          ) : (
            <div>
              {eventTypes.map((et, i) => {
                const color = EVENT_COLORS[et.color] ?? EVENT_COLORS.rose;
                return (
                  <Link
                    key={et.id}
                    href={`/${user.username}/${et.slug}`}
                    className={`group block p-5 transition hover:bg-cream ${
                      i > 0 ? "border-t-2 border-ink" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-xl ${color.chip}`}
                      >
                        {et.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold">{et.name}</h2>
                        {et.description && (
                          <p className="truncate text-sm text-ink/60">{et.description}</p>
                        )}
                        <p className="mono-label mt-1.5 flex items-center gap-3 text-ink/50">
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" /> {et.duration_mins} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" /> {et.location}
                          </span>
                        </p>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <p className="mono-label mt-10 text-center text-ink/40">
          powered by{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-ink">
            bookme
          </Link>
        </p>
      </div>
    </main>
  );
}
