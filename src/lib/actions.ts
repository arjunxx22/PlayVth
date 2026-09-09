"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { all, get, run, transaction } from "./db";
import { getCurrentUser, isDemoOtp, issueOtp, logoutCurrent, normalizePhone, requireUser, verifyOtpAndLogin } from "./auth";
import { priceFor, slotsForCourt } from "./slots";
import { isValidISODate, minutesUntil } from "./time";
import { convenienceFee, KARMA_PER_BOOKING, KARMA_PER_GAME, maxKarmaRedeemable, MIN_CANCEL_LEAD_MINUTES } from "./karma";
import { getBooking, getGame, getVenueById } from "./queries";

export type ActionState = { error?: string; ok?: boolean; otpSent?: boolean; phone?: string; devOtp?: string };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);

function addKarma(userId: number, delta: number, reason: string) {
  run("UPDATE users SET karma = karma + ? WHERE id = ?", delta, userId);
  run("INSERT INTO karma_ledger(user_id, delta, reason) VALUES (?, ?, ?)", userId, delta, reason);
}

// ---------- City ----------
export async function setCity(fd: FormData) {
  const slug = str(fd, "city");
  if (get("SELECT 1 FROM cities WHERE slug = ?", slug)) {
    (await cookies()).set("pv_city", slug, { path: "/", maxAge: 365 * 86400 });
  }
  const back = str(fd, "back") || "/";
  redirect(back);
}

// ---------- Auth ----------
export async function sendOtp(_: ActionState, fd: FormData): Promise<ActionState> {
  const phone = normalizePhone(str(fd, "phone"));
  if (!phone) return { error: "Enter a valid 10-digit Indian mobile number." };
  const code = issueOtp(phone);
  return { otpSent: true, phone, devOtp: isDemoOtp() ? code : undefined };
}

export async function verifyOtp(_: ActionState, fd: FormData): Promise<ActionState> {
  const phone = normalizePhone(str(fd, "phone"));
  const code = str(fd, "otp");
  if (!phone) return { error: "Invalid phone." };
  const user = await verifyOtpAndLogin(phone, code);
  if (!user) return { error: "Incorrect or expired OTP. Try again.", otpSent: true, phone };
  redirect(str(fd, "next") || (user.name ? "/" : "/profile/edit"));
}

export async function logout() {
  await logoutCurrent();
  redirect("/");
}

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = str(fd, "name");
  if (name.length < 2) return { error: "Please enter your name." };
  const email = str(fd, "email") || null;
  const cityId = num(fd, "city_id") || null;
  run("UPDATE users SET name = ?, email = ?, city_id = ? WHERE id = ?", name, email, cityId, user.id);
  const sports = all<{ id: number }>("SELECT id FROM sports");
  for (const s of sports) {
    const level = str(fd, `skill_${s.id}`);
    if (level && level !== "none") {
      run("INSERT INTO user_skills(user_id, sport_id, level) VALUES (?, ?, ?) ON CONFLICT(user_id, sport_id) DO UPDATE SET level = excluded.level", user.id, s.id, level);
    } else {
      run("DELETE FROM user_skills WHERE user_id = ? AND sport_id = ?", user.id, s.id);
    }
  }
  revalidatePath("/profile");
  redirect("/profile");
}

