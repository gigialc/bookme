import { createHash } from "node:crypto";

export const DESKTOP_STATE_RE = /^[A-Za-z0-9_-]{32,128}$/;
export const DESKTOP_CHALLENGE_RE = /^[A-Za-z0-9_-]{43}$/;

export function validDesktopPort(value: string | null): number | null {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1024 && port <= 65535 ? port : null;
}

export function validDesktopParams(
  portValue: string | null,
  state: string | null,
  challenge: string | null
): { port: number; state: string; challenge: string } | null {
  const port = validDesktopPort(portValue);
  if (!port || !state || !challenge) return null;
  if (!DESKTOP_STATE_RE.test(state) || !DESKTOP_CHALLENGE_RE.test(challenge)) return null;
  return { port, state, challenge };
}

export function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}
