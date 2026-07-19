"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 p-4">
      <form
        onSubmit={submit}
        className="animate-pop w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <div className="animate-floaty mb-2 inline-block text-5xl">🔐</div>
          <h1 className="text-2xl font-bold">Hi cutie, it&apos;s you!</h1>
          <p className="text-sm text-neutral-500">Enter your password to manage bookings</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your secret password"
          autoFocus
          className="mb-3 w-full rounded-2xl border border-rose-200 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-300"
        />
        {error && <p className="mb-3 text-center text-sm text-rose-500">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-2xl bg-rose-400 py-3 font-bold text-white transition hover:bg-rose-500 disabled:opacity-50"
        >
          {busy ? "Checking… 💭" : "Let me in ✨"}
        </button>
      </form>
    </main>
  );
}
