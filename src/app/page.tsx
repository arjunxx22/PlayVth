import Link from "next/link";
import { getCitySlug } from "@/lib/auth";
import { cityBySlug, listGames, listSports, listVenues } from "@/lib/queries";
import { GameCardView, VenueCardView } from "@/components/ui";

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const citySlug = await getCitySlug();
  const city = cityBySlug(citySlug);
  const sports = listSports();
  const venues = listVenues({ citySlug }).slice(0, 6);
  const games = listGames({ citySlug }).slice(0, 4);
  return (
    <>
      {deleted && <div className="container-x pt-4"><div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">Your account has been deleted. We&apos;re sorry to see you go.</div></div>}
      <section className="bg-ink text-white">
        <div className="container-x grid gap-8 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="chip bg-brand-600/20 text-brand-200">🏸 {city?.name ?? "Your city"} · 50+ sports</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Book. Play. <span className="text-brand-500">Repeat.</span></h1>
            <p className="mt-4 max-w-lg text-slate-300">Reserve courts and turfs near you in seconds, join games with players of your skill level, and earn Karma every time you play.</p>
            <form action="/venues" className="mt-6 flex gap-2">
              <input name="q" className="input max-w-sm text-ink" placeholder="Search venues, areas…" />
              <button className="btn-primary">Search</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/venues" className="btn-primary">Book a venue</Link>
              <Link href="/play" className="btn bg-white/10 text-white hover:bg-white/20">Find a game</Link>
              <Link href="/coaching" className="btn bg-white/10 text-white hover:bg-white/20">Get coached</Link>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
            {sports.map((s) => (
              <Link key={s.id} href={`/venues?sport=${s.slug}`} className="card flex flex-col items-center gap-1 bg-white/5 border-white/10 p-3 text-center hover:bg-white/10">
                <span className="text-3xl">{s.icon}</span><span className="text-xs font-medium text-slate-200">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">Top venues in {city?.name}</h2>
          <Link href="/venues" className="font-semibold text-brand-700">See all →</Link>
        </div>
        {venues.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{venues.map((v) => <VenueCardView key={v.id} v={v} />)}</div>
        ) : <p className="text-slate-500">No venues listed here yet. <Link className="text-brand-700 font-semibold" href="/partner/new">List yours</Link>.</p>}
      </section>

      <section className="container-x py-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">Games happening near you</h2>
          <Link href="/play" className="font-semibold text-brand-700">See all →</Link>
        </div>
        {games.length ? (
          <div className="grid gap-4 sm:grid-cols-2">{games.map((g) => <GameCardView key={g.id} g={g} />)}</div>
        ) : <p className="text-slate-500">No open games yet. <Link className="text-brand-700 font-semibold" href="/play/new">Host one</Link>.</p>}
      </section>

      <section className="container-x py-12">
        <h2 className="text-2xl font-extrabold text-center">How PlayVth works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[["🔎", "Discover", "Search venues by sport, area and price with live slot availability."],
            ["📅", "Book", "Pick a court and hour, pay online, get an instant confirmation code."],
            ["🤝", "Play together", "Join games hosted by players near you or host your own and approve who joins."],
            ["⚡", "Earn Karma", "3 Karma per booking, 1 per game. Redeem up to 20% off your next booking."]].map(([i, t, d]) => (
            <div key={t} className="card p-5"><div className="text-3xl">{i}</div><h3 className="mt-2 font-bold">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="container-x pb-4">
        <div className="card overflow-hidden theme-emerald p-8 text-white sm:flex sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-extrabold">Own a sports facility?</h2><p className="mt-1 text-white/85">List for free, manage slots and pricing from one dashboard, and fill your off-peak hours.</p></div>
          <Link href="/partner/new" className="btn bg-white text-brand-700 mt-4 sm:mt-0">List your venue</Link>
        </div>
      </section>
    </>
  );
}
