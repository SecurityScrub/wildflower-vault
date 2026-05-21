import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Star, ArrowRight, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getFeaturedRentals() {
  return prisma.rentalItem.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });
}

const testimonials = [
  {
    quote:
      "The flower wall was absolutely breathtaking. Our photos turned out stunning and our guests couldn't stop talking about it.",
    author: "Emily & Jake",
    event: "Wedding at The Bricks",
  },
  {
    quote:
      "From booking to day-of delivery, everything was seamless. The Wild Flower Vault made our vision come to life.",
    author: "Madison S.",
    event: "Bridal Shower",
  },
  {
    quote:
      "Professional, beautiful, and exactly what we wanted. Would book again in a heartbeat.",
    author: "Sarah & Tyler",
    event: "Wedding Reception",
  },
];

const process = [
  { num: "01", title: "Browse", desc: "Explore our curated collection and find pieces that match your vision." },
  { num: "02", title: "Reserve", desc: "Pick your date and secure it with a simple deposit." },
  { num: "03", title: "Celebrate", desc: "We deliver, set up, and take down. You just enjoy your day." },
];

export default async function V2HomePage() {
  const featured = await getFeaturedRentals();

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=90"
          alt="Elegant flower wall backdrop at a wedding reception"
          fill
          priority
          className="object-cover"
        />
        <div className="relative z-20 max-w-6xl mx-auto px-8 pb-24 w-full">
          <div className="max-w-2xl">
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-brand-pink-300 mb-6">
              Des Moines, Iowa
            </p>
            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-light text-white leading-[0.95] mb-8">
              Backdrops<br />
              worth<br />
              <em className="text-brand-pink-300">remembering</em>
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mb-10">
              Flower walls, photo booths, and ceremony pieces — delivered,
              styled, and removed. You just celebrate.
            </p>
            <div className="flex gap-4">
              <Link
                href="/v2/rentals"
                className="inline-flex items-center gap-3 bg-white text-brand-charcoal px-8 py-4 font-sans text-[11px] tracking-[0.25em] uppercase hover:bg-brand-pink-50 transition-colors"
              >
                View Collection <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Marquee strip ────────────────────────────────────────────── */}
      <section className="bg-brand-pink-50 py-5 overflow-hidden">
        <div className="flex items-center justify-center gap-12 text-brand-pink-400">
          {["Flower Walls", "Photo Booths", "Ceremony Arches", "Backdrops", "Pampas Installations"].map((item) => (
            <span key={item} className="font-serif text-sm italic whitespace-nowrap opacity-60">
              {item} &nbsp;·
            </span>
          ))}
        </div>
      </section>

      {/* ─── Featured collection ──────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-pink-500 mb-3">
                The Collection
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-brand-charcoal leading-tight">
                Pieces that set<br />the scene
              </h2>
            </div>
            <Link
              href="/v2/rentals"
              className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.2em] uppercase text-brand-charcoal/50 hover:text-brand-charcoal transition-colors"
            >
              See all <ArrowUpRight size={12} />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((item, i) => (
                <Link
                  key={item.id}
                  href={`/rentals/${item.slug}`}
                  className={`group block ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
                >
                  <div className={`relative overflow-hidden bg-brand-cream ${
                    i === 0 ? "aspect-square" : "aspect-[3/4]"
                  }`}>
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
                        <span className="text-brand-pink-300 font-serif text-lg italic">{item.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg text-brand-charcoal group-hover:text-brand-pink-700 transition-colors">
                        {item.name}
                      </h3>
                      {item.tagline && (
                        <p className="text-xs text-brand-charcoal/40 mt-0.5">{item.tagline}</p>
                      )}
                    </div>
                    <span className="font-sans text-sm text-brand-pink-600 whitespace-nowrap">
                      {formatCurrency(Number(item.price))}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Garden Rose Wall", price: 350 },
                { name: "Greenery Wall", price: 325 },
                { name: "360° Photo Booth", price: 495 },
                { name: "Pampas Arch", price: 275 },
              ].map((item, i) => (
                <Link key={item.name} href="/v2/rentals" className={`group block ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                  <div className={`bg-gradient-to-br from-brand-pink-50 to-brand-pink-100 flex items-center justify-center ${
                    i === 0 ? "aspect-square" : "aspect-[3/4]"
                  }`}>
                    <span className="text-brand-pink-300 font-serif text-lg italic">{item.name}</span>
                  </div>
                  <div className="mt-4 flex items-start justify-between">
                    <h3 className="font-serif text-lg text-brand-charcoal">{item.name}</h3>
                    <span className="font-sans text-sm text-brand-pink-600">{formatCurrency(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Process ──────────────────────────────────────────────────── */}
      <section className="py-28 bg-brand-pink-50/50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-20">
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-pink-500 mb-3">
              How it works
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-brand-charcoal">
              Three simple steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
            {process.map((step) => (
              <div key={step.num} className="text-center">
                <span className="inline-block font-serif text-6xl text-brand-pink-200 mb-6">
                  {step.num}
                </span>
                <h3 className="font-serif text-2xl text-brand-charcoal mb-3">{step.title}</h3>
                <p className="text-sm text-brand-charcoal/50 leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Split CTA ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
        <div className="relative">
          <Image
            src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1000&q=85"
            alt="Romantic wedding setting"
            fill
            className="object-cover"
          />
        </div>
        <div className="bg-brand-charcoal flex items-center px-8 md:px-20 py-20">
          <div>
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-pink-400 mb-4">
              Ready to begin?
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-white leading-tight mb-6">
              Your story<br />deserves a<br />beautiful backdrop
            </h2>
            <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm">
              Limited dates available each season. Reserve your rental
              now to make sure your day is exactly as you imagined.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-3 bg-white text-brand-charcoal px-8 py-4 font-sans text-[11px] tracking-[0.25em] uppercase hover:bg-brand-pink-50 transition-colors"
              >
                Book Your Date
              </Link>
              <Link
                href="/inquiry"
                className="inline-flex items-center justify-center gap-3 border border-white/20 text-white/70 px-8 py-4 font-sans text-[11px] tracking-[0.25em] uppercase hover:border-white/40 hover:text-white transition-all"
              >
                Ask a Question
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-pink-500 mb-3">
              Kind Words
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-brand-charcoal">
              From our couples
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="border border-brand-pink-100 p-10">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className="fill-brand-pink-400 text-brand-pink-400" />
                  ))}
                </div>
                <p className="font-serif text-lg text-brand-charcoal/80 italic leading-relaxed mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-brand-pink-100 pt-5">
                  <p className="font-sans text-sm font-medium text-brand-charcoal">{t.author}</p>
                  <p className="font-sans text-xs text-brand-charcoal/40 mt-1">{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Instagram ────────────────────────────────────────────────── */}
      <section className="py-14 bg-brand-pink-50/50">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-charcoal/30 mb-2">
            Follow along
          </p>
          <a
            href="https://instagram.com/thewildflowervault"
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif text-2xl text-brand-charcoal/60 hover:text-brand-charcoal transition-colors"
          >
            @thewildflowervault
          </a>
        </div>
      </section>
    </>
  );
}
