import Link from "next/link";
import { notFound } from "next/navigation";
import { Send as SendIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TemplateEditor, type EmailBlock } from "../TemplateEditor";

export const dynamic = "force-dynamic";

export default async function EditEmailTemplatePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/admin/email" className="font-sans text-xs text-gray-400 hover:text-brand-orange-700">
            ← Back to email
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700 mt-2 break-words">
            {template.name}
          </h1>
        </div>
        <Link
          href={`/admin/email/${id}/send`}
          className="bg-brand-pink-500 hover:bg-brand-pink-600 text-white text-xs font-sans uppercase tracking-wider px-4 py-2.5 rounded flex items-center gap-2 shrink-0"
        >
          <SendIcon size={14} /> Send
        </Link>
      </div>
      <TemplateEditor
        templateId={template.id}
        initial={{
          name: template.name,
          subject: template.subject,
          blocks: (template.blocks as unknown as EmailBlock[]) ?? [],
        }}
      />
    </div>
  );
}
