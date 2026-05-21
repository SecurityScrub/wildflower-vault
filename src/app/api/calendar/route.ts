import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const from = new Date(searchParams.get("from") ?? new Date().toISOString());
  const to = new Date(searchParams.get("to") ?? addMonths(new Date(), 3).toISOString());

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "DEPOSIT_PAID", "PAID"] },
      eventDate: { gte: startOfDay(from), lte: to },
      ...(itemId ? { items: { some: { rentalItemId: itemId } } } : {}),
    },
    select: {
      eventDate: true,
      eventEndDate: true,
      items: { select: { rentalItemId: true } },
    },
  });

  const bookedDates = bookings.map((b) => ({
    date: b.eventDate.toISOString().split("T")[0],
    end: (b.eventEndDate ?? b.eventDate).toISOString().split("T")[0],
    itemIds: b.items.map((i) => i.rentalItemId),
  }));

  return NextResponse.json(bookedDates);
}
