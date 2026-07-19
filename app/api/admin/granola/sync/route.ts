import { NextResponse } from "next/server";
import { query, getUserById } from "@/lib/db";
import { requireUser } from "@/lib/admin";
import { listNotes, getNote, GranolaNote } from "@/lib/granola";
import { getGranolaAccessToken } from "@/lib/granola-oauth";
import { fetchGranolaNotesViaMcp } from "@/lib/granola-mcp";
import { extractActionItems } from "@/lib/extract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const user = await getUserById(userId);
  if (!user || (!user.granola_access_token && !user.granola_api_key)) {
    return NextResponse.json({ error: "Connect Granola in Settings first" }, { status: 400 });
  }

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  let notes: GranolaNote[];
  try {
    const oauthToken = await getGranolaAccessToken(user);
    if (oauthToken) {
      notes = await fetchGranolaNotesViaMcp(oauthToken, since.toISOString());
    } else if (user.granola_api_key) {
      notes = await listNotes(user.granola_api_key, since);
    } else {
      return NextResponse.json(
        { error: "Your Granola connection expired — reconnect it in Settings" },
        { status: 400 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const invalid = msg === "invalid_key" || msg === "granola_unauthorized";
    return NextResponse.json(
      {
        error: invalid
          ? "Your Granola connection stopped working — reconnect it in Settings"
          : "Couldn't reach Granola — try again in a moment",
      },
      { status: invalid ? 400 : 502 }
    );
  }

  // Skip notes we've already turned into to-dos.
  const seen = await query<{ source_note_id: string }>(
    "SELECT DISTINCT source_note_id FROM todos WHERE user_id = $1 AND source_note_id IS NOT NULL",
    [userId]
  );
  const seenIds = new Set(seen.map((r) => r.source_note_id));
  const fresh = notes.filter((n) => n.id && !seenIds.has(n.id)).slice(0, 10);

  let created = 0;
  const processedNotes: string[] = [];
  for (const stub of fresh) {
    const note = stub.summary
      ? stub
      : user.granola_api_key
        ? await getNote(user.granola_api_key, stub.id)
        : null;
    if (!note?.summary) continue;
    const title = note.title || "Untitled meeting";
    const items = await extractActionItems(title, note.summary);
    for (const text of items) {
      await query(
        `INSERT INTO todos (user_id, text, source, source_note_id, source_note_title, meeting_time)
         VALUES ($1, $2, 'granola', $3, $4, $5)`,
        [userId, text.slice(0, 500), note.id, title, note.created_at ?? null]
      );
      created++;
    }
    // Remember processed notes even when no action items were found.
    if (items.length === 0) {
      await query(
        `INSERT INTO todos (user_id, text, done, source, source_note_id, source_note_title, meeting_time)
         VALUES ($1, $2, TRUE, 'granola-empty', $3, $4, $5)`,
        [userId, `(no action items) ${title}`.slice(0, 500), note.id, title, note.created_at ?? null]
      );
    }
    processedNotes.push(title);
  }

  return NextResponse.json({
    ok: true,
    notes_checked: notes.length,
    notes_processed: processedNotes,
    todos_created: created,
  });
}
