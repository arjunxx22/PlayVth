import Link from "next/link";
import { getCitySlug } from "@/lib/auth";
import { cityBySlug, listGames, listSports, listVenues } from "@/lib/queries";
import { GameCardView, VenueCardView } from "@/components/ui";
import { Reveal, Stagger, StaggerItem, Hover } from "@/components/motion/Reveal";
import { AnimatedHeadline, FadeIn, FloatingSports, HeroBackdrop } from "@/components/motion/Hero";
import CountUp from "@/components/motion/CountUp";
import { get } from "@/lib/db";

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const citySlug = await getCitySlug();
  const city = cityBySlug(citySlug);
  const sports = listSports();
  const venues = listVenues({ citySlug }).slice(0, 6);
  const games = listGames({ citySlug }).slice(0, 4);
  const stats = {
    venues: get<{ n: number }>("SELECT COUNT(*) AS n FROM venues WHERE is_active = 1")!.n,
    courts: get<{ n: number }>("SELECT COUNT(*) AS n FROM courts WHERE is_active = 1")!.n,
    games: get<{ n: number }>("SELECT COUNT(*) AS n FROM games WHERE status IN ('open','full')")!.n,
    players: get<{ n: number }>("SELECT COUNT(*) AS n FROM users")!.n,
  };
  return (
    <>
      {deleted && <div className="container-x pt-4"><div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">Your account has been deleted. We&apos;re sorry to see you go.</div></div>}
      <section className="relative overflow-hidden bg-ink text-white">
        <HeroBackdrop />
        <div className="container-x relative grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <FadeIn><p className="chip bg-brand-600/20 text-brand-200"><span className="pulse-dot inline-block h-2 w-2 rounded-full bg-brand-400" /> Live in {city?.name ?? "your city"} · 10 sports</p></FadeIn>
            <AnimatedHeadline words={["Book.", "Play.", "Repeat."]} accentIndex={2} />
            <FadeIn delay={0.5}><p className="mt-4 max-w-lg text-slate-300">Reserve courts and turfs near you in seconds, join games with players of your skill level, and earn Karma every time you play.</p></FadeIn>
            <FadeIn delay={0.65}>
              <form action="/venues" className="mt-6 flex gap-2">
                <input name="q" className="input max-w-sm text-ink" placeholder="Search venues, areas…" />
                <button className="btn-primary">Search</button>
              </form>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/venues" className="btn-primary">Book a venue</Link>
                <Link href="/play" className="btn bg-white/10 text-white hover:bg-white/20">Find a game</Link>
                <Link href="/coaching" className="btn bg-white/10 text-white hover:bg-white/20">Get coached</Link>
              </div>
            </FadeIn>
          </div>
          <FloatingSports sports={sports.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon }))} />
        </div>
        <div className="container-x relative pb-10">
          <Reveal>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:grid-cols-4">
              {[[stats.venues, "venues"], [stats.courts, "courts & turfs"], [stats.games, "open games"], [stats.players, "players"]].map(([n, l]) => (
                <div key={l as string} className="text-center"><div className="text-3xl font-extrabold text-white"><CountUp to={n as number} suffix="+" /></div><div className="text-xs uppercase tracking-wide text-slate-400">{l}</div></div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">Top venues in {city?.name}</h2>
          <Link href="/venues" className="font-semibold text-brand-700">See all →</Link>
        </div>
        {venues.length ? (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{venues.map((v) => <StaggerItem key={v.id}><VenueCardView v={v} /></StaggerItem>)}</Stagger>
        ) : <p className="text-slate-500">No venues listed here yet. <Link className="text-brand-700 font-semibold" href="/partner/new">List yours</Link>.</p>}
      </section>

      <section className="container-x py-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">Games happening near you</h2>
          <Link href="/play" className="font-semibold text-brand-700">See all →</Link>
        </div>
        {games.length ? (
          <Stagger className="grid gap-4 sm:grid-cols-2">{games.map((g) => <StaggerItem key={g.id}><GameCardView g={g} /></StaggerItem>)}</Stagger>
        ) : <p className="text-slate-500">No open games yet. <Link className="text-brand-700 font-semibold" href="/play/new">Host one</Link>.</p>}
      </section>

      <section className="container-x py-12">
        <Reveal><h2 className="text-2xl font-extrabold text-center">How PlayVth works</h2></Reveal>
        <Stagger className="mt-6 grid gap-4 md:grid-cols-4">
          {[["🔎", "Discover", "Search venues by sport, area and price with live slot availability."],
            ["📅", "Book", "Pick a court and hour, pay online, get an instant confirmation code."],
            ["🤝", "Play together", "Join games hosted by players near you or host your own and approve who joins."],
            ["⚡", "Earn Karma", "3 Karma per booking, 1 per game. Redeem up to 20% off your next booking."]].map(([i, t, d]) => (
            <StaggerItem key={t}><Hover className="h-full"><div className="card card-shine h-full p-5"><div className="text-3xl">{i}</div><h3 className="mt-2 font-bold">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div></Hover></StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="container-x pb-4">
        <Reveal><div className="card card-shine overflow-hidden theme-emerald p-8 text-white sm:flex sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-extrabold">Own a sports facility?</h2><p className="mt-1 text-white/85">List for free, manage slots and pricing from one dashboard, and fill your off-peak hours.</p></div>
          <Link href="/partner/new" className="btn bg-white text-brand-700 mt-4 sm:mt-0">List your venue</Link>
        </div></Reveal>
      </section>
    </>
  );
}
