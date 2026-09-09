import type { Metadata } from "next";
import { CONVENIENCE_FEE_MIN, CONVENIENCE_FEE_PCT, KARMA_MAX_REDEEM_PCT, KARMA_PER_BOOKING, KARMA_PER_GAME, KARMA_PER_REFERRAL } from "@/lib/karma";
export const metadata: Metadata = { title: "Policies" };
export default function Policies() {
  return (
    <div className="container-x py-10 prose prose-slate max-w-3xl">
      <h1 className="text-3xl font-extrabold">Policies</h1>
      <h2 className="mt-8 text-xl font-bold">Cancellation &amp; refunds</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
        <li>Each venue sets its own free-cancellation window and cancellation fee. Both are shown on the venue page and before you confirm.</li>
        <li>Cancelling before the free-cancellation window refunds the court charges minus the venue&apos;s cancellation fee.</li>
        <li>Cancelling inside the window but more than 2 hours before the slot refunds 50% of the court charges.</li>
        <li>Bookings cannot be cancelled within 2 hours of the slot start, or after it has started.</li>
        <li>The convenience fee ({CONVENIENCE_FEE_PCT}% of court charges, minimum ₹{CONVENIENCE_FEE_MIN}) is non-refundable.</li>
        <li>Refunds are returned to the original payment method within 5–7 working days. Redeemed Karma is credited back immediately.</li>
        <li>If a venue cancels your booking, you receive a full refund including the convenience fee.</li>
      </ul>
      <h2 id="karma" className="mt-8 text-xl font-bold">Karma points</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
        <li>Earn {KARMA_PER_BOOKING} Karma for every venue booking, {KARMA_PER_GAME} for every game you host or join, and {KARMA_PER_REFERRAL} for every friend who signs up with your referral code and books.</li>
        <li>1 Karma = ₹1. Redeem up to {KARMA_MAX_REDEEM_PCT}% of the court charges on any booking.</li>
        <li>Karma earned on a booking is reversed if that booking is cancelled.</li>
      </ul>
    </div>
  );
}
