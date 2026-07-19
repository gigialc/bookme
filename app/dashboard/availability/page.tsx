"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "@/components/icons";

type Rule = { weekday: number; start_time: string; end_time: string };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
      alert("Please check your times — end must be after start (HH:MM).");
    }
    setSaving(false);
  }

  if (rules === null) return <p className="text-sm text-ink/50">Loading…</p>;

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
