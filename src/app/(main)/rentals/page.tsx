import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rentals",
  description:
    "Browse our full collection of flower walls, photo booths, and backdrops for rent in Des Moines, Iowa.",
};

const categories = [
  { value: "all", label: "All Rentals" },
  { value: "flower-walls", label: "Flower Walls" },
  { value: "photo-booths", label: "Photo Booths" },
  { value: "backdrops", label: "Backdrops" },
  { value: "arches", label: "Arches & Arbors" },
];

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const rentals = await prisma.rentalItem.findMany({
    where: {
      isActive: true,
      ...(category && category !== "all" ? { category } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <>
      {/* Page header */}
      <section className="pt-32 pb-16 bg-brand-cream">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <p className="section-subtitle">Our Collection</p>
          <h1 className="section-title">Rental Pieces</h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
            Every piece in our vault is designed to elevate your event. Browse and book your
            perfect backdrop.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="sticky top-20 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex gap-0 overflow-x-auto">
            {categories.map((cat) => {
              const isActive =
                (!category && cat.value === "all") || category === cat.value;
              return (
                <Link
                  key={cat.value}
                  href={cat.value === "all" ? "/rentals" : `/rentals?category=${cat.value}`}
                  className={`whitespace-nowrap px-6 py-4 font-sans text-xs tracking-[0.2em] uppercase border-b-2 transition-colors ${
                    isActive
                      ? "border-brand-orange-700 text-brand-orange-700"
                      : "border-transparent text-gray-400 hover:text-brand-orange-700"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          {rentals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {rentals.map((item) => (
                <Link
                  key={item.id}
                  href={`/rentals/${item.slug}`}
                  className="group block card-hover"
                >
                  <div className="relative aspect-[4/5] bg-brand-cream overflow-hidden">
                    {item.images[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-orange-50 to-brand-orange-100 flex items-center justify-center">
                        <span className="text-brand-orange-300 font-serif text-sm text-center px-4">
                          {item.name}
                        </span>
                      </div>
                    )}
                    {!item.isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-brand-charcoal px-4 py-2 text-xs font-sans tracking-widest uppercase">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-serif text-xl text-brand-orange-700">{item.name}</h2>
                        {item.tagline && (
                          <p className="font-sans text-xs text-gray-400 mt-1">{item.tagline}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-sans text-sm font-semibold text-brand-pink-600">
                          {formatCurrency(Number(item.price))}
                        </span>
                        <span className="text-xs text-gray-400 block">/ event</span>
                      </div>
                    </div>
                    <p className="mt-3 font-sans text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    {item.dimensions && (
                      <p className="mt-2 font-sans text-xs text-gray-400">
                        Dimensions: {item.dimensions}
                      </p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-1 font-sans text-xs text-brand-orange-700 font-medium tracking-wider uppercase group-hover:gap-2 transition-all">
                      Check Availability →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-brand-orange-700 mb-4">
                No rentals found
              </p>
              <p className="text-gray-400 font-sans text-sm mb-8">
                We&apos;re adding new pieces to our collection. Check back soon or reach out to
                us.
              </p>
              <Link href="/inquiry" className="btn-primary">
                Get in Touch
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-cream">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <p className="section-subtitle">Not Sure?</p>
          <h2 className="section-title text-3xl">We&apos;d Love to Help</h2>
          <p className="mt-4 text-gray-500 font-sans text-sm max-w-md mx-auto mb-8">
            Tell us about your event and we&apos;ll suggest the perfect pieces for your style and
            budget.
          </p>
          <Link href="/inquiry" className="btn-primary">
            Send an Inquiry
          </Link>
        </div>
      </section>
    </>
  );
}
