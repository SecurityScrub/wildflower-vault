import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SendComposer } from "./SendComposer";
import type { EmailBlock } from "../../TemplateEditor";

export const dynamic = "force-dynamic";

export default async function SendEmailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  // A short list of recent leads to make recipient picking easier.
  const recentLeads = await prisma.weddingPlanningLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, partnerName: true, email: true, status: true },
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/admin/email/${id}`} className="font-sans text-xs text-gray-400 hover:text-brand-orange-700">
          ← Back to template
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700 mt-2 break-words">
          Send: {template.name}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Subject: <span className="text-gray-700">{template.subject}</span>
        </p>
      </div>
      <SendComposer
        templateId={template.id}
        subject={template.subject}
        blocks={template.blocks as unknown as EmailBlock[]}
        recentLeads={recentLeads}
      />
    </div>
  );
}
