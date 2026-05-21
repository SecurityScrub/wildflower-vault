import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCancellationEmail } from "@/lib/email";
import { deleteCalendarEvent } from "@/lib/google-calendar";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: { include: { rentalItem: true } } },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "ADMIN" && booking.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(booking);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role !== "ADMIN" && booking.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status === "PAID" || booking.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Fully paid bookings cannot be cancelled online. Please contact us." },
      { status: 400 }
    );
  }

  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  // Cleanup calendar event
  if (booking.googleEventId) {
    deleteCalendarEvent(booking.googleEventId).catch(console.error);
  }

  // Send cancellation email
  const email = booking.guestEmail ?? "";
  const name = booking.guestName ?? "Customer";
  if (email) {
    sendCancellationEmail({
      to: email,
      name,
      bookingNumber: booking.bookingNumber,
      eventDate: booking.eventDate,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
