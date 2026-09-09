import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { gamePlayers, getGame } from "@/lib/queries";
import { cancelGame, joinGame, leaveGame, respondToRequest } from "@/lib/actions";
import { fmtDate, fmtINR, fmtRange } from "@/lib/time";
import { Alert, SKILL_LABEL } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const g = getGame(Number((await params).id));
  return { title: g ? `${g.sport_name} game · ${fmtDate(g.date)}` : "Game" };
}

export default async function GamePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const g = getGame(Number(id));
  if (!g) notFound();
  const user = await getCurrentUser();
  const players = gamePlayers(g.id);
  const accepted = players.filter((p) => p.status === "accepted");
  const requested = players.filter((p) => p.status === "requested");
  const mine = user ? players.find((p) => p.user_id === user.id) : undefined;
  const isHost = user?.id === g.host_user_id;
  const spotsLeft = g.max_players - accepted.length;
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        {error === "full" && <Alert kind="error">This game is full.</Alert>}
        {g.status === "cancelled" && <Alert kind="error">This game was cancelled by the host.</Alert>}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-4xl">{g.sport_icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold">{g.sport_name} · {SKILL_LABEL[g.skill_level]}</h1>
              <p className="text-slate-600">📍 {g.venue_slug ? <Link href={`/venues/${g.venue_slug}`} className="font-semibold text-brand-700">{g.location_text}</Link> : g.location_text} · {g.city_name}</p>
              <p className="text-slate-600">🗓 {fmtDate(g.date, { weekday: "long", day: "numeric", month: "long" })} · {fmtRange(g.start_hour, g.end_hour)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="chip bg-slate-100">{g.price_per_player ? `${fmtINR(g.price_per_player)} per player` : "Free"}</span>
                <span className={`chip ${spotsLeft > 0 ? "bg-brand-100 text-brand-700" : "bg-slate-200"}`}>{accepted.length}/{g.max_players} players · {spotsLeft > 0 ? `${spotsLeft} left` : "Full"}</span>
              </div>
            </div>
          </div>
          {g.description && <p className="mt-4 whitespace-pre-line text-slate-700">{g.description}</p>}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {!user && <Link href={`/login?next=/play/${g.id}`} className="btn-primary">Login to join</Link>}
            {user && !isHost && g.status !== "cancelled" && (!mine || mine.status === "left" || mine.status === "rejected") && spotsLeft > 0 && (
              <form action={joinGame}><input type="hidden" name="game_id" value={g.id} /><button className="btn-primary">{g.price_per_player ? "Request to join" : "Join game"}</button></form>)}
            {mine?.status === "requested" && <span className="chip bg-amber-100 text-amber-800">Request sent · waiting for host</span>}
            {mine?.status === "accepted" && !isHost && <span className="chip bg-brand-100 text-brand-700">You&apos;re in ✓</span>}
            {mine?.status === "rejected" && <span className="chip bg-rose-100 text-rose-700">Host declined your request</span>}
            {user && !isHost && mine && (mine.status === "accepted" || mine.status === "requested") && (
              <form action={leaveGame}><input type="hidden" name="game_id" value={g.id} /><button className="btn-ghost text-rose-600">Leave</button></form>)}
            {isHost && g.status !== "cancelled" && (
              <form action={cancelGame}><input type="hidden" name="game_id" value={g.id} /><button className="btn-ghost text-rose-600">Cancel game</button></form>)}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-bold">Playing ({accepted.length})</h2>
            <ul className="mt-3 space-y-2">
              {accepted.map((p) => (
                <li key={p.user_id} className="flex items-center gap-3 text-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{(p.name ?? "P").slice(0, 1)}</span>
                  <span className="font-medium">{p.name ?? "Player"}</span>
                  {p.user_id === g.host_user_id && <span className="chip bg-ink text-white">Host</span>}
                  {p.skill && <span className="chip bg-slate-100">{SKILL_LABEL[p.skill]}</span>}
                </li>))}
            </ul>
          </div>
          {isHost && (
            <div className="card p-5">
              <h2 className="font-bold">Join requests ({requested.length})</h2>
              {requested.length === 0 && <p className="mt-2 text-sm text-slate-500">No pending requests.</p>}
              <ul className="mt-3 space-y-2">
                {requested.map((p) => (
                  <li key={p.user_id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium flex-1">{p.name ?? "Player"} {p.skill && <span className="chip bg-slate-100">{SKILL_LABEL[p.skill]}</span>}</span>
                    <form action={respondToRequest} className="flex gap-1">
                      <input type="hidden" name="game_id" value={g.id} /><input type="hidden" name="user_id" value={p.user_id} />
                      <button name="decision" value="accept" className="btn-primary py-1">Accept</button>
                      <button name="decision" value="reject" className="btn-secondary py-1">Decline</button>
                    </form>
                  </li>))}
              </ul>
            </div>
          )}
        </div>
        <Link href="/play" className="btn-ghost">← All games</Link>
      </div>
    </div>
  );
}
