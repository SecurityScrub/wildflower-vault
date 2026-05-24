import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from "date-fns";
import Link from "next/link";
import { expandTimeOffForRange } from "@/lib/time-off";

export const dynamic = "force-dynamic";

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800 border-indigo-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
};

const CONSULTATION_COLOR = "bg-brand-pink-100 text-brand-pink-800 border-brand-pink-200";
const TIMEOFF_COLOR = "bg-gray-200 text-gray-700 border-gray-300";

type CalendarItem = {
  kind: "booking" | "consultation" | "timeoff";
  id: string;
  when: Date;
  title: string;
  subtitle: string;
  href: string;
  statusLabel: string;
  colorClass: string;
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

  const [bookings, consultations, timeOffRows] = await Promise.all([
    prisma.booking.findMany({
      where: {
        eventDate: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      include: {
        items: { include: { rentalItem: { select: { name: true } } } },
      },
      orderBy: { eventDate: "asc" },
    }),
    prisma.consultation.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        status: { notIn: ["CANCELLED"] },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.timeOff.findMany({
      where: {
        OR: [
          { recurrence: "NONE", startAt: { lte: end }, endAt: { gte: start } },
          {
            recurrence: "WEEKLY",
            startAt: { lte: end },
            OR: [{ recurUntil: null }, { recurUntil: { gte: start } }],
          },
        ],
      },
    }),
  ]);

  const timeOffBlocks = expandTimeOffForRange(timeOffRows, start, end);

  const items: CalendarItem[] = [
    ...bookings.map<CalendarItem>((b) => ({
      kind: "booking",
      id: b.id,
      when: b.eventDate,
      title: b.guestName ?? "Booking",
      subtitle: [b.items.map((i) => i.rentalItem.name).join(", "), b.venueName]
        .filter(Boolean)
        .join(" · "),
      href: `/admin/orders?id=${b.id}`,
      statusLabel: b.status.replace("_", " "),
      colorClass: BOOKING_STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-800 border-gray-200",
    })),
    ...consultations.map<CalendarItem>((c) => ({
      kind: "consultation",
      id: c.id,
      when: c.scheduledAt,
      title: `${c.name} (consult)`,
      subtitle: [`${c.durationMin} min`, c.location].filter(Boolean).join(" · "),
      href: c.leadId
        ? `/admin/wedding-planning-leads/${c.leadId}`
        : "/admin/consultations",
      statusLabel: "Consult",
      colorClass: CONSULTATION_COLOR,
    })),
    ...timeOffBlocks.map<CalendarItem>((t) => ({
      kind: "timeoff" as const,
      id: t.id,
      when: t.start,
      title: t.reason ?? "Time off",
      subtitle: t.allDay
        ? `All day${t.recurring ? " · weekly" : ""}`
        : `${t.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${t.end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}${t.recurring ? " · weekly" : ""}`,
      href: "/admin/time-off",
      statusLabel: "Off",
      colorClass: TIMEOFF_COLOR,
    })),
  ].sort((a, b) => a.when.getTime() - b.when.getTime());

  const days = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start);
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

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs font-sans">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-blue-200 bg-blue-100 text-blue-800">
          <span className="w-2 h-2 rounded-full bg-blue-400" /> Bookings
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-brand-pink-200 bg-brand-pink-100 text-brand-pink-800">
          <span className="w-2 h-2 rounded-full bg-brand-pink-500" /> Consultations
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-300 bg-gray-200 text-gray-700">
          <span className="w-2 h-2 rounded-full bg-gray-500" /> Time off
        </span>
      </div>

      {/* Calendar grid */}
      <div className="bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="px-1 sm:px-3 py-2 font-sans text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 text-center">
              <span className="sm:hidden">{d.charAt(0)}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-50 min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 bg-gray-50/30" />
          ))}

          {days.map((day) => {
            const dayItems = items.filter((it) => isSameDay(it.when, day));
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
                {dayItems.length > 0 && (
                  <div className="sm:hidden flex flex-wrap gap-0.5 mt-0.5">
                    {dayItems.slice(0, 3).map((it) => (
                      <span
                        key={it.id}
                        className={`w-1.5 h-1.5 rounded-full ${it.colorClass.split(" ")[0]}`}
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <span className="text-[9px] text-gray-400 leading-none">+{dayItems.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="hidden sm:block space-y-1">
                  {dayItems.map((it) => (
                    <Link
                      key={it.id}
                      href={it.href}
                      className={`block text-xs px-1.5 py-0.5 border rounded truncate hover:opacity-80 transition-opacity ${it.colorClass}`}
                      title={`${it.title} – ${it.subtitle}`}
                    >
                      {it.title.split(" ")[0]}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month list */}
      <div className="bg-white">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-sans font-semibold text-xs sm:text-sm text-gray-700 uppercase tracking-wider">
            {items.length} Event{items.length !== 1 ? "s" : ""} This Month
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Nothing on the calendar this month.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((it) => (
              <Link
                key={`${it.kind}-${it.id}`}
                href={it.href}
                className="flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-semibold text-sm truncate">{it.title}</p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5 truncate">{it.subtitle}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 shrink-0">
                  <span className="font-sans text-xs sm:text-sm text-brand-pink-600">
                    {formatShortDate(it.when)}
                  </span>
                  <span className={`font-sans text-[10px] sm:text-xs px-2 py-0.5 rounded-full border ${it.colorClass}`}>
                    {it.statusLabel}
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
