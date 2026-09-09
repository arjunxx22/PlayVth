"use client";
import { useActionState } from "react";
import { createVenue, type ActionState } from "@/lib/actions";
import { fmtHour } from "@/lib/time";
import { Alert } from "./ui";
type Opt = { id: number; name: string; icon?: string };
export default function VenueForm(p: { cities: Opt[]; sports: Opt[]; defaultCityId: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createVenue, {});
  const hours = Array.from({ length: 25 }, (_, h) => h);
  return (
    <form action={action} className="card mt-6 space-y-6 p-6">
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Venue name</label><input name="name" className="input" required minLength={3} /></div>
        <div><label className="label">City</label><select name="city_id" className="input" defaultValue={p.defaultCityId}>{p.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label">Area / locality</label><input name="area" className="input" required placeholder="e.g. Koramangala" /></div>
        <div className="sm:col-span-2"><label className="label">Full address</label><input name="address" className="input" required /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea name="description" className="input" rows={3} placeholder="Surface, lighting, rules…" /></div>
        <div className="sm:col-span-2"><label className="label">Amenities (comma separated)</label><input name="amenities" className="input" placeholder="Parking, Changing Room, Drinking Water, Floodlights" /></div>
        <div><label className="label">Opens at</label><select name="open_hour" className="input" defaultValue={6}>{hours.slice(0, 24).map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}</select></div>
        <div><label className="label">Closes at</label><select name="close_hour" className="input" defaultValue={23}>{hours.slice(1).map((h) => <option key={h} value={h}>{h === 24 ? "12:00 AM (midnight)" : fmtHour(h)}</option>)}</select></div>
        <div><label className="label">Free cancellation window (hours)</label><input type="number" name="free_cancel_hours" className="input" min={2} defaultValue={24} /></div>
        <div><label className="label">Cancellation fee (%)</label><input type="number" name="cancel_fee_pct" className="input" min={0} max={50} defaultValue={10} /></div>
      </div>
      <div>
        <label className="label">Courts &amp; hourly prices</label>
        <p className="mb-2 text-xs text-slate-500">Enter the number of courts for each sport you offer. Leave 0 for sports you don&apos;t have.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Sport</th><th className="px-3 py-2">Courts</th><th className="px-3 py-2">Weekday ₹/hr</th><th className="px-3 py-2">Weekend ₹/hr</th></tr></thead>
          <tbody>{p.sports.map((s) => (
            <tr key={s.id} className="border-t border-slate-100"><td className="px-3 py-2">{s.icon} {s.name}</td>
              <td className="px-3 py-2"><input type="number" name={`courts_${s.id}`} className="input w-20 py-1" min={0} max={20} defaultValue={0} /></td>
              <td className="px-3 py-2"><input type="number" name={`price_${s.id}`} className="input w-28 py-1" min={50} placeholder="500" /></td>
              <td className="px-3 py-2"><input type="number" name={`weekend_price_${s.id}`} className="input w-28 py-1" min={50} placeholder="same" /></td></tr>))}</tbody>
        </table></div>
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Creating…" : "Create venue listing"}</button>
    </form>
  );
}
