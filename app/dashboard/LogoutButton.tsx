import { signOutAction } from "@/lib/actions";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-400 transition hover:bg-rose-50 hover:text-rose-500"
      >
        <span>👋</span>
        <span>Log out</span>
      </button>
    </form>
  );
}
