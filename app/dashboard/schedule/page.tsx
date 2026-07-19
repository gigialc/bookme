"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime, Interval } from "luxon";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

type CalendarEvent = {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
  accountEmail: string;
  meetLink: string | null;
};

// the classic six colors, in stripe order
const ACCOUNT_COLORS = ["#e03a3e", "#009ddc", "#61bb46", "#963d97", "#f5821f", "#fdb827"];

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;
const HOUR_PX = 44;

type Positioned = {
  event: CalendarEvent;
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

/** Greedy lane assignment so overlapping events sit side by side. */
function layoutDay(events: { event: CalendarEvent; start: DateTime; end: DateTime }[]): Positioned[] {
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
    const top = (Math.max(startH, DAY_START_HOUR) - DAY_START_HOUR) * HOUR_PX;
    const bottom = (Math.min(endH === 0 ? 24 : endH, DAY_END_HOUR) - DAY_START_HOUR) * HOUR_PX;
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

  // widen lanes count for overlapping clusters
  for (const p of placed) {
    const overlapping = placed.filter(
      (q) => q.start < p.end && q.end > p.start
    );
    const lanes = Math.max(...overlapping.map((q) => q.lane)) + 1;
    for (const q of overlapping) q.lanes = Math.max(q.lanes, lanes);
  }
  return placed;
}

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() =>
    DateTime.now().startOf("week")
  );
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState("");

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart]
  );
  const today = DateTime.now().startOf("day");

  const load = useCallback(async () => {
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

  function eventsForDay(day: DateTime) {
    const dayInt = Interval.fromDateTimes(day, day.plus({ days: 1 }));
    const timed: { event: CalendarEvent; start: DateTime; end: DateTime }[] = [];
    const allDay: CalendarEvent[] = [];
    for (const e of events ?? []) {
      const start = DateTime.fromISO(e.startIso).setZone("local");
      const end = DateTime.fromISO(e.endIso).setZone("local");
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
    return { timed: layoutDay(timed), allDay };
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
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
            onClick={() => setWeekStart(DateTime.now().startOf("week"))}
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
        <div className="mb-4 flex flex-wrap items-center gap-4">
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

        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Day headers + all-day row */}
            <div className="grid border-b-2 border-ink" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div />
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
                        <div
                          key={i}
                          title={`${e.title} — ${e.accountEmail}`}
                          className="truncate rounded border border-ink/30 px-1 py-0.5 text-left text-[10px] font-semibold"
                          style={{ background: `${colorFor(e.accountEmail)}26` }}
                        >
                          {e.title}
                        </div>
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

            {/* Time grid */}
            <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              {/* hour labels */}
              <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((h) => (
                  <span
                    key={h}
                    className="mono-label absolute right-2 -translate-y-1/2 text-ink/40"
                    style={{ top: (h - DAY_START_HOUR) * HOUR_PX }}
                  >
                    {DateTime.fromObject({ hour: h }).toFormat("h a")}
                  </span>
                ))}
              </div>

              {days.map((d) => {
                const dayData = events ? eventsForDay(d) : { timed: [] as Positioned[] };
                const isToday = d.hasSame(today, "day");
                const now = DateTime.now();
                const nowTop =
                  (now.hour + now.minute / 60 - DAY_START_HOUR) * HOUR_PX;
                return (
                  <div
                    key={d.toISO()}
                    className={`relative border-l border-ink/15 ${isToday ? "bg-paper" : ""}`}
                    style={{ height: hours.length * HOUR_PX }}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute w-full border-t border-ink/10"
                        style={{ top: (h - DAY_START_HOUR) * HOUR_PX }}
                      />
                    ))}
                    {isToday && nowTop >= 0 && nowTop <= hours.length * HOUR_PX && (
                      <div
                        className="absolute z-10 w-full border-t-2 border-red-500"
                        style={{ top: nowTop }}
                      />
                    )}
                    {dayData.timed.map((p, i) => {
                      const color = colorFor(p.event.accountEmail);
                      const width = 100 / p.lanes;
                      return (
                        <div
                          key={i}
                          title={`${p.event.title}\n${DateTime.fromISO(p.event.startIso).toFormat("h:mm a")} – ${DateTime.fromISO(p.event.endIso).toFormat("h:mm a")}\n${p.event.accountEmail}`}
                          className="absolute overflow-hidden rounded-md border border-ink/40 px-1.5 py-0.5"
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
                              {DateTime.fromISO(p.event.startIso).toFormat("h:mm a")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="mono-label mt-3 text-ink/40">
        times shown in your local timezone · showing {DAY_START_HOUR}:00–{DAY_END_HOUR}:00
      </p>
    </div>
  );
}
