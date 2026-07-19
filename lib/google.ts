import { google } from "googleapis";
import { query, Account } from "./db";

export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function oauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local (see README).");
  }
  return new google.auth.OAuth2(clientId, clientSecret, `${appUrl()}/api/google/callback`);
}

export function authedClient(refreshToken: string) {
  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export type BusyInterval = { start: string; end: string };

/** Fetch busy intervals across every calendar of one connected account. */
export async function busyForAccount(
  account: Account,
  timeMinIso: string,
  timeMaxIso: string
): Promise<BusyInterval[]> {
  const auth = authedClient(account.refresh_token);
  const calendar = google.calendar({ version: "v3", auth });

  const calList = await calendar.calendarList.list({ maxResults: 50 });
  const ids = (calList.data.items ?? [])
    .filter((c) => c.selected !== false || c.primary)
    .map((c) => c.id!)
    .filter(Boolean)
    .slice(0, 20);
  if (ids.length === 0) return [];

  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      items: ids.map((id) => ({ id })),
    },
  });

  const busy: BusyInterval[] = [];
  for (const cal of Object.values(fb.data.calendars ?? {})) {
    for (const b of cal.busy ?? []) {
      if (b.start && b.end) busy.push({ start: b.start, end: b.end });
    }
  }
  return busy;
}

export async function allBusy(
  userId: number,
  timeMinIso: string,
  timeMaxIso: string
): Promise<BusyInterval[]> {
  const accounts = await query<Account>(
    "SELECT * FROM accounts WHERE user_id = $1 AND include_in_busy = TRUE",
    [userId]
  );
  const results = await Promise.allSettled(
    accounts.map((a) => busyForAccount(a, timeMinIso, timeMaxIso))
  );
  const busy: BusyInterval[] = [];
  for (const r of results) if (r.status === "fulfilled") busy.push(...r.value);
  return busy;
}

export async function getPrimaryAccount(userId: number): Promise<Account | null> {
  const rows = await query<Account>(
    "SELECT * FROM accounts WHERE user_id = $1 ORDER BY is_primary DESC, id ASC LIMIT 1",
    [userId]
  );
  return rows[0] ?? null;
}

export async function createBookingEvent(opts: {
  account: Account;
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  attendeeEmail: string;
  attendeeName: string;
  timezone: string;
  withMeet: boolean;
}): Promise<{ eventId: string; meetLink: string | null }> {
  const auth = authedClient(opts.account.refresh_token);
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: opts.withMeet ? 1 : 0,
    sendUpdates: "all",
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startIso, timeZone: opts.timezone },
      end: { dateTime: opts.endIso, timeZone: opts.timezone },
      attendees: [{ email: opts.attendeeEmail, displayName: opts.attendeeName }],
      reminders: { useDefault: true },
      ...(opts.withMeet
        ? {
            conferenceData: {
              createRequest: {
                requestId: `bookme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          }
        : {}),
    },
  });

  return {
    eventId: res.data.id ?? "",
    meetLink:
      res.data.hangoutLink ??
      res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
      null,
  };
}

export async function cancelBookingEvent(account: Account, eventId: string): Promise<void> {
  const auth = authedClient(account.refresh_token);
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId, sendUpdates: "all" });
}
