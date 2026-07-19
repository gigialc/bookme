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
    if (!confirm(`Cancel ${b.name}'s booking? They'll receive a cancellation email.`)) return;
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
      <div
        className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ${
          b.status === "cancelled" ? "opacity-60" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl">{b.event_emoji ?? "•"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-900">
              {b.name}{" "}
              <span className="font-normal text-stone-400">· {b.event_name ?? "meeting"}</span>
              {b.status === "cancelled" && (
                <span className="ml-1.5 text-xs font-medium text-rose-500">cancelled</span>
              )}
            </p>
            <p className="text-xs text-stone-500">
              {fmt(b.start_ts)} ·{" "}
              <a href={`mailto:${b.email}`} className="underline underline-offset-2 hover:text-stone-700">
                {b.email}
              </a>
            </p>
            {b.notes && <p className="mt-1 text-xs italic text-stone-400">“{b.notes}”</p>}
          </div>
          <div className="flex gap-2">
            {b.meet_link && (
              <a
                href={b.meet_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
              >
                <VideoIcon className="h-3.5 w-3.5" /> Join
              </a>
            )}
            {showCancel && (
              <button
                onClick={() => cancel(b)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
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
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Bookings</h1>
      <p className="mb-8 text-sm text-stone-500">Everyone who has booked time with you.</p>

      {bookings === null && <p className="text-sm text-stone-400">Loading…</p>}

      {bookings !== null && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <p className="mb-8 text-sm text-stone-400">
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
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
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
