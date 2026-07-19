import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { isLoggedIn } from "@/lib/auth";
import { oauthClient, appUrl } from "@/lib/google";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const redirect = (path: string) => NextResponse.redirect(new URL(path, appUrl()));

  if (!(await isLoggedIn())) return redirect("/login");

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return redirect("/dashboard/calendars?error=denied");

  try {
    const client = oauthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const me = await oauth2.userinfo.get();
    const email = me.data.email;
    if (!email) return redirect("/dashboard/calendars?error=noemail");

    if (tokens.refresh_token) {
      const existing = await query("SELECT id FROM accounts LIMIT 1");
      await query(
        `INSERT INTO accounts (email, refresh_token, is_primary)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET refresh_token = EXCLUDED.refresh_token`,
        [email, tokens.refresh_token, existing.length === 0]
      );
    } else {
      // Google only returns a refresh token on first consent; without one we
      // can't act on this account later, so ask the user to re-consent.
      const existing = await query("SELECT id FROM accounts WHERE email = $1", [email]);
      if (existing.length === 0) return redirect("/dashboard/calendars?error=norefresh");
    }

    return redirect("/dashboard/calendars?connected=" + encodeURIComponent(email));
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return redirect("/dashboard/calendars?error=oauth");
  }
}
