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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-brand-orange-700">Inquiries</h1>
        <span className="font-sans text-sm text-gray-400">{inquiries.length} total</span>
      </div>

      <div className="space-y-3">
        {inquiries.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-400 text-sm">No inquiries yet</div>
        ) : (
          inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`bg-white p-5 border-l-4 ${inquiry.isRead ? "border-gray-100" : "border-brand-pink-500"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-sans font-semibold text-sm">{inquiry.name}</p>
                    {!inquiry.isRead && (
                      <span className="bg-brand-pink-100 text-brand-pink-700 text-xs px-2 py-0.5 rounded-full font-sans">
                        New
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-gray-400 mt-0.5">
                    {inquiry.email}
                    {inquiry.phone && ` · ${inquiry.phone}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-xs text-gray-400">{formatShortDate(inquiry.createdAt)}</p>
                  {inquiry.eventDate && (
                    <p className="font-sans text-xs text-brand-orange-700 mt-0.5">
                      Event: {formatShortDate(inquiry.eventDate)}
                    </p>
                  )}
                </div>
              </div>

              {inquiry.items.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {inquiry.items.map((item) => (
                    <span key={item} className="bg-brand-orange-50 text-brand-orange-700 text-xs px-2 py-0.5 rounded font-sans">
                      {item}
                    </span>
                  ))}
                </div>
              )}

              <p className="font-sans text-sm text-gray-600 whitespace-pre-wrap">{inquiry.message}</p>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                <a
                  href={`mailto:${inquiry.email}?subject=Re: Your inquiry – The Wild Flower Vault`}
                  className="font-sans text-xs text-brand-orange-700 hover:underline"
                >
                  Reply via Email →
                </a>
                {!inquiry.isRead && (
                  <form action={async () => { "use server"; await markRead(inquiry.id); }}>
                    <button type="submit" className="font-sans text-xs text-gray-400 hover:text-gray-600">
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
