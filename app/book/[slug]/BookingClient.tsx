"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { getTheme } from "@/lib/themes";
import Confetti from "@/components/Confetti";

type PublicEventType = {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  duration_mins: number;
  location: string;
};

type Slot = { startIso: string; endIso: string };

export default function BookingClient({
  eventType,
  displayName,
  themeKey,
  bookingWindowDays,
  availableWeekdays,
  ownerTimezone,
}: {
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
          `/api/slots?slug=${encodeURIComponent(eventType.slug)}&date=${dateIso}&tz=${encodeURIComponent(visitorTz)}`
        );
        const data = await res.json();
        setSlots(data.slots ?? []);
      } catch {
        setSlots([]);
        setError("Couldn't load times — try again?");
      } finally {
        setLoadingSlots(false);
      }
    },
    [eventType.slug, visitorTz]
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
      setError(data.error || "Something went wrong — please try again");
      if (res.status === 409 && selectedDate) loadSlots(selectedDate);
    }
    setSubmitting(false);
  }

  // ----- Confirmation screen -----
  if (confirmed) {
    const start = DateTime.fromISO(confirmed.startIso).setZone(visitorTz);
    return (
      <div className="animate-pop rounded-3xl bg-white/95 p-8 text-center shadow-xl backdrop-blur">
        <Confetti />
        <div className="mb-3 text-6xl">🎉</div>
        <h1 className="mb-2 text-2xl font-bold">Yay, you&apos;re booked!</h1>
        <p className="mb-6 text-neutral-500">
          {eventType.emoji} <span className="font-semibold">{eventType.name}</span> with {displayName}
        </p>
        <div className={`mb-6 inline-block rounded-2xl px-6 py-4 ${theme.accentSoft}`}>
          <p className="font-bold">{start.toFormat("cccc, LLLL d")}</p>
          <p className={`text-lg font-bold ${theme.accentTextColor}`}>
            {start.toFormat("h:mm a")} – {start.plus({ minutes: eventType.duration_mins }).toFormat("h:mm a")}
          </p>
          <p className="text-xs text-neutral-400">{visitorTz}</p>
        </div>
        <p className="text-sm text-neutral-500">
          A calendar invite is on its way to your inbox 💌
          {confirmed.meetLink && (
            <>
              <br />
              <a
                href={confirmed.meetLink}
                target="_blank"
                rel="noreferrer"
                className={`font-semibold underline ${theme.accentTextColor}`}
              >
                Google Meet link
              </a>
            </>
          )}
        </p>
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
    <div className="rounded-3xl bg-white/95 p-6 shadow-xl backdrop-blur sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${theme.accentSoft}`}>
          {eventType.emoji}
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{eventType.name}</h1>
          <p className="text-sm text-neutral-500">
            with {displayName} · ⏱️ {eventType.duration_mins} min · 📍 {eventType.location}
          </p>
          {eventType.description && (
            <p className="mt-1 text-sm text-neutral-500">{eventType.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Calendar */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => canGoPrev && setMonthCursor(monthCursor.minus({ months: 1 }))}
              disabled={!canGoPrev}
              className="rounded-full px-3 py-1 text-lg font-bold text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="font-bold">{monthCursor.toFormat("LLLL yyyy")}</span>
            <button
              onClick={() => canGoNext && setMonthCursor(monthCursor.plus({ months: 1 }))}
              disabled={!canGoNext}
              className="rounded-full px-3 py-1 text-lg font-bold text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-neutral-400">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="py-1">{d}</div>
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
                  className={`aspect-square rounded-xl text-sm font-semibold transition ${
                    selected
                      ? `${theme.accentBg} ${theme.accentText} shadow`
                      : enabled
                        ? `${theme.accentSoft} hover:scale-105 ${theme.accentTextColor}`
                        : inMonth
                          ? "text-neutral-300"
                          : "text-transparent"
                  }`}
                >
                  {inMonth ? d.day : ""}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-xs text-neutral-400">
            times shown in {visitorTz.replace(/_/g, " ")}
          </p>
        </div>

        {/* Slots / form */}
        <div>
          {!selectedDate && (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-neutral-400">
              <div className="animate-floaty mb-2 text-4xl">👈</div>
              <p className="text-sm font-semibold">Pick a day to see times!</p>
            </div>
          )}

          {selectedDate && loadingSlots && (
            <div className="flex h-full min-h-40 items-center justify-center text-neutral-400">
              <span className="animate-pulse font-semibold">finding times… 🔍</span>
            </div>
          )}

          {selectedDate && !loadingSlots && slots && !selectedSlot && (
            <div>
              <p className="mb-3 text-sm font-bold text-neutral-500">
                {DateTime.fromISO(selectedDate).toFormat("cccc, LLLL d")}
              </p>
              {slots.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  No free times this day 🥺 — try another one!
                </p>
              ) : (
                <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {slots.map((s) => (
                    <button
                      key={s.startIso}
                      onClick={() => setSelectedSlot(s)}
                      className={`rounded-xl border-2 py-2 text-sm font-bold transition hover:scale-105 ${theme.accentBorder} ${theme.accentTextColor} hover:${theme.accentSoft}`}
                    >
                      {DateTime.fromISO(s.startIso).setZone(visitorTz).toFormat("h:mm a")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <form onSubmit={book} className="animate-pop">
              <div className={`mb-4 rounded-2xl p-3 text-center text-sm font-bold ${theme.accentSoft} ${theme.accentTextColor}`}>
                {DateTime.fromISO(selectedSlot.startIso).setZone(visitorTz).toFormat("ccc, LLL d · h:mm a")}
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="ml-2 text-xs underline opacity-70"
                >
                  change
                </button>
              </div>
              <input
                required
                placeholder="Your name 🌸"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`mb-2 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 ${theme.ring}`}
              />
              <input
                required
                type="email"
                placeholder="you@email.com 💌"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`mb-2 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 ${theme.ring}`}
              />
              <textarea
                placeholder="Anything you'd like to share? (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={`mb-3 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 ${theme.ring}`}
              />
              {error && <p className="mb-2 text-sm font-semibold text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-xl py-3 font-bold transition disabled:opacity-50 ${theme.accentBg} ${theme.accentBgHover} ${theme.accentText}`}
              >
                {submitting ? "Booking… ⏳" : "Confirm booking ✨"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
