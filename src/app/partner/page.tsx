import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { venuesForOwner } from "@/lib/queries";
import { fmtINR, todayISO } from "@/lib/time";
import { PageTitle, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Partner dashboard" };

export default async function PartnerPage() {
  const user = await getCurrentUser();
  const venues = user ? venuesForOwner(user.id) : [];
  if (!user || venues.length === 0) {
    return (
      <div>
        <section className="theme-emerald text-white"><div className="container-x py-16">
          <h1 className="text-4xl font-extrabold">Grow your sports business with PlayVth</h1>
          <p className="mt-3 max-w-xl text-white/85">Turf, court, pool or academy: list it in minutes, take online bookings 24×7, and manage everything from one dashboard. No listing fee, just a small commission per successful booking.</p>
          <Link href={user ? "/partner/new" : "/login?next=/partner/new"} className="btn bg-white text-brand-700 mt-6">List your venue — it&apos;s free</Link>
        </div></section>
        <section className="container-x grid gap-4 py-12 md:grid-cols-3">
          {[["📅", "Facility scheduler", "See every court by the hour, block slots for maintenance or walk-ins, and cancel with automatic refunds."],
            ["💰", "Pricing engine", "Different rates per court, weekday vs weekend, peak vs off-peak. Change them any time."],
            ["📈", "Reports & customers", "Daily revenue and booking counts, customer contact details for every booking, ratings and reviews."]].map(([i, t, d]) => (
            <div key={t} className="card p-5"><div className="text-3xl">{i}</div><h3 className="mt-2 font-bold">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>))}
        </section>
      </div>
    );
  }
  const today = todayISO();
  const stats = all<{ venue_id: number; n: number; revenue: number }>(
    `SELECT venue_id, COUNT(*) AS n, COALESCE(SUM(base_amount), 0) AS revenue FROM bookings WHERE status = 'confirmed' AND date = ? AND venue_id IN (${venues.map(() => "?").join(",")}) GROUP BY venue_id`,
    today, ...venues.map((v) => v.id));
  const monthly = all<{ venue_id: number; n: number; revenue: number }>(
    `SELECT venue_id, COUNT(*) AS n, COALESCE(SUM(base_amount), 0) AS revenue FROM bookings WHERE status = 'confirmed' AND substr(date, 1, 7) = ? AND venue_id IN (${venues.map(() => "?").join(",")}) GROUP BY venue_id`,
    today.slice(0, 7), ...venues.map((v) => v.id));
  return (
    <div className="container-x py-8">
      <PageTitle title="Partner dashboard" sub={`Hi ${user.name ?? "partner"}, here's how your venues are doing today.`} action={<Link href="/partner/new" className="btn-primary">+ Add venue</Link>} />
      <div className="grid gap-4 md:grid-cols-2">
        {venues.map((v) => {
          const t = stats.find((s) => s.venue_id === v.id); const m = monthly.find((s) => s.venue_id === v.id);
          return (
            <Link key={v.id} href={`/partner/venues/${v.id}`} className="card overflow-hidden hover:shadow-md transition">
              <div className={`theme-${v.theme} p-4 text-white`}><h3 className="text-lg font-bold">{v.name}</h3><p className="text-sm text-white/80">{v.area}, {v.city_name}</p></div>
              <div className="grid grid-cols-3 gap-2 p-4 text-center text-sm">
                <div><div className="text-2xl font-extrabold">{t?.n ?? 0}</div><div className="text-slate-500">bookings today</div></div>
                <div><div className="text-2xl font-extrabold">{fmtINR(t?.revenue ?? 0)}</div><div className="text-slate-500">today&apos;s revenue</div></div>
                <div><div className="text-2xl font-extrabold">{fmtINR(m?.revenue ?? 0)}</div><div className="text-slate-500">{m?.n ?? 0} this month</div></div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-sm"><Stars rating={v.rating} count={v.rating_count} /><span className="font-semibold text-brand-700">Manage →</span></div>
            </Link>);
        })}
      </div>
    </div>
  );
}
