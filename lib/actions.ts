"use server";

import { redirect } from "next/navigation";
import { getAuth } from "./neon-auth";
import { validDesktopParams } from "./desktop-auth";

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

export async function desktopSignInWithGoogleAction(formData: FormData) {
  const params = validDesktopParams(
    String(formData.get("port") ?? ""),
    String(formData.get("state") ?? ""),
    String(formData.get("challenge") ?? "")
  );
  if (!params) redirect("/desktop-login?error=invalid");

  const callbackURL =
    `/api/desktop-auth/complete?port=${params.port}` +
    `&state=${encodeURIComponent(params.state)}` +
    `&challenge=${encodeURIComponent(params.challenge)}`;
  let url: string | null = null;
  try {
    const { data, error } = await getAuth().signIn.social({
      provider: "google",
      callbackURL,
    });
    if (!error && data?.url) url = data.url;
  } catch (err) {
    console.error("Desktop Google sign-in failed:", err);
  }
  redirect(url ?? "/desktop-login?error=oauth");
}
