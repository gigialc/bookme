import Link from "next/link";

const FEATURES = [
  { emoji: "📅", title: "All your Gmails, one schedule", text: "Connect every Google account — busy times merge so you're never double-booked." },
  { emoji: "🌍", title: "Timezone magic", text: "Visitors see your open slots in their own timezone, automatically." },
  { emoji: "🎥", title: "Meet links included", text: "Every booking creates a calendar invite with a Google Meet link for both of you." },
  { emoji: "🎨", title: "5 dreamy themes", text: "Strawberry Milk, Lavender Haze, Matcha Latte, Blueberry Sky, Golden Hour." },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 px-4 py-20">
      <div className="w-full max-w-2xl text-center">
        <div className="animate-floaty mb-4 inline-block text-7xl">🗓️</div>
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">bookme 💖</h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-neutral-600">
          Your own cute little booking page. Share one link, and people book time that actually
          fits your calendars.
        </p>

        <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-2xl bg-rose-400 px-8 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-rose-500"
          >
            Get your booking page ✨
          </Link>
          <Link
            href="/login"
            className="rounded-2xl bg-white/80 px-8 py-3.5 font-bold text-neutral-600 shadow transition hover:bg-white"
          >
            Sign in
          </Link>
        </div>

        <div className="grid gap-4 text-left sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl bg-white/90 p-6 shadow-lg backdrop-blur">
              <div className="mb-2 text-3xl">{f.emoji}</div>
              <h2 className="mb-1 font-bold">{f.title}</h2>
              <p className="text-sm text-neutral-500">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-xs text-neutral-400">made with 💖</p>
      </div>
    </main>
  );
}
