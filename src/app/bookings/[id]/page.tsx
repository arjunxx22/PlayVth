import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBooking } from "@/lib/queries";
import { cancelBooking, previewCancel } from "@/lib/actions";
import { fmtDate, fmtHour, fmtINR } from "@/lib/time";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string; cancelled?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/bookings/${id}`);
  const b = getBooking(Number(id));
  if (!b || (b.user_id !== user.id && user.role !== "admin")) notFound();
  const preview = await previewCancel(b.id, user.id);
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {sp.new && <Alert kind="success">🎉 Booking confirmed! You earned 3 Karma. Show the code below at the venue.</Alert>}
        {sp.cancelled && <Alert kind="info">Booking cancelled. {b.refund_amount ? `${fmtINR(b.refund_amount)} will be refunded to your ${b.payment_method.toUpperCase()} in 5–7 working days.` : "No refund applicable."}</Alert>}
        {sp.error && <Alert kind="error">{sp.error}</Alert>}
        <div className="card overflow-hidden">
          <div className={`p-5 text-white ${b.status === "confirmed" ? "bg-ink" : "bg-slate-500"}`}>
            <div className="text-xs uppercase tracking-widest text-white/70">Booking code</div>
            <div className="text-3xl font-extrabold tracking-wider">{b.code}</div>
            <div className="mt-1 text-sm text-white/80">Status: <b className="uppercase">{b.status}</b></div>
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
              <div className="flex justify-between"><dt>Convenience fee</dt><dd>{fmtINR(b.convenience_fee)}</dd></div>
              {b.karma_redeemed > 0 && <div className="flex justify-between text-brand-700"><dt>Karma redeemed</dt><dd>−{fmtINR(b.karma_redeemed)}</dd></div>}
              <div className="flex justify-between font-extrabold"><dt>Paid via {b.payment_method.toUpperCase()}</dt><dd>{fmtINR(b.total_amount)}</dd></div>
              {b.status === "cancelled" && <div className="flex justify-between text-slate-600"><dt>Refund</dt><dd>{fmtINR(b.refund_amount ?? 0)}</dd></div>}
            </dl>
          </div>
        </div>
        {b.status === "confirmed" && (
          <div className="card p-5">
            <h3 className="font-bold">Need to cancel?</h3>
            {preview.allowed ? (
              <form action={cancelBooking} className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <input type="hidden" name="booking_id" value={b.id} />
                <p className="text-sm text-slate-600">You&apos;ll get <b>{fmtINR(preview.refund)}</b> back{preview.karmaBack ? ` and ${preview.karmaBack} Karma returned` : ""}. The convenience fee is not refunded.</p>
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
