import { NextResponse } from "next/server";
import { sessionUserId } from "@/lib/auth";
import { appUrl } from "@/lib/google";
import { buildAuthUrl, makePkce } from "@/lib/granola-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  if ((await sessionUserId()) === null) {
    return NextResponse.redirect(new URL("/login", appUrl()));
  }
  try {
    const { verifier, challenge, state } = makePkce();
    const url = await buildAuthUrl(challenge, state);
    const res = NextResponse.redirect(url);
    res.cookies.set("granola_pkce", JSON.stringify({ v: verifier, s: state }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  } catch (err) {
    console.error("Granola connect failed:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?granola=error", appUrl()));
  }
}
