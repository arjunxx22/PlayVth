import { all, get } from "./db";
import { dayType, minutesUntil } from "./time";
import { HOLD_MINUTES } from "./karma";

export type SlotStatus = "available" | "booked" | "blocked" | "past";
export type Slot = { hour: number; price: number; status: SlotStatus };

export function priceFor(courtId: number, date: string, hour: number): number {
  const dt = dayType(date);
  const r = get<{ price: number }>(
    "SELECT price FROM pricing_rules WHERE court_id = ? AND day_type = ? AND start_hour <= ? AND end_hour > ? ORDER BY id LIMIT 1",
    courtId, dt, hour, hour,
  );
  if (r) return r.price;
  // Fallback: any rule for this court (keeps newly created venues bookable).
  const any = get<{ price: number }>("SELECT price FROM pricing_rules WHERE court_id = ? ORDER BY id LIMIT 1", courtId);
  return any?.price ?? 0;
}

export function slotsForCourt(courtId: number, date: string, openHour: number, closeHour: number): Slot[] {
  const booked = all<{ start_hour: number; end_hour: number }>(
    `SELECT start_hour, end_hour FROM bookings WHERE court_id = ? AND date = ?
       AND (status = 'confirmed' OR (status = 'pending_payment' AND created_at > datetime('now', ?)))`,
    courtId, date, `-${HOLD_MINUTES} minutes`,
  );
  const blocked = all<{ start_hour: number; end_hour: number }>(
    "SELECT start_hour, end_hour FROM blocked_slots WHERE court_id = ? AND date = ?", courtId, date,
  );
  const slots: Slot[] = [];
  for (let h = openHour; h < closeHour; h++) {
    let status: SlotStatus = "available";
    if (minutesUntil(date, h) <= 0) status = "past";
    else if (booked.some((b) => b.start_hour <= h && b.end_hour > h)) status = "booked";
    else if (blocked.some((b) => b.start_hour <= h && b.end_hour > h)) status = "blocked";
    slots.push({ hour: h, price: priceFor(courtId, date, h), status });
  }
  return slots;
}

/** Cheapest hourly price across a venue's courts, for listing cards. */
export function startingPrice(venueId: number): number {
  const r = get<{ p: number }>(
    "SELECT MIN(pr.price) AS p FROM pricing_rules pr JOIN courts c ON c.id = pr.court_id WHERE c.venue_id = ?", venueId,
  );
  return r?.p ?? 0;
}
