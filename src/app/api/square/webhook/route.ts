import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSquareConfig } from "@/lib/settings";
import { verifyWebhookSignature } from "@/lib/square";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";
  const url = req.url;

  const config = await getSquareConfig();
  const isValid = await verifyWebhookSignature(body, signature, config.webhookKey, url);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type: string; data?: { object?: { payment?: { order_id?: string; status?: string; total_money?: { amount?: number } } } } };
  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "payment.completed") {
    const payment = event.data?.object?.payment;
    if (!payment?.order_id) return NextResponse.json({ ok: true });

    const booking = await prisma.booking.findFirst({
      where: { squareOrderId: payment.order_id },
    });

    if (booking) {
      const paidAmount = payment.total_money?.amount
        ? payment.total_money.amount / 100
        : 0;

      const isFullyPaid = paidAmount >= Number(booking.totalAmount);
      const newStatus = isFullyPaid ? "PAID" : "DEPOSIT_PAID";

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: newStatus,
          squarePaymentId: payment.order_id,
          paidAmount,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
