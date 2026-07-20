"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime, Interval } from "luxon";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  MailIcon,
  UsersIcon,
  VideoIcon,
  CalendarIcon,
} from "@/components/icons";

type CalendarEvent = {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
  accountEmail: string;
  calendarName: string;
  meetLink: string | null;
  location: string | null;
  description: string | null;
  htmlLink: string | null;
  organizer: string | null;
  attendees: { email: string; name: string | null; response: string | null }[];
};

// the classic six colors, in stripe order
const ACCOUNT_COLORS = ["#e03a3e", "#009ddc", "#61bb46", "#963d97", "#f5821f", "#fdb827"];

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_PX = 48;

const RESPONSE_ICON: Record<string, string> = {
  accepted: "✓",
  declined: "✗",
  tentative: "~",
  needsAction: "?",
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

type Positioned = {
  event: CalendarEvent;
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

/** Greedy lane assignment so overlapping events sit side by side. */
function layoutDay(
  events: { event: CalendarEvent; start: DateTime; end: DateTime }[],
  hourPx: number
): Positioned[] {
  const sorted = [...events].sort((a, b) => a.start.toMillis() - b.start.toMillis());
  const laneEnds: DateTime[] = [];
  const placed: (Positioned & { start: DateTime; end: DateTime })[] = [];

  for (const e of sorted) {
    let lane = laneEnds.findIndex((end) => e.start >= end);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e.end);
    } else {
      laneEnds[lane] = e.end;
    }
    const startH = e.start.hour + e.start.minute / 60;
    const endH = e.end.hour + e.end.minute / 60;
    const top = (Math.max(startH, DAY_START_HOUR) - DAY_START_HOUR) * hourPx;
    const bottom = (Math.min(endH === 0 ? 24 : endH, DAY_END_HOUR) - DAY_START_HOUR) * hourPx;
    placed.push({
      event: e.event,
      start: e.start,
      end: e.end,
      top,
      height: Math.max(bottom - top, 20),
      lane,
      lanes: 1,
    });
  }

  for (const p of placed) {
    const overlapping = placed.filter((q) => q.start < p.end && q.end > p.start);
    const lanes = Math.max(...overlapping.map((q) => q.lane)) + 1;
    for (const q of overlapping) q.lanes = Math.max(q.lanes, lanes);
  }
  return placed;
}

