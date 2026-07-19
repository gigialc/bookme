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
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  refresh_token TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  include_in_busy BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS event_types (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💬',
  description TEXT NOT NULL DEFAULT '',
  duration_mins INTEGER NOT NULL DEFAULT 30,
  buffer_before INTEGER NOT NULL DEFAULT 0,
  buffer_after INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'rose',
  location TEXT NOT NULL DEFAULT 'Google Meet',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
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

export type Settings = {
  display_name: string;
  welcome_message: string;
  timezone: string;
  min_notice_hours: number;
  booking_window_days: number;
  theme: string;
  slot_step_mins: number;
};

export const DEFAULT_SETTINGS: Settings = {
  display_name: "Georgina",
  welcome_message: "Pick a time that works for you — can't wait to chat! ✨",
  timezone: "America/New_York",
  min_notice_hours: 4,
  booking_window_days: 30,
  theme: "rose",
  slot_step_mins: 30,
};

export async function getSettings(): Promise<Settings> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    display_name: map.display_name ?? DEFAULT_SETTINGS.display_name,
    welcome_message: map.welcome_message ?? DEFAULT_SETTINGS.welcome_message,
    timezone: map.timezone ?? DEFAULT_SETTINGS.timezone,
    min_notice_hours: Number(map.min_notice_hours ?? DEFAULT_SETTINGS.min_notice_hours),
    booking_window_days: Number(map.booking_window_days ?? DEFAULT_SETTINGS.booking_window_days),
    theme: map.theme ?? DEFAULT_SETTINGS.theme,
    slot_step_mins: Number(map.slot_step_mins ?? DEFAULT_SETTINGS.slot_step_mins),
  };
}

export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, String(value)]
    );
  }
}

export type Account = {
  id: number;
  email: string;
  refresh_token: string;
  is_primary: boolean;
  include_in_busy: boolean;
};

export type EventType = {
  id: number;
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
  weekday: number; // 0 = Monday ... 6 = Sunday (luxon weekday - 1)
  start_time: string; // "09:00"
  end_time: string; // "17:00"
};

export type Booking = {
  id: number;
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
