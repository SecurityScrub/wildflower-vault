import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";
import { WEDDING_STATUS_LABELS } from "@/lib/wedding-planning";
import type { WeddingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<WeddingStatus, string> = {
  PLANNING: "bg-brand-pink-100 text-brand-pink-700",
  ACTIVE: "bg-brand-orange-100 text-brand-orange-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-600",
};

export default async function AdminWeddingsPage() {
  const weddings = await prisma.wedding.findMany({
    orderBy: [{ weddingDate: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { tasks: true, vendors: true, guests: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-brand-orange-700">Weddings</h1>
        <span className="font-sans text-sm text-gray-400">{weddings.length} total</span>
      </div>

      <div className="space-y-2">
        {weddings.length === 0 ? (
          <div className="bg-white p-8 text-center text-sm text-gray-400">
            No weddings yet. Convert a wedding planning lead to create one.
          </div>
        ) : (
          weddings.map((w) => {
            const couple = w.partner2Name ? `${w.partner1Name} & ${w.partner2Name}` : w.partner1Name;
            return (
              <Link
                key={w.id}
                href={`/admin/weddings/${w.id}`}
                className="block bg-white p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <p className="font-sans font-semibold text-sm">{couple}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[w.status]}`}>
                      {WEDDING_STATUS_LABELS[w.status]}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-brand-orange-700">
                    {w.weddingDate ? formatShortDate(w.weddingDate) : "Date TBD"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-sans text-gray-500">
                  {w.venue && <span>{w.venue}</span>}
                  {w.guestCount != null && <span>{w.guestCount} guests</span>}
                  {w.packageType && <span>{w.packageType}</span>}
                  <span>· {w._count.tasks} tasks</span>
                  <span>{w._count.vendors} vendors</span>
                  <span>{w._count.guests} guests in list</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
