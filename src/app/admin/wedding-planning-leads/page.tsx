import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatWeddingDate(date: Date | null, flexible: boolean): string {
  if (!date) return flexible ? "Flexible / TBD" : "—";
  const formatted = formatShortDate(date);
  return flexible ? `${formatted} (flexible)` : formatted;
}

export default async function AdminWeddingPlanningLeadsPage() {
  const leads = await prisma.weddingPlanningLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  async function markRead(id: string) {
    "use server";
    await prisma.weddingPlanningLead.update({
      where: { id },
      data: { isRead: true, contactedAt: new Date() },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-brand-orange-700">Wedding Planning Leads</h1>
        <span className="font-sans text-sm text-gray-400">{leads.length} total</span>
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-400 text-sm">
            No wedding planning leads yet
          </div>
        ) : (
          leads.map((lead) => {
            const couple = lead.partnerName
              ? `${lead.name} & ${lead.partnerName}`
              : lead.name;
            return (
              <div
                key={lead.id}
                className={`bg-white p-5 border-l-4 ${lead.isRead ? "border-gray-100" : "border-brand-pink-500"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-sans font-semibold text-sm">{couple}</p>
                      {!lead.isRead && (
                        <span className="bg-brand-pink-100 text-brand-pink-700 text-xs px-2 py-0.5 rounded-full font-sans">
                          New
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans text-gray-600 mb-3">
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
                  {lead.hearAboutUs && (
                    <div>
                      <span className="text-gray-400 block">Source</span>
                      {lead.hearAboutUs}
                    </div>
                  )}
                </div>

                {lead.servicesNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {lead.servicesNeeded.map((item) => (
                      <span
                        key={item}
                        className="bg-brand-orange-50 text-brand-orange-700 text-xs px-2 py-0.5 rounded font-sans"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                {lead.message && (
                  <p className="font-sans text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {lead.message}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                  <a
                    href={`mailto:${lead.email}?subject=Re: Your wedding planning inquiry – The Wild Flower Vault`}
                    className="font-sans text-xs text-brand-orange-700 hover:underline"
                  >
                    Reply via Email →
                  </a>
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="font-sans text-xs text-brand-orange-700 hover:underline"
                    >
                      Call →
                    </a>
                  )}
                  {!lead.isRead && (
                    <form
                      action={async () => {
                        "use server";
                        await markRead(lead.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="font-sans text-xs text-gray-400 hover:text-gray-600"
                      >
                        Mark as Contacted
                      </button>
                    </form>
                  )}
                  {lead.contactedAt && (
                    <span className="font-sans text-xs text-gray-400 ml-auto">
                      Contacted {formatShortDate(lead.contactedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
