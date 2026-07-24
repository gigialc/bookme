import Logo from "@/components/Logo";
import { GoogleIcon } from "@/components/icons";
import { desktopSignInWithGoogleAction } from "@/lib/actions";
import { validDesktopParams } from "@/lib/desktop-auth";

export const dynamic = "force-dynamic";

export default async function DesktopLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    port?: string;
    state?: string;
    challenge?: string;
    error?: string;
  }>;
}) {
  const values = await searchParams;
  const params = validDesktopParams(
    values.port ?? null,
    values.state ?? null,
    values.challenge ?? null
  );

  return (
    <main className="flex flex-1 items-center justify-center bg-cream p-4">
      <div className="animate-pop w-full max-w-sm">
        <div className="card overflow-hidden">
          <div className="titlebar">
            <span className="titlebar-box" />
            <span className="titlebar-label">bookme desktop</span>
          </div>
          <div className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <Logo size={48} />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight">
              Continue to BookMe Desktop
            </h1>
            <p className="mb-7 text-sm leading-relaxed text-ink/60">
              Sign in securely in your browser. When you&apos;re done, this page will return you
              to the desktop app.
            </p>

            {!params ? (
              <p className="card-flat bg-rose-50 px-4 py-3 text-sm text-rose-700">
                This desktop sign-in link is invalid or expired. Start again from BookMe Desktop.
              </p>
            ) : (
              <form action={desktopSignInWithGoogleAction}>
                <input type="hidden" name="port" value={params.port} />
                <input type="hidden" name="state" value={params.state} />
                <input type="hidden" name="challenge" value={params.challenge} />
                <button type="submit" className="btn w-full py-3 text-sm">
                  <GoogleIcon />
                  Continue with Google
                </button>
              </form>
            )}

            {values.error && (
              <p className="mt-4 text-xs font-semibold text-rose-600">
                Sign-in didn&apos;t complete. Return to the desktop app and try again.
              </p>
            )}
            <p className="mt-7 text-xs text-ink/45">
              BookMe Desktop never sees your Google password.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
