"use client";
import { useActionState } from "react";
import { hostGame, type ActionState } from "@/lib/actions";
import { fmtHour } from "@/lib/time";
import { Alert } from "./ui";

type Opt = { id: number; name: string; icon?: string };
export default function HostGameForm(p: { sports: Opt[]; cities: Opt[]; venues: Opt[]; defaultCityId: number; defaultVenueId: number; defaultSportId: number; minDate: string; maxDate: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(hostGame, {});
  return (
    <form action={action} className="card mt-6 space-y-4 p-6">
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Sport</label>
          <select name="sport_id" className="input" defaultValue={p.defaultSportId || ""} required><option value="">Choose…</option>{p.sports.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select></div>
        <div><label className="label">City</label>
          <select name="city_id" className="input" defaultValue={p.defaultCityId}>{p.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label">Venue (optional)</label>
          <select name="venue_id" className="input" defaultValue={p.defaultVenueId || ""}><option value="">Other / my own place</option>{p.venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
        <div><label className="label">Location text</label><input name="location_text" className="input" placeholder="e.g. Cubbon Park north gate" /></div>
        <div><label className="label">Date</label><input type="date" name="date" className="input" min={p.minDate} max={p.maxDate} defaultValue={p.minDate} required /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Start</label><select name="start_hour" className="input" defaultValue={19}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{fmtHour(h)}</option>)}</select></div>
          <div><label className="label">Duration</label><select name="duration" className="input" defaultValue={1}>{[1, 2, 3, 4].map((d) => <option key={d} value={d}>{d} hr</option>)}</select></div>
        </div>
        <div><label className="label">Total players (incl. you)</label><input type="number" name="max_players" className="input" min={2} max={40} defaultValue={4} required /></div>
        <div><label className="label">Price per player (₹, 0 = free)</label><input type="number" name="price_per_player" className="input" min={0} defaultValue={0} /></div>
        <div className="sm:col-span-2"><label className="label">Skill level</label>
          <div className="flex flex-wrap gap-2">{[["any", "All levels"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]].map(([v, l], i) => (
            <label key={v} className="chip cursor-pointer border border-slate-200 has-[:checked]:bg-ink has-[:checked]:text-white"><input type="radio" name="skill_level" value={v} defaultChecked={i === 0} className="hidden" />{l}</label>))}</div></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea name="description" className="input" rows={3} maxLength={600} placeholder="Format, what to bring, how costs are split…" /></div>
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Publishing…" : "Publish game"}</button>
    </form>
  );
}
