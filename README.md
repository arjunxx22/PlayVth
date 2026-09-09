# PlayVth

A sports venue booking and community platform modelled on [Playo](https://playo.co): book courts and turfs by the hour, join or host games with players of your level, find coaches, earn Karma, and manage venues from a partner dashboard.

See **[docs/PLAYO_ANALYSIS.md](docs/PLAYO_ANALYSIS.md)** for the full product analysis, requirements, data model and roadmap.

## Run it

Requires Node.js 22.13+ (uses the built-in `node:sqlite`, no native modules).

```bash
npm install
npm run dev        # http://localhost:3000
```

The SQLite database is created and seeded automatically at `data/playvth.db` on first request (6 cities, 10 sports, 12 venues with courts and pricing, demo users, games, coaches). Delete the file to reset.

### Demo logins

| Role | Phone | OTP |
|---|---|---|
| Player (Aarav) | `9000000001` | `123456` |
| Venue partner (owns the 4 Bengaluru venues) | `9999999999` | `123456` |
| Any other 10-digit number | creates a new account | `123456` |

The fixed demo OTP is used until `SMS_API_KEY` is set; then OTPs are random and need an SMS provider wired into `issueOtp()` in `src/lib/auth.ts`. Override the demo code with `PLAYVTH_DEMO_OTP`.

### Production build

```bash
npm run build && npm run start
npm run lint
```

## What's inside

| Route | What it does |
|---|---|
| `/` | City-aware home: sports, top venues, nearby games |
| `/venues`, `/venues/[slug]` | Discovery with filters; venue page with court × hour slot grid, live availability, peak/weekend pricing, reviews, policy |
| `/book` → `/bookings/[id]` | Checkout with Karma redemption and convenience fee; confirmation code; policy-driven cancellation and refund preview |
| `/play`, `/play/new`, `/play/[id]` | Game feed, host a game, request to join, host approval, leave/cancel |
| `/coaching` | Coach directory with enquiries |
| `/profile`, `/profile/edit` | Bookings, games, Karma ledger, referral code, skill levels |
| `/partner`, `/partner/new`, `/partner/venues/[id]` | Partner landing, list-your-venue wizard, dashboard with revenue, day scheduler, block slots, venue-side cancel, pricing editor |
| `/api/*` | JSON endpoints (sports, venues, slots, games) for a mobile app |

### Code map

```
src/lib/schema.ts    SQL schema            src/lib/slots.ts     availability + pricing engine
src/lib/seed.ts      demo data             src/lib/karma.ts     loyalty & fee rules
src/lib/db.ts        node:sqlite helpers   src/lib/actions.ts   all server actions (auth, booking, games, partner)
src/lib/auth.ts      OTP + sessions        src/lib/queries.ts   typed read queries
src/app/**           pages (App Router)    src/components/**    UI + client forms
```

Payments are simulated. Swap the `createBooking` action for a Razorpay order/capture flow when going live.
