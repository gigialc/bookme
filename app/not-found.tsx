import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-cream p-4">
      <div className="card w-full max-w-sm overflow-hidden text-center">
        <div className="titlebar">
          <span className="titlebar-box" />
          <span className="titlebar-label">error 404</span>
        </div>
        <div className="p-10">
          <div className="mb-4 flex justify-center">
            <Logo size={44} />
          </div>
          <h1 className="mb-2 text-xl font-bold tracking-tight">Page not found</h1>
          <p className="mb-6 text-sm text-ink/60">
            This page doesn&apos;t exist — maybe the link changed, or the username was renamed.
          </p>
          <Link href="/" className="btn btn-primary px-6 py-2.5 text-sm">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
