"use client";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RazorpayCheckout as CheckoutData } from "@/lib/actions";
import { fmtINR } from "@/lib/time";
import { Alert } from "./ui";

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global { interface Window { Razorpay?: new (opts: Record<string, unknown>) => RzpInstance } }

/** Opens Razorpay Standard Checkout for a pending booking and verifies the result with our server. */
export default function RazorpayCheckout({ checkout }: { checkout: CheckoutData }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "open" | "verifying" | "error" | "dismissed">("idle");
  const [message, setMessage] = useState("");
  const opened = useRef(false);

  const open = useCallback(() => {
    if (!window.Razorpay) { setStatus("error"); setMessage("Payment library failed to load. Check your connection and retry."); return; }
    setStatus("open");
    const rzp = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: "PlayVth",
      description: checkout.description,
      order_id: checkout.orderId,
      prefill: { name: checkout.name, contact: checkout.phone, email: checkout.email },
      notes: { booking: checkout.code },
      theme: { color: "#059669" },
      modal: { ondismiss: () => setStatus("dismissed") },
      handler: async (r: RzpResponse) => {
        setStatus("verifying");
        try {
          const res = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
          const j = (await res.json()) as { ok: boolean; redirect?: string; error?: string };
          if (j.ok && j.redirect) { router.push(j.redirect); return; }
          setStatus("error"); setMessage(j.error ?? "We could not verify the payment. If money was deducted it will be reconciled automatically.");
        } catch {
          setStatus("error"); setMessage("Network error while confirming. If money was deducted, your booking will be confirmed automatically within a few minutes.");
        }
      },
    });
    rzp.on("payment.failed", (r) => { setStatus("error"); setMessage(r.error?.description ?? "Payment failed. You can try again."); });
    rzp.open();
  }, [checkout, router]);

  useEffect(() => {
    if (ready && !opened.current) { opened.current = true; open(); }
  }, [ready, open]);

  return (
    <div className="card p-5 space-y-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => { setStatus("error"); setMessage("Could not load Razorpay Checkout."); }} />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking {checkout.code}</div>
        <div className="text-2xl font-extrabold">{fmtINR(checkout.amount / 100)}</div>
        <p className="text-sm text-slate-600">{checkout.description}</p>
      </div>
      {status === "idle" && <Alert kind="info">Loading secure payment…</Alert>}
      {status === "open" && <Alert kind="info">Complete the payment in the Razorpay window. Your slot is held for 10 minutes.</Alert>}
      {status === "verifying" && <Alert kind="info">Payment received, confirming your booking…</Alert>}
      {status === "dismissed" && <Alert kind="info">Payment window closed. Your slot is still held for a few minutes.</Alert>}
      {status === "error" && <Alert kind="error">{message}</Alert>}
      {(status === "dismissed" || status === "error") && (
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={open} disabled={!ready}>Retry payment</button>
          <a href={`/bookings/${checkout.bookingId}`} className="btn-secondary">View booking</a>
        </div>
      )}
    </div>
  );
}
