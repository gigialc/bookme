"use client";

import { useCallback, useEffect, useState } from "react";
import { EVENT_COLORS } from "@/lib/themes";

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

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[] | null>(null);
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: number }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/event-types");
    const data = await res.json();
    setEventTypes(data.eventTypes ?? []);
  }, []);

  useEffect(() => {
    load();
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
      <h1 className="mb-1 text-2xl font-bold">Event types 💬</h1>
      <p className="mb-6 text-neutral-500">The kinds of calls people can book with you.</p>

      <div className="mb-6 space-y-3">
        {eventTypes === null && <p className="text-sm text-neutral-400">Loading… ⏳</p>}
        {eventTypes?.map((et) => {
          const color = EVENT_COLORS[et.color] ?? EVENT_COLORS.rose;
          return (
            <div key={et.id} className={`rounded-3xl bg-white p-5 shadow ${et.active ? "" : "opacity-50"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${color.chip}`}>
                  {et.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {et.name} {!et.active && <span className="text-xs font-semibold text-neutral-400">(hidden)</span>}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {et.duration_mins} min · {et.location} · /book/{et.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/book/${et.slug}`}
                    target="_blank"
                    className="rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-100"
                  >
                    Preview
                  </a>
                  <button
                    onClick={() => setEditing({ ...et })}
                    className="rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(et.id, et.name)}
                    className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-100"
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
          className="rounded-2xl bg-rose-400 px-6 py-3 font-bold text-white shadow transition hover:bg-rose-500"
        >
          + New event type
        </button>
      )}

      {editing && (
        <div className="animate-pop rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 font-bold">{editing.id ? "Edit event type ✏️" : "New event type 🌟"}</h2>

          <label className="mb-1 block text-xs font-bold text-neutral-500">Name</label>
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            placeholder="Coffee chat"
            className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
          />

          <label className="mb-1 block text-xs font-bold text-neutral-500">Emoji</label>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                onClick={() => setEditing({ ...editing, emoji: e })}
                className={`rounded-xl p-2 text-xl transition hover:scale-110 ${
                  editing.emoji === e ? "bg-rose-100 ring-2 ring-rose-300" : "bg-neutral-50"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label className="mb-1 block text-xs font-bold text-neutral-500">Color</label>
          <div className="mb-4 flex gap-2">
            {Object.entries(EVENT_COLORS).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setEditing({ ...editing, color: key })}
                className={`h-8 w-8 rounded-full transition hover:scale-110 ${c.dot} ${
                  editing.color === key ? "ring-2 ring-neutral-400 ring-offset-2" : ""
                }`}
                aria-label={key}
              />
            ))}
          </div>

          <label className="mb-1 block text-xs font-bold text-neutral-500">Duration</label>
          <div className="mb-4 flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setEditing({ ...editing, duration_mins: d })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  editing.duration_mins === d
                    ? "bg-rose-400 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>

          <label className="mb-1 block text-xs font-bold text-neutral-500">Description</label>
          <textarea
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            placeholder="A quick call to say hi!"
            rows={2}
            className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
          />

          <label className="mb-1 block text-xs font-bold text-neutral-500">Location</label>
          <input
            value={editing.location}
            onChange={(e) => setEditing({ ...editing, location: e.target.value })}
            placeholder="Google Meet"
            className="mb-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
          />
          <p className="mb-4 text-xs text-neutral-400">
            If it contains &quot;Meet&quot;, a Google Meet link is added automatically 🎥
          </p>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-500">Buffer before (min)</label>
              <input
                type="number"
                min={0}
                value={editing.buffer_before}
                onChange={(e) => setEditing({ ...editing, buffer_before: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-500">Buffer after (min)</label>
              <input
                type="number"
                min={0}
                value={editing.buffer_after}
                onChange={(e) => setEditing({ ...editing, buffer_after: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-600">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              className="h-4 w-4 accent-rose-400"
            />
            Visible on your booking page
          </label>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !editing.name.trim()}
              className="rounded-xl bg-rose-400 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-50"
            >
              {saving ? "Saving… ⏳" : "Save ✨"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
