import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const booking = id
    ? await prisma.booking.findUnique({
        where: { id },
        include: { items: { include: { rentalItem: { select: { name: true } } } } },
      })
    : null;

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        <div className="w-20 h-20 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-brand-orange-700" />
        </div>

        <h1 className="font-serif text-4xl text-brand-orange-700 mb-3">
          {booking ? "Booking Received!" : "Thank You!"}
        </h1>

        {booking ? (
          <>
            <p className="text-gray-500 font-sans text-sm mb-8 leading-relaxed">
              Your booking has been submitted. We&apos;ll confirm availability and send you a
              follow-up within 24 hours. A confirmation email has been sent to{" "}
              <strong>{booking.guestEmail}</strong>.
            </p>

            <div className="bg-white p-6 text-left mb-8">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="font-sans text-xs text-gray-400 tracking-wider uppercase">Booking Reference</p>
                  <p className="font-serif text-2xl text-brand-orange-700 mt-1">{booking.bookingNumber}</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 font-sans text-xs px-2.5 py-1 rounded-full">
                  {booking.status}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Event Date</span>
                  <span className="font-medium">{formatDate(booking.eventDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Items</span>
                  <span className="font-medium">{booking.items.map((i) => i.rentalItem.name).join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="font-semibold text-brand-pink-600">{formatCurrency(Number(booking.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deposit</span>
                  <span className="font-semibold">{formatCurrency(Number(booking.depositAmount ?? 0))}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500 font-sans text-sm mb-8">
            Your booking has been submitted. Check your email for confirmation details.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/portal" className="btn-primary">
            View My Bookings
          </Link>
          <Link href="/rentals" className="btn-secondary">
            Browse More Rentals
          </Link>
        </div>
      </div>
    </div>
  );
}
