"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { getTheme } from "@/lib/themes";
import Confetti from "@/components/Confetti";
import {
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  VideoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";

type PublicEventType = {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  duration_mins: number;
  location: string;
};

type Slot = { startIso: string; endIso: string };

const inputCls =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-300 focus:ring-2";

export default function BookingClient({
  username,
  eventType,
  displayName,
  themeKey,
  bookingWindowDays,
  availableWeekdays,
  ownerTimezone,
}: {
  username: string;
  eventType: PublicEventType;
  displayName: string;
  themeKey: string;
  bookingWindowDays: number;
  availableWeekdays: number[];
  ownerTimezone: string;
}) {
  const theme = getTheme(themeKey);
  const [visitorTz, setVisitorTz] = useState(ownerTimezone);
  useEffect(() => {
    try {
      setVisitorTz(Intl.DateTimeFormat().resolvedOptions().timeZone || ownerTimezone);
    } catch {
      /* keep owner tz */
    }
  }, [ownerTimezone]);

  const today = useMemo(() => DateTime.now().setZone(visitorTz).startOf("day"), [visitorTz]);
  const maxDay = useMemo(() => today.plus({ days: bookingWindowDays }), [today, bookingWindowDays]);

  const [monthCursor, setMonthCursor] = useState(() => DateTime.now().startOf("month"));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{
    startIso: string;
    meetLink: string | null;
  } | null>(null);

  const loadSlots = useCallback(
    async (dateIso: string) => {
      setSelectedDate(dateIso);
      setSelectedSlot(null);
      setSlots(null);
      setLoadingSlots(true);
      setError("");
      try {
        const res = await fetch(
          `/api/slots?username=${encodeURIComponent(username)}&slug=${encodeURIComponent(eventType.slug)}&date=${dateIso}&tz=${encodeURIComponent(visitorTz)}`
        );
        const data = await res.json();
        setSlots(data.slots ?? []);
      } catch {
        setSlots([]);
        setError("Couldn't load times — please try again.");
      } finally {
        setLoadingSlots(false);
      }
    },
    [username, eventType.slug, visitorTz]
  );

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        slug: eventType.slug,
        startIso: selectedSlot.startIso,
        name: form.name,
        email: form.email,
        notes: form.notes,
        tz: visitorTz,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setConfirmed({ startIso: selectedSlot.startIso, meetLink: data.meetLink ?? null });
    } else {
      setError(data.error || "Something went wrong — please try again.");
      if (res.status === 409 && selectedDate) loadSlots(selectedDate);
    }
    setSubmitting(false);
  }

  // ----- Confirmation screen -----
  if (confirmed) {
    const start = DateTime.fromISO(confirmed.startIso).setZone(visitorTz);
    return (
      <div className="animate-pop rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
        <Confetti />
        <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full ${theme.accentSoft} ${theme.accentTextColor}`}>
          <CheckIcon className="h-6 w-6" />
        </div>
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-stone-900">
          Booking confirmed
        </h1>
        <p className="mb-7 text-sm text-stone-500">
          {eventType.name} with {displayName}
        </p>
        <div className="mx-auto mb-7 inline-block rounded-xl border border-stone-200 px-8 py-4">
          <p className="font-semibold text-stone-900">{start.toFormat("cccc, LLLL d")}</p>
          <p className={`font-semibold ${theme.accentTextColor}`}>
            {start.toFormat("h:mm a")} – {start.plus({ minutes: eventType.duration_mins }).toFormat("h:mm a")}
          </p>
          <p className="mt-1 text-xs text-stone-400">{visitorTz.replace(/_/g, " ")}</p>
        </div>
        <p className="text-sm text-stone-500">A calendar invite is on its way to your inbox.</p>
        {confirmed.meetLink && (
          <a
            href={confirmed.meetLink}
            target="_blank"
            rel="noreferrer"
            className={`mt-3 inline-flex items-center gap-2 text-sm font-semibold ${theme.accentTextColor} hover:underline`}
          >
            <VideoIcon className="h-4 w-4" /> Google Meet link
          </a>
        )}
      </div>
    );
  }

  // ----- Calendar helpers -----
  const monthStart = monthCursor.startOf("month");
  const gridStart = monthStart.minus({ days: (monthStart.weekday + 6) % 7 }); // back to Monday
  const days = Array.from({ length: 42 }, (_, i) => gridStart.plus({ days: i }));

  function dayEnabled(d: DateTime) {
    if (d < today || d > maxDay) return false;
    // Approximate with the owner-timezone weekday; the slots API is the source of truth.
    return availableWeekdays.includes(d.setZone(ownerTimezone).weekday - 1);
  }

  const canGoPrev = monthCursor > today.startOf("month");
  const canGoNext = monthCursor.plus({ months: 1 }) <= maxDay.startOf("month").plus({ months: 1 });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="mb-7 flex items-start gap-4 border-b border-stone-100 pb-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${theme.accentSoft}`}>
          {eventType.emoji}
        </div>
        <div>
          <p className="text-sm text-stone-500">{displayName}</p>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
            {eventType.name}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-medium text-stone-400">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" /> {eventType.duration_mins} min
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" /> {eventType.location}
            </span>
          </p>
          {eventType.description && (
            <p className="mt-2 text-sm text-stone-500">{eventType.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        {/* Calendar */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-900">
              {monthCursor.toFormat("LLLL yyyy")}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => canGoPrev && setMonthCursor(monthCursor.minus({ months: 1 }))}
                disabled={!canGoPrev}
                className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 disabled:opacity-30"
                aria-label="Previous month"
              >
                <ChevronLeftIcon />
              </button>
              <button
                onClick={() => canGoNext && setMonthCursor(monthCursor.plus({ months: 1 }))}
                disabled={!canGoNext}
                className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 disabled:opacity-30"
                aria-label="Next month"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} className="py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const iso = d.toISODate()!;
              const inMonth = d.month === monthCursor.month;
              const enabled = inMonth && dayEnabled(d);
              const selected = selectedDate === iso;
              return (
                <button
                  key={iso}
                  onClick={() => enabled && loadSlots(iso)}
                  disabled={!enabled}
                  className={`aspect-square rounded-lg text-sm font-medium transition ${
                    selected
                      ? `${theme.accentBg} ${theme.accentText}`
                      : enabled
                        ? `${theme.accentSoft} ${theme.accentTextColor} hover:opacity-80`
                        : inMonth
                          ? "text-stone-300"
                          : "text-transparent"
                  }`}
                >
                  {inMonth ? d.day : ""}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-stone-400">
            Times shown in {visitorTz.replace(/_/g, " ")}
          </p>
        </div>

        {/* Slots / form */}
        <div>
          {!selectedDate && (
            <div className="flex h-full min-h-44 items-center justify-center rounded-xl border border-dashed border-stone-200 text-center">
              <p className="text-sm text-stone-400">Select a day to see available times</p>
            </div>
          )}

          {selectedDate && loadingSlots && (
            <div className="flex h-full min-h-44 items-center justify-center">
              <span className="animate-pulse text-sm text-stone-400">Finding times…</span>
            </div>
          )}

          {selectedDate && !loadingSlots && slots && !selectedSlot && (
            <div className="animate-fade-up">
              <p className="mb-3 text-sm font-semibold text-stone-900">
                {DateTime.fromISO(selectedDate).toFormat("cccc, LLLL d")}
              </p>
              {slots.length === 0 ? (
                <p className="text-sm text-stone-400">
                  No availability on this day — try another one.
                </p>
              ) : (
                <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {slots.map((s) => (
                    <button
                      key={s.startIso}
                      onClick={() => setSelectedSlot(s)}
                      className={`rounded-lg border py-2.5 text-sm font-semibold transition ${theme.accentBorder} ${theme.accentTextColor} hover:bg-stone-50`}
                    >
                      {DateTime.fromISO(s.startIso).setZone(visitorTz).toFormat("h:mm a")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <form onSubmit={book} className="animate-fade-up">
              <div className={`mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${theme.accentSoft} ${theme.accentTextColor}`}>
                <span>
                  {DateTime.fromISO(selectedSlot.startIso).setZone(visitorTz).toFormat("ccc, LLL d · h:mm a")}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="text-xs font-medium underline underline-offset-2 opacity-70 hover:opacity-100"
                >
                  Change
                </button>
              </div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Name</label>
              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`mb-3 ${inputCls} ${theme.ring}`}
              />
              <label className="mb-1 block text-xs font-semibold text-stone-500">Email</label>
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`mb-3 ${inputCls} ${theme.ring}`}
              />
              <label className="mb-1 block text-xs font-semibold text-stone-500">
                Notes <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <textarea
                placeholder="Anything you'd like to share ahead of time"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={`mb-4 ${inputCls} ${theme.ring}`}
              />
              {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${theme.accentBg} ${theme.accentBgHover} ${theme.accentText}`}
              >
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
