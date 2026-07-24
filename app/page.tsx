import Link from "next/link";
import Logo from "@/components/Logo";
import {
  CalendarIcon,
  GlobeIcon,
  VideoIcon,
  ClockIcon,
  CheckIcon,
  GitHubIcon,
} from "@/components/icons";

const GITHUB_URL = "https://github.com/gigialc/bookme";
const DESKTOP_DOWNLOAD_URL =
  "https://github.com/gigialc/bookme/releases/latest/download/BookMe-Desktop-macOS.dmg";

const FEATURES = [
  {
    icon: CalendarIcon,
    title: "Every calendar, one schedule",
    text: "Connect all of your Google accounts. Busy times merge across every calendar, so you're never double-booked.",
  },
  {
    icon: GlobeIcon,
    title: "Timezone-aware",
    text: "Guests see your availability in their own timezone — and can switch it — no mental math on either side.",
  },
  {
    icon: VideoIcon,
    title: "Meet links, handled",
    text: "Every booking creates a calendar event with a Google Meet link and invites both of you.",
  },
  {
    icon: ClockIcon,
    title: "Your rules",
    text: "Weekly hours, buffers between meetings, minimum notice, and how far ahead people can book.",
  },
];

const MOCK_DAYS = [
  "",
  "",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
];
const MOCK_ENABLED = new Set(["7", "9", "14", "16", "21", "23"]);

function BookingMockup() {
  return (
    <div
      className="card w-full max-w-sm overflow-hidden bg-paper"
      aria-hidden="true"
    >
      <div className="titlebar">
        <span className="titlebar-box" />
        <span className="titlebar-label">book a time</span>
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-3 border-b-2 border-ink pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-rose-50 text-xl">
            ☕
          </div>
          <div>
            <p className="text-sm font-bold">Coffee chat</p>
            <p className="mono-label text-ink/50">30 min · google meet</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="mono-label py-1 text-center text-ink/40">
              {d}
            </div>
          ))}
          {MOCK_DAYS.map((d, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-md text-xs font-semibold ${
                d === "16"
                  ? "border-2 border-ink bg-rose-500 text-white"
                  : MOCK_ENABLED.has(d)
                    ? "border-2 border-ink bg-rose-50 text-rose-600"
                    : "text-ink/30"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {["9:00", "9:30", "11:00"].map((t) => (
            <div
              key={t}
              className={`rounded-lg border-2 py-1.5 text-center text-xs font-bold ${
                t === "9:30"
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/25 text-rose-600"
              }`}
            >
              {t}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border-2 border-ink bg-emerald-100 px-3 py-2">
          <CheckIcon className="h-3.5 w-3.5 text-emerald-800" />
          <span className="text-xs font-bold text-emerald-800">
            Booked — invite sent to both calendars
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-cream">
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo size={30} />
            <span className="text-xl font-bold tracking-tight">bookme</span>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href={DESKTOP_DOWNLOAD_URL}
              className="btn hidden px-4 py-1.5 text-sm sm:inline-flex"
            >
              ↓ Desktop app
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View the source on GitHub"
              className="btn p-2"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
            <Link href="/login" className="btn px-4 py-1.5 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20 pt-10 sm:pt-16">
        <div className="grid items-center gap-12 sm:grid-cols-2">
          <div>
            <p
              className="mb-2 text-5xl text-ink"
              style={{ fontFamily: "var(--font-caveat), cursive" }}
            >
              hello.
            </p>
            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              One link.
              <br />
              Every calendar.
              <br />
              Zero double-bookings.
            </h1>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-ink/70">
              Share your booking page. Guests pick a time that&apos;s genuinely
              free across all your Google accounts — invite and Meet link
              included.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/login" className="btn btn-primary px-7 py-3 text-sm">
                Get your booking link
              </Link>
              <a href={DESKTOP_DOWNLOAD_URL} className="btn px-7 py-3 text-sm">
                ↓ Download for Mac
              </a>
              <p className="w-full mono-label text-ink/50">
                free · sign in with google · desktop notes use your recall api
                key
              </p>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div className="rotate-1 transition hover:rotate-0">
              <BookingMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <p
          className="mb-10 text-center text-4xl"
          style={{ fontFamily: "var(--font-caveat), cursive" }}
        >
          what&apos;s inside
        </p>
        <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-paper shadow-[3px_3px_0_#1a1a1a]">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="mb-1 font-bold">{f.title}</h2>
                <p className="text-sm leading-relaxed text-ink/60">{f.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p
            className="mb-3 text-4xl"
            style={{ fontFamily: "var(--font-caveat), cursive" }}
          >
            ready when you are
          </p>
          <Link href="/login" className="btn btn-primary px-8 py-3 text-sm">
            Create your page — it&apos;s free
          </Link>
        </div>
      </section>

      <section className="border-y-2 border-ink bg-paper">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-8 px-6 py-14 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="mono-label mb-2 text-rose-600">BookMe Desktop</p>
            <h2 className="mb-2 text-2xl font-bold">
              Your calls, transcribed beside your schedule.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-ink/60">
              Download the macOS app, create or sign in to your BookMe account,
              then add your own Recall API key under Meeting Notes → recorder
              settings. BookMe detects supported meeting windows, and only
              records after you choose Record &amp; take notes.
            </p>
          </div>
          <a
            href={DESKTOP_DOWNLOAD_URL}
            className="btn btn-primary px-7 py-3 text-sm"
          >
            ↓ Download .dmg
          </a>
        </div>
      </section>

      <footer className="border-t-2 border-ink">
        <div className="rainbow-h h-1.5" />
        <div className="flex items-center justify-center gap-5 py-6">
          <p className="mono-label text-ink/50">bookme</p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="mono-label flex items-center gap-1.5 text-ink/50 transition hover:text-ink"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            github
          </a>
        </div>
      </footer>
    </main>
  );
}