// ---------- Booking ----------
export async function createBooking(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const courtId = num(fd, "court_id");
  const date = str(fd, "date");
  const hours = str(fd, "hours").split(",").map(Number).filter((n) => Number.isInteger(n)).sort((a, b) => a - b);
  if (!user) redirect(`/login?next=${encodeURIComponent(str(fd, "return_to") || "/venues")}`);
  if (!isValidISODate(date) || hours.length === 0) return { error: "Pick at least one slot." };
  for (let i = 1; i < hours.length; i++) if (hours[i] !== hours[i - 1] + 1) return { error: "Selected slots must be consecutive." };

  const court = get<{ id: number; venue_id: number; sport_id: number }>("SELECT id, venue_id, sport_id FROM courts WHERE id = ? AND is_active = 1", courtId);
  if (!court) return { error: "Court not found." };
  const venue = getVenueById(court.venue_id)!;
  const start = hours[0], end = hours[hours.length - 1] + 1;
  if (start < venue.open_hour || end > venue.close_hour) return { error: "Slot outside venue hours." };
  if (minutesUntil(date, start) <= 0) return { error: "That slot has already started." };

  const wantKarma = Math.max(0, Math.floor(num(fd, "karma")));
  const payment = ["upi", "card", "netbanking", "wallet"].includes(str(fd, "payment")) ? str(fd, "payment") : "upi";

  const code = "PV" + randomBytes(3).toString("hex").toUpperCase();
  let bookingId = 0;
  try {
    bookingId = transaction(() => {
      // Re-check availability inside the transaction to avoid double booking.
      const slots = slotsForCourt(court.id, date, venue.open_hour, venue.close_hour);
      for (const h of hours) {
        const s = slots.find((x) => x.hour === h);
        if (!s || s.status !== "available") throw new Error(`Slot ${h}:00 is no longer available.`);
      }
      const base = hours.reduce((sum, h) => sum + priceFor(court.id, date, h), 0);
      const fee = convenienceFee(base);
      const fresh = get<{ karma: number }>("SELECT karma FROM users WHERE id = ?", user.id)!;
      const karma = Math.min(wantKarma, maxKarmaRedeemable(base, fresh.karma));
      const total = base + fee - karma;
      const r = run(
        `INSERT INTO bookings(code, user_id, venue_id, court_id, sport_id, date, start_hour, end_hour, base_amount, convenience_fee, karma_redeemed, total_amount, payment_method)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        code, user.id, venue.id, court.id, court.sport_id, date, start, end, base, fee, karma, total, payment,
      );
      if (karma > 0) addKarma(user.id, -karma, `Redeemed on booking ${code}`);
      addKarma(user.id, KARMA_PER_BOOKING, `Venue booking ${code}`);
      return Number(r.lastInsertRowid);
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Booking failed." };
  }
  revalidatePath(`/venues/${venue.slug}`);
  redirect(`/bookings/${bookingId}?new=1`);
}

export type CancelPreview = { allowed: boolean; reason?: string; refund: number; karmaBack: number };

export async function previewCancel(bookingId: number, userId: number): Promise<CancelPreview> {
  const b = getBooking(bookingId);
  if (!b || b.user_id !== userId) return { allowed: false, reason: "Not found", refund: 0, karmaBack: 0 };
  if (b.status !== "confirmed") return { allowed: false, reason: "Already cancelled", refund: 0, karmaBack: 0 };
  const lead = minutesUntil(b.date, b.start_hour);
  if (lead <= MIN_CANCEL_LEAD_MINUTES) return { allowed: false, reason: "Cancellations close 2 hours before the slot starts.", refund: 0, karmaBack: 0 };
  const v = getVenueById(b.venue_id)!;
  const payableBase = b.base_amount - b.karma_redeemed; // convenience fee is non-refundable
  const refund = lead >= v.free_cancel_hours * 60
    ? Math.round(payableBase * (1 - v.cancel_fee_pct / 100))
    : Math.round(payableBase * 0.5);
  return { allowed: true, refund, karmaBack: b.karma_redeemed };
}

export async function cancelBooking(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "booking_id");
  const p = await previewCancel(id, user.id);
  if (!p.allowed) redirect(`/bookings/${id}?error=${encodeURIComponent(p.reason ?? "Cannot cancel")}`);
  const b = getBooking(id)!;
  transaction(() => {
    run("UPDATE bookings SET status = 'cancelled', refund_amount = ?, cancelled_at = datetime('now') WHERE id = ?", p.refund, id);
    if (p.karmaBack > 0) addKarma(user.id, p.karmaBack, `Karma returned for cancelled booking ${b.code}`);
    addKarma(user.id, -KARMA_PER_BOOKING, `Booking ${b.code} cancelled`);
  });
  revalidatePath("/profile");
  redirect(`/bookings/${id}?cancelled=1`);
}

export async function addReview(fd: FormData) {
  const user = await requireUser();
  const venueId = num(fd, "venue_id");
  const rating = Math.min(5, Math.max(1, num(fd, "rating")));
  const comment = str(fd, "comment").slice(0, 500);
  const v = getVenueById(venueId);
  if (!v) return;
  transaction(() => {
    run("INSERT INTO reviews(venue_id, user_id, rating, comment) VALUES (?, ?, ?, ?)", venueId, user.id, rating, comment);
    // Blend the venue's existing rating history with the new review.
    const total = v.rating_count + 1;
    const newRating = (v.rating * v.rating_count + rating) / total;
    run("UPDATE venues SET rating = ?, rating_count = ? WHERE id = ?", Math.round(newRating * 10) / 10, total, venueId);
  });
  revalidatePath(`/venues/${v.slug}`);
  redirect(`/venues/${v.slug}#reviews`);
}

// ---------- Games / Activities ----------
export async function hostGame(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/play/new");
  const sportId = num(fd, "sport_id"), cityId = num(fd, "city_id");
  const date = str(fd, "date"), start = num(fd, "start_hour"), duration = num(fd, "duration") || 1;
  const maxPlayers = num(fd, "max_players"), price = Math.max(0, num(fd, "price_per_player"));
  const skill = ["any", "beginner", "intermediate", "advanced"].includes(str(fd, "skill_level")) ? str(fd, "skill_level") : "any";
  const venueId = num(fd, "venue_id") || null;
  const location = str(fd, "location_text") || (venueId ? getVenueById(venueId)?.name ?? "" : "");
  if (!get("SELECT 1 FROM sports WHERE id = ?", sportId)) return { error: "Choose a sport." };
  if (!get("SELECT 1 FROM cities WHERE id = ?", cityId)) return { error: "Choose a city." };
  if (!isValidISODate(date) || minutesUntil(date, start) <= 0) return { error: "Pick a future date and time." };
  if (start < 0 || start > 23 || duration < 1 || duration > 4) return { error: "Invalid time." };
  if (maxPlayers < 2 || maxPlayers > 40) return { error: "Players must be between 2 and 40." };
  if (!location) return { error: "Add a location." };
  const id = transaction(() => {
    const r = run(
      `INSERT INTO games(host_user_id, sport_id, city_id, venue_id, location_text, date, start_hour, end_hour, max_players, price_per_player, skill_level, description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      user.id, sportId, cityId, venueId, location, date, start, Math.min(24, start + duration), maxPlayers, price, skill, str(fd, "description").slice(0, 600),
    );
    const gid = Number(r.lastInsertRowid);
    run("INSERT INTO game_players(game_id, user_id, status) VALUES (?, ?, 'accepted')", gid, user.id);
    addKarma(user.id, KARMA_PER_GAME, "Hosted a game");
    return gid;
  });
  redirect(`/play/${id}`);
}

export async function joinGame(fd: FormData) {
  const user = await getCurrentUser();
  const id = num(fd, "game_id");
  if (!user) redirect(`/login?next=/play/${id}`);
  const g = getGame(id);
  if (!g || g.status === "cancelled") return;
  const existing = get<{ status: string }>("SELECT status FROM game_players WHERE game_id = ? AND user_id = ?", id, user.id);
  if (existing && existing.status !== "left" && existing.status !== "rejected") return;
  if (g.accepted_count >= g.max_players) redirect(`/play/${id}?error=full`);
  // Playo model: players send a request; the host approves. Free games auto-accept to keep things moving.
  const status = g.price_per_player === 0 ? "accepted" : "requested";
  run("INSERT INTO game_players(game_id, user_id, status) VALUES (?, ?, ?) ON CONFLICT(game_id, user_id) DO UPDATE SET status = excluded.status, created_at = datetime('now')", id, user.id, status);
  if (status === "accepted") addKarma(user.id, KARMA_PER_GAME, "Joined a game");
  syncGameStatus(id);
  revalidatePath(`/play/${id}`);
  redirect(`/play/${id}`);
}

export async function leaveGame(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "game_id");
  const g = getGame(id);
  if (!g || g.host_user_id === user.id) return;
  const prev = get<{ status: string }>("SELECT status FROM game_players WHERE game_id = ? AND user_id = ?", id, user.id);
  run("UPDATE game_players SET status = 'left' WHERE game_id = ? AND user_id = ?", id, user.id);
  if (prev?.status === "accepted") addKarma(user.id, -KARMA_PER_GAME, "Left a game");
  syncGameStatus(id);
  revalidatePath(`/play/${id}`);
  redirect(`/play/${id}`);
}

export async function respondToRequest(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "game_id"), playerId = num(fd, "user_id");
  const decision = str(fd, "decision") === "accept" ? "accepted" : "rejected";
  const g = getGame(id);
  if (!g || g.host_user_id !== user.id) return;
  if (decision === "accepted" && g.accepted_count >= g.max_players) redirect(`/play/${id}?error=full`);
  run("UPDATE game_players SET status = ? WHERE game_id = ? AND user_id = ? AND status = 'requested'", decision, id, playerId);
  if (decision === "accepted") addKarma(playerId, KARMA_PER_GAME, "Joined a game");
  syncGameStatus(id);
  revalidatePath(`/play/${id}`);
  redirect(`/play/${id}`);
}

export async function cancelGame(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "game_id");
  const g = getGame(id);
  if (!g || g.host_user_id !== user.id) return;
  run("UPDATE games SET status = 'cancelled' WHERE id = ?", id);
  revalidatePath("/play");
  redirect("/play");
}

function syncGameStatus(id: number) {
  const g = getGame(id);
  if (!g || g.status === "cancelled") return;
  run("UPDATE games SET status = ? WHERE id = ?", g.accepted_count >= g.max_players ? "full" : "open", id);
}

// ---------- Coaching ----------
export async function enquireCoach(fd: FormData) {
  const user = await getCurrentUser();
  const coachId = num(fd, "coach_id");
  if (!user) redirect(`/login?next=/coaching`);
  run("INSERT INTO enquiries(coach_id, user_id, message) VALUES (?, ?, ?)", coachId, user.id, str(fd, "message").slice(0, 500) || "Interested in coaching sessions.");
  redirect(`/coaching?enquired=${coachId}`);
}

// ---------- Partner ----------
function requireOwner(userId: number, venueId: number) {
  const v = getVenueById(venueId);
  if (!v || v.owner_user_id !== userId) throw new Error("Not your venue");
  return v;
}

export async function createVenue(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/partner/new");
  const name = str(fd, "name"), area = str(fd, "area"), address = str(fd, "address");
  const cityId = num(fd, "city_id"), open = num(fd, "open_hour"), close = num(fd, "close_hour");
  if (name.length < 3 || area.length < 2 || address.length < 5) return { error: "Fill in venue name, area and address." };
  if (!get("SELECT 1 FROM cities WHERE id = ?", cityId)) return { error: "Choose a city." };
  if (open < 0 || close > 24 || open >= close) return { error: "Opening hours are invalid." };
  const sports = all<{ id: number }>("SELECT id FROM sports").filter((s) => num(fd, `courts_${s.id}`) > 0);
  if (sports.length === 0) return { error: "Add at least one court for a sport." };
  const amenities = str(fd, "amenities").split(",").map((a) => a.trim()).filter(Boolean);
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = base;
  for (let i = 2; get("SELECT 1 FROM venues WHERE slug = ?", slug); i++) slug = `${base}-${i}`;
  const themes = ["emerald", "lime", "orange", "violet", "sky"];
  const id = transaction(() => {
    const r = run(
      `INSERT INTO venues(slug, name, city_id, area, address, description, amenities, open_hour, close_hour, free_cancel_hours, cancel_fee_pct, owner_user_id, theme)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      slug, name, cityId, area, address, str(fd, "description").slice(0, 1000), JSON.stringify(amenities), open, close,
      Math.max(2, num(fd, "free_cancel_hours") || 24), Math.min(50, Math.max(0, num(fd, "cancel_fee_pct"))), user.id, themes[Math.floor(Math.random() * themes.length)],
    );
    const vid = Number(r.lastInsertRowid);
    for (const s of sports) {
      const n = Math.min(20, num(fd, `courts_${s.id}`));
      const wd = Math.max(50, num(fd, `price_${s.id}`) || 500);
      const we = Math.max(50, num(fd, `weekend_price_${s.id}`) || wd);
      const sportName = get<{ name: string }>("SELECT name FROM sports WHERE id = ?", s.id)!.name;
      run("INSERT INTO venue_sports(venue_id, sport_id) VALUES (?, ?)", vid, s.id);
      for (let i = 1; i <= n; i++) {
        const cid = Number(run("INSERT INTO courts(venue_id, sport_id, name) VALUES (?, ?, ?)", vid, s.id, `${sportName} ${i}`).lastInsertRowid);
        run("INSERT INTO pricing_rules(court_id, day_type, start_hour, end_hour, price) VALUES (?, 'weekday', 0, 24, ?)", cid, wd);
        run("INSERT INTO pricing_rules(court_id, day_type, start_hour, end_hour, price) VALUES (?, 'weekend', 0, 24, ?)", cid, we);
      }
    }
    if (user.role === "player") run("UPDATE users SET role = 'partner' WHERE id = ?", user.id);
    return vid;
  });
  revalidatePath("/partner");
  redirect(`/partner/venues/${id}`);
}

export async function blockSlot(fd: FormData) {
  const user = await requireUser();
  const venueId = num(fd, "venue_id"), courtId = num(fd, "court_id");
  const date = str(fd, "date"), start = num(fd, "start_hour"), end = num(fd, "end_hour");
  requireOwner(user.id, venueId);
  if (!get("SELECT 1 FROM courts WHERE id = ? AND venue_id = ?", courtId, venueId)) return;
  if (!isValidISODate(date) || start >= end) redirect(`/partner/venues/${venueId}?date=${date}&error=Invalid+block`);
  run("INSERT INTO blocked_slots(court_id, date, start_hour, end_hour, reason) VALUES (?, ?, ?, ?, ?)", courtId, date, start, end, str(fd, "reason") || "Blocked by venue");
  revalidatePath(`/partner/venues/${venueId}`);
  redirect(`/partner/venues/${venueId}?date=${date}`);
}

export async function unblockSlot(fd: FormData) {
  const user = await requireUser();
  const venueId = num(fd, "venue_id"), id = num(fd, "block_id");
  requireOwner(user.id, venueId);
  run("DELETE FROM blocked_slots WHERE id = ? AND court_id IN (SELECT id FROM courts WHERE venue_id = ?)", id, venueId);
  revalidatePath(`/partner/venues/${venueId}`);
  redirect(`/partner/venues/${venueId}?date=${str(fd, "date")}`);
}

export async function updatePricing(fd: FormData) {
  const user = await requireUser();
  const venueId = num(fd, "venue_id"), courtId = num(fd, "court_id");
  requireOwner(user.id, venueId);
  if (!get("SELECT 1 FROM courts WHERE id = ? AND venue_id = ?", courtId, venueId)) return;
  const wd = Math.max(0, num(fd, "weekday")), wdPeak = Math.max(0, num(fd, "weekday_peak")), we = Math.max(0, num(fd, "weekend"));
  transaction(() => {
    run("DELETE FROM pricing_rules WHERE court_id = ?", courtId);
    run("INSERT INTO pricing_rules(court_id, day_type, start_hour, end_hour, price) VALUES (?, 'weekday', 0, 18, ?)", courtId, wd);
    run("INSERT INTO pricing_rules(court_id, day_type, start_hour, end_hour, price) VALUES (?, 'weekday', 18, 22, ?)", courtId, wdPeak || wd);
    run("INSERT INTO pricing_rules(court_id, day_type, start_hour, end_hour, price) VALUES (?, 'weekday', 22, 24, ?)", courtId, wd);
    run("INSERT INTO pricing_rules(court_id, day_type, start_hour, end_hour, price) VALUES (?, 'weekend', 0, 24, ?)", courtId, we || wd);
  });
  revalidatePath(`/partner/venues/${venueId}`);
  redirect(`/partner/venues/${venueId}?tab=pricing`);
}

export async function partnerCancelBooking(fd: FormData) {
  const user = await requireUser();
  const venueId = num(fd, "venue_id"), id = num(fd, "booking_id");
  requireOwner(user.id, venueId);
  const b = getBooking(id);
  if (!b || b.venue_id !== venueId || b.status !== "confirmed") return;
  // Venue-initiated cancellations refund everything paid.
  transaction(() => {
    run("UPDATE bookings SET status = 'cancelled', refund_amount = ?, cancelled_at = datetime('now') WHERE id = ?", b.total_amount, id);
    if (b.karma_redeemed > 0) addKarma(b.user_id, b.karma_redeemed, `Karma returned for booking ${b.code} (cancelled by venue)`);
  });
  revalidatePath(`/partner/venues/${venueId}`);
  redirect(`/partner/venues/${venueId}?date=${b.date}`);
}
