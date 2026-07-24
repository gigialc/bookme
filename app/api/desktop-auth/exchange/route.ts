import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  DESKTOP_STATE_RE,
  sha256Base64Url,
} from "@/lib/desktop-auth";

export const dynamic = "force-dynamic";

type CodeRow = {
  state: string;
  verifier_challenge: string;
  auth_cookies: { name: string; value: string }[];
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const state = typeof body?.state === "string" ? body.state : "";
  const verifier = typeof body?.verifier === "string" ? body.verifier : "";
  if (
    !/^[A-Za-z0-9_-]{43}$/.test(code) ||
    !DESKTOP_STATE_RE.test(state) ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)
  ) {
    return NextResponse.json({ error: "invalid exchange" }, { status: 400 });
  }

  const [row] = await query<CodeRow>(
    `DELETE FROM desktop_auth_codes
     WHERE code_hash = $1 AND state = $2 AND expires_at > NOW()
     RETURNING state, verifier_challenge, auth_cookies`,
    [sha256Base64Url(code), state]
  );
  if (!row || sha256Base64Url(verifier) !== row.verifier_challenge) {
    return NextResponse.json({ error: "invalid or expired code" }, { status: 401 });
  }

  return NextResponse.json({
    cookies: row.auth_cookies,
    redirect: "/dashboard",
  });
}
