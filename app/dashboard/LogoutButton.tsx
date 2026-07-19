import { signOutAction } from "@/lib/actions";
import { LogOutIcon } from "@/components/icons";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
      >
        <LogOutIcon className="h-4 w-4 text-stone-400" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
