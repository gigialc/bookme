"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";

type CalendarEvent = {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
  accountEmail: string;
  meetLink: string | null;
};

const ACCOUNT_COLORS = ["#e03a3e", "#009ddc", "#61bb46", "#963d97", "#f5821f", "#fdb827"];

export default function TodayAgenda() {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [tz, setTz] = useState<string>("local");

  useEffect(() => {
    (async () => {
      try {
        const settingsRes = await fetch("/api/admin/settings");
        const settings = await settingsRes.json();
        const zone = settings.settings?.timezone || "local";
        setTz(zone);
        const start = DateTime.now().setZone(zone).startOf("day");
        const res = await fetch(
          `/api/admin/schedule?start=${encodeURIComponent(start.toISO()!)}&end=${encodeURIComponent(start.plus({ days: 1 }).toISO()!)}`
        );
        const data = await res.json();
        setEvents(data.events ?? []);
        setAccounts(data.accounts ?? []);
      } catch {
        setEvents([]);
      }
    })();
  }, []);

  const colorFor = (email: string) =>
    ACCOUNT_COLORS[Math.max(0, accounts.indexOf(email)) % ACCOUNT_COLORS.length];

  const now = DateTime.now().setZone(tz);
  const timed = (events ?? [])
    .filter((e) => !e.allDay)
    .sort((a, b) => a.startIso.localeCompare(b.startIso));

  return (
    <div className="card mb-6 overflow-hidden">
      <div className="titlebar">
        <span className="titlebar-box" />
        <span className="titlebar-label">today · {now.toFormat("ccc, LLL d")}</span>
      </div>
      <div className="p-5">
        {events === null && (
          <div className="space-y-2">
            <div className="skeleton h-6" />
            <div className="skeleton h-6 w-3/4" />
          </div>
        )}
        {events !== null && timed.length === 0 && (
          <p className="text-sm text-ink/50">Nothing on the calendar today — enjoy the space.</p>
        )}
        {events !== null && timed.length > 0 && (
          <ul className="space-y-2.5">
            {timed.slice(0, 8).map((e, i) => {
              const start = DateTime.fromISO(e.startIso).setZone(tz);
              const end = DateTime.fromISO(e.endIso).setZone(tz);
              const past = end < now;
              return (
                <li key={i} className={`flex items-center gap-3 text-sm ${past ? "opacity-45" : ""}`}>
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-sm border border-ink"
                    style={{ background: colorFor(e.accountEmail) }}
                  />
                  <span className="mono-label w-28 shrink-0 text-ink/60">
                    {start.toFormat("h:mm a")}–{end.toFormat("h:mm a")}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{e.title}</span>
                  {e.meetLink && !past && (
                    <a
                      href={e.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-plain shrink-0 px-2.5 py-1 text-xs font-bold"
                    >
                      Join
                    </a>
                  )}
                </li>
              );
            })}
            {timed.length > 8 && (
              <li>
                <Link href="/dashboard/schedule" className="mono-label text-ink/50 underline underline-offset-2">
                  +{timed.length - 8} more — open schedule
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
