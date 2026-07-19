import Link from "next/link";
import { CalendarIcon, GlobeIcon, VideoIcon, ClockIcon } from "@/components/icons";

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

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="rainbow inline-block h-6 w-2 rounded-sm" />
          <span className="text-xl font-bold tracking-tight">bookme</span>
        </div>
        <Link href="/login" className="btn px-4 py-1.5 text-sm">
          Sign in
        </Link>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16 pt-14 text-center sm:pt-20">
        <p
          className="mb-2 text-5xl text-ink sm:text-6xl"
          style={{ fontFamily: "var(--font-caveat), cursive" }}
        >
          hello.
        </p>
        <h1 className="mx-auto mb-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          One link. Every calendar. Zero double-bookings.
        </h1>
        <p className="mx-auto mb-9 max-w-xl text-lg leading-relaxed text-ink/70">
          Share your booking page. Guests pick a time that&apos;s genuinely free across all your
          Google accounts — and the invite lands on both calendars with a Meet link attached.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/login" className="btn btn-primary px-7 py-3 text-sm">
            Get your booking link
          </Link>
          <Link href="/login" className="btn px-7 py-3 text-sm">
            Sign in
          </Link>
        </div>
        <p className="mono-label mt-5 text-ink/50">free · sign in with google</p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="card overflow-hidden">
          <div className="titlebar">
            <span className="titlebar-box" />
            <span className="titlebar-label">what&apos;s inside</span>
          </div>
          <div className="grid sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`p-8 ${i % 2 === 0 ? "sm:border-r-2 sm:border-ink" : ""} ${
                  i < 2 ? "border-b-2 border-ink" : ""
                }`}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-cream">
                  <f.icon className="h-4.5 w-4.5" />
                </div>
                <h2 className="mb-1.5 font-bold">{f.title}</h2>
                <p className="text-sm leading-relaxed text-ink/60">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-ink">
        <div className="rainbow-h h-1.5" />
        <p className="mono-label py-6 text-center text-ink/50">bookme</p>
      </footer>
    </main>
  );
}
