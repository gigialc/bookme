import Link from "next/link";
import { headers } from "next/headers";
import Logo from "@/components/Logo";
import LoginAction from "@/components/LoginAction";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; desktop?: string }>;
}) {
  const { error, desktop } = await searchParams;
  const userAgent = (await headers()).get("user-agent") ?? "";
  const isDesktop = desktop === "1" || userAgent.includes("Electron");

  return (
    <main className="flex flex-1 items-center justify-center bg-cream p-4">
      <div className="animate-pop w-full max-w-sm">
        <div className="card overflow-hidden">
          <div className="titlebar">
            <span className="titlebar-box" />
            <span className="titlebar-label">welcome</span>
          </div>
          <div className="p-8 text-center">
            <div className="mb-3 flex justify-center">
              <Logo size={44} />
            </div>
            <p
              className="mb-1 text-4xl"
              style={{ fontFamily: "var(--font-caveat), cursive" }}
            >
              hello.
            </p>
            <h1 className="mb-1 text-lg font-bold tracking-tight">
              Sign in to bookme
            </h1>
            <p className="mb-7 text-sm text-ink/60">Manage your booking page</p>

            {error && (
              <p className="card-flat mb-5 bg-cream px-4 py-2.5 text-sm">
                Sign-in didn&apos;t complete — please try again.
              </p>
            )}

            <LoginAction desktopHint={isDesktop} />

            <p className="mt-7 text-xs text-ink/50">
              {isDesktop
                ? "Google sign-in opens securely in your regular browser."
                : "New here? Signing in creates your account."}
            </p>
            <p className="mono-label mt-3 text-ink/40">
              <Link href="/" className="hover:text-ink">
                ← back home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
