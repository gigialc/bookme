"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-400 transition hover:bg-rose-50 hover:text-rose-500"
    >
      <span>👋</span>
      <span>Log out</span>
    </button>
  );
}
