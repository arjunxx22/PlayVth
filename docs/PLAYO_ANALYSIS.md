# Playo.co — Product Analysis & Requirements for PlayVth

> Purpose: a complete breakdown of what Playo (playo.co) does, the requirements to build an equivalent product, and how the PlayVth codebase in this repository maps to those requirements.
>
> Sources: Playo's public site structure, Google Play / App Store listings, Playo's help centre (Zendesk / Freshdesk), the Playo Partner App documentation and blog, plus third-party teardown articles. playo.co itself could not be fetched from the build environment, so exact copy and layout are reconstructed from these sources.

---

## 1. What Playo is

Playo is a **sports community and venue-booking marketplace** (India-first, 5M+ users, 50+ sports). It has three sides:

| Side | Who | What they do |
|---|---|---|
| **Players** (consumer app + web) | Anyone who wants to play | Discover and book venues, join or host games, find coaches, earn/redeem Karma |
| **Venue partners** (Partner app + web dashboard) | Turf / court / pool / academy owners | Manage courts, slots, pricing, memberships, bookings, payouts |
| **Playo ops / admin** | Playo staff | Onboard venues, run GameTime events, moderate content, settle payments, support |

Revenue: commission per successful booking (venue side) + a **convenience fee** charged to the player at checkout, plus memberships, sponsored events and B2B tooling.

---

## 2. Feature inventory

### 2.1 Player-facing

| Area | Feature | Notes from Playo |
|---|---|---|
| **Onboarding** | Mobile-number + OTP login, social login | No passwords. Profile asks name, city, sports played, self-rated skill level |
| **Location** | City selector, GPS "near me", distance shown on cards | Metro cities: Bengaluru, Hyderabad, Chennai, Mumbai, Delhi NCR, Pune, and more |
| **Discover venues** | Search, filter by sport / price / rating / distance / amenities, sort, map view | Cards show name, area, sports, rating, "from ₹X/hr", distance |
| **Venue page** | Photos, address & map, timings, sports, amenities, ratings & reviews, cancellation policy, price list | "Book" opens sport → date → court → slot flow |
| **Slot booking** | Hourly grid per court, real-time availability, multi-hour selection, dynamic pricing (peak/weekend), memberships and daily passes | Price is per court per hour unless stated |
| **Checkout** | Karma redemption, coupon code, convenience fee, UPI/card/net-banking/wallet, instant confirmation with booking ID | Refunds to original payment method in 5–7 working days |
| **Manage bookings** | Upcoming / past, reschedule (venue-dependent), cancel with venue-specific fee, share booking | Cannot cancel within ~2 h of start, cannot cancel after one reschedule if venue disallows |
| **Play / Activities** | Feed of games near you; filter by sport, date, skill, distance; join (request → host approval) or host; co-host; player list; chat | Skill matching: beginner / intermediate / advanced; self-rating balanced by peer ratings |
| **GameTime** | Playo-hosted pay-per-spot games at partner venues, guaranteed spot, "just show up" | Filter by sport, skill, distance, slot |
| **Groups** | Create / join groups; group-only game notifications | |
| **Learn / Coaching** | Coaches, academies, trainers by sport, age, rating; enquiry / trial booking | Also yoga, fitness, nutrition |
| **Karma** | Loyalty points: 3 per booking, 1 per game hosted/joined, 50 per referral; redeem up to ~20% (city-specific cap) | Reversed on cancellation |
| **Ratings** | Rate venues; rate co-players (sportsmanship, skill) → user rating graph, badges | |
| **Notifications** | Push, SMS, WhatsApp, email for confirmations, reminders, join requests, group activity | |

### 2.2 Venue-partner-facing (Playo Partner App / web)

