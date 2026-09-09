import type { Metadata } from "next";
import Link from "next/link";
import { getCitySlug, getCurrentUser } from "@/lib/auth";
import { cityBySlug, listCoaches, listSports } from "@/lib/queries";
import { enquireCoach } from "@/lib/actions";
import { fmtINR } from "@/lib/time";
import { Alert, Empty, PageTitle, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Coaching & academies" };

export default async function CoachingPage({ searchParams }: { searchParams: Promise<{ sport?: string; enquired?: string; all?: string }> }) {
  const sp = await searchParams;
  const citySlug = await getCitySlug();
  const city = cityBySlug(citySlug);
  const user = await getCurrentUser();
  const coaches = listCoaches({ citySlug: sp.all ? undefined : citySlug, sportSlug: sp.sport });
  const sports = listSports();
  return (
    <div className="container-x py-8">
      <PageTitle title={sp.all ? "Coaches & academies" : `Coaches in ${city?.name}`} sub="Certified coaches for every level. Send an enquiry and they'll call you back." />
      {sp.enquired && <div className="mb-4"><Alert kind="success">Enquiry sent. The coach will contact you on your registered number.</Alert></div>}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/coaching" className={`chip border ${!sp.sport ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>All sports</Link>
        {sports.map((s) => <Link key={s.id} href={`/coaching?sport=${s.slug}${sp.all ? "&all=1" : ""}`} className={`chip border ${sp.sport === s.slug ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>{s.icon} {s.name}</Link>)}
        {!sp.all && <Link href={`/coaching?all=1${sp.sport ? `&sport=${sp.sport}` : ""}`} className="chip border border-dashed border-slate-300">Show all cities</Link>}
      </div>
      {coaches.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {coaches.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-3xl">{c.sport_icon}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{c.name}</h3><Stars rating={c.rating} /></div>
                  <p className="text-sm text-slate-500">{c.sport_name} · {c.area}, {c.city_name} · {c.experience_years} yrs experience</p>
                  <p className="mt-2 text-sm text-slate-700">{c.bio}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm"><b>{fmtINR(c.price_per_session)}</b>/session</span>
                    {user ? (
                      <form action={enquireCoach} className="flex gap-2"><input type="hidden" name="coach_id" value={c.id} /><input name="message" className="input py-1.5 w-40" placeholder="Message (optional)" /><button className="btn-primary py-1.5">Enquire</button></form>
                    ) : <Link href="/login?next=/coaching" className="btn-secondary py-1.5">Login to enquire</Link>}
                  </div>
                </div>
              </div>
            </div>))}
        </div>
      ) : <Empty title="No coaches listed here yet" hint="Try another sport or show all cities." />}
    </div>
  );
}
