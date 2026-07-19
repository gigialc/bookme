import { createNeonAuth } from "@neondatabase/auth/next/server";

let _auth: ReturnType<typeof createNeonAuth> | null = null;

/**
 * Lazy so the app (and `next build`) doesn't crash before the Neon Auth
 * env vars are configured — auth calls simply fail until they are set.
 */
export function getAuth() {
  if (!_auth) {
    _auth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL || "https://neon-auth-not-configured.invalid",
      cookies: {
        secret:
          process.env.NEON_AUTH_COOKIE_SECRET ||
          "dev-placeholder-secret-please-configure-32chars!",
        // The SDK default is "strict", which drops the session cookie on the
        // cross-site redirect back from Google → infinite login loop.
        sameSite: "lax",
      },
    });
  }
  return _auth;
}
