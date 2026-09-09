import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyAndConfirm } from "@/lib/payments";

/** Called by the browser after Razorpay Checkout succeeds. Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const orderId = String(body.razorpay_order_id ?? ""), paymentId = String(body.razorpay_payment_id ?? ""), signature = String(body.razorpay_signature ?? "");
  if (!orderId || !paymentId || !signature) return NextResponse.json({ ok: false, error: "Missing payment fields" }, { status: 400 });
  const r = await verifyAndConfirm(orderId, paymentId, signature, user.id);
  if (!r.ok) return NextResponse.json(r, { status: r.status ?? 400 });
  return NextResponse.json({ ok: true, bookingId: r.bookingId, redirect: `/bookings/${r.bookingId}?new=1` });
}
