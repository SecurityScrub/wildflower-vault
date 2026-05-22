import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConsultationForm } from "@/components/ConsultationForm";

export const dynamic = "force-dynamic";

export default async function AdminNewConsultationPage(props: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const sp = await props.searchParams;
  const lead = sp.leadId
    ? await prisma.weddingPlanningLead.findUnique({ where: { id: sp.leadId } })
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={lead ? `/admin/wedding-planning-leads/${lead.id}` : "/admin/consultations"}
          className="font-sans text-xs text-gray-400 hover:text-brand-orange-700"
        >
          ← Back
        </Link>
        <h1 className="font-serif text-3xl text-brand-orange-700 mt-2">
          Book consultation
          {lead && (
            <>
              {" "}
              <span className="text-gray-400 text-xl">
                for {lead.name}
                {lead.partnerName ? ` & ${lead.partnerName}` : ""}
              </span>
            </>
          )}
        </h1>
        <p className="font-sans text-sm text-gray-500 mt-1">
          A confirmation email with a calendar invite (.ics + Google Calendar) will be sent to the couple.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8">
        <ConsultationForm
          defaultName={lead?.name ?? ""}
          defaultPartnerName={lead?.partnerName ?? ""}
          defaultEmail={lead?.email ?? ""}
          defaultPhone={lead?.phone ?? ""}
          leadId={lead?.id}
        />
      </div>
    </div>
  );
}
