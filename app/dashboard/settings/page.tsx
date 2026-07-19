"use client";

import { useEffect, useState } from "react";
import { THEMES } from "@/lib/themes";

type Settings = {
  email: string;
  username: string;
  display_name: string;
  welcome_message: string;
  timezone: string;
  min_notice_hours: number;
  booking_window_days: number;
  theme: string;
  slot_step_mins: number;
};

const COMMON_TIMEZONES = [
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const d = await res.json();
      setSettings(d.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Couldn't save — try again?");
    }
    setSaving(false);
  }

  if (!settings) return <p className="text-sm text-neutral-400">Loading… ⏳</p>;

  const tzList = COMMON_TIMEZONES.includes(settings.timezone)
    ? COMMON_TIMEZONES
    : [settings.timezone, ...COMMON_TIMEZONES];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Settings ⚙️</h1>
      <p className="mb-6 text-neutral-500">Make it yours 💅</p>

      <div className="mb-6 rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-4 font-bold">🌸 Profile</h2>

        <label className="mb-1 block text-xs font-bold text-neutral-500">Username</label>
        <div className="mb-1 flex items-center gap-1">
          <span className="text-sm text-neutral-400">/</span>
          <input
            value={settings.username}
            onChange={(e) => setSettings({ ...settings, username: e.target.value.toLowerCase() })}
            className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
        <p className="mb-4 text-xs text-neutral-400">
          Your booking link: {typeof window !== "undefined" ? window.location.origin : ""}/{settings.username} · signed in as {settings.email}
        </p>

        <label className="mb-1 block text-xs font-bold text-neutral-500">Your name</label>
        <input
          value={settings.display_name}
          onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
          className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
        />

        <label className="mb-1 block text-xs font-bold text-neutral-500">Welcome message</label>
        <textarea
          value={settings.welcome_message}
          onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
          rows={2}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      <div className="mb-6 rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-4 font-bold">🎨 Theme</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.key}
              onClick={() => setSettings({ ...settings, theme: t.key })}
              className={`rounded-2xl p-4 text-left transition hover:scale-105 ${t.pageBg} ${
                settings.theme === t.key ? "ring-2 ring-neutral-500 ring-offset-2" : ""
              }`}
            >
              <div className="mb-1 text-2xl">{t.emoji}</div>
              <p className="text-xs font-bold">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-4 font-bold">🕐 Scheduling rules</h2>

        <label className="mb-1 block text-xs font-bold text-neutral-500">Your timezone</label>
        <select
          value={settings.timezone}
          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
        >
          {tzList.map((tz) => (
            <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
          ))}
        </select>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-neutral-500">Min notice (hours)</label>
            <input
              type="number"
              min={0}
              value={settings.min_notice_hours}
              onChange={(e) => setSettings({ ...settings, min_notice_hours: Number(e.target.value) })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            />
            <p className="mt-1 text-xs text-neutral-400">No last-minute surprises 🙅‍♀️</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-neutral-500">Booking window (days)</label>
            <input
              type="number"
              min={1}
              value={settings.booking_window_days}
              onChange={(e) => setSettings({ ...settings, booking_window_days: Number(e.target.value) })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            />
            <p className="mt-1 text-xs text-neutral-400">How far ahead people can book</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-neutral-500">Slot spacing (min)</label>
            <select
              value={settings.slot_step_mins}
              onChange={(e) => setSettings({ ...settings, slot_step_mins: Number(e.target.value) })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            >
              {[15, 30, 45, 60].map((s) => (
                <option key={s} value={s}>every {s} min</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-400">How often slots start</p>
          </div>
        </div>
      </div>

      {error && <p className="mb-3 text-sm font-semibold text-rose-500">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="rounded-2xl bg-rose-400 px-8 py-3 font-bold text-white shadow transition hover:bg-rose-500 disabled:opacity-50"
      >
        {saving ? "Saving… ⏳" : saved ? "Saved! 🎀" : "Save settings ✨"}
      </button>
    </div>
  );
}
