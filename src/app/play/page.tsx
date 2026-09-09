import type { Metadata } from "next";
import Link from "next/link";
import { getCitySlug } from "@/lib/auth";
import { cityBySlug, listGames, listSports } from "@/lib/queries";
import { addDays, fmtDate, isValidISODate, todayISO } from "@/lib/time";
import { Empty, GameCardView, PageTitle, SKILL_LABEL } from "@/components/ui";

export const metadata: Metadata = { title: "Play with others" };

export default async function PlayPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const citySlug = await getCitySlug();
  const city = cityBySlug(citySlug);
  const sports = listSports();
  const today = todayISO();
  const date = sp.date && isValidISODate(sp.date) ? sp.date : undefined;
  const games = listGames({ citySlug, sportSlug: sp.sport, skill: sp.skill, date });
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    return `/play?${p.toString()}`;
  };
  return (
    <div className="container-x py-8">
      <PageTitle title={`Games in ${city?.name ?? ""}`} sub="Join games hosted by players near you, or host your own and pick who plays."
        action={<Link href="/play/new" className="btn-primary">+ Host a game</Link>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={link({ sport: undefined })} className={`chip border ${!sp.sport ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>All sports</Link>
        {sports.map((s) => <Link key={s.id} href={link({ sport: s.slug })} className={`chip border ${sp.sport === s.slug ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>{s.icon} {s.name}</Link>)}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {[undefined, today, addDays(today, 1), addDays(today, 2)].map((d, i) => (
          <Link key={i} href={link({ date: d })} className={`chip border ${date === d ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200"}`}>{d ? (i === 1 ? "Today" : i === 2 ? "Tomorrow" : fmtDate(d)) : "Any day"}</Link>
        ))}
        <span className="mx-2 text-slate-300">|</span>
        {["any", "beginner", "intermediate", "advanced"].map((k) => (
          <Link key={k} href={link({ skill: k === "any" ? undefined : k })} className={`chip border ${(sp.skill ?? "any") === k ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200"}`}>{SKILL_LABEL[k]}</Link>
        ))}
      </div>
      {games.length ? <div className="grid gap-4 sm:grid-cols-2">{games.map((g) => <GameCardView key={g.id} g={g} />)}</div>
        : <Empty title="No games yet" hint="Be the first to host one in your area. It takes 30 seconds." cta={{ href: "/play/new", label: "Host a game" }} />}
    </div>
  );
}
