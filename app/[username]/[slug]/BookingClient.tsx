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
  GlobeIcon,
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

const FALLBACK_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function allTimezones(): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tz = (Intl as any).supportedValuesOf?.("timeZone");
    if (Array.isArray(tz) && tz.length > 0) return tz;
  } catch {
    /* fall through */
  }
  return FALLBACK_TIMEZONES;
}

export default function BookingClient({
  username,
  avatarUrl,
  eventType,
  displayName,
  themeKey,
  bookingWindowDays,
  availableWeekdays,
  ownerTimezone,
}: {
  username: string;
  avatarUrl: string | null;
  eventType: PublicEventType;
  displayName: string;
  themeKey: string;
  bookingWindowDays: number;
  availableWeekdays: number[];
  ownerTimezone: string;
}) {
  const theme = getTheme(themeKey);
  const [visitorTz, setVisitorTz] = useState(ownerTimezone);
  const [timezones, setTimezones] = useState<string[]>(FALLBACK_TIMEZONES);
  useEffect(() => {
    setTimezones(allTimezones());
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
    async (dateIso: string, tz?: string) => {
      const useTz = tz ?? visitorTz;
      setSelectedDate(dateIso);
      setSelectedSlot(null);
      setSlots(null);
      setLoadingSlots(true);
      setError("");
      try {
        const res = await fetch(
          `/api/slots?username=${encodeURIComponent(username)}&slug=${encodeURIComponent(eventType.slug)}&date=${dateIso}&tz=${encodeURIComponent(useTz)}`
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

  function changeTimezone(tz: string) {
    setVisitorTz(tz);
    if (selectedDate) loadSlots(selectedDate, tz);
  }

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
      <div className="animate-pop card overflow-hidden">
        <Confetti />
        <div className="titlebar">
          <span className="titlebar-box" />
          <span className="titlebar-label">confirmed</span>
        </div>
        <div className="p-10 text-center">
          <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink ${theme.accentSoft} ${theme.accentTextColor}`}>
            <CheckIcon className="h-6 w-6" />
          </div>
          <h1 className="mb-1 text-xl font-bold tracking-tight">You&apos;re booked</h1>
          <p className="mb-7 text-sm text-ink/60">
            {eventType.name} with {displayName}
          </p>
          <div className="card-flat mx-auto mb-7 inline-block bg-cream px-8 py-4">
            <p className="font-bold">{start.toFormat("cccc, LLLL d")}</p>
            <p className={`font-bold ${theme.accentTextColor}`}>
              {start.toFormat("h:mm a")} – {start.plus({ minutes: eventType.duration_mins }).toFormat("h:mm a")}
            </p>
            <p className="mono-label mt-1 text-ink/50">{visitorTz.replace(/_/g, " ")}</p>
          </div>
          <p className="text-sm text-ink/60">A calendar invite is on its way to your inbox.</p>
          {confirmed.meetLink && (
            <a
              href={confirmed.meetLink}
              target="_blank"
              rel="noreferrer"
              className={`mt-3 inline-flex items-center gap-2 text-sm font-bold ${theme.accentTextColor} hover:underline`}
            >
              <VideoIcon className="h-4 w-4" /> Google Meet link
            </a>
          )}
        </div>
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
    <div className="card overflow-hidden">
      <div className="titlebar">
        <span className="titlebar-box" />
        <span className="titlebar-label">{displayName} · book a time</span>
      </div>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-7 flex items-start gap-4 border-b-2 border-ink pb-6">
          <div className="relative shrink-0">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink text-2xl ${theme.accentSoft}`}>
              {eventType.emoji}
            </div>
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full border-2 border-ink object-cover"
              />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">{eventType.name}</h1>
            <p className="mono-label mt-1.5 flex flex-wrap items-center gap-3 text-ink/50">
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" /> {eventType.duration_mins} min
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" /> {eventType.location}
              </span>
            </p>
            {eventType.description && (
              <p className="mt-2 text-sm text-ink/60">{eventType.description}</p>
            )}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Calendar */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">{monthCursor.toFormat("LLLL yyyy")}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => canGoPrev && setMonthCursor(monthCursor.minus({ months: 1 }))}
                  disabled={!canGoPrev}
                  className="btn-plain p-1.5 disabled:opacity-30"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  onClick={() => canGoNext && setMonthCursor(monthCursor.plus({ months: 1 }))}
                  disabled={!canGoNext}
                  className="btn-plain p-1.5 disabled:opacity-30"
                  aria-label="Next month"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
            <div className="mono-label grid grid-cols-7 gap-1 text-center text-ink/40">
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
                    className={`aspect-square rounded-lg text-sm font-semibold transition ${
                      selected
                        ? `border-2 border-ink ${theme.accentBg} ${theme.accentText}`
                        : enabled
                          ? `border-2 border-ink ${theme.accentSoft} ${theme.accentTextColor} hover:-translate-y-0.5`
                          : inMonth
                            ? "text-ink/25"
                            : "text-transparent"
                    }`}
                  >
                    {inMonth ? d.day : ""}
                  </button>
                );
              })}
            </div>

            {/* Timezone picker */}
            <div className="mt-4 flex items-center gap-2">
              <GlobeIcon className="h-4 w-4 shrink-0 text-ink/50" />
              <select
                value={visitorTz}
                onChange={(e) => changeTimezone(e.target.value)}
                className="retro-input py-1.5 text-xs"
                aria-label="Timezone"
              >
                {!timezones.includes(visitorTz) && (
                  <option value={visitorTz}>{visitorTz.replace(/_/g, " ")}</option>
                )}
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots / form */}
          <div>
            {!selectedDate && (
              <div className="card-flat flex h-full min-h-44 items-center justify-center bg-cream text-center">
                <p className="text-sm text-ink/50">Select a day to see available times</p>
              </div>
            )}

            {selectedDate && loadingSlots && (
              <div className="animate-fade-up">
                <div className="skeleton mb-3 h-5 w-40" />
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="skeleton h-10" />
                  ))}
                </div>
              </div>
            )}

            {selectedDate && !loadingSlots && slots && !selectedSlot && (
              <div className="animate-fade-up">
                <p className="mb-3 font-bold">
                  {DateTime.fromISO(selectedDate).toFormat("cccc, LLLL d")}
                </p>
                {slots.length === 0 ? (
                  <p className="text-sm text-ink/50">
                    No availability on this day — try another one.
                  </p>
                ) : (
                  <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {slots.map((s) => (
                      <button
                        key={s.startIso}
                        onClick={() => setSelectedSlot(s)}
                        className={`btn-plain py-2.5 text-sm font-bold ${theme.accentTextColor}`}
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
                <div className={`card-flat mb-4 flex items-center justify-between px-4 py-3 text-sm font-bold ${theme.accentSoft} ${theme.accentTextColor}`}>
                  <span>
                    {DateTime.fromISO(selectedSlot.startIso).setZone(visitorTz).toFormat("ccc, LLL d · h:mm a")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    className="mono-label underline underline-offset-2 opacity-70 hover:opacity-100"
                  >
                    change
                  </button>
                </div>
                <label className="mono-label mb-1.5 block text-ink/60">Name</label>
                <input
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="retro-input mb-3"
                />
                <label className="mono-label mb-1.5 block text-ink/60">Email</label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="retro-input mb-3"
                />
                <label className="mono-label mb-1.5 block text-ink/60">
                  Notes <span className="normal-case opacity-60">(optional)</span>
                </label>
                <textarea
                  placeholder="Anything you'd like to share ahead of time"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="retro-input mb-4"
                />
                {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
                <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3 text-sm">
                  {submitting ? "Booking…" : "Confirm booking"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
