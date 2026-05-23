import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, LEAD_STATUS_COLORS } from "@/lib/wedding-planning";
import type { LeadStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatWeddingDate(date: Date | null, flexible: boolean): string {
  if (!date) return flexible ? "Flexible / TBD" : "—";
  const formatted = formatShortDate(date);
  return flexible ? `${formatted} (flexible)` : formatted;
}

export default async function AdminWeddingPlanningLeadsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await props.searchParams;
  const validStatus = LEAD_STATUS_ORDER.includes(statusFilter as LeadStatus)
    ? (statusFilter as LeadStatus)
    : null;

  const [leads, allStatusCounts] = await Promise.all([
    prisma.weddingPlanningLead.findMany({
      where: validStatus ? { status: validStatus } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: { select: { notes: true, consultations: true } },
      },
    }),
    prisma.weddingPlanningLead.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countsByStatus = Object.fromEntries(
    allStatusCounts.map((c) => [c.status, c._count._all]),
  ) as Record<LeadStatus, number>;
  const totalCount = allStatusCounts.reduce((s, c) => s + c._count._all, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700 leading-tight">
          <span className="hidden sm:inline">Wedding Planning </span>Leads
        </h1>
        <span className="font-sans text-xs sm:text-sm text-gray-400 text-right shrink-0">
          {leads.length} shown · {totalCount} total
        </span>
      </div>

      {/* Status pipeline filter */}
      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:gap-2 pb-1">
        <Link
          href="/admin/wedding-planning-leads"
          className={`shrink-0 px-3 py-2 text-xs font-sans rounded ${
            !validStatus ? "bg-brand-orange-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          All · {totalCount}
        </Link>
        {LEAD_STATUS_ORDER.map((s) => {
          const c = countsByStatus[s] ?? 0;
          const isActive = validStatus === s;
          const colors = LEAD_STATUS_COLORS[s];
          return (
            <Link
              key={s}
              href={`/admin/wedding-planning-leads?status=${s}`}
              className={`shrink-0 px-3 py-2 text-xs font-sans rounded ${
                isActive
                  ? `${colors.bg} ${colors.text} ring-1 ring-current`
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {LEAD_STATUS_LABELS[s]} · {c}
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-400 text-sm">
            {validStatus
              ? `No leads in "${LEAD_STATUS_LABELS[validStatus]}" status`
              : "No wedding planning leads yet"}
          </div>
        ) : (
          leads.map((lead) => {
            const couple = lead.partnerName
              ? `${lead.name} & ${lead.partnerName}`
              : lead.name;
            const colors = LEAD_STATUS_COLORS[lead.status];
            return (
              <Link
                key={lead.id}
                href={`/admin/wedding-planning-leads/${lead.id}`}
                className={`block bg-white p-4 sm:p-5 border-l-4 ${colors.border} hover:bg-gray-50 active:bg-gray-100 transition-colors`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-sans font-semibold text-sm">{couple}</p>
                      <span className={`${colors.bg} ${colors.text} text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-sans`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                      {lead._count.notes > 0 && (
                        <span className="font-sans text-[10px] sm:text-xs text-gray-400">
                          {lead._count.notes} note{lead._count.notes === 1 ? "" : "s"}
                        </span>
                      )}
                      {lead._count.consultations > 0 && (
                        <span className="font-sans text-[10px] sm:text-xs text-brand-orange-700">
                          {lead._count.consultations} consult.
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-gray-400 mt-0.5 break-all">
                      {lead.email}
                      {lead.phone && <span className="whitespace-nowrap"> · {lead.phone}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-[11px] sm:text-xs text-gray-400">
                      {formatShortDate(lead.createdAt)}
                    </p>
                    <p className="font-sans text-[11px] sm:text-xs text-brand-orange-700 mt-0.5">
                      <span className="hidden sm:inline">Wedding: </span>{formatWeddingDate(lead.weddingDate, lead.flexibleDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans text-gray-600">
                  {lead.guestCount != null && (
                    <div>
                      <span className="text-gray-400 block">Guests</span>
                      {lead.guestCount}
                    </div>
                  )}
                  {lead.venue && (
                    <div>
                      <span className="text-gray-400 block">Venue</span>
                      {lead.venue}
                    </div>
                  )}
                  {lead.budget && (
                    <div>
                      <span className="text-gray-400 block">Budget</span>
                      {lead.budget}
                    </div>
                  )}
                  {lead.planningType && (
                    <div>
                      <span className="text-gray-400 block">Package</span>
                      {lead.planningType}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
