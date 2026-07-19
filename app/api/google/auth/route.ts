import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { oauthClient, GOOGLE_SCOPES } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isLoggedIn())) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  const url = oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent select_account",
    scope: GOOGLE_SCOPES,
  });
  return NextResponse.redirect(url);
}
