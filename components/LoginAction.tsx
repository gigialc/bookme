"use client";

import { useEffect, useState } from "react";
import { signInWithGoogleAction } from "@/lib/actions";
import { GoogleIcon } from "@/components/icons";

export default function LoginAction({
  desktopHint = false,
}: {
  desktopHint?: boolean;
}) {
  const [isDesktop, setIsDesktop] = useState(desktopHint);

  useEffect(() => {
    setIsDesktop(navigator.userAgent.includes("Electron"));
  }, []);

  if (isDesktop) {
    return (
      <a
        href="bookme-desktop://sign-in"
        className="btn flex w-full items-center justify-center py-3 text-sm"
      >
        Sign in with your browser
      </a>
    );
  }

  return (
    <form action={signInWithGoogleAction}>
      <button type="submit" className="btn w-full py-3 text-sm">
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  );
}
