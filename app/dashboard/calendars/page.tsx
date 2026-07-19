"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Account = {
  id: number;
  email: string;
  is_primary: boolean;
  include_in_busy: boolean;
};

function CalendarsInner() {
  const params = useSearchParams();
  const [accounts, setAccounts] = useState<Account[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setAccounts(data.accounts ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: number, action: string) {
    await fetch("/api/admin/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  async function disconnect(id: number, email: string) {
    if (!confirm(`Disconnect ${email}? New bookings won't check this calendar anymore.`)) return;
    await fetch(`/api/admin/accounts?id=${id}`, { method: "DELETE" });
    load();
  }

  const connected = params.get("connected");
  const error = params.get("error");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Calendars 📅</h1>
      <p className="mb-6 text-neutral-500">
        Connect all your Gmail accounts — busy times from <em>every</em> calendar are merged so
        you&apos;re never double-booked.
      </p>

      {connected && (
        <div className="mb-4 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">
          🎉 Connected {connected}!
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-600">
          {error === "norefresh"
            ? "Google didn't send a refresh token — try connecting again and make sure to approve access."
            : error === "taken"
              ? "That Google account is already connected to a different bookme profile 🙈"
              : "Hmm, connecting didn't work. Try again?"}
        </div>
      )}

      <div className="mb-6 space-y-3">
        {accounts === null && <p className="text-sm text-neutral-400">Loading… ⏳</p>}
        {accounts?.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow">
            <div className="mb-2 text-4xl">🌱</div>
            <p className="text-sm text-neutral-500">No calendars connected yet — add your first below!</p>
          </div>
        )}
        {accounts?.map((a) => (
          <div key={a.id} className="rounded-3xl bg-white p-5 shadow">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl">✉️</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{a.email}</p>
                <p className="text-xs text-neutral-400">
                  {a.is_primary ? "⭐ bookings are created here" : "busy-time source"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!a.is_primary && (
                  <button
                    onClick={() => patch(a.id, "make_primary")}
                    className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-200"
                  >
                    Make primary ⭐
                  </button>
                )}
                <button
                  onClick={() => patch(a.id, "toggle_busy")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                    a.include_in_busy
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                  }`}
                >
                  {a.include_in_busy ? "Checking busy ✓" : "Ignored 💤"}
                </button>
                <button
                  onClick={() => disconnect(a.id, a.email)}
                  className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-100"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <a
        href="/api/google/auth"
        className="inline-block rounded-2xl bg-rose-400 px-6 py-3 font-bold text-white shadow transition hover:bg-rose-500"
      >
        + Connect a Google account
      </a>
      <p className="mt-3 text-xs text-neutral-400">
        You&apos;ll be sent to Google to approve calendar access. Repeat for each Gmail you use! 💌
      </p>
    </div>
  );
}

export default function CalendarsPage() {
  return (
    <Suspense>
      <CalendarsInner />
    </Suspense>
  );
}
