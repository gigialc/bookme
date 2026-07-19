import { NextResponse } from "next/server";
import { isLoggedIn } from "./auth";

export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isLoggedIn()) return null;
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
