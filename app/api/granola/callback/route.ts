import { NextRequest, NextResponse } from "next/server";
import { sessionUserId } from "@/lib/auth";
import { appUrl } from "@/lib/google";
import { exchangeCode, saveTokens } from "@/lib/granola-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const redirect = (path: string) => {
    const res = NextResponse.redirect(new URL(path, appUrl()));
    res.cookies.set("granola_pkce", "", { path: "/", maxAge: 0 });
    return res;
  };

  const userId = await sessionUserId();
  if (userId === null) return redirect("/login");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code) return redirect("/dashboard/settings?granola=denied");

  const cookie = req.cookies.get("granola_pkce")?.value;
  if (!cookie) return redirect("/dashboard/settings?granola=error");
  let pkce: { v: string; s: string };
  try {
    pkce = JSON.parse(cookie);
  } catch {
    return redirect("/dashboard/settings?granola=error");
  }
  if (!state || state !== pkce.s) return redirect("/dashboard/settings?granola=error");

  try {
    const tokens = await exchangeCode(code, pkce.v);
    await saveTokens(userId, tokens);
    return redirect("/dashboard/settings?granola=connected");
  } catch (err) {
    console.error("Granola callback failed:", err);
    return redirect("/dashboard/settings?granola=error");
  }
}
