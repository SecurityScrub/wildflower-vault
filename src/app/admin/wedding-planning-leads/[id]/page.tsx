import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { formatShortDate, formatDate } from "@/lib/utils";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
  LEAD_STATUS_COLORS,
  NOTE_TYPE_LABELS,
  CONSULTATION_STATUS_LABELS,
} from "@/lib/wedding-planning";
import type { LeadStatus, NoteType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const lead = await prisma.weddingPlanningLead.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: { occurredAt: "desc" },
        include: { author: { select: { name: true, email: true } } },
      },
      consultations: { orderBy: { scheduledAt: "asc" } },
      wedding: { select: { id: true, status: true } },
    },
  });

  if (!lead) notFound();

  const couple = lead.partnerName ? `${lead.name} & ${lead.partnerName}` : lead.name;
  const colors = LEAD_STATUS_COLORS[lead.status];

  // ── Server actions ────────────────────────────────────────────────────────

  async function updateStatus(formData: FormData) {
    "use server";
    const newStatus = formData.get("status") as LeadStatus;
    if (!LEAD_STATUS_ORDER.includes(newStatus)) return;
    await prisma.weddingPlanningLead.update({
      where: { id },
      data: {
        status: newStatus,
        contactedAt:
          newStatus !== "NEW" && newStatus !== "LOST" ? new Date() : undefined,
        isRead: true,
      },
    });
    revalidatePath(`/admin/wedding-planning-leads/${id}`);
    revalidatePath("/admin/wedding-planning-leads");
  }

  async function addNote(formData: FormData) {
    "use server";
    const body = (formData.get("body") as string | null)?.trim();
    const type = (formData.get("type") as NoteType | null) ?? "NOTE";
    if (!body) return;
    await prisma.leadNote.create({
      data: { leadId: id, body, type, authorId: userId ?? null },
    });
    revalidatePath(`/admin/wedding-planning-leads/${id}`);
  }

  const existingWeddingId = lead.wedding?.id ?? null;
  const leadSnapshot = {
    name: lead.name,
    partnerName: lead.partnerName,
    weddingDate: lead.weddingDate,
    venue: lead.venue,
    guestCount: lead.guestCount,
    planningType: lead.planningType,
  };

  async function convertToClient() {
    "use server";
    if (existingWeddingId) {
      redirect(`/admin/weddings/${existingWeddingId}`);
    }
    const wedding = await prisma.wedding.create({
      data: {
        leadId: id,
        partner1Name: leadSnapshot.name,
        partner2Name: leadSnapshot.partnerName,
        weddingDate: leadSnapshot.weddingDate,
        venue: leadSnapshot.venue,
        guestCount: leadSnapshot.guestCount,
        packageType: leadSnapshot.planningType,
      },
    });
    await prisma.weddingPlanningLead.update({
      where: { id },
      data: { status: "BOOKED" },
    });
    redirect(`/admin/weddings/${wedding.id}`);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <Link
          href="/admin/wedding-planning-leads"
          className="font-sans text-xs text-gray-400 hover:text-brand-orange-700"
        >
          ← Back to all leads
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mt-2">
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700 break-words">{couple}</h1>
          <span className={`${colors.bg} ${colors.text} text-xs px-2.5 py-1 rounded-full font-sans self-start sm:self-auto`}>
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
        </div>
        <p className="font-sans text-xs sm:text-sm text-gray-500 mt-1">
          Submitted {formatDate(lead.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Right column (mobile: shows first as actions, desktop: right side) */}
        {/* Pipeline / Quick Actions appear before details on mobile, on right on desktop */}
        <div className="space-y-5 sm:space-y-6 lg:col-start-3 lg:row-start-1">
          <div className="bg-white p-4 sm:p-6">
            <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-3 sm:mb-4">
              Pipeline Status
            </h2>
            <form action={updateStatus} className="space-y-3">
              <select
                name="status"
                defaultValue={lead.status}
                className="w-full border border-gray-200 px-3 py-2.5 text-sm font-sans rounded"
              >
                {LEAD_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-brand-orange-700 text-white text-sm font-sans py-2.5 rounded hover:bg-brand-orange-800"
              >
                Update status
              </button>
            </form>
          </div>

          <div className="bg-white p-4 sm:p-6 space-y-3">
            <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400">
              Quick Actions
            </h2>
            <a
              href={`mailto:${lead.email}?subject=Re: Your wedding planning inquiry – The Wild Flower Vault`}
              className="block w-full text-center bg-white border border-brand-orange-700 text-brand-orange-700 text-sm font-sans py-2.5 rounded hover:bg-brand-orange-50"
            >
              Reply via Email
            </a>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="block w-full text-center bg-white border border-gray-200 text-gray-600 text-sm font-sans py-2.5 rounded hover:bg-gray-50"
              >
                Call {lead.phone}
              </a>
            )}
            <Link
              href={`/admin/consultations/new?leadId=${lead.id}`}
              className="block w-full text-center bg-white border border-gray-200 text-gray-600 text-sm font-sans py-2.5 rounded hover:bg-gray-50"
            >
              Schedule consultation
            </Link>
            {lead.wedding ? (
              <Link
                href={`/admin/weddings/${lead.wedding.id}`}
                className="block w-full text-center bg-brand-orange-700 text-white text-sm font-sans py-2.5 rounded hover:bg-brand-orange-800"
              >
                Open wedding workspace →
              </Link>
            ) : (
              <form action={convertToClient}>
                <button
                  type="submit"
                  className="w-full bg-brand-pink-500 text-white text-sm font-sans py-2.5 rounded hover:bg-brand-pink-600"
                >
                  Convert to client
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Left: details */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6 lg:row-start-1">
          <div className="bg-white p-4 sm:p-6">
            <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
              Wedding Details
            </h2>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm font-sans">
              <div>
                <dt className="text-gray-400 text-xs">Email</dt>
                <dd>
                  <a href={`mailto:${lead.email}`} className="text-brand-orange-700 hover:underline">
                    {lead.email}
                  </a>
                </dd>
              </div>
              {lead.phone && (
                <div>
                  <dt className="text-gray-400 text-xs">Phone</dt>
                  <dd>
                    <a href={`tel:${lead.phone}`} className="text-brand-orange-700 hover:underline">
                      {lead.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-400 text-xs">Wedding Date</dt>
                <dd>
                  {lead.weddingDate
                    ? `${formatShortDate(lead.weddingDate)}${lead.flexibleDate ? " (flex)" : ""}`
                    : lead.flexibleDate
                      ? "Flexible / TBD"
                      : "—"}
                </dd>
              </div>
              {lead.guestCount != null && (
                <div>
                  <dt className="text-gray-400 text-xs">Guests</dt>
                  <dd>{lead.guestCount}</dd>
                </div>
              )}
              {lead.venue && (
                <div>
                  <dt className="text-gray-400 text-xs">Venue</dt>
                  <dd>{lead.venue}</dd>
                </div>
              )}
              {lead.budget && (
                <div>
                  <dt className="text-gray-400 text-xs">Budget</dt>
                  <dd>{lead.budget}</dd>
                </div>
              )}
              {lead.planningType && (
                <div>
                  <dt className="text-gray-400 text-xs">Package</dt>
                  <dd>{lead.planningType}</dd>
                </div>
              )}
              {lead.hearAboutUs && (
                <div>
                  <dt className="text-gray-400 text-xs">Source</dt>
                  <dd>{lead.hearAboutUs}</dd>
                </div>
              )}
            </dl>

            {lead.servicesNeeded.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-50">
                <p className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Services Needed
                </p>
                <div className="flex flex-wrap gap-2">
                  {lead.servicesNeeded.map((s) => (
                    <span key={s} className="bg-brand-orange-50 text-brand-orange-700 text-xs px-2 py-0.5 rounded font-sans">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lead.message && (
              <div className="mt-5 pt-5 border-t border-gray-50">
                <p className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Inquiry Message
                </p>
                <p className="font-sans text-sm whitespace-pre-wrap text-gray-700">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Consultations summary */}
          {lead.consultations.length > 0 && (
            <div className="bg-white p-4 sm:p-6">
              <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-3 sm:mb-4">
                Scheduled Consultations
              </h2>
              <ul className="space-y-2">
                {lead.consultations.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm font-sans">
                    <span>
                      {formatDate(c.scheduledAt)} ·{" "}
                      <span className="text-gray-400">{c.location ?? "TBD"}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {CONSULTATION_STATUS_LABELS[c.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes timeline */}
          <div className="bg-white p-4 sm:p-6">
            <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-3 sm:mb-4">
              Activity Log
            </h2>

            <form action={addNote} className="mb-6 space-y-3">
              <textarea
                name="body"
                required
                rows={3}
                placeholder="Add a note, call summary, or activity…"
                className="w-full border border-gray-200 px-3 py-2 text-sm font-sans rounded focus:outline-none focus:border-brand-orange-500"
              />
              <div className="flex items-center gap-3">
                <select
                  name="type"
                  className="border border-gray-200 px-3 py-1.5 text-xs font-sans rounded"
                  defaultValue="NOTE"
                >
                  {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-brand-orange-700 text-white text-xs font-sans px-4 py-1.5 rounded hover:bg-brand-orange-800"
                >
                  Save activity
                </button>
              </div>
            </form>

            {lead.notes.length === 0 ? (
              <p className="text-xs text-gray-400 font-sans">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {lead.notes.map((n) => (
                  <li key={n.id} className="border-l-2 border-brand-orange-100 pl-4 py-1">
                    <div className="flex items-center gap-2 text-xs font-sans text-gray-400 mb-1">
                      <span className="bg-brand-orange-50 text-brand-orange-700 px-1.5 py-0.5 rounded">
                        {NOTE_TYPE_LABELS[n.type]}
                      </span>
                      <span>{formatShortDate(n.occurredAt)}</span>
                      {n.author?.name && <span>· {n.author.name}</span>}
                    </div>
                    <p className="text-sm font-sans whitespace-pre-wrap text-gray-700">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
