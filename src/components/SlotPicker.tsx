"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Slot } from "@/lib/slots";
import { fmtHour, fmtINR } from "@/lib/time";

type CourtSlots = { id: number; name: string; slots: Slot[] };

export default function SlotPicker({ courts, date, returnTo }: { courts: CourtSlots[]; date: string; returnTo: string }) {
  const [courtId, setCourtId] = useState<number | null>(null);
  const [hours, setHours] = useState<number[]>([]);
  const court = courts.find((c) => c.id === courtId);

  function toggle(cid: number, h: number) {
    if (cid !== courtId) { setCourtId(cid); setHours([h]); return; }
    const set = new Set(hours);
    if (set.has(h)) {
      // Only allow removing from the ends so the selection stays contiguous.
      const sorted = [...set].sort((a, b) => a - b);
      if (h !== sorted[0] && h !== sorted[sorted.length - 1]) { setHours([h]); return; }
      set.delete(h);
    } else {
      const sorted = [...set].sort((a, b) => a - b);
      if (set.size && h !== sorted[0] - 1 && h !== sorted[sorted.length - 1] + 1) { setHours([h]); return; }
      if (set.size >= 4) return;
      set.add(h);
    }
    setHours([...set].sort((a, b) => a - b));
  }

  const total = useMemo(() => court ? hours.reduce((s, h) => s + (court.slots.find((x) => x.hour === h)?.price ?? 0), 0) : 0, [court, hours]);
  const allHours = courts[0]?.slots.map((s) => s.hour) ?? [];

  if (!courts.length) return <p className="text-slate-500">No courts for this sport.</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span><i className="inline-block h-3 w-3 rounded bg-white border border-slate-300 align-middle" /> Available</span>
        <span><i className="inline-block h-3 w-3 rounded bg-brand-600 align-middle" /> Selected</span>
        <span><i className="inline-block h-3 w-3 rounded bg-slate-200 align-middle" /> Booked / blocked</span>
        <span className="ml-auto">Prices per hour · select up to 4 consecutive hours</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold">Court</th>
              {allHours.map((h) => <th key={h} className="px-1 py-2 font-medium whitespace-nowrap">{fmtHour(h).replace(":00", "")}</th>)}</tr>
          </thead>
          <tbody>
            {courts.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 font-semibold whitespace-nowrap">{c.name}</td>
                {c.slots.map((s) => {
                  const selected = c.id === courtId && hours.includes(s.hour);
                  const disabled = s.status !== "available";
                  return (
                    <td key={s.hour} className="p-1">
                      <button type="button" disabled={disabled} onClick={() => toggle(c.id, s.hour)}
                        title={s.status === "available" ? `${fmtHour(s.hour)} · ${fmtINR(s.price)}` : s.status}
                        className={`h-10 w-14 rounded-md border text-[11px] font-medium transition
                          ${selected ? "bg-brand-600 border-brand-600 text-white" : disabled ? "bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-300 hover:border-brand-500 hover:bg-brand-50"}`}>
                        {disabled ? (s.status === "past" ? "–" : "✕") : `₹${s.price}`}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sticky bottom-0 mt-4 card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          {court && hours.length ? (
            <><b>{court.name}</b> · {fmtHour(hours[0])} – {fmtHour(hours[hours.length - 1] + 1)} · {hours.length} hr<div className="text-slate-500">Subtotal <b className="text-ink">{fmtINR(total)}</b> + convenience fee</div></>
          ) : <span className="text-slate-500">Select a slot to continue</span>}
        </div>
        {court && hours.length ? (
          <Link href={`/book?court=${court.id}&date=${date}&hours=${hours.join(",")}&return_to=${encodeURIComponent(returnTo)}`} className="btn-primary">Proceed to book →</Link>
        ) : <button className="btn-primary" disabled>Proceed to book →</button>}
      </div>
    </div>
  );
}
