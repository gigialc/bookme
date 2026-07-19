import Link from "next/link";
import { CalendarIcon, GlobeIcon, VideoIcon, CheckIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: CalendarIcon,
    title: "Every calendar, one schedule",
    text: "Connect all of your Google accounts. Busy times are merged across every calendar, so you're never double-booked.",
  },
  {
    icon: GlobeIcon,
    title: "Timezone-aware",
    text: "Guests see your availability in their own timezone, automatically — no mental math on either side.",
  },
  {
    icon: VideoIcon,
    title: "Meet links, handled",
    text: "Every booking creates a calendar event with a Google Meet link and sends the invite to both of you.",
  },
  {
    icon: CheckIcon,
    title: "Your rules",
    text: "Weekly hours, buffers between meetings, minimum notice, and how far ahead people can book.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-stone-50">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">bookme</span>
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <h1 className="mx-auto mb-5 max-w-2xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          One booking link that respects every calendar you have
        </h1>
        <p className="mx-auto mb-9 max-w-xl text-lg leading-relaxed text-stone-500">
          Share your link. Guests pick a time that&apos;s genuinely free — across all your Google
          accounts — and the invite lands on both calendars with a Meet link attached.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700"
          >
            Get your booking link
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-stone-400">Free · Sign in with Google</p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white p-8">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <h2 className="mb-1.5 font-semibold text-stone-900">{f.title}</h2>
              <p className="text-sm leading-relaxed text-stone-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-400">
        bookme
      </footer>
    </main>
  );
}
