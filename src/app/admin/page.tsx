import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { TrendingUp, Calendar, Clock, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export default async function AdminDashboard() {
  const now = new Date();

  const [
    totalBookings,
    pendingCount,
    confirmedCount,
    revenueResult,
    upcomingBookings,
    recentBookings,
    unreadInquiries,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "DEPOSIT_PAID", "PAID"] } } }),
    prisma.booking.aggregate({
      where: { status: { in: ["DEPOSIT_PAID", "PAID", "COMPLETED"] } },
      _sum: { paidAmount: true },
    }),
    prisma.booking.findMany({
      where: {
        eventDate: { gte: now },
        status: { in: ["CONFIRMED", "DEPOSIT_PAID", "PAID"] },
      },
      include: { items: { include: { rentalItem: { select: { name: true } } } } },
      orderBy: { eventDate: "asc" },
      take: 5,
    }),
    prisma.booking.findMany({
      include: {
        items: { include: { rentalItem: { select: { name: true } } } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.inquiry.count({ where: { isRead: false } }),
  ]);

  const revenue = Number(revenueResult._sum.paidAmount ?? 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {[
          { label: "Total Bookings", value: totalBookings.toString(), icon: <Calendar size={20} />, color: "text-blue-600" },
          { label: "Pending Review", value: pendingCount.toString(), icon: <Clock size={20} />, color: "text-yellow-600", href: "/admin/orders?status=PENDING" },
          { label: "Confirmed Events", value: confirmedCount.toString(), icon: <TrendingUp size={20} />, color: "text-green-600" },
          { label: "Revenue Collected", value: formatCurrency(revenue), icon: <DollarSign size={20} />, color: "text-brand-pink-600" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white p-4 sm:p-6 ${kpi.href ? "hover:shadow-md transition-shadow cursor-pointer" : ""}`}>
            {kpi.href ? (
              <Link href={kpi.href} className="block">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
                <p className={`font-serif text-2xl sm:text-3xl ${kpi.color}`}>{kpi.value}</p>
                <p className="font-sans text-[10px] sm:text-xs text-gray-400 mt-1 uppercase tracking-wider">{kpi.label}</p>
              </Link>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
                <p className={`font-serif text-2xl sm:text-3xl ${kpi.color}`}>{kpi.value}</p>
                <p className="font-sans text-[10px] sm:text-xs text-gray-400 mt-1 uppercase tracking-wider">{kpi.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {unreadInquiries > 0 && (
        <Link
          href="/admin/inquiries"
          className="flex items-center gap-3 bg-brand-pink-50 border border-brand-pink-200 p-4 text-sm text-brand-pink-800 hover:bg-brand-pink-100 transition-colors"
        >
          <span className="w-6 h-6 bg-brand-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {unreadInquiries}
          </span>
          unread {unreadInquiries === 1 ? "inquiry" : "inquiries"} waiting for your response →
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Upcoming events */}
        <div className="bg-white">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
            <h2 className="font-sans font-semibold text-xs sm:text-sm text-gray-700 uppercase tracking-wider">
              Upcoming Events
            </h2>
            <Link href="/admin/calendar" className="text-xs text-brand-orange-700 hover:underline">
              Calendar →
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">No upcoming events</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/orders?id=${b.id}`}
                  className="flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-medium text-brand-orange-700 truncate">
                      {b.guestName}
                    </p>
                    <p className="font-sans text-xs text-gray-400 mt-0.5 truncate">
                      {b.items.map((i) => i.rentalItem.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-sm font-semibold text-brand-pink-600">
                      {formatShortDate(b.eventDate)}
                    </p>
                    <span className={`font-sans text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? ""}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="bg-white">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
            <h2 className="font-sans font-semibold text-xs sm:text-sm text-gray-700 uppercase tracking-wider">
              Recent Bookings
            </h2>
            <Link href="/admin/orders" className="text-xs text-brand-orange-700 hover:underline">
              All orders →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm font-medium truncate">{b.guestName ?? b.user?.name}</p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5 truncate">
                    #{b.bookingNumber} · {formatShortDate(b.eventDate)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0">
                  <span className="font-sans text-sm text-brand-pink-600">
                    {formatCurrency(Number(b.totalAmount))}
                  </span>
                  <span className={`font-sans text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? ""}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
