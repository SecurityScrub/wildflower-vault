import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { z } from "zod";

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming") === "true";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = {
    ...(status ? { status: status as string } : {}),
    ...(upcoming ? { eventDate: { gte: new Date() } } : {}),
  };

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        items: { include: { rentalItem: { select: { name: true, images: true } } } },
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ eventDate: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / limit) });
}

const UpdateSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "DEPOSIT_PAID", "PAID", "CANCELLED", "REFUNDED", "COMPLETED"]).optional(),
  adminNotes: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as unknown;
  const { id, status, adminNotes } = UpdateSchema.parse(body);

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    },
  });

  // Sync calendar event title if status changed to confirmed
  if (status === "CONFIRMED" && booking.googleEventId) {
    updateCalendarEvent(booking.googleEventId, {
      title: `✓ ${booking.guestName} – Confirmed`,
    }).catch(console.error);
  }

  return NextResponse.json(booking);
}
