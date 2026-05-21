import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSquareOrder, createPaymentLink } from "@/lib/square";
import {
  sendBookingConfirmation,
  sendBookingNotificationToAdmin,
} from "@/lib/email";
import {
  createCalendarEvent,
} from "@/lib/google-calendar";
import { generateBookingNumber, formatCurrency } from "@/lib/utils";
import { z } from "zod";

const BookingSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  eventDate: z.string().min(1),
  eventType: z.string().optional(),
  venueName: z.string().min(1),
  venueAddress: z.string().min(1),
  venueCity: z.string().min(1),
  venueState: z.string().optional(),
  guestCount: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      rentalItemId: z.string(),
      quantity: z.number().int().min(1),
      price: z.number().positive(),
      name: z.string(),
    })
  ).min(1),
  totalAmount: z.number().positive(),
  depositAmount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json() as unknown;
    const data = BookingSchema.parse(body);

    const eventDate = new Date(data.eventDate + "T12:00:00");

    // Check for conflicts
    const conflicts = await prisma.booking.findMany({
      where: {
        eventDate: { gte: new Date(eventDate.toDateString()) },
        eventEndDate: { lte: new Date(eventDate.toDateString() + "T23:59:59") },
        status: { in: ["CONFIRMED", "DEPOSIT_PAID", "PAID"] },
        items: {
          some: {
            rentalItemId: { in: data.items.map((i) => i.rentalItemId) },
          },
        },
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "One or more items are already booked for that date." },
        { status: 409 }
      );
    }

    const bookingNumber = generateBookingNumber();

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId: session?.user
          ? (session.user as typeof session.user & { id: string }).id
          : undefined,
        guestEmail: data.email,
        guestName: data.name,
        guestPhone: data.phone,
        eventDate,
        eventType: data.eventType,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        venueCity: data.venueCity,
        venueState: data.venueState,
        guestCount: data.guestCount ? parseInt(data.guestCount) : undefined,
        notes: data.notes,
        totalAmount: data.totalAmount,
        depositAmount: data.depositAmount,
        status: "PENDING",
        items: {
          create: data.items.map((item) => ({
            rentalItemId: item.rentalItemId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
        },
      },
    });

    // Create Square order & payment link
    let checkoutUrl: string | undefined;
    try {
      const squareOrder = await createSquareOrder({
        referenceId: booking.id,
        lineItems: data.items.map((item) => ({
          name: item.name,
          quantity: item.quantity.toString(),
          basePriceMoney: {
            amount: BigInt(Math.round(item.price * 100)),
            currency: "USD",
          },
        })),
      });

      if (squareOrder?.id) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { squareOrderId: squareOrder.id },
        });

        const link = await createPaymentLink({
          orderId: squareOrder.id,
          redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/book/confirmation?id=${booking.id}`,
        });
        checkoutUrl = link?.url ?? undefined;
      }
    } catch (squareError) {
      console.error("Square error:", squareError);
      // Don't fail the booking if Square fails — admin can handle manually
    }

    // Send emails (non-blocking)
    Promise.all([
      sendBookingConfirmation({
        to: data.email,
        name: data.name,
        bookingNumber,
        eventDate,
        items: data.items.map((i) => i.name),
        total: formatCurrency(data.totalAmount),
        depositAmount: formatCurrency(data.depositAmount),
      }),
      sendBookingNotificationToAdmin({
        bookingNumber,
        guestName: data.name,
        guestEmail: data.email,
        eventDate,
        items: data.items.map((i) => i.name),
        total: formatCurrency(data.totalAmount),
      }),
    ]).catch(console.error);

    // Create Google Calendar event (non-blocking)
    createCalendarEvent({
      title: `[PENDING] ${data.name} – ${data.items.map((i) => i.name).join(", ")}`,
      description: `Booking #${bookingNumber}\n${data.email} · ${data.phone}\nVenue: ${data.venueName}, ${data.venueCity}`,
      startDate: eventDate,
      endDate: new Date(eventDate.getTime() + 8 * 60 * 60 * 1000),
      location: `${data.venueAddress}, ${data.venueCity}, ${data.venueState}`,
    })
      .then((eventId) => {
        if (eventId) {
          return prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: eventId },
          });
        }
      })
      .catch(console.error);

    return NextResponse.json({
      bookingId: booking.id,
      bookingNumber,
      checkoutUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data", details: error.errors }, { status: 400 });
    }
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as typeof session.user & { id: string }).id;
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: { items: { include: { rentalItem: true } } },
    orderBy: { eventDate: "desc" },
  });

  return NextResponse.json(bookings);
}
