import { NextResponse } from "next/server";
import { sessionUserId } from "./auth";

/** Returns the logged-in user id, or a 401 response to return as-is. */
export async function requireUser(): Promise<number | NextResponse> {
  const userId = await sessionUserId();
  if (userId !== null) return userId;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "chat"
  );
}
