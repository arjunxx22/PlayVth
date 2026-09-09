import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBooking } from "@/lib/queries";
import { cancelBooking, previewCancel } from "@/lib/actions";
import { fmtDate, fmtHour, fmtINR } from "@/lib/time";
import { Alert } from "@/components/ui";
import RetryPaymentButton from "@/components/RetryPaymentButton";
import { expireStaleHolds } from "@/lib/payments";
import { HOLD_MINUTES } from "@/lib/karma";
import Confetti from "@/components/motion/Confetti";
import SuccessCheck from "@/components/motion/SuccessCheck";
import { Reveal, Pop } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string; cancelled?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/bookings/${id}`);
  expireStaleHolds();
  const b = getBooking(Number(id));
  if (!b || (b.user_id !== user.id && user.role !== "admin")) notFound();
  const preview = await previewCancel(b.id, user.id);
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {sp.new && (
          <><Confetti />
          <div className="card flex items-center gap-4 border-brand-200 bg-brand-50 p-5">
            <SuccessCheck />
            <div><Pop><div className="text-lg font-extrabold text-brand-700">Booking confirmed!</div></Pop><Pop delay={0.15}><p className="text-sm text-brand-700/80">You earned <b>+3 Karma</b>. Show the code below at the venue.</p></Pop></div>
          </div></>
        )}
        {sp.cancelled && <Alert kind="info">Booking cancelled. {b.refund_amount ? `${fmtINR(b.refund_amount)} will be refunded to your original payment method in 5–7 working days.` : b.payment_provider === "razorpay" ? "No refund applicable." : "Nothing was charged, so no refund is needed."}</Alert>}
        {b.status === "pending_payment" && (
          <div className="card p-5 border-amber-200 bg-amber-50">
            <h3 className="font-bold text-amber-900">Payment pending</h3>
            <p className="mt-1 text-sm text-amber-800">Your slot is held for {HOLD_MINUTES} minutes from when you started checkout. Complete the payment to confirm.</p>
            <div className="mt-3"><RetryPaymentButton bookingId={b.id} /></div>
          </div>
        )}
        {b.status === "confirmed" && b.payment_provider !== "razorpay" && !b.paid_at && (
          <div className="card flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm">
            <span className="text-2xl">🏟️</span>
            <div><b className="text-amber-900">Pay {fmtINR(b.total_amount)} at the venue.</b><p className="text-amber-800">Show this booking code at the counter before your slot. Cash, UPI and cards accepted. No online charge has been made.</p></div>
          </div>
        )}
        {b.paid_at && b.payment_provider !== "razorpay" && <Alert kind="success">Paid at venue ✓</Alert>}
        {(b.status === "failed" || b.status === "expired") && <Alert kind="error">This booking was not paid ({b.status}). Any Karma you reserved has been returned. <Link className="font-semibold underline" href={`/venues/${b.venue_slug}`}>Pick a slot again</Link>.</Alert>}
        {sp.error && <Alert kind="error">{sp.error}</Alert>}
        <Reveal delay={0.2}><div className="card overflow-hidden">
          <div className={`p-5 text-white ${b.status === "confirmed" ? "bg-ink" : "bg-slate-500"}`}>
            <div className="text-xs uppercase tracking-widest text-white/70">Booking code</div>
            <Pop delay={0.35}><div className="text-3xl font-extrabold tracking-wider">{b.code}</div></Pop>
            <div className="mt-1 text-sm text-white/80">Status: <b className="uppercase">{b.status.replace("_", " ")}</b></div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3"><span className="text-3xl">{b.sport_icon}</span>
              <div><Link href={`/venues/${b.venue_slug}`} className="font-bold hover:text-brand-700">{b.venue_name}</Link><div className="text-sm text-slate-500">{b.area}</div></div></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="label">Sport · Court</dt><dd className="font-semibold">{b.sport_name} · {b.court_name}</dd></div>
              <div><dt className="label">Date</dt><dd className="font-semibold">{fmtDate(b.date, { weekday: "long", day: "numeric", month: "long" })}</dd></div>
              <div><dt className="label">Time</dt><dd className="font-semibold">{fmtHour(b.start_hour)} – {fmtHour(b.end_hour)}</dd></div>
            </dl>
            <dl className="mt-5 space-y-1 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><dt>Court charges</dt><dd>{fmtINR(b.base_amount)}</dd></div>
              {b.convenience_fee > 0 && <div className="flex justify-between"><dt>Convenience fee</dt><dd>{fmtINR(b.convenience_fee)}</dd></div>}
              {b.karma_redeemed > 0 && <div className="flex justify-between text-brand-700"><dt>Karma redeemed</dt><dd>−{fmtINR(b.karma_redeemed)}</dd></div>}
              <div className="flex justify-between font-extrabold"><dt>{b.payment_provider === "razorpay" ? (b.status === "pending_payment" ? "Payable" : "Paid online") : b.paid_at ? `Paid at venue (${b.payment_method.replace("pay_at_venue", "counter").replace("_", " ")})` : "To pay at venue"}</dt><dd>{fmtINR(b.total_amount)}</dd></div>
              {b.razorpay_payment_id && <div className="flex justify-between text-xs text-slate-500"><dt>Razorpay payment ID</dt><dd className="font-mono">{b.razorpay_payment_id}</dd></div>}
              {b.status === "cancelled" && <div className="flex justify-between text-slate-600"><dt>Refund{b.refund_status ? ` (${b.refund_status})` : ""}</dt><dd>{fmtINR(b.refund_amount ?? 0)}</dd></div>}
              {b.razorpay_refund_id && <div className="flex justify-between text-xs text-slate-500"><dt>Razorpay refund ID</dt><dd className="font-mono">{b.razorpay_refund_id}</dd></div>}
            </dl>
          </div>
        </div></Reveal>
        {b.status === "confirmed" && (
          <div className="card p-5">
            <h3 className="font-bold">Need to cancel?</h3>
            {preview.allowed ? (
              <form action={cancelBooking} className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <input type="hidden" name="booking_id" value={b.id} />
                <p className="text-sm text-slate-600">{b.payment_provider === "razorpay" ? <>You&apos;ll get <b>{fmtINR(preview.refund)}</b> back{preview.karmaBack ? ` and ${preview.karmaBack} Karma returned` : ""}. The convenience fee is not refunded.</> : <>Nothing was charged, so there&apos;s nothing to refund{preview.karmaBack ? `; your ${preview.karmaBack} Karma will be returned` : ""}. Cancelling frees the court for someone else.</>}</p>
                <button className="btn-danger">Cancel booking</button>
              </form>
            ) : <p className="mt-2 text-sm text-slate-500">{preview.reason}</p>}
          </div>
        )}
        <div className="flex gap-2"><Link href="/profile" className="btn-secondary">My bookings</Link><Link href="/venues" className="btn-ghost">Book another</Link></div>
      </div>
    </div>
  );
}
