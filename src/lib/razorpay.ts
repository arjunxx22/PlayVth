// Thin Razorpay REST client. Uses fetch + node:crypto so there is no SDK dependency.
// Docs: https://razorpay.com/docs/api/orders/  https://razorpay.com/docs/api/refunds/  https://razorpay.com/docs/webhooks/
import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1";

export function razorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID || undefined;
}
export function isRazorpayEnabled(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
}

async function rzp<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { description?: string; code?: string } } & T;
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${json.error?.description ?? json.error?.code ?? res.status}`);
  return json;
}

export type RzpOrder = { id: string; amount: number; currency: string; receipt: string; status: string };
export type RzpPayment = { id: string; order_id: string; amount: number; status: string; method?: string; email?: string; contact?: string };
export type RzpRefund = { id: string; payment_id: string; amount: number; status: string };

/** amount is in INR; Razorpay wants paise. */
export function createOrder(amountInr: number, receipt: string, notes: Record<string, string>): Promise<RzpOrder> {
  return rzp<RzpOrder>("/orders", { amount: Math.round(amountInr * 100), currency: "INR", receipt, notes, payment_capture: 1 });
}
export function fetchPayment(paymentId: string): Promise<RzpPayment> {
  return rzp<RzpPayment>(`/payments/${paymentId}`);
}
/** Full refund when amountInr is omitted. */
export function createRefund(paymentId: string, amountInr: number | undefined, notes: Record<string, string>): Promise<RzpRefund> {
  return rzp<RzpRefund>(`/payments/${paymentId}/refund`, { ...(amountInr !== undefined ? { amount: Math.round(amountInr * 100) } : {}), speed: "normal", notes });
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex"), bb = Buffer.from(b, "hex");
  return ba.length > 0 && ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Checkout success handler returns (order_id, payment_id, signature); signature = HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhooks are signed with the webhook secret over the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
