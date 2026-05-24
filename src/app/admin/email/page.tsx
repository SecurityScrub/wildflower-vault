import Link from "next/link";
import { Mail, Plus, Send as SendIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  const [templates, sendCount] = await Promise.all([
    prisma.emailTemplate.findMany({
      orderBy: [{ isPreset: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.emailSend.count(),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">Email Marketing</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create templates with no HTML knowledge needed. {sendCount} email{sendCount === 1 ? "" : "s"} sent through the platform.
          </p>
        </div>
        <Link
          href="/admin/email/new"
          className="bg-brand-orange-700 text-white text-xs font-sans px-3 sm:px-4 py-2.5 rounded hover:bg-brand-orange-800 flex items-center gap-1.5 shrink-0"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Template</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="bg-white p-10 text-center">
            <Mail className="mx-auto text-brand-pink-300 mb-3" size={32} />
            <p className="text-sm text-gray-500 mb-4">No templates yet. Start with one of the presets or build your own.</p>
            <Link
              href="/admin/email/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={14} /> Create First Template
            </Link>
          </div>
        ) : (
          templates.map((t) => {
            const blockCount = Array.isArray(t.blocks) ? t.blocks.length : 0;
            return (
              <div key={t.id} className="bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-sans text-sm font-semibold">{t.name}</p>
                    {t.isPreset && (
                      <span className="bg-brand-pink-100 text-brand-pink-700 text-[10px] sm:text-xs px-2 py-0.5 rounded">Preset</span>
                    )}
                    <span className="text-[10px] sm:text-xs text-gray-400">{blockCount} block{blockCount === 1 ? "" : "s"}</span>
                  </div>
                  <p className="font-sans text-xs text-gray-500 mt-1 truncate">
                    <span className="text-gray-400">Subject:</span> {t.subject}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/admin/email/${t.id}`}
                    className="px-3 py-2 text-xs font-sans uppercase tracking-wider text-brand-orange-700 border border-brand-orange-700 hover:bg-brand-orange-50 rounded"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/email/${t.id}/send`}
                    className="px-3 py-2 text-xs font-sans uppercase tracking-wider bg-brand-pink-500 text-white hover:bg-brand-pink-600 rounded flex items-center gap-1.5"
                  >
                    <SendIcon size={12} /> Send
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
