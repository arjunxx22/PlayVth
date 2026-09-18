import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { bookingsForVenueDate, courtsForVenue, getVenueById, listSports, notificationsForVenue, ownerPhone, photosForVenue } from "@/lib/queries";
import { slotsForCourt } from "@/lib/slots";
import { addDays, fmtDate, fmtHour, fmtINR, isValidISODate, nowIST, todayISO } from "@/lib/time";
import { addOfflineBooking, blockSlot, deleteVenuePhoto, markPaidAtVenue, partnerCancelBooking, setCoverPhoto, unblockSlot, updatePricing, updateVenueSettings } from "@/lib/actions";
import { Alert } from "@/components/ui";
import PhotoUploader from "@/components/PhotoUploader";
import { MAX_PHOTOS_PER_VENUE } from "@/lib/uploads";
import { photoUrl } from "@/lib/photo-url";
import { isWhatsAppEnabled } from "@/lib/notify";

export const metadata: Metadata = { title: "Manage venue" };

const TABS = [["schedule", "Schedule"], ["pricing", "Pricing"], ["photos", "Photos"], ["alerts", "Alerts"]] as const;

export default async function ManageVenue({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string; tab?: string; error?: string; saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/partner");
  const v = getVenueById(Number(id));
  if (!v || v.owner_user_id !== user.id) notFound();
  const today = todayISO();
  const date = sp.date && isValidISODate(sp.date) ? sp.date : today;
  const tab = (TABS.find(([t]) => t === sp.tab)?.[0] ?? "schedule") as (typeof TABS)[number][0];
  const courts = courtsForVenue(v.id);
  const sports = listSports();
  const bookings = bookingsForVenueDate(v.id, date);
  const blocks = all<{ id: number; court_id: number; start_hour: number; end_hour: number; reason: string }>(
    "SELECT b.* FROM blocked_slots b JOIN courts c ON c.id = b.court_id WHERE c.venue_id = ? AND b.date = ? ORDER BY b.start_hour", v.id, date);
  const grid = courts.map((c) => ({ court: c, slots: slotsForCourt(c.id, date, v.open_hour, v.close_hour) }));
  const pricing = all<{ court_id: number; day_type: string; start_hour: number; end_hour: number; price: number }>(
    "SELECT pr.court_id, pr.day_type, pr.start_hour, pr.end_hour, pr.price FROM pricing_rules pr JOIN courts c ON c.id = pr.court_id WHERE c.venue_id = ? ORDER BY pr.court_id, pr.day_type, pr.start_hour", v.id);
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const revenue = confirmed.reduce((s, b) => s + b.base_amount, 0);
  const toCollect = confirmed.filter((b) => b.payment_provider !== "razorpay" && !b.paid_at).reduce((s, b) => s + b.total_amount, 0);
  const hoursOfDay = grid[0]?.slots.map((s) => s.hour) ?? [];
  const now = nowIST();
  const defaultStart = date === today ? Math.min(v.close_hour - 1, Math.max(v.open_hour, now.hour)) : Math.max(v.open_hour, 18);
  const photos = photosForVenue(v.id);
  const notifications = tab === "alerts" ? notificationsForVenue(v.id) : [];
  const sourceChip = (src: string) => src === "walk_in" ? <span className="chip bg-violet-100 text-violet-800">Walk-in</span> : src === "phone" ? <span className="chip bg-sky-100 text-sky-800">Phone</span> : <span className="chip bg-brand-100 text-brand-700">Online</span>;

  return (
    <div className="container-x py-8">
      <Link href="/partner" className="text-sm text-slate-500">← Dashboard</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">{v.name}</h1><p className="text-slate-500">{v.area}, {v.city_name} · <Link href={`/venues/${v.slug}`} className="text-brand-700 font-semibold">View public page</Link></p></div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {TABS.map(([t, l]) => <Link key={t} href={`/partner/venues/${v.id}?tab=${t}${t === "schedule" ? `&date=${date}` : ""}`} className={`rounded-lg px-3 py-1.5 ${tab === t ? "bg-white shadow-sm" : "text-slate-500"}`}>{l}{t === "photos" && photos.length === 0 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />}</Link>)}
        </div>
      </div>
      {sp.error && <div className="mt-4"><Alert kind="error">{sp.error}</Alert></div>}
      {sp.saved && <div className="mt-4"><Alert kind="success">Saved.</Alert></div>}

      {tab === "schedule" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((d) => (
              <Link key={d} href={`/partner/venues/${v.id}?date=${d}`} className={`chip border ${d === date ? "bg-ink text-white border-ink" : "bg-white border-slate-200"}`}>{d === today ? "Today" : fmtDate(d)}</Link>))}
            <form className="flex items-center gap-1"><input type="date" name="date" defaultValue={date} className="input py-1" /><button className="btn-secondary py-1">Go</button></form>
            <span className="ml-auto text-sm">Revenue {fmtDate(date)}: <b>{fmtINR(revenue)}</b> · {confirmed.length} bookings{toCollect > 0 && <> · <span className="chip bg-amber-100 text-amber-800">{fmtINR(toCollect)} to collect</span></>}</span>
          </div>

          <div className="card overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="sticky left-0 bg-slate-50 px-3 py-2 text-left">Court</th>{hoursOfDay.map((h) => <th key={h} className="px-1 py-2 font-medium">{fmtHour(h).replace(":00", "")}</th>)}</tr></thead>
              <tbody>{grid.map(({ court, slots }) => (
                <tr key={court.id} className="border-t border-slate-100"><td className="sticky left-0 bg-white px-3 py-2 font-semibold whitespace-nowrap">{court.name}</td>
                  {slots.map((s) => {
                    const bk = confirmed.find((b) => b.court_id === court.id && b.start_hour <= s.hour && b.end_hour > s.hour);
                    const cls = bk ? (bk.source === "online" ? "bg-brand-600 text-white" : "bg-violet-500 text-white") : s.status === "blocked" ? "bg-amber-300 text-amber-900" : s.status === "past" ? "bg-slate-100 text-slate-300" : "bg-white border border-slate-200";
                    const label = bk ? (bk.guest_name ?? bk.user_name ?? "B").slice(0, 3) : s.status === "blocked" ? "▮" : "";
                    return <td key={s.hour} className="p-0.5"><div title={bk ? `${bk.guest_name ?? bk.user_name ?? bk.user_phone} · ${bk.code} · ${bk.source}` : s.status} className={`h-9 w-12 rounded-md grid place-items-center ${cls}`}>{label}</div></td>;
                  })}</tr>))}</tbody>
            </table>
            <div className="flex flex-wrap gap-4 px-3 py-2 text-xs text-slate-500"><span><i className="inline-block h-3 w-3 rounded bg-brand-600 align-middle" /> Online booking</span><span><i className="inline-block h-3 w-3 rounded bg-violet-500 align-middle" /> Walk-in / phone</span><span><i className="inline-block h-3 w-3 rounded bg-amber-300 align-middle" /> Blocked</span><span><i className="inline-block h-3 w-3 rounded border border-slate-300 align-middle" /> Open</span></div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="card p-5 lg:col-span-3">
              <h2 className="font-bold">Bookings on {fmtDate(date, { weekday: "long", day: "numeric", month: "long" })}</h2>
              {bookings.length === 0 && <p className="mt-2 text-sm text-slate-500">No bookings yet. Add walk-ins and phone bookings on the right so the schedule stays complete.</p>}
              <ul className="mt-3 divide-y divide-slate-100 text-sm">{bookings.map((b) => (
                <li key={b.id} className="flex items-start gap-3 py-2">
                  <div className="flex-1">
                    <div className="font-semibold">{fmtHour(b.start_hour)} – {fmtHour(b.end_hour)} · {b.court_name} {sourceChip(b.source)}</div>
                    <div className="text-slate-500">{b.guest_name ?? b.user_name ?? "Player"}{b.guest_phone_display ? ` · +91 ${b.guest_phone_display}` : ""} · {b.code}{b.note ? ` · ${b.note}` : ""}</div>
                    {b.status === "confirmed" && (b.payment_provider === "razorpay" ? <span className="chip bg-brand-100 text-brand-700">Paid online · {fmtINR(b.total_amount)}</span>
                      : b.paid_at ? <span className="chip bg-brand-100 text-brand-700">Collected {fmtINR(b.total_amount)} ✓ {b.payment_method !== "pay_at_venue" ? b.payment_method.toUpperCase() : ""}</span>
                      : <span className="chip bg-amber-100 text-amber-800">Collect {fmtINR(b.total_amount)} at counter{b.karma_redeemed ? ` (${b.karma_redeemed} Karma applied)` : ""}</span>)}
                  </div>
                  {b.status === "confirmed" ? (
                    <div className="flex flex-col items-end gap-1">
                      {b.payment_provider !== "razorpay" && (
                        <form action={markPaidAtVenue} className="flex items-center gap-1"><input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="booking_id" value={b.id} />
                          {b.paid_at ? <button className="btn-ghost py-1 text-xs">Undo paid</button> : <><select name="method" className="input w-24 py-1 text-xs" defaultValue="cash"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option></select><button className="btn-primary py-1 text-xs">Mark paid</button></>}
                        </form>)}
                      <form action={partnerCancelBooking}><input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="booking_id" value={b.id} /><button className="btn-ghost py-1 text-xs text-rose-600">{b.payment_provider === "razorpay" ? "Cancel & refund" : "Cancel booking"}</button></form>
                    </div>
                  ) : <span className="chip bg-slate-200">cancelled</span>}
                </li>))}</ul>
            </section>

            <div className="space-y-6 lg:col-span-2">
              <section className="card p-5">
                <h2 className="font-bold">Add walk-in or phone booking</h2>
                <p className="text-xs text-slate-500">Keeps offline bookings on the same grid so online customers never double-book.</p>
                <form action={addOfflineBooking} className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="date" value={date} />
                  <div className="col-span-2"><label className="label">Court</label><select name="court_id" className="input">{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="label">Start</label><select name="start_hour" className="input" defaultValue={defaultStart}>{hoursOfDay.map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}</select></div>
                  <div><label className="label">Duration</label><select name="duration" className="input" defaultValue={1}>{[1, 2, 3, 4].map((d) => <option key={d} value={d}>{d} hr</option>)}</select></div>
                  <div><label className="label">Customer name</label><input name="guest_name" className="input" placeholder="Walk-in" /></div>
                  <div><label className="label">Phone (optional)</label><input name="guest_phone" className="input" inputMode="numeric" placeholder="98765 43210" /></div>
                  <div><label className="label">Amount (₹, blank = list price)</label><input name="amount" type="number" min={0} className="input" placeholder="auto" /></div>
                  <div><label className="label">Source</label><select name="source" className="input" defaultValue="walk_in"><option value="walk_in">Walk-in</option><option value="phone">Phone</option></select></div>
                  <div className="col-span-2 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <label className="flex items-center gap-2"><input type="checkbox" name="paid" value="1" className="accent-brand-600" /> Paid now</label>
                    <select name="method" className="input w-24 py-1"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option></select>
                  </div>
                  <div className="col-span-2"><label className="label">Note (optional)</label><input name="note" className="input" placeholder="e.g. regular Tuesday group" maxLength={200} /></div>
                  <button className="btn-primary col-span-2">Add booking</button>
                </form>
              </section>
              <section className="card p-5">
                <h2 className="font-bold">Block a slot</h2>
                <p className="text-xs text-slate-500">For maintenance or coaching batches.</p>
                <form action={blockSlot} className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="date" value={date} />
                  <div className="col-span-2"><label className="label">Court</label><select name="court_id" className="input">{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="label">From</label><select name="start_hour" className="input" defaultValue={v.open_hour}>{hoursOfDay.map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}</select></div>
                  <div><label className="label">To</label><select name="end_hour" className="input" defaultValue={v.open_hour + 1}>{hoursOfDay.map((h) => <option key={h + 1} value={h + 1}>{fmtHour(h + 1)}</option>)}</select></div>
                  <div className="col-span-2"><label className="label">Reason</label><input name="reason" className="input" placeholder="Maintenance" /></div>
                  <button className="btn-secondary col-span-2">Block slot</button>
                </form>
                {blocks.length > 0 && <ul className="mt-4 space-y-1 text-sm">{blocks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5"><span>{courts.find((c) => c.id === b.court_id)?.name}: {fmtHour(b.start_hour)} – {fmtHour(b.end_hour)} · {b.reason}</span>
                    <form action={unblockSlot}><input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="block_id" value={b.id} /><input type="hidden" name="date" value={date} /><button className="text-xs font-semibold text-rose-600">Unblock</button></form></li>))}</ul>}
              </section>
            </div>
          </div>
        </div>
      )}

      {tab === "pricing" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {courts.map((c) => {
            const rules = pricing.filter((p) => p.court_id === c.id);
            const wd = rules.find((r) => r.day_type === "weekday" && r.start_hour === 0)?.price ?? rules[0]?.price ?? 0;
            const peak = rules.find((r) => r.day_type === "weekday" && r.start_hour === 18)?.price ?? wd;
            const we = rules.find((r) => r.day_type === "weekend")?.price ?? wd;
            return (
              <form key={c.id} action={updatePricing} className="card p-5">
                <input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="court_id" value={c.id} />
                <h3 className="font-bold">{sports.find((s) => s.id === c.sport_id)?.icon} {c.name}</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><label className="label">Weekday</label><input type="number" name="weekday" className="input" defaultValue={wd} min={0} /></div>
                  <div><label className="label">Weekday peak (6–10 PM)</label><input type="number" name="weekday_peak" className="input" defaultValue={peak} min={0} /></div>
                  <div><label className="label">Weekend</label><input type="number" name="weekend" className="input" defaultValue={we} min={0} /></div>
                </div>
                <button className="btn-secondary mt-3">Save prices</button>
              </form>);
          })}
        </div>
      )}

      {tab === "photos" && (
        <div className="mt-6 space-y-6">
          <section className="card p-5">
            <h2 className="font-bold">Venue photos</h2>
            <p className="mt-1 text-sm text-slate-500">Venues with photos get far more bookings. The cover photo shows on search results and at the top of your page.</p>
            <div className="mt-4"><PhotoUploader venueId={v.id} remaining={MAX_PHOTOS_PER_VENUE - photos.length} /></div>
          </section>
          {photos.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {photos.map((p) => {
                const isCover = (v.cover_photo_id ?? photos[0].id) === p.id;
                return (
                  <div key={p.id} className={`card overflow-hidden ${isCover ? "ring-2 ring-brand-500" : ""}`}>
                    <img src={photoUrl(p.thumb)} alt="" className="h-40 w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 p-2 text-xs">
                      {isCover ? <span className="chip bg-brand-100 text-brand-700">Cover</span> : <form action={setCoverPhoto}><input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="photo_id" value={p.id} /><button className="btn-ghost py-1 text-xs">Set as cover</button></form>}
                      <form action={deleteVenuePhoto}><input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="photo_id" value={p.id} /><button className="btn-ghost py-1 text-xs text-rose-600">Delete</button></form>
                    </div>
                  </div>);
              })}
            </div>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="card p-5">
            <h2 className="font-bold">WhatsApp alerts</h2>
            <p className="mt-1 text-sm text-slate-500">Every new booking and cancellation is sent to this number. Defaults to the owner&apos;s login number.</p>
            <form action={updateVenueSettings} className="mt-3 space-y-2 text-sm">
              <input type="hidden" name="venue_id" value={v.id} />
              <label className="label" htmlFor="alert_phone">WhatsApp number</label>
              <input id="alert_phone" name="alert_phone" className="input" defaultValue={v.alert_phone ?? ""} placeholder={`Default: ${ownerPhone(v.id) ?? ""}`} inputMode="tel" />
              <button className="btn-primary">Save</button>
            </form>
            <div className={`mt-4 rounded-lg px-3 py-2 text-xs ${isWhatsAppEnabled() ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-800"}`}>
              {isWhatsAppEnabled() ? "WhatsApp delivery is on." : "WhatsApp delivery is not configured yet: alerts are recorded here but not sent. The app owner needs to set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID."}
            </div>
          </section>
          <section className="card p-5 lg:col-span-2">
            <h2 className="font-bold">Recent alerts</h2>
            {notifications.length === 0 && <p className="mt-2 text-sm text-slate-500">No alerts yet. They appear here as bookings come in.</p>}
            <ul className="mt-3 divide-y divide-slate-100 text-sm">{notifications.map((n) => (
              <li key={n.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className={`chip ${n.status === "sent" ? "bg-brand-100 text-brand-700" : n.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"}`}>{n.status}</span>
                  <span>{n.audience === "venue" ? "To venue" : "To customer"} · +{n.recipient}</span><span>· {n.created_at} UTC</span>{n.error && <span className="text-rose-600">· {n.error}</span>}
                </div>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-slate-700">{n.body}</pre>
              </li>))}</ul>
          </section>
        </div>
      )}
    </div>
  );
}
