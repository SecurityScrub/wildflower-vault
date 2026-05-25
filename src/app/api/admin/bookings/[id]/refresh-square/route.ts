// Manual "pull payment status from Square" endpoint, used by the admin
// "Refresh from Square" button on the order detail panel. Useful when the
// webhook is delayed, misconfigured, or the signature key needs rotation.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSquareOrderPaymentSummary } from "@/lib/square";

function isAdmin(s: Session | null) {
  return (s?.user as { role?: string } | undefined)?.role === "ADMIN";
}

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, squareOrderId: true, totalAmount: true, status: true, paidAmount: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!booking.squareOrderId) {
    return NextResponse.json(
      { error: "This booking has no Square order — nothing to refresh." },
      { status: 400 },
    );
  }

  const summary = await getSquareOrderPaymentSummary(booking.squareOrderId);
  if (!summary) {
    return NextResponse.json(
      {
        error:
          "Couldn't reach Square or the order is no longer accessible. Check the SQUARE_ACCESS_TOKEN and SQUARE_ENVIRONMENT settings.",
      },
      { status: 502 },
    );
  }

  const newStatus = summary.isFullyPaid ? "PAID" : summary.paidAmount > 0 ? "DEPOSIT_PAID" : undefined;
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paidAmount: summary.paidAmount,
      ...(newStatus ? { status: newStatus } : {}),
    },
    select: { id: true, status: true, paidAmount: true, totalAmount: true },
  });

  return NextResponse.json({
    ok: true,
    booking: updated,
    summary,
  });
}
