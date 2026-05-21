import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { BookingCalendar } from "@/components/rentals/BookingCalendar";
import { Check, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await prisma.rentalItem.findUnique({ where: { slug } });
  if (!item) return { title: "Not Found" };
  return {
    title: item.metaTitle ?? item.name,
    description: item.metaDesc ?? item.description,
    openGraph: {
      title: item.name,
      description: item.description,
      images: item.images[0] ? [item.images[0]] : [],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RentalDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await prisma.rentalItem.findUnique({ where: { slug, isActive: true } });
  if (!item) notFound();

  // Get booked dates for this item
  const bookedBookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "DEPOSIT_PAID", "PAID"] },
      items: { some: { rentalItemId: item.id } },
    },
    select: { eventDate: true, eventEndDate: true },
  });
  const bookedDates = bookedBookings.map((b) => ({
    start: b.eventDate,
    end: b.eventEndDate ?? b.eventDate,
  }));

  const deposit = Math.ceil((Number(item.price) * item.depositPct) / 100);

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-24 pb-6 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-7xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sans text-gray-400">
            <Link href="/" className="hover:text-brand-green-700">Home</Link>
            <span>/</span>
            <Link href="/rentals" className="hover:text-brand-green-700">Rentals</Link>
            <span>/</span>
            <span className="text-brand-green-700">{item.name}</span>
          </nav>
        </div>
      </div>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-[4/5] bg-brand-cream overflow-hidden">
                {item.images[0] ? (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-green-100 to-brand-green-200 flex items-center justify-center">
                    <span className="text-brand-green-400 font-serif text-xl">{item.name}</span>
                  </div>
                )}
              </div>
              {item.images.slice(1, 4).length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {item.images.slice(1, 4).map((img, i) => (
                    <div key={i} className="relative aspect-square bg-brand-cream overflow-hidden">
                      <Image src={img} alt={`${item.name} view ${i + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="lg:sticky lg:top-28">
              <Link
                href="/rentals"
                className="inline-flex items-center gap-2 font-sans text-xs text-gray-400 hover:text-brand-green-700 transition-colors mb-6"
              >
                <ArrowLeft size={12} /> Back to Rentals
              </Link>

              {item.category && (
                <span className="inline-block font-sans text-xs tracking-[0.25em] uppercase text-brand-gold-500 mb-3">
                  {item.category.replace("-", " ")}
                </span>
              )}

              <h1 className="font-serif text-4xl md:text-5xl text-brand-green-700 font-light leading-tight mb-3">
                {item.name}
              </h1>

              {item.tagline && (
                <p className="font-sans text-sm text-gray-400 italic mb-5">{item.tagline}</p>
              )}

              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-sans text-3xl font-semibold text-brand-gold-600">
                  {formatCurrency(Number(item.price))}
                </span>
                <span className="text-sm text-gray-400 font-sans">per event</span>
              </div>

              <p className="font-sans text-sm text-gray-600 leading-relaxed mb-6">
                {item.longDesc ?? item.description}
              </p>

              {item.dimensions && (
                <p className="text-sm text-gray-500 mb-2">
                  <span className="font-medium text-brand-green-700">Dimensions:</span>{" "}
                  {item.dimensions}
                </p>
              )}
              {item.capacity && (
                <p className="text-sm text-gray-500 mb-5">
                  <span className="font-medium text-brand-green-700">Capacity:</span>{" "}
                  {item.capacity}
                </p>
              )}

              {item.features.length > 0 && (
                <ul className="space-y-2 mb-8">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check size={14} className="text-brand-gold-500 shrink-0" />
                      <span className="font-sans text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="bg-brand-cream p-5 mb-8">
                <p className="font-sans text-xs text-gray-400 mb-1 tracking-wider uppercase">
                  Pricing
                </p>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Rental total</span>
                  <span className="font-semibold text-brand-green-700">
                    {formatCurrency(Number(item.price))}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Deposit to reserve ({item.depositPct}%)</span>
                  <span className="font-semibold text-brand-gold-600">
                    {formatCurrency(deposit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Balance due before event</span>
                  <span className="font-semibold">
                    {formatCurrency(Number(item.price) - deposit)}
                  </span>
                </div>
              </div>

              <Link
                href={`/book?item=${item.id}`}
                className="btn-primary w-full text-center mb-3"
              >
                Book This Piece
              </Link>
              <Link href="/inquiry" className="btn-secondary w-full text-center">
                Ask a Question
              </Link>

              <p className="text-center font-sans text-xs text-gray-400 mt-4">
                Secure checkout via Square · Delivery &amp; setup included
              </p>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="mt-20">
            <div className="mb-8">
              <p className="section-subtitle">Availability</p>
              <h2 className="font-serif text-3xl text-brand-green-700">Check Your Date</h2>
            </div>
            <BookingCalendar
              rentalItemId={item.id}
              bookedDates={bookedDates.map((d) => ({
                start: d.start.toISOString(),
                end: d.end.toISOString(),
              }))}
            />
          </div>
        </div>
      </section>

      {/* Schema.org product markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: item.name,
            description: item.description,
            image: item.images,
            offers: {
              "@type": "Offer",
              price: item.price.toString(),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              seller: {
                "@type": "LocalBusiness",
                name: "The Wild Flower Vault",
              },
            },
          }),
        }}
      />
    </>
  );
}
