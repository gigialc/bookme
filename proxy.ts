import { getAuth } from "@/lib/neon-auth";

// Required by Neon Auth: this middleware completes the OAuth return trip
// (exchanging the one-time verifier for the session cookie) and protects
// the dashboard. Public pages (/, /[username], booking) are not matched.
export default getAuth().middleware({ loginUrl: "/login" });

export const config = {
  matcher: ["/dashboard/:path*"],
};
