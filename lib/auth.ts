import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bookme_session";

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.APP_PASSWORD;
  if (!s) throw new Error("Set APP_PASSWORD (and optionally SESSION_SECRET) in .env.local");
  return s;
}

export function sessionToken(): string {
  return createHmac("sha256", secret()).update("bookme-owner-session").digest("hex");
}

export function passwordIsCorrect(password: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    return token === sessionToken();
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
