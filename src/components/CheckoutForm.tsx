"use client";
import { useActionState, useState } from "react";
import { createBooking, type ActionState } from "@/lib/actions";
import { fmtINR } from "@/lib/time";
import { Alert } from "./ui";

export default function CheckoutForm(p: { courtId: number; date: string; hours: number[]; base: number; fee: number; maxKarma: number; userKarma: number; returnTo: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createBooking, {});
  const [karma, setKarma] = useState(0);
  const total = p.base + p.fee - karma;
  return (
    <form action={action} className="card p-5 space-y-5">
      <input type="hidden" name="court_id" value={p.courtId} />
      <input type="hidden" name="date" value={p.date} />
      <input type="hidden" name="hours" value={p.hours.join(",")} />
      <input type="hidden" name="return_to" value={p.returnTo} />
      <input type="hidden" name="karma" value={karma} />
      {state.error && <Alert kind="error">{state.error}</Alert>}

      <div>
        <div className="flex items-center justify-between"><label className="label mb-0" htmlFor="karma">Redeem Karma points</label><span className="text-xs text-slate-500">You have ⚡ {p.userKarma} · max {p.maxKarma} on this booking</span></div>
        <input id="karma" type="range" min={0} max={p.maxKarma} value={karma} onChange={(e) => setKarma(Number(e.target.value))} className="mt-2 w-full accent-brand-600" disabled={p.maxKarma === 0} />
        <div className="text-sm">Using <b>{karma}</b> Karma = −{fmtINR(karma)}</div>
      </div>

      <div>
        <label className="label">Payment method</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[["upi", "UPI"], ["card", "Card"], ["netbanking", "Net banking"], ["wallet", "Wallet"]].map(([v, l], i) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
              <input type="radio" name="payment" value={v} defaultChecked={i === 0} className="accent-brand-600" />{l}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-400">Demo mode: payment is simulated. Plug in Razorpay / PhonePe in production.</p>
      </div>

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>Court charges ({p.hours.length} hr)</dt><dd>{fmtINR(p.base)}</dd></div>
        <div className="flex justify-between"><dt>Convenience fee</dt><dd>{fmtINR(p.fee)}</dd></div>
        {karma > 0 && <div className="flex justify-between text-brand-700"><dt>Karma discount</dt><dd>−{fmtINR(karma)}</dd></div>}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold"><dt>Total payable</dt><dd>{fmtINR(total)}</dd></div>
      </dl>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Confirming…" : `Pay ${fmtINR(total)} & confirm`}</button>
    </form>
  );
}