| Feature | Notes |
|---|---|
| Venue onboarding ("List your business") | Details, photos, sports, courts, amenities, policies, bank/KYC |
| **Facility scheduler** | Court × hour grid per day; online + offline (walk-in) bookings; block slots for maintenance or coaching |
| **Pricing engine** | Per court, per sport, weekday vs weekend, peak vs off-peak, promotional discounts |
| **Membership manager** | Packages, advances, renewal cycles |
| Bookings & customers | Customer name/phone per booking, cancel/refund from venue side, reports & revenue |
| Notifications | Real-time booking alerts and reminders to venue and customer |
| Loyalty / engagement | Venue-level offers, customer alerts, value-added services |
| Payouts | Commission-based settlement statements |

### 2.3 Admin / ops

Venue approval & KYC, content moderation (games, reviews), coupons and city-level Karma caps, GameTime event creation, refunds & disputes, analytics, CMS for banners.

---

## 3. Core user flows

1. **Book a venue**: City → (search/filter) → venue → sport → date → court + hours → checkout (Karma, fee, payment) → confirmation code → reminder → play → rate venue.
2. **Cancel**: Booking page → refund preview per venue policy → confirm → refund initiated, Karma reversed/returned.
3. **Join a game**: Play feed → filter → game detail (host, players, skill, cost) → "Request to join" → host accepts/declines → in-app chat → attend → rate players.
4. **Host a game**: Sport, city/venue, date, time, players needed, price per player, skill level, description → publish → manage requests, promote co-host, cancel.
5. **Partner day-to-day**: open scheduler for today → see bookings by court → block slot / add walk-in → adjust prices for the weekend → view revenue.

---

## 4. Business rules to implement

| Rule | Playo behaviour | PlayVth implementation |
|---|---|---|
| Pricing | Per court per hour; varies by day type and time band | `pricing_rules` (court, weekday/weekend, hour band, price) |
| Availability | A slot is bookable if not booked, not blocked, and in the future | `slotsForCourt()` in `src/lib/slots.ts` |
| Double-booking | Must be impossible | Re-checked inside a SQLite transaction in `createBooking` |
| Convenience fee | Charged at checkout, non-refundable | 3% of court charges, min ₹10 (`src/lib/karma.ts`) |
| Karma | +3 booking, +1 game, +50 referral; redeem ≤ 20% of base; 1 Karma = ₹1; reversed on cancel | Implemented; referral credit is a TODO |
| Cancellation | Venue-specific window and fee; no cancellation < 2 h before; refund 5–7 days | `free_cancel_hours`, `cancel_fee_pct` per venue; 50% refund inside window; blocked < 2 h |
| Venue cancels | Full refund incl. fee | `partnerCancelBooking` |
| Join a game | Request → host approval; free games are simpler | Paid games require approval, free games auto-accept |
| Game capacity | Host sets total players; status flips to full | `syncGameStatus()` |
| Skill levels | Self-rated per sport | `user_skills` |

---

## 5. Data model (implemented in `src/lib/schema.ts`)

```
cities, sports
users (phone, role player|partner|admin, karma, referral_code) — sessions, otps
venues (city, area, geo, hours, amenities JSON, rating, cancellation policy, owner, theme)
  venue_sports, courts (per sport), pricing_rules (per court/day-type/hour band)
  blocked_slots, reviews
bookings (code, user, venue, court, sport, date, start/end hour, base, fee, karma_redeemed, total, status, refund)
games (host, sport, city, venue?, location, date, hours, max_players, price, skill, status)
  game_players (status requested|accepted|rejected|left)
karma_ledger, user_skills
coaches, enquiries
```

For scale, the same schema ports 1:1 to PostgreSQL (add PostGIS for distance search) with Prisma or Drizzle.

---

## 6. Architecture & tech stack

**What is in this repo (MVP, built to run today)**

- Next.js 15 (App Router, React 19, Server Components + Server Actions) with TypeScript
- Tailwind CSS v4
- SQLite via Node's built-in `node:sqlite` (zero native dependencies, auto-migrates and seeds on first run)
- OTP auth with HTTP-only session cookie
- JSON API routes (`/api/sports`, `/api/venues`, `/api/venues/[slug]/slots`, `/api/games`) so a mobile app can consume the same backend

**Recommended production stack**

