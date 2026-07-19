import { createHash, randomBytes } from "crypto";
import { query, User } from "./db";
import { appUrl } from "./google";

export const GRANOLA_MCP_URL = "https://mcp.granola.ai/mcp";

type AuthServerMeta = {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
};

let _meta: AuthServerMeta | null = null;

/** Discover Granola's OAuth endpoints per the MCP auth spec. */
export async function discover(): Promise<AuthServerMeta> {
  if (_meta) return _meta;

  const origin = new URL(GRANOLA_MCP_URL).origin;
  let asBase = origin;
  try {
    const prRes = await fetch(`${origin}/.well-known/oauth-protected-resource`, {
      cache: "no-store",
    });
    if (prRes.ok) {
      const pr = await prRes.json();
      if (Array.isArray(pr.authorization_servers) && pr.authorization_servers[0]) {
        asBase = pr.authorization_servers[0].replace(/\/$/, "");
      }
    }
  } catch {
    /* fall back to same origin */
  }

  const candidates = [
    `${asBase}/.well-known/oauth-authorization-server`,
    `${origin}/.well-known/oauth-authorization-server`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const meta = await res.json();
      if (meta.authorization_endpoint && meta.token_endpoint) {
        _meta = meta;
        return meta;
      }
    } catch {
      /* try next */
    }
  }
  throw new Error("Could not discover Granola OAuth endpoints");
}

/** Get (or dynamically register) our OAuth client for the current app URL. */
export async function ensureClientId(): Promise<string> {
  const redirectUri = `${appUrl()}/api/granola/callback`;
  const configKey = `granola_client:${redirectUri}`;

  const [row] = await query<{ value: string }>(
    "SELECT value FROM app_config WHERE key = $1",
    [configKey]
  );
  if (row) return row.value;

  const meta = await discover();
  if (!meta.registration_endpoint) throw new Error("Granola does not offer dynamic registration");

  const res = await fetch(meta.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "bookme",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });
  if (!res.ok) throw new Error(`Granola client registration failed (${res.status})`);
  const reg = await res.json();
  if (!reg.client_id) throw new Error("Granola registration returned no client_id");

  await query(
    `INSERT INTO app_config (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [configKey, reg.client_id]
  );
  return reg.client_id;
}

export function makePkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");
  return { verifier, challenge, state };
}

export async function buildAuthUrl(challenge: string, state: string): Promise<string> {
  const meta = await discover();
  const clientId = await ensureClientId();
  const url = new URL(meta.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${appUrl()}/api/granola/callback`);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("resource", GRANOLA_MCP_URL);
  return url.toString();
}

type TokenSet = { access_token: string; refresh_token?: string; expires_in?: number };

export async function exchangeCode(code: string, verifier: string): Promise<TokenSet> {
  const meta = await discover();
  const clientId = await ensureClientId();
  const res = await fetch(meta.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: `${appUrl()}/api/granola/callback`,
      code_verifier: verifier,
      resource: GRANOLA_MCP_URL,
    }),
  });
  if (!res.ok) throw new Error(`Granola token exchange failed (${res.status})`);
  return res.json();
}

export async function saveTokens(userId: number, tokens: TokenSet): Promise<void> {
  const expires = tokens.expires_in
    ? new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString()
    : null;
  await query(
    `UPDATE users SET
       granola_access_token = $2,
       granola_refresh_token = COALESCE($3, granola_refresh_token),
       granola_token_expires = $4
     WHERE id = $1`,
    [userId, tokens.access_token, tokens.refresh_token ?? null, expires]
  );
}

/** Return a working access token for the user, refreshing if needed. */
export async function getGranolaAccessToken(user: User): Promise<string | null> {
  if (!user.granola_access_token) return null;
  const expires = user.granola_token_expires ? new Date(user.granola_token_expires) : null;
  if (!expires || expires > new Date()) return user.granola_access_token;

  if (!user.granola_refresh_token) return user.granola_access_token;
  try {
    const meta = await discover();
    const clientId = await ensureClientId();
    const res = await fetch(meta.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.granola_refresh_token,
        client_id: clientId,
        resource: GRANOLA_MCP_URL,
      }),
    });
    if (!res.ok) return null;
    const tokens: TokenSet = await res.json();
    await saveTokens(user.id, tokens);
    return tokens.access_token;
  } catch {
    return null;
  }
}
