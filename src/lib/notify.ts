// WhatsApp alerts. Uses the Meta WhatsApp Cloud API when configured; otherwise every message is recorded in the
// notifications table with status "logged" so venues can still see what would have been sent.
import { run } from "./db";
import type { Booking } from "./queries";
import { fmtDate, fmtHour, fmtINR } from "./time";

const API_BASE = process.env.WHATSAPP_API_BASE || "https://graph.facebook.com/v21.0";

export function isWhatsAppEnabled(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Indian numbers: accept 10 digits or +91…; returns E.164 digits without "+" as the Cloud API expects. */
export function toWaNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(d)) return "91" + d;
  if (/^91[6-9]\d{9}$/.test(d)) return d;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

type Event = "venue_booked" | "venue_cancelled" | "player_confirmed" | "player_cancelled";
type Msg = { to: string; audience: "venue" | "player"; event: Event; body: string; template?: string; params: string[]; venueId: number; bookingId: number };

async function deliver(m: Msg) {
  if (!isWhatsAppEnabled()) {
    run("INSERT INTO notifications(channel, recipient, audience, event, body, status, venue_id, booking_id) VALUES ('whatsapp', ?, ?, ?, ?, 'logged', ?, ?)", m.to, m.audience, m.event, m.body, m.venueId, m.bookingId);
    return;
  }
  const useTemplate = process.env.WHATSAPP_MODE === "template" && m.template;
  const payload = useTemplate
    ? { messaging_product: "whatsapp", to: m.to, type: "template", template: { name: m.template, language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" }, components: [{ type: "body", parameters: m.params.map((text) => ({ type: "text", text })) }] } }
    : { messaging_product: "whatsapp", to: m.to, type: "text", text: { preview_url: false, body: m.body } };
  try {
    const res = await fetch(`${API_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
    run("INSERT INTO notifications(channel, recipient, audience, event, body, status, provider_id, venue_id, booking_id) VALUES ('whatsapp', ?, ?, ?, ?, 'sent', ?, ?, ?)", m.to, m.audience, m.event, m.body, json.messages?.[0]?.id ?? null, m.venueId, m.bookingId);
  } catch (e) {
    run("INSERT INTO notifications(channel, recipient, audience, event, body, status, error, venue_id, booking_id) VALUES ('whatsapp', ?, ?, ?, ?, 'failed', ?, ?, ?)", m.to, m.audience, m.event, m.body, e instanceof Error ? e.message : String(e), m.venueId, m.bookingId);
  }
}

const when = (b: Booking) => `${fmtDate(b.date, { weekday: "short", day: "numeric", month: "short" })}, ${fmtHour(b.start_hour)}–${fmtHour(b.end_hour)}`;
const customerName = (b: Booking) => b.guest_name || b.user_name || "Customer";
const customerPhone = (b: Booking) => (b.source === "online" ? b.user_phone : b.guest_phone_display) ?? "";
const payLine = (b: Booking) => b.paid_at ? `Paid: ${fmtINR(b.total_amount)}` : b.payment_provider === "razorpay" ? `Paid online: ${fmtINR(b.total_amount)}` : `To collect at counter: ${fmtINR(b.total_amount)}`;

/** Fire-and-forget: never throws, never blocks the caller's response. */
export function notifyBookingConfirmed(b: Booking, venue: { name: string; alert_phone: string | null; owner_phone?: string | null }) {
  const jobs: Promise<void>[] = [];
  const venueTo = toWaNumber(venue.alert_phone) ?? toWaNumber(venue.owner_phone);
  if (venueTo) jobs.push(deliver({
    to: venueTo, audience: "venue", event: "venue_booked", venueId: b.venue_id, bookingId: b.id,
    template: process.env.WHATSAPP_TEMPLATE_VENUE_BOOKED, params: [venue.name, customerName(b), customerPhone(b), b.court_name, fmtDate(b.date), `${fmtHour(b.start_hour)}–${fmtHour(b.end_hour)}`, fmtINR(b.total_amount), b.code],
    body: `🏸 New booking at ${venue.name}\n${customerName(b)} · ${customerPhone(b)}\n${b.court_name} · ${when(b)}\n${payLine(b)}\nCode ${b.code}${b.source !== "online" ? ` (${b.source.replace("_", "-")})` : ""}`,
  }));
  const playerTo = toWaNumber(b.source === "online" ? b.user_phone : b.guest_phone_display);
  if (playerTo) jobs.push(deliver({
    to: playerTo, audience: "player", event: "player_confirmed", venueId: b.venue_id, bookingId: b.id,
    template: process.env.WHATSAPP_TEMPLATE_PLAYER_CONFIRMED, params: [customerName(b), venue.name, b.court_name, fmtDate(b.date), `${fmtHour(b.start_hour)}–${fmtHour(b.end_hour)}`, fmtINR(b.total_amount), b.code],
    body: `✅ Booking confirmed, ${customerName(b)}!\n${venue.name} · ${b.court_name}\n${when(b)}\n${b.paid_at || b.payment_provider === "razorpay" ? payLine(b) : `Pay ${fmtINR(b.total_amount)} at the venue counter.`}\nShow code ${b.code} at the venue.`,
  }));
  void Promise.allSettled(jobs);
}

export function notifyBookingCancelled(b: Booking, venue: { name: string; alert_phone: string | null; owner_phone?: string | null }, by: "player" | "venue") {
  const jobs: Promise<void>[] = [];
  if (by === "player") {
    const venueTo = toWaNumber(venue.alert_phone) ?? toWaNumber(venue.owner_phone);
    if (venueTo) jobs.push(deliver({
      to: venueTo, audience: "venue", event: "venue_cancelled", venueId: b.venue_id, bookingId: b.id,
      template: process.env.WHATSAPP_TEMPLATE_VENUE_CANCELLED, params: [venue.name, customerName(b), b.court_name, fmtDate(b.date), `${fmtHour(b.start_hour)}–${fmtHour(b.end_hour)}`, b.code],
      body: `❌ Cancelled: ${customerName(b)} cancelled ${b.court_name} · ${when(b)} at ${venue.name}. The slot is open again. Code ${b.code}`,
    }));
  } else {
    const playerTo = toWaNumber(b.source === "online" ? b.user_phone : b.guest_phone_display);
    if (playerTo) jobs.push(deliver({
      to: playerTo, audience: "player", event: "player_cancelled", venueId: b.venue_id, bookingId: b.id,
      template: process.env.WHATSAPP_TEMPLATE_PLAYER_CANCELLED, params: [customerName(b), venue.name, fmtDate(b.date), `${fmtHour(b.start_hour)}–${fmtHour(b.end_hour)}`, b.code],
      body: `Sorry ${customerName(b)}, ${venue.name} had to cancel your booking for ${when(b)} (code ${b.code}).${b.refund_amount ? ` ${fmtINR(b.refund_amount)} will be refunded in 5–7 working days.` : ""} Book another slot on PlayVth.`,
    }));
  }
  void Promise.allSettled(jobs);
}
