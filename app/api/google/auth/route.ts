import { NextResponse } from "next/server";
import { sessionUserId } from "@/lib/auth";
import { oauthClient, GOOGLE_SCOPES, appUrl } from "@/lib/google";

export const dynamic = "force-dynamic";

// Starts the Google OAuth flow to connect a calendar account
// to the currently signed-in user.
export async function GET() {
  if ((await sessionUserId()) === null) {
    return NextResponse.redirect(new URL("/login", appUrl()));
  }
  const url = oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent select_account",
    scope: GOOGLE_SCOPES,
  });
  return NextResponse.redirect(url);
}
