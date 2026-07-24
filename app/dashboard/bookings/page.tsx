"use client";

import { useCallback, useEffect, useState } from "react";
import { VideoIcon } from "@/components/icons";

type BookingRow = {
  id: number;
  name: string;
  email: string;
  notes: string;
  start_ts: string;
  end_ts: string;
  meet_link: string | null;
  status: string;
  event_name: string | null;
  event_emoji: string | null;
};

/** "YYYY-MM-DDTHH:mm" in the browser's timezone, for <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [newStart, setNewStart] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    setBookings(data.bookings ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(b: BookingRow) {
    if (!confirm(`Cancel ${b.name}'s booking? They'll receive a cancellation email.`)) return;
    await fetch(`/api/admin/bookings?id=${b.id}`, { method: "DELETE" });
    load();
  }

  async function move(b: BookingRow) {
    if (!newStart) return;
    setSaving(true);
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, startIso: new Date(newStart).toISOString() }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.error || "Couldn't move the booking — try again.");
      return;
    }
    setMovingId(null);
    load();
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const upcoming = (bookings ?? []).filter(
    (b) => b.status === "confirmed" && new Date(b.start_ts) > new Date()
  );
  const past = (bookings ?? []).filter(
    (b) => b.status !== "confirmed" || new Date(b.start_ts) <= new Date()
  );

  function Card({ b, showCancel }: { b: BookingRow; showCancel: boolean }) {
    return (
      <div
        className={`card p-5 ${
          b.status === "cancelled" ? "opacity-60" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl">{b.event_emoji ?? "•"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              {b.name}{" "}
              <span className="font-normal text-ink/50">· {b.event_name ?? "meeting"}</span>
              {b.status === "cancelled" && (
                <span className="ml-1.5 text-xs font-medium text-rose-500">cancelled</span>
              )}
            </p>
            <p className="text-xs text-ink/60">
              {fmt(b.start_ts)} ·{" "}
              <a href={`mailto:${b.email}`} className="underline underline-offset-2 hover:text-ink/80">
                {b.email}
              </a>
            </p>
            {b.notes && <p className="mt-1 text-xs italic text-ink/50">“{b.notes}”</p>}
          </div>
          <div className="flex gap-2">
            {b.meet_link && (
              <a
                href={b.meet_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 btn-plain px-3 py-1.5 text-xs font-semibold"
              >
                <VideoIcon className="h-3.5 w-3.5" /> Join
              </a>
            )}
            {showCancel && (
              <>
                <button
                  onClick={() => {
                    setMovingId(b.id);
                    setNewStart(toLocalInput(b.start_ts));
                  }}
                  className="btn-plain px-3 py-1.5 text-xs font-semibold"
                >
                  Move
                </button>
                <button
                  onClick={() => cancel(b)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        {movingId === b.id && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
            <span className="text-xs font-semibold text-ink/60">New time</span>
            <input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="retro-input w-auto px-2.5 py-1.5 text-xs"
            />
            <button
              onClick={() => move(b)}
              disabled={saving}
              className="btn btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {saving ? "Moving…" : "Save"}
            </button>
            <button
              onClick={() => setMovingId(null)}
              className="btn-plain px-3 py-1.5 text-xs font-bold"
            >
              Keep
            </button>
            <span className="text-[11px] text-ink/50">
              {b.name} gets an email with the new time.
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Bookings</h1>
      <p className="mb-8 text-sm text-ink/60">Everyone who has booked time with you.</p>

      {bookings === null && <p className="text-sm text-ink/50">Loading…</p>}

      {bookings !== null && (
        <>
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink/50">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <p className="mb-8 text-sm text-ink/50">
              Nothing upcoming — share your booking link.
            </p>
          ) : (
            <div className="mb-8 space-y-3">
              {upcoming.map((b) => (
                <Card key={b.id} b={b} showCancel />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink/50">
                Past &amp; cancelled
              </h2>
              <div className="space-y-3">
                {past.map((b) => (
                  <Card key={b.id} b={b} showCancel={false} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
