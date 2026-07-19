import { getAuth } from "./neon-auth";
import { query, usernameFromEmail, User } from "./db";

/**
 * The logged-in app user, or null. Looks up the Neon Auth session and
 * lazily creates our own users row (username, scheduling prefs) on first visit.
 */
export async function getSessionUser(): Promise<User | null> {
  let authUser: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  } | null = null;
  try {
    const { data: session } = await getAuth().getSession();
    authUser = session?.user ?? null;
  } catch {
    return null;
  }
  if (!authUser?.email) return null;
  const email = authUser.email.toLowerCase();

  const [byAuthId] = await query<User>("SELECT * FROM users WHERE auth_id = $1", [authUser.id]);
  if (byAuthId) {
    if (authUser.image && authUser.image !== byAuthId.avatar_url) {
      const [updated] = await query<User>(
        "UPDATE users SET avatar_url = $2 WHERE id = $1 RETURNING *",
        [byAuthId.id, authUser.image]
      );
      return updated;
    }
    return byAuthId;
  }

  // Link an existing row by email (e.g. auth provider re-created the user).
  const [byEmail] = await query<User>("SELECT * FROM users WHERE email = $1", [email]);
  if (byEmail) {
    const [linked] = await query<User>(
      "UPDATE users SET auth_id = $2 WHERE id = $1 RETURNING *",
      [byEmail.id, authUser.id]
    );
    return linked;
  }

  const username = await usernameFromEmail(email);
  const displayName = authUser.name?.split(" ")[0] || username;
  const [created] = await query<User>(
    `INSERT INTO users (auth_id, email, username, display_name, avatar_url) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id
     RETURNING *`,
    [authUser.id, email, username, displayName, authUser.image ?? null]
  );
  return created;
}

export async function sessionUserId(): Promise<number | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}
