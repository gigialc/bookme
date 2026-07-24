import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { sha256Base64Url, validDesktopParams } from "@/lib/desktop-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = validDesktopParams(
    req.nextUrl.searchParams.get("port"),
    req.nextUrl.searchParams.get("state"),
    req.nextUrl.searchParams.get("challenge")
  );
  if (!params) {
    return NextResponse.json({ error: "invalid desktop callback" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    const retry = new URL("/desktop-login", req.nextUrl.origin);
    retry.searchParams.set("port", String(params.port));
    retry.searchParams.set("state", params.state);
    retry.searchParams.set("challenge", params.challenge);
    retry.searchParams.set("error", "session");
    return NextResponse.redirect(retry);
  }

  const authCookies = req.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("__Secure-neon-auth"))
    .map(({ name, value }) => ({ name, value }));
  if (!authCookies.some((cookie) => cookie.name.endsWith(".session_token"))) {
    return NextResponse.json({ error: "desktop session missing" }, { status: 400 });
  }

  const code = randomBytes(32).toString("base64url");
  await query("DELETE FROM desktop_auth_codes WHERE expires_at <= NOW()");
  await query(
    `INSERT INTO desktop_auth_codes
     (code_hash, user_id, state, verifier_challenge, auth_cookies, expires_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW() + INTERVAL '2 minutes')`,
    [
      sha256Base64Url(code),
      user.id,
      params.state,
      params.challenge,
      JSON.stringify(authCookies),
    ]
  );

  const callback = new URL(`http://127.0.0.1:${params.port}/callback`);
  callback.searchParams.set("code", code);
  callback.searchParams.set("state", params.state);
  return NextResponse.redirect(callback);
}
