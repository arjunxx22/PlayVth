"use client";
import { useActionState, useState } from "react";
import { createBooking, type ActionState } from "@/lib/actions";
import { fmtINR } from "@/lib/time";
import { Alert } from "./ui";
import RazorpayCheckout from "./RazorpayCheckout";
import CountUp from "./motion/CountUp";
import { motion } from "motion/react";

export default function CheckoutForm(p: { courtId: number; date: string; hours: number[]; base: number; fee: number; maxKarma: number; userKarma: number; returnTo: string; online: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createBooking, {});
  const [karma, setKarma] = useState(0);
  const total = p.base + p.fee - karma;

  if (state.checkout) return <RazorpayCheckout checkout={state.checkout} />;

  return (
    <motion.form action={action} className="card p-5 space-y-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
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

      {p.online ? (
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">You&apos;ll pay securely via <b>Razorpay</b> (UPI, cards, net banking, wallets). Your slot is held for 10 minutes while you pay.</p>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <span className="text-2xl">🏟️</span>
          <div className="text-sm">
            <div className="font-bold text-brand-700">Pay at the venue</div>
            <p className="mt-0.5 text-brand-700/80">Nothing to pay now. Show your booking code at the counter and pay <b>{fmtINR(total)}</b> by cash, UPI or card before your slot.</p>
          </div>
        </div>
      )}

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>Court charges ({p.hours.length} hr)</dt><dd>{fmtINR(p.base)}</dd></div>
        {p.fee > 0 && <div className="flex justify-between"><dt>Convenience fee</dt><dd>{fmtINR(p.fee)}</dd></div>}
        {karma > 0 && <motion.div className="flex justify-between text-brand-700" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}><dt>Karma discount</dt><dd>−{fmtINR(karma)}</dd></motion.div>}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold"><dt>{p.online ? "Total payable" : "To pay at venue"}</dt><dd><CountUp to={total} prefix="₹" duration={0.4} animateOnMount={false} /></dd></div>
      </dl>
      <button className="btn-primary w-full" disabled={pending}>{pending ? (p.online ? "Opening secure payment…" : "Confirming…") : p.online ? `Pay ${fmtINR(total)} & confirm` : "Confirm booking"}</button>
    </motion.form>
  );
}
