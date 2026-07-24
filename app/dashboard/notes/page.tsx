"use client";

import { useEffect, useMemo, useState } from "react";

type TranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  at: string;
};

type MeetingNote = {
  id: string;
  title: string;
  platform: string;
  startedAt: string;
  endedAt?: string;
  status: "recording" | "processing" | "ready" | "failed";
  transcript: TranscriptLine[];
  summary?: string;
};

type DesktopState = {
  sdkReady: boolean;
  recallConfigured: boolean;
  permissionsGranted: boolean;
  permissionStatuses: {
    accessibility: string;
    microphone: string;
    systemAudio: string;
  };
  detectedMeeting: { id: string; title: string; platform: string } | null;
  activeWindowId: string | null;
  notes: MeetingNote[];
  error: string | null;
};

type DesktopApi = {
  getState: () => Promise<DesktopState>;
  requestPermissions: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  saveRecallApiKey: (apiKey: string) => Promise<void>;
  onState: (listener: (state: DesktopState) => void) => () => void;
};

function desktopApi(): DesktopApi | null {
  return (window as Window & { bookme?: DesktopApi }).bookme ?? null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function permissionLabel(status: string) {
  const normalized = status.toLowerCase();
  if (["granted", "authorized", "allowed"].includes(normalized))
    return "Granted";
  if (["denied", "restricted", "not-authorized"].includes(normalized))
    return "Not granted";
  if (["not-determined", "notdetermined", "prompt"].includes(normalized))
    return "Needs approval";
  return status === "unknown" ? "Checking…" : status.replaceAll("-", " ");
}

function permissionGranted(status: string) {
  return ["granted", "authorized", "allowed"].includes(status.toLowerCase());
}

export default function MeetingNotesPage() {
  const [api, setApi] = useState<DesktopApi | null>(null);
  const [state, setState] = useState<DesktopState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRecorderSettings, setShowRecorderSettings] = useState(false);

  useEffect(() => {
    const bridge = desktopApi();
    setApi(bridge);
    if (!bridge) return;
    void bridge.getState().then(setState);
    return bridge.onState(setState);
  }, []);

  const selected = useMemo(() => {
    if (!state) return null;
    return (
      state.notes.find((note) => note.id === selectedId) ??
      state.notes[0] ??
      null
    );
  }, [selectedId, state]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight">
            Meeting Notes
          </h1>
          <p className="text-sm text-ink/60">
            Your BookMe recordings and Recall-powered transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              state?.sdkReady
                ? "bg-emerald-100 text-emerald-800"
                : "bg-cream text-ink/55"
            }`}
          >
            {state?.sdkReady
              ? "● Recorder connected"
              : "○ Desktop recorder unavailable"}
          </span>
          {api && (
            <button
              type="button"
              onClick={() => setShowRecorderSettings(true)}
              className="btn flex h-9 w-9 items-center justify-center p-0 text-base"
              aria-label="Recorder settings"
              title="Recorder settings"
            >
              ⚙
            </button>
          )}
        </div>
      </div>

      {!api ? (
        <div className="card p-8 text-center">
          <h2 className="mb-2 text-lg font-bold">
            Open this tab in BookMe Desktop
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-ink/60">
            Meeting detection and recording run on your Mac, so your notes are
            available in this tab inside the desktop app.
          </p>
        </div>
      ) : (
        <>
          <RecorderCard
            api={api}
            state={state}
            busy={busy}
            run={run}
            openSettings={() => setShowRecorderSettings(true)}
          />
          {state?.error && (
            <p className="card-flat mb-4 border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {state.error}
            </p>
          )}

          <div className="grid min-h-[440px] overflow-hidden rounded-xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--ink)] md:grid-cols-[280px_1fr]">
            <aside className="border-b-2 border-ink bg-cream/60 p-3 md:border-r-2 md:border-b-0">
              <p className="mono-label mb-2 px-2 text-ink/50">Recorded calls</p>
              {!state?.notes.length ? (
                <p className="px-2 py-5 text-xs leading-relaxed text-ink/50">
                  Your first recorded call will appear here.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {state.notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedId(note.id)}
                      className={`w-full rounded-lg border-2 px-3 py-3 text-left transition ${
                        selected?.id === note.id
                          ? "border-ink bg-paper"
                          : "border-transparent hover:border-ink/30 hover:bg-paper/70"
                      }`}
                    >
                      <span className="mb-1 block truncate text-sm font-bold">
                        {note.title}
                      </span>
                      <span className="flex items-center justify-between gap-2 text-[11px] text-ink/50">
                        <span>{formatDate(note.startedAt)}</span>
                        <span className="capitalize">{note.status}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="min-w-0 p-6 md:p-8">
              {selected ? <NoteDetail note={selected} /> : <EmptyNotes />}
            </section>
          </div>
        </>
      )}
      {api && state && showRecorderSettings && (
        <RecorderSettings
          api={api}
          state={state}
          busy={busy}
          run={run}
          close={() => setShowRecorderSettings(false)}
        />
      )}
    </div>
  );
}

function RecorderCard({
  api,
  state,
  busy,
  run,
  openSettings,
}: {
  api: DesktopApi;
  state: DesktopState | null;
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  openSettings: () => void;
}) {
  if (!state) {
    return (
      <div className="card mb-5 p-4 text-sm text-ink/50">
        Starting desktop recorder…
      </div>
    );
  }

  if (!state.permissionsGranted) {
    return (
      <div className="card-flat mb-3 flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 px-3 py-2.5">
        <p className="m-0 text-xs font-semibold text-amber-800">
          Recorder setup needs attention
        </p>
        <button
          onClick={openSettings}
          className="text-xs font-bold underline underline-offset-2"
        >
          Open settings
        </button>
      </div>
    );
  }

  if (!state.recallConfigured) {
    return (
      <div className="card-flat mb-3 flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 px-3 py-2.5">
        <p className="m-0 text-xs font-semibold text-amber-800">
          Add a Recall API key before recording
        </p>
        <button
          onClick={openSettings}
          className="text-xs font-bold underline underline-offset-2"
        >
          Open settings
        </button>
      </div>
    );
  }

  if (state.detectedMeeting) {
    return (
      <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="mono-label mb-1 text-red-600">Meeting detected</p>
          <h2 className="mb-1 text-sm font-bold">
            {state.detectedMeeting.title}
          </h2>
          <p className="text-xs text-ink/50">
            {state.detectedMeeting.platform}
          </p>
        </div>
        {state.activeWindowId ? (
          <button
            disabled={busy}
            onClick={() => run(api.stopRecording)}
            className="btn border-rose-400 bg-rose-50 px-4 py-2 text-xs text-rose-700"
          >
            Stop recording
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={() => run(api.startRecording)}
            className="btn btn-primary px-4 py-2 text-xs"
          >
            ● Record & take notes
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-center gap-2 px-1 text-xs text-ink/50">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <p className="m-0">Listening for Google Meet, Zoom, or Microsoft Teams</p>
    </div>
  );
}

function RecorderSettings({
  api,
  state,
  busy,
  run,
  close,
}: {
  api: DesktopApi;
  state: DesktopState;
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  close: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const permissions = [
    ["Accessibility", state.permissionStatuses.accessibility],
    ["Microphone", state.permissionStatuses.microphone],
    ["System Audio", state.permissionStatuses.systemAudio],
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recorder-settings-title"
        className="card w-full max-w-lg p-6"
      >
        <div className="mb-1 flex items-center justify-between gap-4">
          <div>
            <p className="mono-label mb-1 text-ink/45">Meeting Notes</p>
            <h2 id="recorder-settings-title" className="text-lg font-bold">
              Recorder settings
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-ink/50 hover:bg-cream hover:text-ink"
            aria-label="Close recorder settings"
          >
            ×
          </button>
        </div>
        <p className="mb-1 text-sm text-ink/55">
          BookMe needs these macOS permissions to detect meetings and capture
          audio.
        </p>
        <PermissionRows permissions={permissions} />
        <div className="mt-5 border-t-2 border-ink/10 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Recall API key</h3>
              <p className="text-xs text-ink/50">
                Stored only in this Mac&apos;s Application Support folder.
              </p>
            </div>
            <span
              className={`text-xs font-bold ${
                state.recallConfigured ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {state.recallConfigured ? "✓ Configured" : "Not configured"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={
                state.recallConfigured
                  ? "Paste a new key to replace it"
                  : "Recall API key"
              }
              className="retro-input min-w-0 flex-1"
            />
            <button
              disabled={busy || !apiKey.trim()}
              onClick={() =>
                run(async () => {
                  await api.saveRecallApiKey(apiKey);
                  setApiKey("");
                })
              }
              className="btn px-4 py-2 text-xs"
            >
              Save key
            </button>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
          <span
            className={`text-xs font-bold ${
              state.permissionsGranted ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {state.permissionsGranted
              ? "✓ All permissions granted"
              : "Some permissions are missing"}
          </span>
          {!state.permissionsGranted && (
            <button
              disabled={busy}
              onClick={() => run(api.requestPermissions)}
              className="btn btn-primary px-4 py-2 text-xs"
            >
              Grant missing permissions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionRows({
  permissions,
}: {
  permissions: readonly (readonly [string, string])[];
}) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {permissions.map(([name, status]) => {
        const granted = permissionGranted(status);
        return (
          <div
            key={name}
            className="card-flat flex items-center justify-between gap-2 px-3 py-2.5"
          >
            <span className="text-xs font-semibold">{name}</span>
            <span
              className={`text-[11px] font-bold ${
                granted ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {granted ? "✓ " : "○ "}
              {permissionLabel(status)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyNotes() {
  return (
    <div className="grid min-h-[350px] place-content-center text-center">
      <span className="mb-3 text-2xl">✦</span>
      <h2 className="mb-2 text-lg font-bold">Your notes will show here</h2>
      <p className="max-w-sm text-sm leading-relaxed text-ink/55">
        Start a meeting, choose Record &amp; take notes, and the live transcript
        will appear in this panel.
      </p>
    </div>
  );
}

function NoteDetail({ note }: { note: MeetingNote }) {
  return (
    <>
      <div className="border-b-2 border-ink/15 pb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink/50">
          <span>{note.platform}</span>
          <span>·</span>
          <span>{formatDate(note.startedAt)}</span>
          <span className="rounded-full bg-cream px-2 py-1 font-bold capitalize">
            {note.status}
          </span>
        </div>
        <h2 className="text-xl font-bold">{note.title}</h2>
      </div>

      {note.summary && (
        <div className="my-5 border-l-4 border-red-400 bg-cream/60 px-4 py-3 text-sm leading-relaxed">
          {note.summary}
        </div>
      )}

      <div className="pt-5">
        <p className="mono-label mb-4 text-ink/50">Transcript</p>
        {!note.transcript.length ? (
          <p className="text-sm text-ink/50">
            {note.status === "recording"
              ? "Listening… words will appear here as people speak."
              : "No transcript was captured for this call."}
          </p>
        ) : (
          <div className="space-y-4">
            {note.transcript.map((line) => (
              <div
                key={line.id}
                className="grid gap-1 sm:grid-cols-[110px_1fr] sm:gap-4"
              >
                <strong className="text-xs">{line.speaker}</strong>
                <p className="select-text text-sm leading-relaxed text-ink/70">
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
