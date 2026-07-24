"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "@/components/icons";
import TimezoneSelect from "@/components/TimezoneSelect";

type Rule = { weekday: number; start_time: string; end_time: string };
type Trip = {
  label: string;
  start_date: string;
  end_date: string;
  timezone: string;
  rules: Rule[];
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The day-by-day weekly hours editor, shared by the main column and each trip. */
function WeekEditor({
  rules,
  onChange,
  compact = false,
}: {
  rules: Rule[];
  onChange: (next: Rule[]) => void;
  compact?: boolean;
}) {
  return (
    <>
      {DAYS.map((dayName, day) => {
        const dayRules = rules.filter((r) => r.weekday === day);
        const enabled = dayRules.length > 0;
        return (
          <div key={day} className={`border-b border-ink/10 last:border-b-0 ${compact ? "p-3" : "p-4"}`}>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${compact ? "w-24" : "w-28"}`}>{dayName}</span>
              <button
                onClick={() =>
                  onChange(
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
                    onChange([...rules, { weekday: day, start_time: "19:00", end_time: "21:00" }])
                  }
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-ink/60 transition hover:text-ink"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> Add window
                </button>
              )}
            </div>
            {enabled && (
              <div className={`mt-3 space-y-2 ${compact ? "pl-[6.75rem]" : "pl-[7.75rem]"}`}>
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
                          onChange(next);
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
                          onChange(next);
                        }}
                        className="retro-input w-auto px-2.5 py-1.5"
                      />
                      <button
                        onClick={() => onChange(rules.filter((_, i) => i !== globalIdx))}
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
    </>
  );
}

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

  function update(next: Rule[]) {
    setRules(next);
    setSaved(false);
  }

  function updateTrips(next: Trip[]) {
    setTrips(next);
    setSaved(false);
  }

  function updateTrip(idx: number, patch: Partial<Trip>) {
    if (!trips) return;
    const next = [...trips];
    next[idx] = { ...next[idx], ...patch };
    updateTrips(next);
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
          : "Please check your travel dates and times — each trip needs valid dates and HH:MM windows."
      );
    }
    setSaving(false);
  }

  if (rules === null || trips === null) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-6xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Availability</h1>
      <p className="mb-8 text-sm text-ink/60">
        Your weekly bookable hours, in the timezone from your settings. Busy calendar events are
        blocked off automatically on top of this.
      </p>

      <div className="grid items-start gap-8 xl:grid-cols-2">
        <div>
          <h2 className="mb-1 text-lg font-bold tracking-tight">Weekly hours</h2>
          <p className="mb-4 text-sm text-ink/60">Your normal week, in your home timezone.</p>
          <div className="card overflow-hidden">
            <WeekEditor rules={rules} onChange={update} />
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-lg font-bold tracking-tight">Travel schedules ✈️</h2>
          <p className="mb-4 text-sm text-ink/60">
            While you&apos;re away, each trip&apos;s own hours — in the trip&apos;s timezone —
            replace your weekly hours for those dates.
          </p>

          {trips.length === 0 && (
            <div className="card mb-4 p-4">
              <p className="text-sm text-ink/50">
                No trips planned — your weekly hours apply everywhere.
              </p>
            </div>
          )}
          {trips.map((trip, idx) => (
            <div key={idx} className="card mb-4 overflow-hidden">
              <div className="border-b border-ink/10 bg-cream/50 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <input
                    type="text"
                    value={trip.label}
                    placeholder="Trip to Madrid"
                    onChange={(e) => updateTrip(idx, { label: e.target.value })}
                    className="retro-input w-36 px-2.5 py-1.5"
                  />
                  <button
                    onClick={() => updateTrips(trips.filter((_, i) => i !== idx))}
                    className="ml-auto px-1 text-ink/30 transition hover:text-rose-500"
                    aria-label="Remove trip"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <input
                    type="date"
                    value={trip.start_date}
                    onChange={(e) => updateTrip(idx, { start_date: e.target.value })}
                    className="retro-input w-auto px-2.5 py-1.5"
                    aria-label="Trip start date"
                  />
                  <span className="text-ink/50">–</span>
                  <input
                    type="date"
                    value={trip.end_date}
                    onChange={(e) => updateTrip(idx, { end_date: e.target.value })}
                    className="retro-input w-auto px-2.5 py-1.5"
                    aria-label="Trip end date"
                  />
                  <TimezoneSelect
                    value={trip.timezone}
                    onChange={(tz) => updateTrip(idx, { timezone: tz })}
                    className="retro-input w-auto px-2.5 py-1.5"
                    ariaLabel="Trip timezone"
                  />
                </div>
              </div>
              <WeekEditor
                compact
                rules={trip.rules}
                onChange={(next) => updateTrip(idx, { rules: next })}
              />
            </div>
          ))}
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              updateTrips([
                ...trips,
                {
                  label: "",
                  start_date: today,
                  end_date: today,
                  timezone: "Europe/London",
                  // Start from a copy of the normal week, then adjust per trip.
                  rules: rules.map((r) => ({ ...r })),
                },
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
        className="btn btn-primary mt-8 px-6 py-2.5 text-sm"
      >
        {saving ? "Saving…" : saved ? "Saved" : "Save hours"}
      </button>
    </div>
  );
}
