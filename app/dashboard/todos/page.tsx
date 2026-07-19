"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, PlusIcon } from "@/components/icons";

type Todo = {
  id: number;
  text: string;
  done: boolean;
  source: string;
  source_note_title: string | null;
  meeting_time: string | null;
  created_at: string;
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [granolaConnected, setGranolaConnected] = useState<boolean | null>(null);
  const [newText, setNewText] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/todos");
    const data = await res.json();
    setTodos(data.todos ?? []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/integrations")
      .then((r) => r.json())
      .then((d) => setGranolaConnected(Boolean(d.granola_connected)))
      .catch(() => setGranolaConnected(false));
  }, [load]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    await fetch("/api/admin/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText }),
    });
    setNewText("");
    load();
  }

  async function toggle(id: number) {
    setTodos((t) => t?.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) ?? null);
    await fetch("/api/admin/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function remove(id: number) {
    setTodos((t) => t?.filter((x) => x.id !== id) ?? null);
    await fetch(`/api/admin/todos?id=${id}`, { method: "DELETE" });
  }

  async function syncGranola() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/admin/granola/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(data.error || "Sync failed — try again.");
      } else if (data.notes_processed.length === 0) {
        setSyncMsg("No new meeting notes since the last sync.");
      } else {
        setSyncMsg(
          `Pulled ${data.todos_created} to-do${data.todos_created === 1 ? "" : "s"} from ${data.notes_processed.length} meeting${data.notes_processed.length === 1 ? "" : "s"}.`
        );
      }
    } catch {
      setSyncMsg("Sync failed — try again.");
    }
    setSyncing(false);
    load();
  }

  const open = (todos ?? []).filter((t) => !t.done);
  const done = (todos ?? []).filter((t) => t.done);

  function Row({ t }: { t: Todo }) {
    return (
      <div className="flex items-start gap-3 border-b border-ink/10 px-5 py-3.5 last:border-b-0">
        <button
          onClick={() => toggle(t.id)}
          aria-label={t.done ? "Mark as not done" : "Mark as done"}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-ink transition ${
            t.done ? "bg-ink text-paper" : "bg-paper hover:bg-cream"
          }`}
        >
          {t.done && <CheckIcon className="h-3 w-3" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${t.done ? "text-ink/40 line-through" : "font-medium"}`}>
            {t.text}
          </p>
          {t.source === "granola" && t.source_note_title && (
            <p className="mono-label mt-0.5 text-ink/40">
              from “{t.source_note_title}”
              {t.meeting_time &&
                ` · ${new Date(t.meeting_time).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
            </p>
          )}
        </div>
        <button
          onClick={() => remove(t.id)}
          className="px-1 text-ink/25 transition hover:text-rose-500"
          aria-label="Delete"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight">To-dos</h1>
          <p className="text-sm text-ink/60">
            Action items from your meeting notes, plus anything you add yourself.
          </p>
        </div>
        {granolaConnected ? (
          <button onClick={syncGranola} disabled={syncing} className="btn px-4 py-2 text-sm">
            {syncing ? "Syncing…" : "Sync from Granola"}
          </button>
        ) : granolaConnected === false ? (
          <Link href="/dashboard/settings" className="btn px-4 py-2 text-sm">
            Connect Granola
          </Link>
        ) : null}
      </div>

      {syncMsg && (
        <div className="card-flat mb-4 bg-cream px-4 py-3 text-sm font-semibold">{syncMsg}</div>
      )}

      <form onSubmit={addTodo} className="mb-5 flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add a to-do…"
          className="retro-input flex-1"
        />
        <button type="submit" disabled={!newText.trim()} className="btn btn-primary px-4 py-2">
          <PlusIcon className="h-4 w-4" />
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="titlebar">
          <span className="titlebar-box" />
          <span className="titlebar-label">
            {todos === null ? "loading…" : `${open.length} open · ${done.length} done`}
          </span>
        </div>
        {todos !== null && todos.length === 0 && (
          <p className="p-8 text-center text-sm text-ink/50">
            Nothing here yet — add a to-do above
            {granolaConnected ? " or sync your meeting notes." : "."}
          </p>
        )}
        {open.map((t) => (
          <Row key={t.id} t={t} />
        ))}
        {done.length > 0 && open.length > 0 && <div className="border-t-2 border-ink" />}
        {done.map((t) => (
          <Row key={t.id} t={t} />
        ))}
      </div>

      {granolaConnected === false && (
        <p className="mt-4 text-xs text-ink/50">
          Tip: connect{" "}
          <Link href="/dashboard/settings" className="underline underline-offset-2">
            Granola
          </Link>{" "}
          in Settings and your meeting notes turn into to-dos automatically.
        </p>
      )}
    </div>
  );
}
