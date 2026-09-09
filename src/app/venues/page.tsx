import type { Metadata } from "next";
import Link from "next/link";
import { getCitySlug } from "@/lib/auth";
import { cityBySlug, listSports, listVenues } from "@/lib/queries";
import { Empty, PageTitle, VenueCardView } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "Book venues" };

export default async function VenuesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const citySlug = await getCitySlug();
  const city = cityBySlug(citySlug);
  const sports = listSports();
  const maxPrice = sp.max ? Number(sp.max) : undefined;
  const venues = listVenues({ citySlug, sportSlug: sp.sport, q: sp.q, sort: sp.sort, maxPrice });
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    return `/venues?${p.toString()}`;
  };
  return (
    <div className="container-x py-8">
      <PageTitle title={`Venues in ${city?.name ?? ""}`} sub={`${venues.length} venue${venues.length === 1 ? "" : "s"} · real-time slot availability`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={link({ sport: undefined })} className={`chip border ${!sp.sport ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>All sports</Link>
        {sports.map((s) => (
          <Link key={s.id} href={link({ sport: s.slug })} className={`chip border ${sp.sport === s.slug ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>{s.icon} {s.name}</Link>
        ))}
      </div>
      <form className="card mb-6 flex flex-wrap items-end gap-3 p-4" action="/venues">
        {sp.sport && <input type="hidden" name="sport" value={sp.sport} />}
        <div className="flex-1 min-w-48"><label className="label">Search</label><input name="q" defaultValue={sp.q} className="input" placeholder="Venue or area" /></div>
        <div><label className="label">Max price / hr</label>
          <select name="max" defaultValue={sp.max ?? ""} className="input">
            <option value="">Any</option><option value="300">Under ₹300</option><option value="500">Under ₹500</option><option value="1000">Under ₹1,000</option><option value="2000">Under ₹2,000</option>
          </select></div>
        <div><label className="label">Sort</label>
          <select name="sort" defaultValue={sp.sort ?? ""} className="input">
            <option value="">Popularity</option><option value="rating">Rating</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
          </select></div>
        <button className="btn-primary">Apply</button>
        {(sp.q || sp.max || sp.sort) && <Link href={link({ q: undefined, max: undefined, sort: undefined })} className="btn-ghost">Clear</Link>}
      </form>
      {venues.length ? (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{venues.map((v) => <StaggerItem key={v.id}><VenueCardView v={v} /></StaggerItem>)}</Stagger>
      ) : <Empty title="No venues match" hint="Try another sport, a wider price range, or switch city from the top bar." cta={{ href: "/partner/new", label: "List your venue" }} />}
    </div>
  );
}