| Concern | Choice |
|---|---|
| Web | Next.js on Vercel / AWS |
| Mobile | React Native (Expo) sharing the API and types |
| Database | PostgreSQL (+ PostGIS), Redis for slot locks & rate limiting |
| Auth / SMS | Firebase Phone Auth or MSG91 / Twilio OTP; Google & Apple sign-in |
| Payments | Razorpay (UPI, cards, net banking, wallets), webhooks for capture & refunds — implemented |
| Maps | Google Maps Places + Distance Matrix (or Mapbox) |
| Media | S3 / Cloudinary for venue photos |
| Notifications | FCM push, WhatsApp Business API, SendGrid email |
| Chat | Stream / Sendbird, or WebSocket service |
| Search | Postgres full-text first; Meilisearch / Elasticsearch later |
| Analytics | PostHog / Mixpanel; Metabase for ops |
| Infra | Docker, GitHub Actions CI, Sentry |

---

## 7. What is built vs. what comes next

### Built in this repository (working end-to-end, tested in a browser)

- [x] City selector, home page with sports, top venues, nearby games
- [x] Venue discovery: search, sport chips, max price, sort
- [x] Venue page: hero, amenities, reviews (+ post review), cancellation policy, court × hour slot grid with live availability and peak/weekend pricing, 7-day date strip, multi-hour selection
- [x] Checkout: Karma slider (capped at 20%), convenience fee, transactional double-booking protection, booking code
- [x] Razorpay payments: order creation, Standard Checkout, signature verification, amount check, webhooks (captured / failed / refund), 10-minute slot holds with expiry, retry payment, real refunds on cancellation; demo mode when keys are absent
- [x] Booking page with policy-driven refund preview and cancellation
- [x] Play: game feed with sport / date / skill filters, host a game, request-to-join, host accept / decline, leave, cancel, player list with skill levels
- [x] Coaching directory with enquiries
- [x] Profile: bookings, games, Karma ledger, referral code, skill levels
- [x] Partner: landing page, list-your-venue wizard (courts + prices per sport), dashboard with today's / month's revenue, per-venue scheduler grid, block/unblock slots, venue-side cancel & refund, pricing editor (weekday / peak / weekend)
- [x] Phone + OTP login (demo OTP until an SMS provider is configured)
- [x] JSON API for mobile
- [x] Native iOS and Android shells (Capacitor) with icons, splash, CI release workflows, store listing kit and launch checklist (`docs/STORE_LAUNCH.md`)
- [x] Store compliance: privacy policy, terms, in-app account deletion, web manifest

### Phase 2 (next 2–4 weeks)

- Payment extras: coupons, partial refunds review queue, settlement/payout reports for partners
- SMS OTP provider; Google / Apple login
- Venue photos upload; map + distance ("near me") with PostGIS
- Reschedule booking; coupons; city-level Karma caps; referral crediting
- Push / WhatsApp notifications and reminders
- Game chat; co-host; player ratings after games; user rating graph and badges
- Groups
- Admin panel: venue approval, moderation, refunds, GameTime events
- Partner: memberships, walk-in (offline) bookings, payouts/statement export, multi-user staff logins

### Phase 3

- React Native app (Expo), GameTime marketplace, tournaments & leagues, corporate / B2B bookings, dynamic pricing suggestions, recommendations.

---

## 8. Non-functional requirements

- **Concurrency**: slot booking must be atomic (DB transaction / row lock; Redis lock at scale).
- **Time zone**: all business times in Asia/Kolkata (`src/lib/time.ts`).
- **Mobile-first**: every page is responsive; the slot grid scrolls horizontally with a sticky court column.
- **Security**: HTTP-only session cookies, server-side ownership checks on every partner action, OTP expiry, input validation in server actions.
- **Performance**: server-rendered pages, no client data-fetching waterfalls, < 120 kB first-load JS.
- **Compliance (India)**: GST on convenience fee, RBI rules for stored payment data (use a PCI-compliant gateway), DPDP Act for personal data.
