import Link from "next/link";
import { query, getSettings } from "@/lib/db";
import { appUrl } from "@/lib/google";
import CopyLink from "./CopyLink";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  let accountCount = 0;
  let eventTypeCount = 0;
  let upcoming: { name: string; start_ts: string; event_name: string | null; event_emoji: string | null }[] = [];
  let displayName = "there";
  let dbOk = true;

  try {
    const settings = await getSettings();
    displayName = settings.display_name;
    accountCount = (await query("SELECT id FROM accounts")).length;
    eventTypeCount = (await query("SELECT id FROM event_types WHERE active = TRUE")).length;
    upcoming = await query(
      `SELECT b.name, b.start_ts, e.name AS event_name, e.emoji AS event_emoji
       FROM bookings b LEFT JOIN event_types e ON e.id = b.event_type_id
       WHERE b.status = 'confirmed' AND b.start_ts > NOW()
       ORDER BY b.start_ts ASC LIMIT 5`
    );
  } catch {
    dbOk = false;
  }

  if (!dbOk) {
    return (
      <div className="max-w-lg rounded-3xl bg-white p-8 shadow">
        <div className="mb-2 text-4xl">🛠️</div>
        <h1 className="mb-2 text-xl font-bold">Database not connected</h1>
        <p className="text-sm text-neutral-500">
          Add <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code> to your{" "}
          <code className="rounded bg-neutral-100 px-1">.env.local</code> and restart the app. The
          README walks you through it step by step 💪
        </p>
      </div>
    );
  }

  const steps = [
    { done: accountCount > 0, label: "Connect a Google calendar", href: "/dashboard/calendars", emoji: "📅" },
    { done: eventTypeCount > 0, label: "Create an event type", href: "/dashboard/event-types", emoji: "💬" },
    { done: true, label: "Set your weekly availability", href: "/dashboard/availability", emoji: "🕐" },
  ];
  const setupDone = steps.every((s) => s.done);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">Hi {displayName}! 🌸</h1>
      <p className="mb-8 text-neutral-500">Here&apos;s what&apos;s happening with your bookings.</p>

      {!setupDone && (
        <div className="mb-8 rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 font-bold">✨ Let&apos;s get you set up</h2>
          <div className="space-y-2">
            {steps.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-rose-50"
              >
                <span className="text-xl">{s.done ? "✅" : s.emoji}</span>
                <span className={`text-sm font-semibold ${s.done ? "text-neutral-400 line-through" : ""}`}>
                  {s.label}
                </span>
                {!s.done && <span className="ml-auto text-rose-400">→</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="text-3xl font-bold">{accountCount}</p>
          <p className="text-sm text-neutral-500">connected calendar{accountCount === 1 ? "" : "s"} 📅</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="text-3xl font-bold">{eventTypeCount}</p>
          <p className="text-sm text-neutral-500">active event type{eventTypeCount === 1 ? "" : "s"} 💬</p>
        </div>
      </div>

      <div className="mb-8 rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-2 font-bold">🔗 Your booking link</h2>
        <CopyLink url={appUrl()} />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-4 font-bold">💖 Coming up</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-400">No upcoming bookings yet — share your link!</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="text-xl">{b.event_emoji ?? "💬"}</span>
                <span className="font-semibold">{b.name}</span>
                <span className="text-neutral-400">{b.event_name ?? ""}</span>
                <span className="ml-auto text-neutral-500">
                  {new Date(b.start_ts).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
