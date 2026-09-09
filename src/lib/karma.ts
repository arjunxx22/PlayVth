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
