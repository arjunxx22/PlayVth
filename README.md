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

### Payments (Razorpay)

Copy `.env.example` to `.env.local` and set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Without keys the app runs in demo mode and simulates payment.

How the online flow works:

1. `createBooking` re-checks availability in a transaction, inserts the booking as `pending_payment` (the slot is held for 10 minutes), reserves any redeemed Karma, and creates a Razorpay Order for the total.
2. The browser opens Razorpay Standard Checkout with that order (UPI, cards, net banking, wallets).
3. On success the browser posts `razorpay_order_id`, `razorpay_payment_id` and `razorpay_signature` to `/api/payments/verify`. The server checks the HMAC signature, fetches the payment from Razorpay to confirm the amount, marks the booking `confirmed`, and awards Karma.
4. `/api/payments/webhook` handles `payment.captured` (confirms a booking the browser failed to verify), `payment.failed` (releases the slot, returns Karma), and `refund.processed` / `refund.failed`. Deliveries are de-duplicated by event id. Register the URL in Razorpay Dashboard → Settings → Webhooks with the same secret.
5. Cancellations call the Razorpay Refund API for the policy amount (full amount when a venue cancels). If the refund call fails the booking stays confirmed and the user sees the error.
6. Unpaid holds older than 10 minutes are expired lazily whenever slots are read; the customer can retry payment from the booking page while the hold lasts.

Use Razorpay test keys (`rzp_test_…`) and test cards / UPI from the Razorpay docs to try it end to end. For local webhooks, expose the dev server with a tunnel such as ngrok.

### Mobile apps (App Store and Google Play)

The iOS and Android apps are Capacitor shells that load the hosted web app. See **[docs/STORE_LAUNCH.md](docs/STORE_LAUNCH.md)** for the complete launch checklist and **`store/`** for listing copy, screenshots and graphics.

```bash
npx cap sync                      # after changing capacitor.config.ts or plugins
npx cap open ios                  # Xcode (macOS)
npx cap open android              # Android Studio
npx @capacitor/assets generate    # regenerate icons/splash from assets/
```

Set `PLAYVTH_APP_URL` to your production URL before syncing. Release builds run in GitHub Actions (`android-release.yml`, `ios-release.yml`) from secrets described in the launch guide.

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
| `/api/*` | JSON endpoints (sports, venues, slots, games) for a mobile app; `/api/payments/verify` and `/api/payments/webhook` for Razorpay |

### Code map

```
src/lib/schema.ts    SQL schema            src/lib/slots.ts     availability + pricing engine
src/lib/seed.ts      demo data             src/lib/karma.ts     loyalty & fee rules
src/lib/db.ts        node:sqlite helpers   src/lib/actions.ts   all server actions (auth, booking, games, partner)
src/lib/auth.ts      OTP + sessions        src/lib/queries.ts   typed read queries
src/app/**           pages (App Router)    src/components/**    UI + client forms
```

Payment code lives in `src/lib/razorpay.ts` (REST client + signature checks) and `src/lib/payments.ts` (booking payment lifecycle: holds, confirm, fail, expire, refund).