export default function SchedulePage() {
  const [tz, setTz] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<DateTime | null>(null);
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const hourPx = HOUR_PX;
  const gridRef = useRef<HTMLDivElement>(null);

  // Start the scroll position at a useful hour (near "now" for the current
  // week, 7am otherwise) — like Google Calendar.
  useEffect(() => {
    if (!gridRef.current || !weekStart) return;
    const now = DateTime.now().setZone(tz ?? "local");
    const inThisWeek = now >= weekStart && now < weekStart.plus({ days: 7 });
    const targetHour = inThisWeek ? Math.max(now.hour - 2, 0) : 7;
    gridRef.current.scrollTop = targetHour * HOUR_PX;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart === null, tz]);

  // Week starts once we know the timezone from settings.
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const zone = d.settings?.timezone || "local";
        setTz(zone);
        setWeekStart(DateTime.now().setZone(zone).startOf("week"));
      })
      .catch(() => {
        setTz("local");
        setWeekStart(DateTime.now().startOf("week"));
      });
  }, []);

  const days = useMemo(
    () =>
      weekStart ? Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })) : [],
    [weekStart]
  );
  const today = tz ? DateTime.now().setZone(tz).startOf("day") : DateTime.now().startOf("day");

  const load = useCallback(async () => {
    if (!weekStart) return;
    setEvents(null);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/schedule?start=${encodeURIComponent(weekStart.toISO()!)}&end=${encodeURIComponent(weekStart.plus({ days: 7 }).toISO()!)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setEvents(data.events ?? []);
      setAccounts(data.accounts ?? []);
    } catch {
      setEvents([]);
      setError("Couldn't load your calendars — try refreshing.");
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const colorFor = (email: string) =>
    ACCOUNT_COLORS[Math.max(0, accounts.indexOf(email)) % ACCOUNT_COLORS.length];

  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, i) => DAY_START_HOUR + i
  );

  const inTz = useCallback(
    (iso: string) => DateTime.fromISO(iso).setZone(tz ?? "local"),
    [tz]
  );

  function eventsForDay(day: DateTime) {
    const dayInt = Interval.fromDateTimes(day, day.plus({ days: 1 }));
    const timed: { event: CalendarEvent; start: DateTime; end: DateTime }[] = [];
    const allDay: CalendarEvent[] = [];
    for (const e of events ?? []) {
      const start = inTz(e.startIso);
      const end = inTz(e.endIso);
      if (!Interval.fromDateTimes(start, end).overlaps(dayInt)) continue;
      if (e.allDay) {
        allDay.push(e);
      } else {
        timed.push({
          event: e,
          start: start < day ? day : start,
          end: end > day.plus({ days: 1 }) ? day.endOf("day") : end,
        });
      }
    }
    return { timed: layoutDay(timed, hourPx), allDay };
  }

  if (!weekStart) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-ink/60">
            Every event from all your connected accounts, in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(weekStart.minus({ weeks: 1 }))}
            className="btn-plain p-2"
            aria-label="Previous week"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => setWeekStart(DateTime.now().setZone(tz ?? "local").startOf("week"))}
            className="btn-plain px-3.5 py-2 text-xs font-bold"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart(weekStart.plus({ weeks: 1 }))}
            className="btn-plain p-2"
            aria-label="Next week"
          >
            <ChevronRightIcon />
          </button>
          <span className="ml-2 font-bold">
            {weekStart.toFormat("LLL d")} – {weekStart.plus({ days: 6 }).toFormat("LLL d, yyyy")}
          </span>
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {accounts.map((a) => (
            <span key={a} className="mono-label flex items-center gap-1.5 text-ink/70">
              <span
                className="inline-block h-3 w-3 rounded-sm border border-ink"
                style={{ background: colorFor(a) }}
              />
              {a}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="card-flat mb-4 bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="titlebar">
          <span className="titlebar-box" />
          <span className="titlebar-label">
            {events === null ? "loading…" : `${events.length} events this week`}
          </span>
        </div>

        <div
          ref={gridRef}
          className="overflow-auto overscroll-contain"
          style={{ maxHeight: "calc(100vh - 300px)", minHeight: 320 }}
        >
          <div className="min-w-[860px]">
            {/* Day headers + all-day row */}
            <div className="sticky top-0 z-30 grid border-b-2 border-ink bg-paper" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div className="sticky left-0 z-40 bg-paper" />
              {days.map((d) => {
                const dayData = events ? eventsForDay(d) : { allDay: [] as CalendarEvent[] };
                return (
                  <div key={d.toISO()} className="border-l border-ink/15 px-1.5 py-2 text-center">
                    <p className="mono-label text-ink/50">{d.toFormat("ccc")}</p>
                    <p
                      className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                        d.hasSame(today, "day") ? "border-2 border-ink bg-ink text-paper" : ""
                      }`}
                    >
                      {d.day}
                    </p>
                    <div className="mt-1 space-y-1">
                      {dayData.allDay.slice(0, 2).map((e, i) => (
                        <button
                          key={i}
                          onClick={() => setSelected(e)}
                          title={`${e.title} — ${e.accountEmail}`}
                          className="block w-full truncate rounded border border-ink/30 px-1 py-0.5 text-left text-[10px] font-semibold hover:border-ink"
                          style={{ background: `${colorFor(e.accountEmail)}26` }}
                        >
                          {e.title}
                        </button>
                      ))}
                      {dayData.allDay.length > 2 && (
                        <p className="text-[10px] font-semibold text-ink/40">
                          +{dayData.allDay.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time grid — full 24 hours */}
            <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div className="sticky left-0 z-20 bg-paper" style={{ height: hours.length * hourPx }}>
                {hours.map((h) => (
                  <span
                    key={h}
                    className="mono-label absolute right-2 -translate-y-1/2 text-ink/40"
                    style={{ top: (h - DAY_START_HOUR) * hourPx }}
                  >
                    {DateTime.fromObject({ hour: h }).toFormat("h a")}
                  </span>
                ))}
              </div>

              {days.map((d) => {
                const dayData = events ? eventsForDay(d) : { timed: [] as Positioned[] };
                const isToday = d.hasSame(today, "day");
                const now = DateTime.now().setZone(tz ?? "local");
                const nowTop = (now.hour + now.minute / 60 - DAY_START_HOUR) * hourPx;
                return (
                  <div
                    key={d.toISO()}
                    className={`relative border-l border-ink/15 ${isToday ? "bg-paper" : d.weekday >= 6 ? "bg-ink/[0.03]" : ""}`}
                    style={{ height: hours.length * hourPx }}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute w-full border-t border-ink/10"
                        style={{ top: (h - DAY_START_HOUR) * hourPx }}
                      />
                    ))}
                    {isToday && nowTop >= 0 && nowTop <= hours.length * hourPx && (
                      <div
                        className="absolute z-10 w-full border-t-2 border-red-500"
                        style={{ top: nowTop }}
                      />
                    )}
                    {dayData.timed.map((p, i) => {
                      const color = colorFor(p.event.accountEmail);
                      const width = 100 / p.lanes;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelected(p.event)}
                          className="absolute overflow-hidden rounded-md border border-ink/40 px-1.5 py-0.5 text-left transition hover:border-ink hover:shadow-[2px_2px_0_#1a1a1a]"
                          style={{
                            top: p.top,
                            height: p.height,
                            left: `${p.lane * width}%`,
                            width: `calc(${width}% - 3px)`,
                            background: `${color}26`,
                            borderLeft: `4px solid ${color}`,
                          }}
                        >
                          <p className="truncate text-[11px] font-bold leading-tight">
                            {p.event.title}
                          </p>
                          {p.height > 34 && (
                            <p className="truncate text-[10px] text-ink/60">
                              {inTz(p.event.startIso).toFormat("h:mm a")}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="mono-label mt-2 text-ink/40">
        times shown in {(tz ?? "local").replace(/_/g, " ")} · full day, scroll for more
      </p>

      {/* Event detail window */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="animate-pop card w-full max-w-md overflow-hidden bg-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="titlebar">
              <button
                className="titlebar-box transition hover:bg-ink"
                onClick={() => setSelected(null)}
                aria-label="Close"
              />
              <span className="titlebar-label">event details</span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="mb-4 flex items-start gap-3">
                <span
                  className="mt-1 inline-block h-4 w-4 shrink-0 rounded-sm border border-ink"
                  style={{ background: colorFor(selected.accountEmail) }}
                />
                <h2 className="text-lg font-bold leading-snug">{selected.title}</h2>
              </div>

              <div className="space-y-2.5 text-sm">
                <p className="flex items-center gap-2.5">
                  <ClockIcon className="h-4 w-4 shrink-0 text-ink/50" />
                  {selected.allDay ? (
                    <span>
                      All day · {inTz(selected.startIso).toFormat("cccc, LLLL d")}
                    </span>
                  ) : (
                    <span>
                      {inTz(selected.startIso).toFormat("cccc, LLLL d")} ·{" "}
                      {inTz(selected.startIso).toFormat("h:mm a")} –{" "}
                      {inTz(selected.endIso).toFormat("h:mm a")}
                    </span>
                  )}
                </p>
                <p className="flex items-center gap-2.5">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-ink/50" />
                  <span>{selected.calendarName}</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <MailIcon className="h-4 w-4 shrink-0 text-ink/50" />
                  <span>{selected.accountEmail}</span>
                </p>
                {selected.location && (
                  <p className="flex items-center gap-2.5">
                    <MapPinIcon className="h-4 w-4 shrink-0 text-ink/50" />
                    <span>{selected.location}</span>
                  </p>
                )}
                {selected.attendees.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink/50" />
                    <div>
                      <p className="mono-label mb-1 text-ink/50">
                        {selected.attendees.length} guest{selected.attendees.length === 1 ? "" : "s"}
                      </p>
                      <ul className="space-y-0.5">
                        {selected.attendees.map((a, i) => (
                          <li key={i} className="text-xs">
                            <span className="mr-1 font-bold">
                              {RESPONSE_ICON[a.response ?? ""] ?? "·"}
                            </span>
                            {a.name || a.email}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {selected.description && (
                  <div className="card-flat mt-3 whitespace-pre-wrap bg-cream p-3 text-xs leading-relaxed text-ink/80">
                    {stripHtml(selected.description)}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {selected.meetLink && (
                  <a
                    href={selected.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary px-4 py-2 text-xs"
                  >
                    <VideoIcon className="h-3.5 w-3.5" /> Join Meet
                  </a>
                )}
                {selected.htmlLink && (
                  <a
                    href={selected.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn px-4 py-2 text-xs"
                  >
                    Open in Google Calendar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
