import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { bookingsForUser, gamesForUser, karmaLedger, userSkills } from "@/lib/queries";
import { fmtDate, fmtINR, fmtRange, todayISO } from "@/lib/time";
import { Alert, PageTitle, SKILL_LABEL } from "@/components/ui";
import { deleteAccount } from "@/lib/actions";
import CountUp from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  const bookings = bookingsForUser(user.id);
  const games = gamesForUser(user.id);
  const ledger = karmaLedger(user.id);
  const skills = userSkills(user.id);
  const today = todayISO();
  const upcoming = bookings.filter((b) => (b.status === "confirmed" || b.status === "pending_payment") && b.date >= today);
  const past = bookings.filter((b) => !upcoming.includes(b));
  const statusChip = (s: string) => s === "confirmed" ? "bg-brand-100 text-brand-700" : s === "pending_payment" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600";
  return (
    <div className="container-x py-8">
      <PageTitle title={user.name ?? "Complete your profile"} sub={`+91 ${user.phone}${user.email ? ` · ${user.email}` : ""}`}
        action={<div className="flex gap-2"><Link href="/profile/edit" className="btn-secondary">Edit profile</Link>{user.role === "partner" && <Link href="/partner" className="btn-primary">Partner dashboard</Link>}</div>} />
      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="text-lg font-bold">Upcoming bookings</h2>
            {upcoming.length === 0 && <p className="mt-2 text-sm text-slate-500">Nothing booked. <Link href="/venues" className="font-semibold text-brand-700">Find a venue</Link>.</p>}
            <ul className="mt-3 divide-y divide-slate-100">{upcoming.map((b) => (
              <li key={b.id}><Link href={`/bookings/${b.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 rounded-lg">
                <span className="text-2xl">{b.sport_icon}</span>
                <div className="flex-1 text-sm"><div className="font-semibold">{b.venue_name} · {b.court_name}</div><div className="text-slate-500">{fmtDate(b.date)} · {fmtRange(b.start_hour, b.end_hour)}</div></div>
                <div className="text-right text-sm"><div className="font-bold">{fmtINR(b.total_amount)}</div><span className={`chip ${statusChip(b.status)}`}>{b.status === "pending_payment" ? "Payment pending" : b.code}</span></div>
              </Link></li>))}</ul>
          </section>
          <section className="card p-5">
            <h2 className="text-lg font-bold">My games</h2>
            {games.length === 0 && <p className="mt-2 text-sm text-slate-500">You haven&apos;t joined any games. <Link href="/play" className="font-semibold text-brand-700">Browse games</Link>.</p>}
            <ul className="mt-3 divide-y divide-slate-100">{games.map((g) => (
              <li key={g.id}><Link href={`/play/${g.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 rounded-lg">
                <span className="text-2xl">{g.sport_icon}</span>
                <div className="flex-1 text-sm"><div className="font-semibold">{g.sport_name} · {g.location_text}</div><div className="text-slate-500">{fmtDate(g.date)} · {fmtRange(g.start_hour, g.end_hour)}</div></div>
                <span className={`chip ${g.host_user_id === user.id ? "bg-ink text-white" : g.my_status === "accepted" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-800"}`}>{g.host_user_id === user.id ? "Host" : g.my_status}</span>
              </Link></li>))}</ul>
          </section>
          <section className="card p-5">
            <h2 className="text-lg font-bold">Past &amp; cancelled bookings</h2>
            {past.length === 0 && <p className="mt-2 text-sm text-slate-500">No history yet.</p>}
            <ul className="mt-3 divide-y divide-slate-100">{past.map((b) => (
              <li key={b.id}><Link href={`/bookings/${b.id}`} className="flex items-center gap-3 py-2 text-sm hover:bg-slate-50 rounded-lg">
                <span className="text-xl">{b.sport_icon}</span><div className="flex-1"><b>{b.venue_name}</b> · {fmtDate(b.date)} · {fmtRange(b.start_hour, b.end_hour)}</div>
                <span className={`chip ${statusChip(b.status)}`}>{b.status}</span></Link></li>))}</ul>
          </section>
        </div>
        <aside className="space-y-6">
          <Reveal><section className="card p-5 bg-amber-50 border-amber-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Karma points</div>
            <div className="text-4xl font-extrabold text-amber-800">⚡ <CountUp to={user.karma} /></div>
            <p className="mt-1 text-sm text-amber-800/80">Redeem up to 20% of court charges on your next booking.</p>
            <p className="mt-2 text-xs text-amber-800/70">Referral code: <b>{user.referral_code}</b> · 50 Karma per friend</p>
            <ul className="mt-3 max-h-56 space-y-1 overflow-auto text-xs text-amber-900/80">{ledger.map((l) => <li key={l.id} className="flex justify-between"><span>{l.reason}</span><b>{l.delta > 0 ? "+" : ""}{l.delta}</b></li>)}</ul>
          </section></Reveal>
          <section className="card p-5">
            <h2 className="font-bold">Skill levels</h2>
            {skills.length === 0 ? <p className="mt-2 text-sm text-slate-500">Set your levels so hosts can match you. <Link href="/profile/edit" className="font-semibold text-brand-700">Add sports</Link>.</p>
              : <ul className="mt-2 space-y-1 text-sm">{skills.map((s) => <li key={s.sport_id} className="flex justify-between"><span>{s.icon} {s.sport_name}</span><span className="chip bg-slate-100">{SKILL_LABEL[s.level]}</span></li>)}</ul>}
          </section>
          <section className="card p-5">
            <h2 className="font-bold">Delete account</h2>
            <p className="mt-1 text-xs text-slate-500">Removes your name, phone number, email, skills and Karma permanently. Booking records are anonymised and kept only as required by law. Cancel upcoming bookings first.</p>
            <form action={deleteAccount} className="mt-3 flex gap-2">
              <input name="confirm" className="input py-1.5" placeholder='Type "DELETE"' required />
              <button className="btn-danger py-1.5">Delete</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
