# bookme 💖

A cute little multi-user Calendly! Anyone can sign in, connect all their Gmail accounts, and get
their own booking page (like `yoursite.com/georgina`). Busy times from **every** connected
calendar are merged, so nobody gets double-booked.

## What's inside

- 👯 **Multi-user** — everyone who signs in gets their own page, settings, and calendars
- 🔑 **Sign in with Google** via [Neon Auth](https://neon.com/docs/neon-auth/overview) (no scary warnings — login uses only basic profile scopes)
- 📅 **Multiple Google accounts per person** — all their calendars count as "busy"
- 🎥 **Google Meet links** created automatically + calendar invites emailed to both sides
- 🎊 **Confetti** when someone books (obviously)
- 🎨 **5 cute themes** — Strawberry Milk, Lavender Haze, Matcha Latte, Blueberry Sky, Golden Hour
- ⚙️ **Per-user settings** — username, timezone, minimum notice, booking window, slot spacing
- 💬 **Event types** with emoji, duration, buffers, colors · 🕐 weekly availability editor
- 💖 Bookings list with one-click cancel (deletes the Google event + emails the guest)

## Setup (one time)

### 1. Neon — database + auth

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **connection string** → `DATABASE_URL` (app tables create themselves on first run)
3. Open the project's **Auth** tab → enable Neon Auth → copy the **base URL** → `NEON_AUTH_BASE_URL`
4. Make sure **Google** is enabled as a sign-in method in the Auth settings
5. `openssl rand -base64 32` → `NEON_AUTH_COOKIE_SECRET`

### 2. Google Cloud — calendar connections

This powers the "Connect a Google account" button (calendar access, Meet links):

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project
2. **APIs & Services → Library** → enable **Google Calendar API**
3. **OAuth consent screen** → External → fill in name + email
4. **Credentials → Create credentials → OAuth client ID** → Web application
   - Authorized redirect URIs (add both):
     - `http://localhost:3000/api/google/callback`
     - `https://YOUR-PRODUCTION-URL/api/google/callback`
5. Copy Client ID + Secret → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

> **About the "unverified app" screen:** Calendar scopes are *sensitive*, so until the app passes
> Google's (free) verification review, people connecting a calendar see a warning and must be
> added as **Test users** (max 100) or click *Advanced → Continue*. Sign-in itself never shows a
> warning — it's only the calendar-connect step. When you're ready for the public, submit the
> OAuth consent screen for verification; that's the same one-time process every scheduling app
> goes through.

### 3. Run it

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

Open http://localhost:3000 → sign in → follow the checklist → share your link! 💌

## Deploying to Vercel

1. `vercel` (or import the repo at vercel.com)
2. Add all env vars from `.env.example`, with `NEXT_PUBLIC_APP_URL` = your production URL
3. Add the production redirect URI to your Google OAuth client (step 2.4)
4. In Neon Auth settings, add your production domain to the allowed origins/redirects

## Notes

- **Primary account** ⭐ = where booked events are created (and whose Gmail sends invites).
  Other accounts just contribute busy times. Change it on the Calendars page.
- Usernames are claimable on the Settings page (lowercase letters, numbers, dashes).
