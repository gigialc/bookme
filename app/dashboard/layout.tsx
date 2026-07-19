import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import {
  HomeIcon,
  TagIcon,
  ClockIcon,
  CalendarIcon,
  ListIcon,
  SettingsIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/dashboard/event-types", label: "Event types", icon: TagIcon },
  { href: "/dashboard/availability", label: "Availability", icon: ClockIcon },
  { href: "/dashboard/calendars", label: "Calendars", icon: CalendarIcon },
  { href: "/dashboard/bookings", label: "Bookings", icon: ListIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    user = await getSessionUser();
  } catch {
    // DB not configured yet — let the dashboard page show setup help.
  }
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col bg-stone-50 sm:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-stone-200 bg-white p-3 sm:min-h-screen sm:w-60 sm:flex-col sm:items-stretch sm:border-b-0 sm:border-r sm:p-4">
        <Link
          href="/dashboard"
          className="mb-0 hidden px-3 py-2 text-lg font-semibold tracking-tight sm:mb-4 sm:block"
        >
          bookme
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <item.icon className="h-4 w-4 text-stone-400" />
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="ml-auto sm:ml-0 sm:mt-auto sm:border-t sm:border-stone-100 sm:pt-3">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-10">{children}</main>
    </div>
  );
}
