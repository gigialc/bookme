import Link from "next/link";
import { signInWithGoogleAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 p-4">
      <div className="animate-pop w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="animate-floaty mb-2 inline-block text-5xl">🗓️</div>
        <h1 className="mb-1 text-2xl font-bold">Welcome to bookme 💖</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Sign in and get your own cute booking page
        </p>

        {error && (
          <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500">
            Signing in didn&apos;t work — try again? 🙈
          </p>
        )}

        <form action={signInWithGoogleAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-neutral-200 bg-white py-3 font-bold text-neutral-700 transition hover:border-rose-200 hover:bg-rose-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35.2 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-xs text-neutral-400">
          <Link href="/" className="underline decoration-dotted hover:text-neutral-600">
            ← back home
          </Link>
        </p>
      </div>
    </main>
  );
}
