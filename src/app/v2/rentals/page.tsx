import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "Browse our curated collection of flower walls, photo booths, and backdrops available for rent in Des Moines, Iowa.",
};

const categories = [
  { value: "all", label: "All" },
  { value: "flower-walls", label: "Flower Walls" },
  { value: "photo-booths", label: "Photo Booths" },
  { value: "backdrops", label: "Backdrops" },
  { value: "arches", label: "Arches" },
];

export default async function V2RentalsPage({
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
      {/* Header */}
      <section className="pt-36 pb-20 bg-brand-pink-50/40">
        <div className="max-w-6xl mx-auto px-8">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-pink-500 mb-3">
            Rental Collection
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-light text-brand-charcoal leading-tight">
            Find your<br />perfect piece
          </h1>
          <p className="mt-6 text-brand-charcoal/40 text-sm max-w-md leading-relaxed">
            Every piece is hand-selected and maintained to gallery standards.
            Delivery, setup, and removal included with every booking.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-24 z-30 bg-white/90 backdrop-blur-md border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex gap-0 overflow-x-auto -mb-px">
            {categories.map((cat) => {
              const isActive =
                (!category && cat.value === "all") || category === cat.value;
              return (
                <Link
                  key={cat.value}
                  href={cat.value === "all" ? "/v2/rentals" : `/v2/rentals?category=${cat.value}`}
                  className={`whitespace-nowrap px-6 py-4 font-sans text-[11px] tracking-[0.2em] uppercase border-b-2 transition-colors ${
                    isActive
                      ? "border-brand-charcoal text-brand-charcoal"
                      : "border-transparent text-brand-charcoal/30 hover:text-brand-charcoal/60"
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
        <div className="max-w-6xl mx-auto px-8">
          {rentals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
              {rentals.map((item) => (
                <Link
                  key={item.id}
                  href={`/rentals/${item.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-brand-pink-50">
                    {item.images[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-pink-50 to-brand-pink-100 flex items-center justify-center">
                        <span className="text-brand-pink-300 font-serif italic">{item.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.06] transition-colors duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="inline-flex items-center gap-1.5 text-white text-[11px] tracking-[0.15em] uppercase font-sans">
                        View details <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-serif text-xl text-brand-charcoal group-hover:text-brand-pink-700 transition-colors">
                          {item.name}
                        </h2>
                        {item.tagline && (
                          <p className="text-xs text-brand-charcoal/35 mt-1">{item.tagline}</p>
                        )}
                      </div>
                      <span className="font-sans text-sm text-brand-pink-600 whitespace-nowrap mt-1">
                        {formatCurrency(Number(item.price))}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-brand-charcoal/40 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <h2 className="font-serif text-3xl text-brand-charcoal mb-4">
                Nothing here yet
              </h2>
              <p className="text-brand-charcoal/40 text-sm mb-8 max-w-sm mx-auto">
                We&apos;re preparing our collection. Reach out and
                we&apos;ll let you know when pieces are available.
              </p>
              <Link
                href="/inquiry"
                className="inline-flex items-center gap-3 bg-brand-charcoal text-white px-8 py-4 font-sans text-[11px] tracking-[0.25em] uppercase hover:bg-brand-charcoal/90 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 bg-brand-pink-50/40">
        <div className="max-w-xl mx-auto px-8 text-center">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-pink-500 mb-3">
            Need help choosing?
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-charcoal mb-4">
            We&apos;d love to help curate your day
          </h2>
          <p className="text-brand-charcoal/40 text-sm mb-8 leading-relaxed">
            Tell us about your event — style, venue, color palette — and
            we&apos;ll recommend the perfect combination.
          </p>
          <Link
            href="/inquiry"
            className="inline-flex items-center gap-3 border border-brand-charcoal/20 text-brand-charcoal px-8 py-4 font-sans text-[11px] tracking-[0.25em] uppercase hover:bg-brand-charcoal hover:text-white transition-all"
          >
            Start a Conversation
          </Link>
        </div>
      </section>
    </>
  );
}
