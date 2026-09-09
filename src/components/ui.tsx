import Link from "next/link";
import type { Game, VenueCard } from "@/lib/queries";
import { fmtDate, fmtINR, fmtRange } from "@/lib/time";

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">★ {rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-slate-500">({count})</span>}
    </span>
  );
}

export function VenueCardView({ v }: { v: VenueCard }) {
  return (
    <Link href={`/venues/${v.slug}`} className="card overflow-hidden hover:shadow-md transition group">
      <div className={`theme-${v.theme} relative h-36 flex items-end p-3`}>
        <div className="flex flex-wrap gap-1">
          {v.sports.slice(0, 4).map((s) => <span key={s.id} className="chip bg-white/90 text-ink">{s.icon} {s.name}</span>)}
          {v.sports.length > 4 && <span className="chip bg-white/70">+{v.sports.length - 4}</span>}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold group-hover:text-brand-700">{v.name}</h3>
            <p className="text-sm text-slate-500">{v.area}, {v.city_name}</p>
          </div>
          <Stars rating={v.rating} count={v.rating_count} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">from <b className="text-ink">{fmtINR(v.starting_price)}</b>/hr</span>
          <span className="font-semibold text-brand-700">Book now →</span>
        </div>
      </div>
    </Link>
  );
}

export const SKILL_LABEL: Record<string, string> = { any: "All levels", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export function GameCardView({ g }: { g: Game }) {
  const left = g.max_players - g.accepted_count;
  return (
    <Link href={`/play/${g.id}`} className="card p-4 hover:shadow-md transition flex gap-4">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-3xl">{g.sport_icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold truncate">{g.sport_name} · {SKILL_LABEL[g.skill_level]}</h3>
          {g.status === "full" || left <= 0 ? <span className="chip bg-slate-200 text-slate-700">Full</span>
            : <span className="chip bg-brand-100 text-brand-700">{left} spot{left === 1 ? "" : "s"} left</span>}
        </div>
        <p className="text-sm text-slate-600 truncate">📍 {g.location_text}</p>
        <p className="text-sm text-slate-600">🗓 {fmtDate(g.date)} · {fmtRange(g.start_hour, g.end_hour)}</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-500">Hosted by <b className="text-ink">{g.host_name ?? "Player"}</b></span>
          <span className="font-semibold">{g.price_per_player ? `${fmtINR(g.price_per_player)}/player` : "Free"}</span>
        </div>
      </div>
    </Link>
  );
}

export function Empty({ title, hint, cta }: { title: string; hint?: string; cta?: { href: string; label: string } }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-4xl">🏟️</div>
      <h3 className="mt-2 font-bold">{title}</h3>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {cta && <Link href={cta.href} className="btn-primary mt-4">{cta.label}</Link>}
    </div>
  );
}

export function Alert({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: React.ReactNode }) {
  const cls = { info: "bg-sky-50 text-sky-800 border-sky-200", error: "bg-rose-50 text-rose-800 border-rose-200", success: "bg-brand-50 text-brand-700 border-brand-200" }[kind];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{sub && <p className="mt-1 text-slate-500">{sub}</p>}</div>
      {action}
    </div>
  );
}
