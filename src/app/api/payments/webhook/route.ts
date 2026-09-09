import { NextRequest, NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { bookingForWebhook, markBookingFailed, markBookingPaid } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/razorpay";

type Entity = { id?: string; order_id?: string; payment_id?: string; amount?: number; status?: string; method?: string; error_description?: string };
type WebhookBody = { event?: string; payload?: { payment?: { entity?: Entity }; refund?: { entity?: Entity } } };

/**
 * Razorpay webhook receiver. Configure in Dashboard → Settings → Webhooks with events
 * payment.captured, payment.failed, refund.processed, refund.failed and the same secret as RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let body: WebhookBody;
  try { body = JSON.parse(raw) as WebhookBody; } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const event = body.event ?? "";
  const eventId = req.headers.get("x-razorpay-event-id") ?? `${event}:${body.payload?.payment?.entity?.id ?? body.payload?.refund?.entity?.id ?? raw.length}`;

  // Razorpay retries deliveries; process each event id once.
  if (get("SELECT 1 FROM payment_events WHERE event_id = ?", eventId)) return NextResponse.json({ ok: true, duplicate: true });
  run("INSERT INTO payment_events(event_id, event_type, payload) VALUES (?, ?, ?)", eventId, event, raw);

  const payment = body.payload?.payment?.entity;
  const refund = body.payload?.refund?.entity;

  switch (event) {
    case "payment.captured":
    case "payment.authorized": {
      const b = bookingForWebhook(payment?.order_id, payment?.id);
      if (b && payment?.id && payment.amount === Math.round(b.total_amount * 100)) markBookingPaid(b.id, payment.id, payment.method);
      break;
    }
    case "payment.failed": {
      const b = bookingForWebhook(payment?.order_id, payment?.id);
      if (b) markBookingFailed(b.id);
      break;
    }
    case "refund.processed":
    case "refund.failed": {
      const b = bookingForWebhook(undefined, refund?.payment_id);
      if (b) run("UPDATE bookings SET razorpay_refund_id = COALESCE(razorpay_refund_id, ?), refund_status = ? WHERE id = ?",
        refund?.id ?? null, event === "refund.processed" ? "processed" : "failed", b.id);
      break;
    }
    default:
      break; // acknowledged but ignored
  }
  return NextResponse.json({ ok: true });
}
