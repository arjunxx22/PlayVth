"use client";
import { useActionState } from "react";
import { retryPayment, type ActionState } from "@/lib/actions";
import { Alert } from "./ui";
import RazorpayCheckout from "./RazorpayCheckout";

export default function RetryPaymentButton({ bookingId }: { bookingId: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(retryPayment, {});
  if (state.checkout) return <RazorpayCheckout checkout={state.checkout} />;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <button className="btn-primary" disabled={pending}>{pending ? "Opening…" : "Complete payment"}</button>
    </form>
  );
}
