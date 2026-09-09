import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { courtsForVenue, getVenue, reviewsForVenue } from "@/lib/queries";
import { slotsForCourt } from "@/lib/slots";
import { addDays, fmtDate, fmtHour, fmtINR, isValidISODate, todayISO } from "@/lib/time";
import { addReview } from "@/lib/actions";
import { Stars } from "@/components/ui";
import SlotPicker from "@/components/SlotPicker";
import { expireStaleHolds } from "@/lib/payments";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = getVenue((await params).slug);
  return { title: v ? `${v.name}, ${v.area}` : "Venue" };
}

export default async function VenuePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ sport?: string; date?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const v = getVenue(slug);
  if (!v) notFound();
  const user = await getCurrentUser();
  const today = todayISO();
  const date = sp.date && isValidISODate(sp.date) && sp.date >= today && sp.date <= addDays(today, 30) ? sp.date : today;
  const sport = v.sports.find((s) => s.slug === sp.sport) ?? v.sports[0];
  expireStaleHolds();
  const courts = courtsForVenue(v.id, sport?.id).map((c) => ({ id: c.id, name: c.name, slots: slotsForCourt(c.id, date, v.open_hour, v.close_hour) }));
  const amenities: string[] = JSON.parse(v.amenities);
  const reviews = reviewsForVenue(v.id);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const returnTo = `/venues/${v.slug}?sport=${sport?.slug ?? ""}&date=${date}`;

  return (
    <div>
      <div className={`theme-${v.theme} text-white`}>
        <div className="container-x py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-1">{v.sports.map((s) => <span key={s.id} className="chip bg-white/20">{s.icon} {s.name}</span>)}</div>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{v.name}</h1>
              <p className="mt-1 text-white/85">📍 {v.address}</p>
              <p className="mt-1 text-white/85">🕒 {fmtHour(v.open_hour)} – {fmtHour(v.close_hour)} · from <b>{fmtINR(v.starting_price)}</b>/hr</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 text-center"><Stars rating={v.rating} /><div className="mt-1 text-xs text-white/80">{v.rating_count} ratings</div></div>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section id="book" className="card p-5">
            <h2 className="text-xl font-extrabold">Book a slot</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {v.sports.map((s) => (
                <Link key={s.id} href={`/venues/${v.slug}?sport=${s.slug}&date=${date}#book`} className={`chip border ${s.id === sport?.id ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>{s.icon} {s.name}</Link>
              ))}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {days.map((d) => (
                <Link key={d} href={`/venues/${v.slug}?sport=${sport?.slug}&date=${d}#book`}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-center text-sm ${d === date ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200 hover:border-brand-500"}`}>
                  <div className="text-xs opacity-80">{fmtDate(d, { weekday: "short" })}</div><div className="font-bold">{fmtDate(d, { day: "numeric", month: "short" })}</div>
                </Link>
              ))}
              <form action={`/venues/${v.slug}`} className="shrink-0 flex items-center gap-1">
                <input type="hidden" name="sport" value={sport?.slug} />
                <input type="date" name="date" defaultValue={date} min={today} max={addDays(today, 30)} className="input py-1.5" />
                <button className="btn-secondary py-1.5">Go</button>
              </form>
            </div>
            <div className="mt-4"><SlotPicker courts={courts} date={date} returnTo={returnTo} /></div>
          </section>

          <Reveal><section className="card p-5">
            <h2 className="text-xl font-extrabold">About</h2>
            <p className="mt-2 text-slate-700">{v.description}</p>
            <h3 className="mt-5 font-bold">Amenities</h3>
            <div className="mt-2 flex flex-wrap gap-2">{amenities.map((a) => <span key={a} className="chip bg-slate-100 text-slate-700">✓ {a}</span>)}</div>
          </section></Reveal>

          <Reveal><section id="reviews" className="card p-5">
            <h2 className="text-xl font-extrabold">Reviews</h2>
            {reviews.length ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {reviews.map((r) => (
                  <li key={r.id} className="py-3"><div className="flex items-center gap-2"><Stars rating={r.rating} /><b className="text-sm">{r.user_name ?? "Player"}</b><span className="text-xs text-slate-400">{r.created_at.slice(0, 10)}</span></div><p className="mt-1 text-sm text-slate-700">{r.comment}</p></li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-slate-500">No reviews yet.</p>}
            {user ? (
              <form action={addReview} className="mt-4 flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-3">
                <input type="hidden" name="venue_id" value={v.id} />
                <div><label className="label">Rating</label><select name="rating" className="input" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select></div>
                <div className="flex-1 min-w-48"><label className="label">Comment</label><input name="comment" className="input" placeholder="How was your game?" maxLength={500} /></div>
                <button className="btn-secondary">Post review</button>
              </form>
            ) : <p className="mt-3 text-sm text-slate-500"><Link href={`/login?next=/venues/${v.slug}`} className="font-semibold text-brand-700">Login</Link> to write a review.</p>}
          </section></Reveal>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold">Cancellation policy</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>✔ Cancel <b>{v.free_cancel_hours}+ hours</b> before: refund minus {v.cancel_fee_pct}% cancellation fee.</li>
              <li>◐ Between 2 and {v.free_cancel_hours} hours before: 50% refund.</li>
              <li>✖ Under 2 hours before the slot: no cancellation.</li>
              <li className="text-xs text-slate-400">Convenience fee is non-refundable. Refunds reach the original payment method in 5–7 working days.</li>
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-bold">Pricing</h3>
            <p className="mt-1 text-sm text-slate-600">Rates are per court per hour. Weekday evenings (6–10 PM) and weekends may be priced higher.</p>
            <p className="mt-2 text-sm">Starting at <b>{fmtINR(v.starting_price)}</b>/hr</p>
          </div>
          <div className="card p-5">
            <h3 className="font-bold">Play with others here</h3>
            <p className="mt-1 text-sm text-slate-600">Booked a court and need players? Host a game and split the cost.</p>
            <Link href={`/play/new?venue=${v.id}&sport=${sport?.id ?? ""}`} className="btn-secondary mt-3 w-full">Host a game at {v.name}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
