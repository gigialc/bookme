# bookme 💖

Your own personal Calendly! Connect all your Gmail accounts, and people book calls with you
through a cute little booking page. Busy times from **every** connected calendar are merged, so
you're never double-booked.

## What's inside

- 🗓️ **Public booking page** — visitors pick a day + time (shown in *their* timezone) and book
- 📅 **Multiple Google accounts** — connect as many Gmails as you want; all their calendars count as "busy"
- 🎥 **Google Meet links** created automatically + calendar invites emailed to both of you
- 🎊 **Confetti** when someone books (obviously)
- 🎨 **5 cute themes** — Strawberry Milk, Lavender Haze, Matcha Latte, Blueberry Sky, Golden Hour
- ⚙️ **Settings** — timezone, minimum notice, booking window, slot spacing, welcome message
- 💬 **Event types** — different call types with emoji, duration, buffers, and colors
- 🕐 **Weekly availability** editor with multiple windows per day
- 🔐 **Password-protected dashboard** with upcoming bookings + one-click cancel

## Setup (one time, ~15 minutes)

### 1. Database (Neon)

1. Go to [neon.tech](https://neon.tech) → create a project called `bookme`
2. Copy the connection string (starts with `postgres://`)

The tables create themselves on first run — nothing else to do 🎉

### 2. Google setup (so "Connect Google account" works)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project (call it `bookme`)
2. **APIs & Services → Library** → search **Google Calendar API** → Enable
3. **APIs & Services → OAuth consent screen**
   - User type: **External**, fill in app name + your email
   - Add yourself (each Gmail you'll connect) under **Test users**
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs — add BOTH:
     - `http://localhost:3000/api/google/callback`
     - `https://YOUR-VERCEL-URL/api/google/callback` (add after deploying)
5. Copy the **Client ID** and **Client Secret**

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in `DATABASE_URL`, `APP_PASSWORD` (your dashboard password — pick anything),
`GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.

### 4. Run it!

```bash
npm run dev
```

Open http://localhost:3000/login → log in → follow the setup checklist
(connect calendar → create an event type → set your hours). Then share your link! 💌

## Deploying to Vercel

```bash
vercel
```

Then in the Vercel dashboard → Settings → Environment Variables, add the same four variables
plus `NEXT_PUBLIC_APP_URL` set to your production URL (e.g. `https://bookme-xxx.vercel.app`).
Finally, add the production redirect URI to your Google OAuth client (step 2.4 above).

## Notes

- **Primary account** ⭐ = where booked events are created (and whose Gmail sends the invites).
  Every other account just contributes busy times. Change it on the Calendars page.
- If Google says the app is "unverified", that's fine — it's your personal app; click
  *Advanced → Continue*. Just make sure each Gmail is added as a Test user.
- Cancelling a booking from the dashboard also deletes the Google event and emails the guest.
