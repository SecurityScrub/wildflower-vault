import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking/BookingForm";

export const metadata: Metadata = {
  title: "Book a Rental",
  description: "Reserve your rental piece for your wedding or event. Secure checkout via Square.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; date?: string }>;
}) {
  const { item: itemId, date } = await searchParams;

  const rentals = await prisma.rentalItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      depositPct: true,
      images: true,
      category: true,
    },
  });

  const preselected = itemId
    ? rentals.find((r) => r.id === itemId) ?? null
    : null;

  return (
    <>
      <section className="pt-32 pb-16 bg-brand-cream">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <p className="section-subtitle">Reserve Your Date</p>
          <h1 className="section-title">Book a Rental</h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
            Fill out the form below to secure your rental. A{" "}
            <span className="text-brand-green-700 font-medium">deposit is required</span> to hold
            your date, with the balance due before your event.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <BookingForm
            rentals={rentals.map((r) => ({
              ...r,
              price: Number(r.price),
            }))}
            preselectedId={preselected?.id ?? null}
            preselectedDate={date ?? null}
          />
        </div>
      </section>
    </>
  );
}
