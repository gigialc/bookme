import Link from "next/link";
import { signInWithGoogleAction } from "@/lib/actions";
import { GoogleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-stone-50 p-4">
      <div className="animate-pop w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Welcome to bookme</h1>
        <p className="mb-7 text-sm text-stone-500">
          Sign in to manage your booking page
        </p>

        {error && (
          <p className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            Sign-in didn&apos;t complete — please try again.
          </p>
        )}

        <form action={signInWithGoogleAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <p className="mt-7 text-xs text-stone-400">
          New here? Signing in creates your account.
        </p>
        <p className="mt-2 text-xs text-stone-400">
          <Link href="/" className="underline decoration-stone-300 underline-offset-2 hover:text-stone-600">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
