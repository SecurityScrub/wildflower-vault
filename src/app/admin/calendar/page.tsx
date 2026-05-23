import { prisma } from "@/lib/prisma";
import { formatShortDate, formatCurrency } from "@/lib/utils";
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800 border-indigo-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
};

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month: monthStr, year: yearStr } = await searchParams;

  const now = new Date();
  const year = yearStr ? parseInt(yearStr) : now.getFullYear();
  const month = monthStr ? parseInt(monthStr) - 1 : now.getMonth();
  const currentMonth = new Date(year, month, 1);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  const bookings = await prisma.booking.findMany({
    where: {
      eventDate: { gte: start, lte: end },
      status: { not: "CANCELLED" },
    },
    include: {
      items: { include: { rentalItem: { select: { name: true } } } },
    },
    orderBy: { eventDate: "asc" },
  });

  const days = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start); // 0=Sun
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/calendar?month=${prevMonth.getMonth() + 1}&year=${prevMonth.getFullYear()}`}
            className="flex-1 sm:flex-none btn-secondary py-2 px-3 sm:px-4 text-xs text-center"
            aria-label="Previous month"
          >
            ←<span className="hidden sm:inline ml-1">Prev</span>
          </Link>
          <Link href="/admin/calendar" className="flex-1 sm:flex-none btn-secondary py-2 px-3 sm:px-4 text-xs text-center">
            Today
          </Link>
          <Link
            href={`/admin/calendar?month=${nextMonth.getMonth() + 1}&year=${nextMonth.getFullYear()}`}
            className="flex-1 sm:flex-none btn-secondary py-2 px-3 sm:px-4 text-xs text-center"
            aria-label="Next month"
          >
            <span className="hidden sm:inline mr-1">Next</span>→
          </Link>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="px-1 sm:px-3 py-2 font-sans text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 text-center">
              <span className="sm:hidden">{d.charAt(0)}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for alignment */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-50 min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 bg-gray-50/30" />
          ))}

          {days.map((day) => {
            const dayBookings = bookings.filter((b) => isSameDay(b.eventDate, day));
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`border-b border-r border-gray-100 min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 ${
                  isCurrentDay ? "bg-brand-orange-50" : ""
                }`}
              >
                <div
                  className={`font-sans text-xs sm:text-sm mb-0.5 sm:mb-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                    isCurrentDay
                      ? "bg-brand-orange-700 text-white font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {day.getDate()}
                </div>
                {/* On mobile: show a dot if any bookings exist */}
                {dayBookings.length > 0 && (
                  <div className="sm:hidden flex flex-wrap gap-0.5 mt-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          (STATUS_COLORS[b.status] ?? "bg-gray-400").split(" ")[0]
                        }`}
                      />
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="text-[9px] text-gray-400 leading-none">+{dayBookings.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="hidden sm:block space-y-1">
                  {dayBookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/orders?id=${b.id}`}
                      className={`block text-xs px-1.5 py-0.5 border rounded truncate hover:opacity-80 transition-opacity ${
                        STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                      title={`${b.guestName} – ${b.items.map((i) => i.rentalItem.name).join(", ")}`}
                    >
                      {b.guestName?.split(" ")[0]}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month list view */}
      <div className="bg-white">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-sans font-semibold text-xs sm:text-sm text-gray-700 uppercase tracking-wider">
            {bookings.length} Event{bookings.length !== 1 ? "s" : ""} This Month
          </h2>
        </div>
        {bookings.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No bookings this month.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/orders?id=${b.id}`}
                className="flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-semibold text-sm truncate">{b.guestName}</p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5 truncate">
                    {b.items.map((i) => i.rentalItem.name).join(", ")}
                    {b.venueName && ` · ${b.venueName}`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 shrink-0">
                  <span className="font-sans text-xs sm:text-sm text-brand-pink-600">
                    {formatShortDate(b.eventDate)}
                  </span>
                  <span className={`font-sans text-[10px] sm:text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[b.status] ?? ""}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
