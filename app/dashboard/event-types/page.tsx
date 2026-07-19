"use client";

import { useCallback, useEffect, useState } from "react";
import { EVENT_COLORS } from "@/lib/themes";
import { PlusIcon } from "@/components/icons";

type EventType = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  duration_mins: number;
  buffer_before: number;
  buffer_after: number;
  color: string;
  location: string;
  active: boolean;
};

const EMOJI_CHOICES = ["💬", "☕", "🎯", "🧠", "💼", "🌸", "🎨", "🚀", "🍵", "📞", "✨", "🤝"];
const DURATIONS = [15, 30, 45, 60, 90];
const COLOR_KEYS = ["rose", "violet", "emerald", "sky", "amber"];

const EMPTY = {
  name: "",
  emoji: "💬",
  description: "",
  duration_mins: 30,
  buffer_before: 0,
  buffer_after: 0,
  color: "rose",
  location: "Google Meet",
  active: true,
};

const inputCls =
  "retro-input";
const labelCls = "mono-label mb-1.5 block text-ink/60";

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[] | null>(null);
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: number }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string>("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/event-types");
    const data = await res.json();
    setEventTypes(data.eventTypes ?? []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setUsername(d.settings?.username ?? ""))
      .catch(() => {});
  }, [load]);

  async function save() {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    await fetch("/api/admin/event-types", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  async function remove(id: number, name: string) {
    if (!confirm(`Delete "${name}"? Its booking link will stop working.`)) return;
    await fetch(`/api/admin/event-types?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Event types</h1>
      <p className="mb-8 text-sm text-ink/60">The kinds of meetings people can book with you.</p>

      <div className="mb-6 space-y-3">
        {eventTypes === null && <p className="text-sm text-ink/50">Loading…</p>}
        {eventTypes?.map((et) => {
          const color = EVENT_COLORS[et.color] ?? EVENT_COLORS.rose;
          return (
            <div
              key={et.id}
              className={`card p-5 ${et.active ? "" : "opacity-60"}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${color.chip}`}>
                  {et.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {et.name}{" "}
                    {!et.active && (
                      <span className="text-xs font-medium text-ink/50">(hidden)</span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">
                    {et.duration_mins} min · {et.location} · /{et.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  {username && (
                    <a
                      href={`/${username}/${et.slug}`}
                      target="_blank"
                      className="btn-plain px-3 py-1.5 text-xs font-semibold"
                    >
                      Preview
                    </a>
                  )}
                  <button
                    onClick={() => setEditing({ ...et })}
                    className="btn-plain px-3 py-1.5 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(et.id, et.name)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!editing && (
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="btn btn-primary px-5 py-2.5 text-sm"
        >
          <PlusIcon className="h-4 w-4" /> New event type
        </button>
      )}

      {editing && (
        <div className="animate-pop card p-6">
          <h2 className="mb-5 text-sm font-bold">
            {editing.id ? "Edit event type" : "New event type"}
          </h2>

          <label className={labelCls}>Name</label>
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            placeholder="Intro call"
            className={`mb-4 ${inputCls}`}
          />

          <label className={labelCls}>Icon</label>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                onClick={() => setEditing({ ...editing, emoji: e })}
                className={`rounded-lg p-2 text-lg transition ${
                  editing.emoji === e
                    ? "bg-cream ring-2 ring-ink"
                    : "hover:bg-cream"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label className={labelCls}>Color</label>
          <div className="mb-4 flex gap-2">
            {COLOR_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setEditing({ ...editing, color: key })}
                className={`h-7 w-7 rounded-full transition ${EVENT_COLORS[key].dot} ${
                  editing.color === key ? "ring-2 ring-ink ring-offset-2" : ""
                }`}
                aria-label={key}
              />
            ))}
          </div>

          <label className={labelCls}>Duration</label>
          <div className="mb-4 flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setEditing({ ...editing, duration_mins: d })}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  editing.duration_mins === d
                    ? "border-2 border-ink bg-ink text-paper"
                    : "border-2 border-ink/25 text-ink/70 hover:bg-cream"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>

          <label className={labelCls}>Description</label>
          <textarea
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            placeholder="What this meeting is for"
            rows={2}
            className={`mb-4 ${inputCls}`}
          />

          <label className={labelCls}>Location</label>
          <input
            value={editing.location}
            onChange={(e) => setEditing({ ...editing, location: e.target.value })}
            placeholder="Google Meet"
            className={`mb-1.5 ${inputCls}`}
          />
          <p className="mb-4 text-xs text-ink/50">
            If it contains &quot;Meet&quot;, a Google Meet link is added automatically.
          </p>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Buffer before (min)</label>
              <input
                type="number"
                min={0}
                value={editing.buffer_before}
                onChange={(e) => setEditing({ ...editing, buffer_before: Number(e.target.value) })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Buffer after (min)</label>
              <input
                type="number"
                min={0}
                value={editing.buffer_after}
                onChange={(e) => setEditing({ ...editing, buffer_after: Number(e.target.value) })}
                className={inputCls}
              />
            </div>
          </div>

          <label className="mb-5 flex items-center gap-2 text-sm font-medium text-ink/80">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              className="h-4 w-4 accent-ink"
            />
            Visible on your booking page
          </label>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !editing.name.trim()}
              className="btn btn-primary px-5 py-2.5 text-sm"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="btn-plain px-5 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
