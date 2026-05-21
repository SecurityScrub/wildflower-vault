import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Calendar, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: { items: { include: { rentalItem: { select: { name: true } } } } },
    orderBy: { eventDate: "asc" },
    take: 5,
  });

  const upcoming = bookings.filter(
    (b) => b.eventDate >= new Date() && b.status !== "CANCELLED"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-brand-orange-700">
          Welcome back{session?.user?.name ? `, ${session.user?.name?.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your bookings and account details
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5">
          <p className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-1">
            Upcoming Events
          </p>
          <p className="font-serif text-3xl text-brand-orange-700">{upcoming.length}</p>
        </div>
        <div className="bg-white p-5">
          <p className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-1">
            Total Bookings
          </p>
          <p className="font-serif text-3xl text-brand-orange-700">{bookings.length}</p>
        </div>
        <div className="bg-white p-5">
          <p className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-1">
            Next Event
          </p>
          <p className="font-serif text-lg text-brand-orange-700">
            {upcoming[0] ? formatShortDate(upcoming[0].eventDate) : "—"}
          </p>
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-serif text-xl text-brand-orange-700">Upcoming Bookings</h2>
          <Link
            href="/portal/bookings"
            className="font-sans text-xs text-brand-orange-700 hover:text-brand-pink-500 flex items-center gap-1"
          >
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={32} className="text-brand-orange-200 mx-auto mb-3" />
            <p className="font-sans text-sm text-gray-400 mb-4">No upcoming bookings</p>
            <Link href="/book" className="btn-primary text-xs py-2.5 px-6">
              Book a Rental
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcoming.map((booking) => (
              <div key={booking.id} className="p-6 flex items-start justify-between">
                <div>
                  <p className="font-sans font-semibold text-sm text-brand-orange-700">
                    {booking.items.map((i) => i.rentalItem.name).join(", ")}
                  </p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5">
                    {formatShortDate(booking.eventDate)}
                    {booking.venueName && ` · ${booking.venueName}`}
                  </p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5">
                    Ref: {booking.bookingNumber}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-sm font-medium text-brand-pink-600">
                    {formatCurrency(Number(booking.totalAmount))}
                  </span>
                  <span
                    className={`font-sans text-xs px-2.5 py-1 rounded-full ${
                      STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link href="/book" className="btn-primary">
          Book Another Rental
        </Link>
        <Link href="/inquiry" className="btn-secondary">
          Send Inquiry
        </Link>
      </div>
    </div>
  );
}
