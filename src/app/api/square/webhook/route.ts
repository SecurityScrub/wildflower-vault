// Square webhook receiver.
//
// We subscribe to payment.created + payment.updated for the location's
// payment events. Square also fires order.* events but those don't carry
// payment status. The handler looks up the booking by squareOrderId, asks
// the Orders API for the canonical paid amount (more reliable than
// re-implementing payment math from event payloads), and writes the new
// status into our DB.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSquareConfig } from "@/lib/settings";
import {
  verifyWebhookSignature,
  getSquareOrderPaymentSummary,
} from "@/lib/square";

interface SquarePaymentEvent {
  type?: string;
  data?: {
    object?: {
      payment?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";
  const url = req.url;

  const config = await getSquareConfig();
  if (!config.webhookKey) {
    console.warn("[square/webhook] SQUARE_WEBHOOK_SIGNATURE_KEY not configured; rejecting delivery");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const isValid = await verifyWebhookSignature(body, signature, config.webhookKey, url);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: SquarePaymentEvent;
  try {
    event = JSON.parse(body) as SquarePaymentEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only react to payment lifecycle events.
  if (event.type !== "payment.created" && event.type !== "payment.updated") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const payment = event.data?.object?.payment;
  const orderId = payment?.order_id;
  if (!orderId) return NextResponse.json({ ok: true });

  const booking = await prisma.booking.findFirst({
    where: { squareOrderId: orderId },
    select: { id: true, totalAmount: true },
  });
  if (!booking) {
    // Could be an unrelated payment in the same Square account — not an error.
    return NextResponse.json({ ok: true, matched: false });
  }

  const summary = await getSquareOrderPaymentSummary(orderId);
  if (!summary) {
    console.error("[square/webhook] order lookup failed", { orderId });
    return NextResponse.json({ ok: false, error: "order lookup failed" }, { status: 502 });
  }

  const newStatus = summary.isFullyPaid ? "PAID" : summary.paidAmount > 0 ? "DEPOSIT_PAID" : undefined;
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paidAmount: summary.paidAmount,
      ...(newStatus ? { status: newStatus } : {}),
      ...(payment?.id ? { squarePaymentId: payment.id } : {}),
    },
  });

  return NextResponse.json({ ok: true, bookingId: booking.id, status: newStatus, paid: summary.paidAmount });
}
