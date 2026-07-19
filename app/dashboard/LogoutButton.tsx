import { signOutAction } from "@/lib/actions";
import { LogOutIcon } from "@/components/icons";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink/60 transition hover:bg-cream hover:text-ink"
      >
        <LogOutIcon className="h-4 w-4 text-ink/50" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
