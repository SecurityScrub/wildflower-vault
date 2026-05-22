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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-brand-orange-700">Wedding Planning Leads</h1>
        <span className="font-sans text-sm text-gray-400">
          {leads.length} shown · {totalCount} total
        </span>
      </div>

      {/* Status pipeline filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/wedding-planning-leads"
          className={`px-3 py-1.5 text-xs font-sans rounded ${
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
              className={`px-3 py-1.5 text-xs font-sans rounded ${
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
                className={`block bg-white p-5 border-l-4 ${colors.border} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-sans font-semibold text-sm">{couple}</p>
                      <span className={`${colors.bg} ${colors.text} text-xs px-2 py-0.5 rounded-full font-sans`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                      {lead._count.notes > 0 && (
                        <span className="font-sans text-xs text-gray-400">
                          {lead._count.notes} note{lead._count.notes === 1 ? "" : "s"}
                        </span>
                      )}
                      {lead._count.consultations > 0 && (
                        <span className="font-sans text-xs text-brand-orange-700">
                          {lead._count.consultations} consult.
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-gray-400 mt-0.5">
                      {lead.email}
                      {lead.phone && ` · ${lead.phone}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-xs text-gray-400">
                      {formatShortDate(lead.createdAt)}
                    </p>
                    <p className="font-sans text-xs text-brand-orange-700 mt-0.5">
                      Wedding: {formatWeddingDate(lead.weddingDate, lead.flexibleDate)}
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
