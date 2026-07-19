import Link from "next/link";
import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/dashboard", label: "Home", emoji: "🏡" },
  { href: "/dashboard/event-types", label: "Event types", emoji: "💬" },
  { href: "/dashboard/availability", label: "Availability", emoji: "🕐" },
  { href: "/dashboard/calendars", label: "Calendars", emoji: "📅" },
  { href: "/dashboard/bookings", label: "Bookings", emoji: "💖" },
  { href: "/dashboard/settings", label: "Settings", emoji: "⚙️" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isLoggedIn())) redirect("/login");

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 sm:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-rose-100 bg-white/80 p-3 backdrop-blur sm:min-h-screen sm:w-56 sm:flex-col sm:items-stretch sm:border-b-0 sm:border-r sm:p-5">
        <Link href="/dashboard" className="mb-0 hidden px-3 py-2 text-xl font-bold sm:mb-4 sm:block">
          bookme 💖
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-rose-50 hover:text-neutral-900"
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="ml-auto sm:ml-0 sm:mt-auto sm:pt-4">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
