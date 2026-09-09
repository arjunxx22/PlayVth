"use client";
import { useActionState } from "react";
import { sendOtp, verifyOtp, type ActionState } from "@/lib/actions";
import { Alert } from "./ui";

export default function LoginForm({ next }: { next: string }) {
  const [sent, sendAction, sending] = useActionState<ActionState, FormData>(sendOtp, {});
  const [verified, verifyAction, verifying] = useActionState<ActionState, FormData>(verifyOtp, {});
  const phone = verified.phone ?? sent.phone;
  const otpStage = !!(sent.otpSent || verified.otpSent);

  if (!otpStage) {
    return (
      <form action={sendAction} className="mt-6 space-y-4">
        {sent.error && <Alert kind="error">{sent.error}</Alert>}
        <div>
          <label className="label" htmlFor="phone">Mobile number</label>
          <div className="flex gap-2">
            <span className="input w-20 text-center bg-slate-50">+91</span>
            <input id="phone" name="phone" className="input" inputMode="numeric" placeholder="98765 43210" autoFocus required />
          </div>
        </div>
        <button className="btn-primary w-full" disabled={sending}>{sending ? "Sending…" : "Send OTP"}</button>
      </form>
    );
  }
  return (
    <form action={verifyAction} className="mt-6 space-y-4">
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="next" value={next} />
      {verified.error && <Alert kind="error">{verified.error}</Alert>}
      <Alert kind="success">OTP sent to +91 {phone}.{sent.devOtp && <> Demo OTP: <b>{sent.devOtp}</b></>}</Alert>
      <div>
        <label className="label" htmlFor="otp">Enter OTP</label>
        <input id="otp" name="otp" className="input tracking-[0.5em] text-center text-lg" inputMode="numeric" maxLength={6} autoFocus required />
      </div>
      <button className="btn-primary w-full" disabled={verifying}>{verifying ? "Verifying…" : "Verify & continue"}</button>
    </form>
  );
}
