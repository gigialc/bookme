const GRANOLA_API = "https://public-api.granola.ai/v1";

export type GranolaNote = {
  id: string;
  title: string | null;
  created_at: string | null;
  summary: string | null;
  attendees?: { name?: string | null; email?: string | null }[];
};

async function granolaFetch(apiKey: string, path: string) {
  const res = await fetch(`${GRANOLA_API}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("invalid_key");
  }
  if (!res.ok) {
    throw new Error(`granola_${res.status}`);
  }
  return res.json();
}

/** Verify a key works by listing notes. */
export async function testGranolaKey(apiKey: string): Promise<boolean> {
  try {
    await granolaFetch(apiKey, "/notes");
    return true;
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_key") return false;
    throw err;
  }
}

/** List recent notes created after the given date. */
export async function listNotes(apiKey: string, createdAfter: Date): Promise<GranolaNote[]> {
  const notes: GranolaNote[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({ created_after: createdAfter.toISOString() });
    if (cursor) params.set("cursor", cursor);
    const data = await granolaFetch(apiKey, `/notes?${params}`);
    notes.push(...(data.notes ?? []));
    if (!data.hasMore || !data.cursor) break;
    cursor = data.cursor;
  }
  return notes;
}

/** Fetch a single note with its full summary. */
export async function getNote(apiKey: string, id: string): Promise<GranolaNote | null> {
  try {
    const data = await granolaFetch(apiKey, `/notes/${encodeURIComponent(id)}`);
    return data.note ?? data;
  } catch {
    return null;
  }
}
