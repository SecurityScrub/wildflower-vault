import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  async function markRead(id: string) {
    "use server";
    await prisma.inquiry.update({ where: { id }, data: { isRead: true } });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">Inquiries</h1>
        <span className="font-sans text-xs sm:text-sm text-gray-400">{inquiries.length} total</span>
      </div>

      <div className="space-y-3">
        {inquiries.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-400 text-sm">No inquiries yet</div>
        ) : (
          inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`bg-white p-4 sm:p-5 border-l-4 ${inquiry.isRead ? "border-gray-100" : "border-brand-pink-500"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-sans font-semibold text-sm">{inquiry.name}</p>
                    {!inquiry.isRead && (
                      <span className="bg-brand-pink-100 text-brand-pink-700 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-sans">
                        New
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-gray-400 mt-0.5 break-all">
                    {inquiry.email}
                    {inquiry.phone && <span className="whitespace-nowrap"> · {inquiry.phone}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-sans text-[11px] sm:text-xs text-gray-400">{formatShortDate(inquiry.createdAt)}</p>
                  {inquiry.eventDate && (
                    <p className="font-sans text-[11px] sm:text-xs text-brand-orange-700 mt-0.5">
                      Event: {formatShortDate(inquiry.eventDate)}
                    </p>
                  )}
                </div>
              </div>

              {inquiry.items.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                  {inquiry.items.map((item) => (
                    <span key={item} className="bg-brand-orange-50 text-brand-orange-700 text-[10px] sm:text-xs px-2 py-0.5 rounded font-sans">
                      {item}
                    </span>
                  ))}
                </div>
              )}

              <p className="font-sans text-sm text-gray-600 whitespace-pre-wrap break-words">{inquiry.message}</p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 pt-3 border-t border-gray-50">
                <a
                  href={`mailto:${inquiry.email}?subject=Re: Your inquiry – The Wild Flower Vault`}
                  className="font-sans text-xs text-brand-orange-700 hover:underline py-1"
                >
                  Reply via Email →
                </a>
                {inquiry.phone && (
                  <a
                    href={`tel:${inquiry.phone}`}
                    className="font-sans text-xs text-brand-orange-700 hover:underline py-1 sm:hidden"
                  >
                    Call {inquiry.phone} →
                  </a>
                )}
                {!inquiry.isRead && (
                  <form action={async () => { "use server"; await markRead(inquiry.id); }}>
                    <button type="submit" className="font-sans text-xs text-gray-400 hover:text-gray-600 py-1">
                      Mark as Read
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
