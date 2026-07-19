import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { sessionUserId } from "@/lib/auth";
import { oauthClient, appUrl } from "@/lib/google";
import { query, Account } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const redirect = (path: string) => NextResponse.redirect(new URL(path, appUrl()));

  const userId = await sessionUserId();
  if (userId === null) return redirect("/login");

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return redirect("/dashboard/calendars?error=denied");

  try {
    const client = oauthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const me = await oauth2.userinfo.get();
    const email = me.data.email?.toLowerCase();
    if (!email) return redirect("/dashboard/calendars?error=noemail");

    const [existing] = await query<Account>("SELECT * FROM accounts WHERE email = $1", [email]);
    if (existing && existing.user_id !== userId) {
      return redirect("/dashboard/calendars?error=taken");
    }

    if (tokens.refresh_token) {
      const mine = await query("SELECT id FROM accounts WHERE user_id = $1", [userId]);
      await query(
        `INSERT INTO accounts (user_id, email, refresh_token, is_primary)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET refresh_token = EXCLUDED.refresh_token`,
        [userId, email, tokens.refresh_token, mine.length === 0]
      );
    } else if (!existing) {
      // Google only returns a refresh token on first consent; without one we
      // can't act on this account later, so ask the user to re-consent.
      return redirect("/dashboard/calendars?error=norefresh");
    }

    return redirect("/dashboard/calendars?connected=" + encodeURIComponent(email));
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return redirect("/dashboard/calendars?error=oauth");
  }
}
