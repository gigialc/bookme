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

const inputCls =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-200";
const labelCls = "mb-1.5 block text-xs font-semibold text-stone-500";
const cardCls = "mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm";

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
      setError(d.error || "Couldn't save — please try again.");
    }
    setSaving(false);
  }

  if (!settings) return <p className="text-sm text-stone-400">Loading…</p>;

  const tzList = COMMON_TIMEZONES.includes(settings.timezone)
    ? COMMON_TIMEZONES
    : [settings.timezone, ...COMMON_TIMEZONES];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mb-8 text-sm text-stone-500">
        Your public profile and scheduling preferences.
      </p>

      <div className={cardCls}>
        <h2 className="mb-5 text-sm font-semibold text-stone-900">Profile</h2>

        <label className={labelCls}>Username</label>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm text-stone-400">/</span>
          <input
            value={settings.username}
            onChange={(e) => setSettings({ ...settings, username: e.target.value.toLowerCase() })}
            className={inputCls}
          />
        </div>
        <p className="mb-5 text-xs text-stone-400">
          Your booking link: {typeof window !== "undefined" ? window.location.origin : ""}/
          {settings.username} · signed in as {settings.email}
        </p>

        <label className={labelCls}>Display name</label>
        <input
          value={settings.display_name}
          onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
          className={`mb-5 ${inputCls}`}
        />

        <label className={labelCls}>Welcome message</label>
        <textarea
          value={settings.welcome_message}
          onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
          rows={2}
          className={inputCls}
        />
      </div>

      <div className={cardCls}>
        <h2 className="mb-5 text-sm font-semibold text-stone-900">Theme</h2>
        <div className="flex flex-wrap gap-3">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.key}
              onClick={() => setSettings({ ...settings, theme: t.key })}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                settings.theme === t.key
                  ? "border-stone-400 bg-stone-50 text-stone-900"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              <span className={`h-3.5 w-3.5 rounded-full ${t.swatch}`} />
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Sets the accent color of your public booking page.
        </p>
      </div>

      <div className={cardCls}>
        <h2 className="mb-5 text-sm font-semibold text-stone-900">Scheduling</h2>

        <label className={labelCls}>Timezone</label>
        <select
          value={settings.timezone}
          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          className={`mb-5 ${inputCls}`}
        >
          {tzList.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Minimum notice (hours)</label>
            <input
              type="number"
              min={0}
              value={settings.min_notice_hours}
              onChange={(e) =>
                setSettings({ ...settings, min_notice_hours: Number(e.target.value) })
              }
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-stone-400">How soon someone can book</p>
          </div>
          <div>
            <label className={labelCls}>Booking window (days)</label>
            <input
              type="number"
              min={1}
              value={settings.booking_window_days}
              onChange={(e) =>
                setSettings({ ...settings, booking_window_days: Number(e.target.value) })
              }
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-stone-400">How far ahead they can book</p>
          </div>
          <div>
            <label className={labelCls}>Slot interval</label>
            <select
              value={settings.slot_step_mins}
              onChange={(e) => setSettings({ ...settings, slot_step_mins: Number(e.target.value) })}
              className={inputCls}
            >
              {[15, 30, 45, 60].map((s) => (
                <option key={s} value={s}>
                  Every {s} min
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-stone-400">How often slots start</p>
          </div>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}
