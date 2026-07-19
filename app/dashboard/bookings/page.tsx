"use client";

import { useCallback, useEffect, useState } from "react";

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    setBookings(data.bookings ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(b: BookingRow) {
    if (!confirm(`Cancel ${b.name}'s booking? They'll get a cancellation email from Google.`)) return;
    await fetch(`/api/admin/bookings?id=${b.id}`, { method: "DELETE" });
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
      <div className={`rounded-3xl bg-white p-5 shadow ${b.status === "cancelled" ? "opacity-50" : ""}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">{b.event_emoji ?? "💬"}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {b.name}{" "}
              <span className="text-xs font-semibold text-neutral-400">· {b.event_name ?? "call"}</span>
              {b.status === "cancelled" && (
                <span className="ml-1 text-xs font-semibold text-rose-400">(cancelled)</span>
              )}
            </p>
            <p className="text-xs text-neutral-500">
              {fmt(b.start_ts)} · <a href={`mailto:${b.email}`} className="underline">{b.email}</a>
            </p>
            {b.notes && <p className="mt-1 text-xs italic text-neutral-400">“{b.notes}”</p>}
          </div>
          <div className="flex gap-2">
            {b.meet_link && (
              <a
                href={b.meet_link}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-100"
              >
                Meet 🎥
              </a>
            )}
            {showCancel && (
              <button
                onClick={() => cancel(b)}
                className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Bookings 💖</h1>
      <p className="mb-6 text-neutral-500">Everyone who&apos;s booked time with you.</p>

      {bookings === null && <p className="text-sm text-neutral-400">Loading… ⏳</p>}

      {bookings !== null && (
        <>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-400">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="mb-6 text-sm text-neutral-400">Nothing upcoming — share your booking link! 🔗</p>
          ) : (
            <div className="mb-6 space-y-3">
              {upcoming.map((b) => <Card key={b.id} b={b} showCancel />)}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-400">Past & cancelled</h2>
              <div className="space-y-3">
                {past.map((b) => <Card key={b.id} b={b} showCancel={false} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
