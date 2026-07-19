"use server";

import { redirect } from "next/navigation";
import { getAuth } from "./neon-auth";

export async function signInWithGoogleAction() {
  let url: string | null = null;
  try {
    const { data, error } = await getAuth().signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    if (!error && data?.url) url = data.url;
  } catch (err) {
    console.error("Google sign-in failed:", err);
  }
  redirect(url ?? "/login?error=oauth");
}

export async function signOutAction() {
  try {
    await getAuth().signOut();
  } catch (err) {
    console.error("Sign-out failed:", err);
  }
  redirect("/");
}
