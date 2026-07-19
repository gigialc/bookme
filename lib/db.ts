import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _bookmePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _bookmeSchemaReady: Promise<void> | undefined;
}

function getPool(): Pool {
  if (!global._bookmePool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Add it to .env.local (see README).");
    }
    global._bookmePool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return global._bookmePool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  auth_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  welcome_message TEXT NOT NULL DEFAULT 'Pick a time that works for you — can''t wait to chat! ✨',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  min_notice_hours INTEGER NOT NULL DEFAULT 4,
  booking_window_days INTEGER NOT NULL DEFAULT 30,
  theme TEXT NOT NULL DEFAULT 'rose',
  slot_step_mins INTEGER NOT NULL DEFAULT 30,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS granola_api_key TEXT;
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'manual',
  source_note_id TEXT,
  source_note_title TEXT,
  meeting_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  refresh_token TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  include_in_busy BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS event_types (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💬',
  description TEXT NOT NULL DEFAULT '',
  duration_mins INTEGER NOT NULL DEFAULT 30,
  buffer_before INTEGER NOT NULL DEFAULT 0,
  buffer_after INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'rose',
  location TEXT NOT NULL DEFAULT 'Google Meet',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);
CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type_id INTEGER REFERENCES event_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  google_event_id TEXT,
  google_account_email TEXT,
  meet_link TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function ensureSchema(): Promise<void> {
  if (!global._bookmeSchemaReady) {
    global._bookmeSchemaReady = getPool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((err) => {
        global._bookmeSchemaReady = undefined;
        throw err;
      });
  }
  return global._bookmeSchemaReady;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  await ensureSchema();
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

export type User = {
  id: number;
  auth_id: string | null;
  email: string;
  username: string;
  display_name: string;
  welcome_message: string;
  timezone: string;
  min_notice_hours: number;
  booking_window_days: number;
  theme: string;
  slot_step_mins: number;
  avatar_url: string | null;
  granola_api_key: string | null;
};

export type Todo = {
  id: number;
  user_id: number;
  text: string;
  done: boolean;
  source: string;
  source_note_id: string | null;
  source_note_title: string | null;
  meeting_time: string | null;
  created_at: string;
};

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await query<User>("SELECT * FROM users WHERE id = $1", [id]);
  return user ?? null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const [user] = await query<User>("SELECT * FROM users WHERE username = $1", [
    username.toLowerCase(),
  ]);
  return user ?? null;
}

export const RESERVED_USERNAMES = new Set([
  "login", "logout", "dashboard", "api", "book", "admin", "settings", "u",
  "www", "app", "about", "help", "terms", "privacy", "signup", "signin",
]);

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

/** Derive a unique username from an email address. */
export async function usernameFromEmail(email: string): Promise<string> {
  let base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  if (base.length < 2) base = "user";
  if (RESERVED_USERNAMES.has(base)) base = `${base}-1`;

  let candidate = base;
  for (let i = 2; ; i++) {
    const clash = await query("SELECT id FROM users WHERE username = $1", [candidate]);
    if (clash.length === 0) return candidate;
    candidate = `${base}-${i}`;
  }
}

export type Account = {
  id: number;
  user_id: number;
  email: string;
  refresh_token: string;
  is_primary: boolean;
  include_in_busy: boolean;
};

export type EventType = {
  id: number;
  user_id: number;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  duration_mins: number;
  buffer_before: number;
  buffer_after: number;
  color: string;
  location: string;
  active: boolean;
};

export type AvailabilityRule = {
  id: number;
  user_id: number;
  weekday: number; // 0 = Monday ... 6 = Sunday (luxon weekday - 1)
  start_time: string; // "09:00"
  end_time: string; // "17:00"
};

export type Booking = {
  id: number;
  user_id: number;
  event_type_id: number | null;
  name: string;
  email: string;
  notes: string;
  start_ts: string;
  end_ts: string;
  google_event_id: string | null;
  google_account_email: string | null;
  meet_link: string | null;
  status: string;
};
