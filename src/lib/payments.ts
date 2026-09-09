// Booking payment lifecycle shared by server actions, the verify endpoint and the webhook.
import { all, get, run, transaction } from "./db";
import { HOLD_MINUTES, KARMA_PER_BOOKING } from "./karma";
import { getBooking, getBookingByOrder, type Booking } from "./queries";
import { createRefund, fetchPayment, isRazorpayEnabled, verifyPaymentSignature } from "./razorpay";

export function addKarma(userId: number, delta: number, reason: string) {
  run("UPDATE users SET karma = karma + ? WHERE id = ?", delta, userId);
  run("INSERT INTO karma_ledger(user_id, delta, reason) VALUES (?, ?, ?)", userId, delta, reason);
}

/** Release slots held by unpaid bookings older than HOLD_MINUTES and return any reserved Karma. */
export function expireStaleHolds() {
  const stale = all<{ id: number; user_id: number; code: string; karma_redeemed: number }>(
    "SELECT id, user_id, code, karma_redeemed FROM bookings WHERE status = 'pending_payment' AND created_at <= datetime('now', ?)", `-${HOLD_MINUTES} minutes`);
  for (const b of stale) {
    transaction(() => {
      const r = run("UPDATE bookings SET status = 'expired' WHERE id = ? AND status = 'pending_payment'", b.id);
      if (r.changes && b.karma_redeemed > 0) addKarma(b.user_id, b.karma_redeemed, `Karma returned: booking ${b.code} expired unpaid`);
    });
  }
}

/** Mark a pending booking paid. Idempotent: a second call for the same booking is a no-op. */
export function markBookingPaid(bookingId: number, paymentId: string, method?: string): boolean {
  return transaction(() => {
    const b = get<{ status: string; user_id: number; code: string }>("SELECT status, user_id, code FROM bookings WHERE id = ?", bookingId);
    if (!b || b.status !== "pending_payment") return false;
    run("UPDATE bookings SET status = 'confirmed', razorpay_payment_id = ?, paid_at = datetime('now'), payment_method = COALESCE(?, payment_method) WHERE id = ?",
      paymentId, method ?? null, bookingId);
    addKarma(b.user_id, KARMA_PER_BOOKING, `Venue booking ${b.code}`);
    return true;
  });
}

export function markBookingFailed(bookingId: number) {
  transaction(() => {
    const b = get<{ status: string; user_id: number; code: string; karma_redeemed: number }>("SELECT status, user_id, code, karma_redeemed FROM bookings WHERE id = ?", bookingId);
    if (!b || b.status !== "pending_payment") return;
    run("UPDATE bookings SET status = 'failed' WHERE id = ?", bookingId);
    if (b.karma_redeemed > 0) addKarma(b.user_id, b.karma_redeemed, `Karma returned: payment failed for ${b.code}`);
  });
}

export type VerifyResult = { ok: true; bookingId: number } | { ok: false; error: string; status?: number };

/** Verify the Checkout success payload (signature + amount) and confirm the booking. */
export async function verifyAndConfirm(orderId: string, paymentId: string, signature: string, userId: number): Promise<VerifyResult> {
  if (!isRazorpayEnabled()) return { ok: false, error: "Online payments are not configured.", status: 400 };
  if (!verifyPaymentSignature(orderId, paymentId, signature)) return { ok: false, error: "Invalid payment signature.", status: 400 };
  const b = getBookingByOrder(orderId);
  if (!b || b.user_id !== userId) return { ok: false, error: "Booking not found.", status: 404 };
  if (b.status === "confirmed") return { ok: true, bookingId: b.id };
  if (b.status !== "pending_payment") return { ok: false, error: `Booking is ${b.status}.`, status: 409 };
  // Defence in depth: confirm the amount with Razorpay before trusting the client.
  let method: string | undefined;
  try {
    const p = await fetchPayment(paymentId);
    if (p.order_id !== orderId || p.amount !== Math.round(b.total_amount * 100)) return { ok: false, error: "Payment does not match the order.", status: 400 };
    if (p.status !== "captured" && p.status !== "authorized") return { ok: false, error: `Payment status is ${p.status}.`, status: 409 };
    method = p.method;
  } catch (e) {
    // Signature already proves authenticity; a transient API error must not lose a paid booking. The webhook reconciles the method later.
    console.error("Razorpay fetchPayment failed", e);
  }
  markBookingPaid(b.id, paymentId, method);
  return { ok: true, bookingId: b.id };
}

/**
 * Cancel a confirmed booking and issue the refund. For Razorpay bookings the refund is created at Razorpay first;
 * if that call fails nothing is changed locally and the error is thrown.
 */
export async function cancelWithRefund(b: Booking, refundInr: number, reason: string, karmaBack: number, reverseEarnedKarma: boolean) {
  let refundId: string | null = null;
  let refundStatus: string | null = null;
  if (b.payment_provider === "razorpay" && b.razorpay_payment_id && refundInr > 0) {
    const r = await createRefund(b.razorpay_payment_id, refundInr, { booking: b.code, reason });
    refundId = r.id;
    refundStatus = r.status === "processed" ? "processed" : "pending";
  } else if (refundInr > 0) {
    refundStatus = "processed"; // demo provider
  }
  transaction(() => {
    const r = run("UPDATE bookings SET status = 'cancelled', refund_amount = ?, razorpay_refund_id = ?, refund_status = ?, cancelled_at = datetime('now') WHERE id = ? AND status = 'confirmed'",
      refundInr, refundId, refundStatus, b.id);
    if (!r.changes) throw new Error("Booking is no longer confirmed.");
    if (karmaBack > 0) addKarma(b.user_id, karmaBack, `Karma returned for cancelled booking ${b.code}`);
    if (reverseEarnedKarma) addKarma(b.user_id, -KARMA_PER_BOOKING, `Booking ${b.code} cancelled`);
  });
}

export function bookingForWebhook(orderId: string | undefined, paymentId: string | undefined) {
  if (orderId) { const b = getBookingByOrder(orderId); if (b) return b; }
  if (paymentId) return get<Booking>("SELECT * FROM bookings WHERE razorpay_payment_id = ?", paymentId);
  return undefined;
}

export { getBooking };
