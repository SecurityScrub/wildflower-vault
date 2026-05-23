import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CONSULTATION_STATUS_LABELS } from "@/lib/wedding-planning";
import type { ConsultationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const STATUS_COLORS: Record<ConsultationStatus, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  NO_SHOW: "bg-red-100 text-red-700",
};

export default async function AdminConsultationsPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.consultation.findMany({
      where: { scheduledAt: { gte: now }, status: { notIn: ["CANCELLED"] } },
      orderBy: { scheduledAt: "asc" },
      include: { lead: { select: { id: true, name: true, partnerName: true } } },
      take: 100,
    }),
    prisma.consultation.findMany({
      where: { scheduledAt: { lt: now } },
      orderBy: { scheduledAt: "desc" },
      include: { lead: { select: { id: true, name: true, partnerName: true } } },
      take: 50,
    }),
  ]);

  async function updateStatus(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const status = formData.get("status") as ConsultationStatus;
    if (!id || !status) return;
    await prisma.consultation.update({ where: { id }, data: { status } });
    revalidatePath("/admin/consultations");
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">Consultations</h1>
        <Link
          href="/admin/consultations/new"
          className="bg-brand-orange-700 text-white text-xs font-sans px-3 sm:px-4 py-2 rounded hover:bg-brand-orange-800 shrink-0"
        >
          <span className="hidden sm:inline">+ Book consultation</span>
          <span className="sm:hidden">+ New</span>
        </Link>
      </div>

      <section>
        <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-3">
          Upcoming ({upcoming.length})
        </h2>
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <div className="bg-white p-6 text-center text-sm text-gray-400">
              No upcoming consultations.
            </div>
          ) : (
            upcoming.map((c) => (
              <ConsultationRow key={c.id} c={c} updateStatus={updateStatus} />
            ))
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-3">
            Past ({past.length})
          </h2>
          <div className="space-y-2">
            {past.map((c) => (
              <ConsultationRow key={c.id} c={c} updateStatus={updateStatus} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type ConsultationRowData = Awaited<ReturnType<typeof prisma.consultation.findMany>>[number] & {
  lead?: { id: string; name: string; partnerName: string | null } | null;
};

function ConsultationRow({
  c,
  updateStatus,
}: {
  c: ConsultationRowData;
  updateStatus: (fd: FormData) => Promise<void>;
}) {
  const name = c.lead?.partnerName ? `${c.lead.name} & ${c.lead.partnerName}` : c.name;
  return (
    <div className="bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <p className="font-sans text-sm font-semibold">{name}</p>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${STATUS_COLORS[c.status]}`}>
            {CONSULTATION_STATUS_LABELS[c.status]}
          </span>
        </div>
        <p className="font-sans text-xs text-gray-400 mt-0.5">
          {formatWhen(c.scheduledAt)} · {c.durationMin}min · {c.location ?? "—"}
        </p>
        <p className="font-sans text-xs text-gray-400 mt-0.5 break-all">{c.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <form action={updateStatus} className="inline-flex flex-1 sm:flex-none">
          <input type="hidden" name="id" value={c.id} />
          <select
            name="status"
            defaultValue={c.status}
            className="border border-gray-200 text-xs font-sans px-2 py-1.5 rounded w-full sm:w-auto"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {Object.entries(CONSULTATION_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </form>
        {c.lead && (
          <Link
            href={`/admin/wedding-planning-leads/${c.lead.id}`}
            className="text-xs font-sans text-brand-orange-700 hover:underline px-2 py-1.5"
          >
            Lead →
          </Link>
        )}
      </div>
    </div>
  );
}
