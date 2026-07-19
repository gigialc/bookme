"use client";

import { useEffect, useState } from "react";
import { THEMES } from "@/lib/themes";

type Settings = {
  email: string;
  avatar_url: string | null;
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
  "retro-input";
const labelCls = "mono-label mb-1.5 block text-ink/60";
const cardCls = "mb-6 card p-6";

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

  if (!settings) return <p className="text-sm text-ink/50">Loading…</p>;

  const tzList = COMMON_TIMEZONES.includes(settings.timezone)
    ? COMMON_TIMEZONES
    : [settings.timezone, ...COMMON_TIMEZONES];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mb-8 text-sm text-ink/60">
        Your public profile and scheduling preferences.
      </p>

      <div className={cardCls}>
        <div className="mb-5 flex items-center gap-3">
          {settings.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.avatar_url}
              alt="Your profile photo"
              className="h-11 w-11 rounded-full border-2 border-ink object-cover"
            />
          )}
          <div>
            <h2 className="text-sm font-bold">Profile</h2>
            {settings.avatar_url && (
              <p className="text-xs text-ink/50">
                Photo from your Google account — shown on your booking page
              </p>
            )}
          </div>
        </div>

        <label className={labelCls}>Username</label>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm text-ink/50">/</span>
          <input
            value={settings.username}
            onChange={(e) => setSettings({ ...settings, username: e.target.value.toLowerCase() })}
            className={inputCls}
          />
        </div>
        <p className="mb-5 text-xs text-ink/50">
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
        <h2 className="mb-5 text-sm font-bold">Theme</h2>
        <div className="flex flex-wrap gap-3">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.key}
              onClick={() => setSettings({ ...settings, theme: t.key })}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                settings.theme === t.key
                  ? "border-ink bg-cream text-ink"
                  : "border-ink/25 text-ink/70 hover:border-ink"
              }`}
            >
              <span className={`h-3.5 w-3.5 rounded-full ${t.swatch}`} />
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Sets the accent color of your public booking page.
        </p>
      </div>

      <div className={cardCls}>
        <h2 className="mb-5 text-sm font-bold">Scheduling</h2>

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
            <p className="mt-1.5 text-xs text-ink/50">How soon someone can book</p>
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
            <p className="mt-1.5 text-xs text-ink/50">How far ahead they can book</p>
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
            <p className="mt-1.5 text-xs text-ink/50">How often slots start</p>
          </div>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="btn btn-primary px-6 py-2.5 text-sm"
      >
        {saving ? "Saving…" : saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}
