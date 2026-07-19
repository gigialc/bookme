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
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Calendars</h1>
      <p className="mb-8 text-sm text-ink/60">
        Connect every Google account you use. Busy times are merged across all of them, so
        you&apos;re never double-booked.
      </p>

      {connected && (
        <div className="mb-4 card-flat bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
          Connected {connected}
        </div>
      )}
      {error && (
        <div className="mb-4 card-flat bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">
          {error === "norefresh"
            ? "Google didn't return a refresh token — please try connecting again and approve access."
            : error === "taken"
              ? "That Google account is already connected to a different bookme profile."
              : "Connecting didn't work — please try again."}
        </div>
      )}

      <div className="mb-6 space-y-3">
        {accounts === null && <p className="text-sm text-ink/50">Loading…</p>}
        {accounts?.length === 0 && (
          <div className="card-flat border-dashed p-10 text-center">
            <p className="text-sm text-ink/60">
              No calendars connected yet — add your first below.
            </p>
          </div>
        )}
        {accounts?.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream text-ink/60">
                <MailIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.email}</p>
                <p className="text-xs text-ink/50">
                  {a.is_primary ? "Primary — bookings are created here" : "Busy-time source"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!a.is_primary && (
                  <button
                    onClick={() => patch(a.id, "make_primary")}
                    className="btn-plain px-3 py-1.5 text-xs font-semibold"
                  >
                    Make primary
                  </button>
                )}
                <button
                  onClick={() => patch(a.id, "toggle_busy")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    a.include_in_busy
                      ? "border-2 border-ink bg-emerald-100 text-emerald-800"
                      : "border-2 border-ink/25 text-ink/50 hover:bg-cream"
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
        className="btn btn-primary px-5 py-2.5 text-sm"
      >
        <PlusIcon className="h-4 w-4" /> Connect a Google account
      </a>
      <p className="mt-3 text-xs text-ink/50">
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
