"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "@/components/icons";
import TimezoneSelect from "@/components/TimezoneSelect";

type Rule = { weekday: number; start_time: string; end_time: string };
type Trip = { label: string; start_date: string; end_date: string; timezone: string };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailabilityPage() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/availability")
      .then((r) => r.json())
      .then((d) => setRules(d.rules ?? []));
    fetch("/api/admin/travel")
      .then((r) => r.json())
      .then((d) => setTrips(d.travel ?? []));
  }, []);

  function rulesFor(day: number) {
    return (rules ?? []).filter((r) => r.weekday === day);
  }

  function update(next: Rule[]) {
    setRules(next);
    setSaved(false);
  }

  function updateTrips(next: Trip[]) {
    setTrips(next);
    setSaved(false);
  }

  async function save() {
    if (!rules || !trips) return;
    setSaving(true);
    const [rulesRes, travelRes] = await Promise.all([
      fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      }),
      fetch("/api/admin/travel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ travel: trips }),
      }),
    ]);
    if (rulesRes.ok && travelRes.ok) {
      const [rulesData, travelData] = await Promise.all([rulesRes.json(), travelRes.json()]);
      setRules(rulesData.rules);
      setTrips(travelData.travel);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else if (!rulesRes.ok) {
      alert("Please check your times — end must be after start (HH:MM).");
    } else {
      const d = await travelRes.json().catch(() => null);
      alert(
        d?.error === "overlapping travel schedules"
          ? "Two of your travel schedules overlap — give each trip its own dates."
          : "Please check your travel dates — each trip needs a start and end date."
      );
    }
    setSaving(false);
  }

  if (rules === null || trips === null) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Availability</h1>
      <p className="mb-8 text-sm text-ink/60">
        Your weekly bookable hours, in the timezone from your settings. Busy calendar events are
        blocked off automatically on top of this.
      </p>

      <div className="mb-6 card overflow-hidden">
        {DAYS.map((dayName, day) => {
          const dayRules = rulesFor(day);
          const enabled = dayRules.length > 0;
          return (
            <div key={day} className="border-b border-ink/10 p-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="w-28 text-sm font-bold">{dayName}</span>
                <button
                  onClick={() =>
                    update(
                      enabled
                        ? rules.filter((r) => r.weekday !== day)
                        : [...rules, { weekday: day, start_time: "09:00", end_time: "17:00" }]
                    )
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    enabled
                      ? "border-2 border-ink bg-emerald-100 text-emerald-800"
                      : "border-2 border-ink/25 text-ink/50 hover:bg-cream"
                  }`}
                >
                  {enabled ? "Available" : "Unavailable"}
                </button>
                {enabled && (
                  <button
                    onClick={() =>
                      update([...rules, { weekday: day, start_time: "19:00", end_time: "21:00" }])
                    }
                    className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-ink/60 transition hover:text-ink"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add window
                  </button>
                )}
              </div>
              {enabled && (
                <div className="mt-3 space-y-2 pl-[7.75rem]">
                  {dayRules.map((r, idx) => {
                    const globalIdx = rules.indexOf(r);
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <input
                          type="time"
                          value={r.start_time}
                          onChange={(e) => {
                            const next = [...rules];
                            next[globalIdx] = { ...r, start_time: e.target.value };
                            update(next);
                          }}
                          className="retro-input w-auto px-2.5 py-1.5"
                        />
                        <span className="text-ink/50">–</span>
                        <input
                          type="time"
                          value={r.end_time}
                          onChange={(e) => {
                            const next = [...rules];
                            next[globalIdx] = { ...r, end_time: e.target.value };
                            update(next);
                          }}
                          className="retro-input w-auto px-2.5 py-1.5"
                        />
                        <button
                          onClick={() => update(rules.filter((_, i) => i !== globalIdx))}
                          className="px-1 text-ink/30 transition hover:text-rose-500"
                          aria-label="Remove window"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mb-1 text-lg font-bold tracking-tight">Travel schedules ✈️</h2>
      <p className="mb-4 text-sm text-ink/60">
        Travelling? Pick a date range and a timezone, and your weekly hours above will apply in
        that timezone for those dates — so 9–5 stays 9–5 wherever you are.
      </p>

      <div className="mb-6 card overflow-hidden">
        {trips.length === 0 && (
          <p className="p-4 text-sm text-ink/50">No trips planned — your home timezone applies.</p>
        )}
        {trips.map((trip, idx) => (
          <div key={idx} className="border-b border-ink/10 p-4 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="text"
                value={trip.label}
                placeholder="Trip to Madrid"
                onChange={(e) => {
                  const next = [...trips];
                  next[idx] = { ...trip, label: e.target.value };
                  updateTrips(next);
                }}
                className="retro-input w-36 px-2.5 py-1.5"
              />
              <input
                type="date"
                value={trip.start_date}
                onChange={(e) => {
                  const next = [...trips];
                  next[idx] = { ...trip, start_date: e.target.value };
                  updateTrips(next);
                }}
                className="retro-input w-auto px-2.5 py-1.5"
                aria-label="Trip start date"
              />
              <span className="text-ink/50">–</span>
              <input
                type="date"
                value={trip.end_date}
                onChange={(e) => {
                  const next = [...trips];
                  next[idx] = { ...trip, end_date: e.target.value };
                  updateTrips(next);
                }}
                className="retro-input w-auto px-2.5 py-1.5"
                aria-label="Trip end date"
              />
              <TimezoneSelect
                value={trip.timezone}
                onChange={(tz) => {
                  const next = [...trips];
                  next[idx] = { ...trip, timezone: tz };
                  updateTrips(next);
                }}
                className="retro-input w-auto px-2.5 py-1.5"
                ariaLabel="Trip timezone"
              />
              <button
                onClick={() => updateTrips(trips.filter((_, i) => i !== idx))}
                className="px-1 text-ink/30 transition hover:text-rose-500"
                aria-label="Remove trip"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <div className="p-4">
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              updateTrips([
                ...trips,
                { label: "", start_date: today, end_date: today, timezone: "Europe/London" },
              ]);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink/60 transition hover:text-ink"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add travel schedule
          </button>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="btn btn-primary px-6 py-2.5 text-sm"
      >
        {saving ? "Saving…" : saved ? "Saved" : "Save hours"}
      </button>
    </div>
  );
}
