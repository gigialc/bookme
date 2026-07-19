"use client";

import { useEffect, useState } from "react";

type Rule = { weekday: number; start_time: string; end_time: string };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_EMOJI = ["🌷", "🌼", "🌻", "🌸", "🌺", "🍰", "☁️"];

export default function AvailabilityPage() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/availability")
      .then((r) => r.json())
      .then((d) => setRules(d.rules ?? []));
  }, []);

  function rulesFor(day: number) {
    return (rules ?? []).filter((r) => r.weekday === day);
  }

  function update(next: Rule[]) {
    setRules(next);
    setSaved(false);
  }

  async function save() {
    if (!rules) return;
    setSaving(true);
    const res = await fetch("/api/admin/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });
    if (res.ok) {
      const d = await res.json();
      setRules(d.rules);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Check your times — end must be after start, format HH:MM");
    }
    setSaving(false);
  }

  if (rules === null) return <p className="text-sm text-neutral-400">Loading… ⏳</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Availability 🕐</h1>
      <p className="mb-6 text-neutral-500">
        Your weekly bookable hours (in the timezone from your settings). Busy calendar events are
        automatically blocked off on top of this.
      </p>

      <div className="mb-6 space-y-3">
        {DAYS.map((dayName, day) => {
          const dayRules = rulesFor(day);
          const enabled = dayRules.length > 0;
          return (
            <div key={day} className="rounded-3xl bg-white p-4 shadow">
              <div className="flex items-center gap-3">
                <span className="text-xl">{DAY_EMOJI[day]}</span>
                <span className="w-24 text-sm font-bold">{dayName}</span>
                <button
                  onClick={() =>
                    update(
                      enabled
                        ? rules.filter((r) => r.weekday !== day)
                        : [...rules, { weekday: day, start_time: "09:00", end_time: "17:00" }]
                    )
                  }
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {enabled ? "Available ✓" : "Off 💤"}
                </button>
                {enabled && (
                  <button
                    onClick={() => update([...rules, { weekday: day, start_time: "19:00", end_time: "21:00" }])}
                    className="ml-auto text-xs font-bold text-rose-400 hover:text-rose-500"
                  >
                    + add window
                  </button>
                )}
              </div>
              {enabled && (
                <div className="mt-3 space-y-2 pl-9">
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
                          className="rounded-lg border border-neutral-200 px-2 py-1.5 outline-none focus:ring-2 focus:ring-rose-300"
                        />
                        <span className="text-neutral-400">to</span>
                        <input
                          type="time"
                          value={r.end_time}
                          onChange={(e) => {
                            const next = [...rules];
                            next[globalIdx] = { ...r, end_time: e.target.value };
                            update(next);
                          }}
                          className="rounded-lg border border-neutral-200 px-2 py-1.5 outline-none focus:ring-2 focus:ring-rose-300"
                        />
                        {dayRules.length > 0 && (
                          <button
                            onClick={() => update(rules.filter((_, i) => i !== globalIdx))}
                            className="text-neutral-300 hover:text-rose-400"
                            aria-label="Remove window"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-2xl bg-rose-400 px-8 py-3 font-bold text-white shadow transition hover:bg-rose-500 disabled:opacity-50"
      >
        {saving ? "Saving… ⏳" : saved ? "Saved! 🎀" : "Save hours ✨"}
      </button>
    </div>
  );
}
