import Link from "next/link";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { appUrl } from "@/lib/google";
import CopyLink from "./CopyLink";
import { CheckIcon, ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const accountCount = (
    await query("SELECT id FROM accounts WHERE user_id = $1", [user.id])
  ).length;
  const eventTypeCount = (
    await query("SELECT id FROM event_types WHERE user_id = $1 AND active = TRUE", [user.id])
  ).length;
  const upcoming = await query<{
    name: string;
    start_ts: string;
    event_name: string | null;
    event_emoji: string | null;
  }>(
    `SELECT b.name, b.start_ts, e.name AS event_name, e.emoji AS event_emoji
     FROM bookings b LEFT JOIN event_types e ON e.id = b.event_type_id
     WHERE b.user_id = $1 AND b.status = 'confirmed' AND b.start_ts > NOW()
     ORDER BY b.start_ts ASC LIMIT 5`,
    [user.id]
  );

  const steps = [
    { done: accountCount > 0, label: "Connect a Google calendar", href: "/dashboard/calendars" },
    { done: eventTypeCount > 0, label: "Create an event type", href: "/dashboard/event-types" },
    { done: true, label: "Set your weekly availability", href: "/dashboard/availability" },
  ];
  const setupDone = steps.every((s) => s.done);
  const bookingUrl = `${appUrl()}/${user.username}`;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Welcome back, {user.display_name}
      </h1>
      <p className="mb-9 text-sm text-stone-500">Here&apos;s what&apos;s happening with your bookings.</p>

      {!setupDone && (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-stone-900">Finish setting up</h2>
          <div className="space-y-1">
            {steps.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-stone-50"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    s.done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-stone-300 text-transparent"
                  }`}
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span className={`text-sm ${s.done ? "text-stone-400 line-through" : "font-medium text-stone-700"}`}>
                  {s.label}
                </span>
                {!s.done && <ArrowRightIcon className="ml-auto h-4 w-4 text-stone-300" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-2xl font-semibold">{accountCount}</p>
          <p className="mt-0.5 text-sm text-stone-500">
            connected calendar{accountCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-2xl font-semibold">{eventTypeCount}</p>
          <p className="mt-0.5 text-sm text-stone-500">
            active event type{eventTypeCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-stone-900">Your booking link</h2>
        <CopyLink url={bookingUrl} />
        <p className="mt-2.5 text-xs text-stone-400">
          You can change your username in{" "}
          <Link href="/dashboard/settings" className="underline underline-offset-2 hover:text-stone-600">
            settings
          </Link>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-stone-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-stone-400">
            No upcoming bookings yet — share your link to get started.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {upcoming.map((b, i) => (
              <li key={i} className="flex items-center gap-3 py-3 text-sm first:pt-0 last:pb-0">
                <span className="text-lg">{b.event_emoji ?? "•"}</span>
                <span className="font-medium text-stone-900">{b.name}</span>
                <span className="text-stone-400">{b.event_name ?? ""}</span>
                <span className="ml-auto text-stone-500">
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
