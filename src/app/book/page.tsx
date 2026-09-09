import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { getVenueById } from "@/lib/queries";
import { priceFor, slotsForCourt } from "@/lib/slots";
import { fmtDate, fmtHour, fmtINR, isValidISODate } from "@/lib/time";
import { convenienceFee, maxKarmaRedeemable } from "@/lib/karma";
import CheckoutForm from "@/components/CheckoutForm";
import { isRazorpayEnabled } from "@/lib/razorpay";
import { expireStaleHolds } from "@/lib/payments";
import RetryPaymentButton from "@/components/RetryPaymentButton";

export const metadata: Metadata = { title: "Checkout" };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ court?: string; date?: string; hours?: string; return_to?: string }> }) {
  const sp = await searchParams;
  const courtId = Number(sp.court);
  const date = sp.date ?? "";
  const hours = (sp.hours ?? "").split(",").map(Number).filter(Number.isInteger).sort((a, b) => a - b);
  const court = get<{ id: number; venue_id: number; name: string; sport_name: string; sport_icon: string }>(
    "SELECT c.id, c.venue_id, c.name, s.name AS sport_name, s.icon AS sport_icon FROM courts c JOIN sports s ON s.id = c.sport_id WHERE c.id = ?", courtId);
  if (!court || !isValidISODate(date) || !hours.length) redirect("/venues");
  const venue = getVenueById(court.venue_id)!;
  const user = await getCurrentUser();
  const self = `/book?court=${courtId}&date=${date}&hours=${hours.join(",")}&return_to=${encodeURIComponent(sp.return_to ?? "")}`;
  if (!user) redirect(`/login?next=${encodeURIComponent(self)}`);

  expireStaleHolds();
  const slots = slotsForCourt(court.id, date, venue.open_hour, venue.close_hour);
  const unavailable = hours.filter((h) => slots.find((s) => s.hour === h)?.status !== "available");
  // If the user already holds these exact slots with an unpaid booking, let them finish paying instead of saying "taken".
  const ownHold = unavailable.length
    ? get<{ id: number; code: string }>(
      "SELECT id, code FROM bookings WHERE user_id = ? AND court_id = ? AND date = ? AND start_hour = ? AND end_hour = ? AND status = 'pending_payment' ORDER BY id DESC LIMIT 1",
      user.id, court.id, date, hours[0], hours[hours.length - 1] + 1)
    : undefined;
  const base = hours.reduce((s, h) => s + priceFor(court.id, date, h), 0);
  const fee = convenienceFee(base);
  const maxKarma = maxKarmaRedeemable(base, user.karma);

  return (
    <div className="container-x py-8">
      <Link href={sp.return_to || `/venues/${venue.slug}`} className="text-sm text-slate-500">← Back to {venue.name}</Link>
      <h1 className="mt-2 text-2xl font-extrabold">Confirm your booking</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3"><span className="text-3xl">{court.sport_icon}</span>
              <div><div className="font-bold">{venue.name}</div><div className="text-sm text-slate-500">{venue.area}, {venue.city_name}</div></div></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="label">Sport · Court</dt><dd className="font-semibold">{court.sport_name} · {court.name}</dd></div>
              <div><dt className="label">Date</dt><dd className="font-semibold">{fmtDate(date, { weekday: "long", day: "numeric", month: "long" })}</dd></div>
              <div><dt className="label">Time</dt><dd className="font-semibold">{fmtHour(hours[0])} – {fmtHour(hours[hours.length - 1] + 1)} ({hours.length} hr)</dd></div>
            </dl>
          </div>
          {ownHold ? (
            <div className="card border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-900">You already hold this slot (booking {ownHold.code})</h3>
              <p className="mt-1 text-sm text-amber-800">Complete the payment to confirm it.</p>
              <div className="mt-3"><RetryPaymentButton bookingId={ownHold.id} /></div>
            </div>
          ) : unavailable.length > 0 ? (
            <div className="card border-rose-200 bg-rose-50 p-5 text-rose-800">Some of your selected slots were just taken. <Link className="font-semibold underline" href={sp.return_to || `/venues/${venue.slug}`}>Pick again</Link>.</div>
          ) : (
            <CheckoutForm courtId={court.id} date={date} hours={hours} base={base} fee={fee} maxKarma={maxKarma} userKarma={user.karma} returnTo={sp.return_to ?? ""} online={isRazorpayEnabled()} />
          )}
        </div>
        <aside className="card p-5 text-sm h-fit">
          <h3 className="font-bold">Cancellation policy</h3>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li>{venue.free_cancel_hours}+ hrs before: refund minus {venue.cancel_fee_pct}% fee</li>
            <li>2–{venue.free_cancel_hours} hrs before: 50% refund</li>
            <li>Under 2 hrs: no cancellation</li>
            <li className="text-xs text-slate-400">Convenience fee {fmtINR(fee)} is non-refundable.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
