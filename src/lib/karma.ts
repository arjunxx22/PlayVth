// Loyalty and fee rules modelled on Playo's public policy.
export const KARMA_PER_BOOKING = 3;
export const KARMA_PER_GAME = 1;
export const KARMA_PER_REFERRAL = 50;
export const KARMA_MAX_REDEEM_PCT = 20;   // max % of the base amount payable with Karma
export const KARMA_RUPEE_VALUE = 1;       // 1 Karma = ₹1

export const CONVENIENCE_FEE_PCT = 3;
export const CONVENIENCE_FEE_MIN = 10;
export const MIN_CANCEL_LEAD_MINUTES = 120; // cannot cancel inside 2 hours of start

export function convenienceFee(base: number): number {
  return Math.max(CONVENIENCE_FEE_MIN, Math.round((base * CONVENIENCE_FEE_PCT) / 100));
}

export function maxKarmaRedeemable(base: number, userKarma: number): number {
  return Math.max(0, Math.min(userKarma, Math.floor((base * KARMA_MAX_REDEEM_PCT) / 100)));
}

/** A pending (unpaid) booking holds its slot for this long before the hold lapses. */
export const HOLD_MINUTES = 10;

/**
 * How bookings are paid. "venue" (default): the player pays at the venue counter, no online charge, no convenience fee.
 * "razorpay": online payment via Razorpay (requires PAYMENT_MODE=razorpay plus the Razorpay keys).
 */
export function paymentMode(): "venue" | "razorpay" {
  return process.env.PAYMENT_MODE === "razorpay" && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "razorpay" : "venue";
}
