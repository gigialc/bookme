"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MailIcon, PlusIcon } from "@/components/icons";

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
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Calendars</h1>
      <p className="mb-8 text-sm text-stone-500">
        Connect every Google account you use. Busy times are merged across all of them, so
        you&apos;re never double-booked.
      </p>

      {connected && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Connected {connected}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error === "norefresh"
            ? "Google didn't return a refresh token — please try connecting again and approve access."
            : error === "taken"
              ? "That Google account is already connected to a different bookme profile."
              : "Connecting didn't work — please try again."}
        </div>
      )}

      <div className="mb-6 space-y-3">
        {accounts === null && <p className="text-sm text-stone-400">Loading…</p>}
        {accounts?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-sm text-stone-500">
              No calendars connected yet — add your first below.
            </p>
          </div>
        )}
        {accounts?.map((a) => (
          <div key={a.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <MailIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{a.email}</p>
                <p className="text-xs text-stone-400">
                  {a.is_primary ? "Primary — bookings are created here" : "Busy-time source"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!a.is_primary && (
                  <button
                    onClick={() => patch(a.id, "make_primary")}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    Make primary
                  </button>
                )}
                <button
                  onClick={() => patch(a.id, "toggle_busy")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    a.include_in_busy
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-stone-200 text-stone-400 hover:bg-stone-50"
                  }`}
                >
                  {a.include_in_busy ? "Checking busy" : "Ignored"}
                </button>
                <button
                  onClick={() => disconnect(a.id, a.email)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
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
        className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700"
      >
        <PlusIcon className="h-4 w-4" /> Connect a Google account
      </a>
      <p className="mt-3 text-xs text-stone-400">
        You&apos;ll be redirected to Google to approve calendar access. Repeat for each account you
        use.
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
