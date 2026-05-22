import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Star, ChevronRight, ArrowRight, Calendar, Shield, Heart, Sparkles, PartyPopper } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Wild Flower Vault | Wedding & Event Planning, Rentals – Des Moines, Iowa",
  description:
    "Wedding planning, event coordination, and rental pieces — flower walls, photo booths, and backdrops. Serving Des Moines and all of Iowa.",
};

async function getFeaturedRentals() {
  return prisma.rentalItem.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });
}

const testimonials = [
  {
    quote:
      "The flower wall was absolutely breathtaking. Our photos turned out stunning and our guests couldn't stop talking about it.",
    author: "Emily & Jake",
    event: "Wedding at The Bricks Event Center",
    rating: 5,
  },
  {
    quote:
      "From booking to day-of delivery, everything was seamless. The Wild Flower Vault made our vision come to life.",
    author: "Madison S.",
    event: "Bridal Shower",
    rating: 5,
  },
  {
    quote:
      "Professional, beautiful, and exactly what we wanted. Would book again in a heartbeat.",
    author: "Sarah & Tyler",
    event: "Wedding Reception",
    rating: 5,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Browse & Choose",
    desc: "Explore our curated collection of photo walls, flower walls, and photo booths. Filter by style and size.",
  },
  {
    step: "02",
    title: "Check Availability",
    desc: "Select your event date to see real-time availability. No double-bookings, ever.",
  },
  {
    step: "03",
    title: "Secure Your Date",
    desc: "Reserve with a deposit via our secure Square checkout. Receive instant confirmation.",
  },
  {
    step: "04",
    title: "We Handle the Rest",
    desc: "We deliver, set up, and break down everything. You focus on celebrating.",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedRentals();

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange-900/60 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=90"
          alt="Elegant flower wall backdrop at a wedding reception"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="relative z-20 text-center text-white px-6 max-w-5xl mx-auto animate-fade-in">
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand-pink-300 mb-6">
            Wedding &amp; Event Rentals · Des Moines, Iowa
          </p>
          <h1 className="font-serif text-6xl md:text-8xl font-light leading-none mb-6">
            The Wild Flower <br />
            <em className="text-brand-pink-300">Vault</em>
          </h1>
          <p className="font-sans text-lg text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
            Wedding planning, event coordination, and stunning rental pieces —
            flower walls, photo booths, and backdrops that transform any occasion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rentals" className="btn-gold">
              View Rentals
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-white/60 text-white font-sans text-sm font-medium tracking-widest uppercase hover:bg-white/10 transition-colors rounded-none"
            >
              Book Your Date
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/60">
          <span className="font-sans text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-12 bg-white/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── Intro strip ─────────────────────────────────────────────────── */}
      <section className="bg-brand-orange-700 text-white py-6">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center">
            {[
              { icon: <Calendar size={18} />, label: "Easy Online Booking" },
              { icon: <Shield size={18} />, label: "Secure Square Payments" },
              { icon: <Heart size={18} />, label: "Delivery & Setup Included" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-brand-pink-400">{item.icon}</span>
                <span className="font-sans text-xs tracking-[0.2em] uppercase">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Rentals ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <p className="section-subtitle">Our Collection</p>
            <h2 className="section-title">Rental Pieces That Tell Your Story</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
              Each piece is carefully selected to create the perfect backdrop for your most
              treasured moments.
            </p>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((item) => (
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
                      <div className="absolute inset-0 flex items-center justify-center bg-brand-orange-50">
                        <span className="text-brand-orange-300 font-serif text-lg">{item.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-brand-orange-900/0 group-hover:bg-brand-orange-900/20 transition-colors duration-300" />
                    <div className="absolute bottom-4 right-4 bg-brand-pink-500 text-white px-3 py-1.5 font-sans text-xs tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                    </div>
                  </div>
                  <div className="pt-5 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif text-xl text-brand-orange-700">{item.name}</h3>
                        {item.tagline && (
                          <p className="font-sans text-xs text-gray-400 mt-1">{item.tagline}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-sans text-sm font-semibold text-brand-pink-600">
                          {formatCurrency(Number(item.price))}
                        </span>
                        <span className="text-xs text-gray-400 block">/ event</span>
                      </div>
                    </div>
                    <p className="mt-3 font-sans text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Placeholder cards when no rentals are seeded yet
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: "Garden Rose Flower Wall", price: 350, desc: "Lush roses in blush and cream, perfect for wedding ceremonies and receptions." },
                { name: "Greenery & Eucalyptus Wall", price: 325, desc: "Cascading greenery with eucalyptus for a romantic, garden-inspired feel." },
                { name: "360° Photo Booth", price: 495, desc: "The ultimate party experience — slow-motion video booth your guests will love." },
                { name: "Pampas Grass Arch", price: 275, desc: "Bohemian dried pampas arch for a timeless, modern ceremony backdrop." },
                { name: "Glam Mirror Photo Booth", price: 450, desc: "Touch-screen mirror booth with custom overlays and instant printing." },
                { name: "Wildflower Meadow Wall", price: 375, desc: "A burst of seasonal wildflowers evoking an Iowa summer meadow." },
              ].map((item) => (
                <Link key={item.name} href="/rentals" className="group block card-hover">
                  <div className="relative aspect-[4/5] bg-brand-cream overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-orange-100 to-brand-orange-200 flex items-center justify-center">
                      <span className="text-brand-orange-400 font-serif text-center px-6">{item.name}</span>
                    </div>
                  </div>
                  <div className="pt-5 pb-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-serif text-xl text-brand-orange-700">{item.name}</h3>
                      <div className="text-right">
                        <span className="font-sans text-sm font-semibold text-brand-pink-600">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-xs text-gray-400 block">/ event</span>
                      </div>
                    </div>
                    <p className="mt-3 font-sans text-sm text-gray-500">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-14">
            <Link href="/rentals" className="btn-secondary inline-flex items-center gap-2">
              Browse All Rentals <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Services ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <p className="section-subtitle">Our Services</p>
            <h2 className="section-title">More Than Just Rentals</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
              From full-service planning to day-of coordination, we bring your vision to life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart size={24} />,
                title: "Wedding Planning",
                desc: "Full-service and partial planning for your big day — venue selection, vendor coordination, timeline management, and day-of direction.",
              },
              {
                icon: <PartyPopper size={24} />,
                title: "Event Planning",
                desc: "Birthdays, corporate events, baby showers, brand activations, and more. We handle the logistics so you can enjoy the celebration.",
              },
              {
                icon: <Sparkles size={24} />,
                title: "Rental Pieces",
                desc: "Flower walls, shimmer walls, photo booths, floral arches, and statement decor — delivered, styled, and removed after your event.",
              },
            ].map((s) => (
              <div key={s.title} className="bg-brand-cream p-8 text-center card-hover">
                <div className="w-14 h-14 rounded-full bg-brand-orange-100 flex items-center justify-center mx-auto mb-5 text-brand-orange-700">
                  {s.icon}
                </div>
                <h3 className="font-serif text-xl text-brand-orange-700 mb-3">{s.title}</h3>
                <p className="font-sans text-sm text-gray-500 leading-relaxed mb-5">{s.desc}</p>
                <Link href="/inquiry" className="font-sans text-xs tracking-[0.2em] uppercase text-brand-pink-500 hover:text-brand-pink-600 transition-colors inline-flex items-center gap-1.5">
                  Get a Quote <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-brand-cream">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <p className="section-subtitle">Simple Process</p>
            <h2 className="section-title">Your Perfect Day Made Easy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-brand-pink-200 -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-brand-orange-700 flex items-center justify-center mb-5">
                    <span className="font-sans text-xs text-white tracking-widest">{step.step}</span>
                  </div>
                  <h3 className="font-serif text-xl text-brand-orange-700 mb-3">{step.title}</h3>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Full-bleed CTA ───────────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange-800/80 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1400&q=85"
          alt="Romantic wedding reception"
          fill
          className="object-cover object-center"
        />
        <div className="relative z-20 container mx-auto px-6 max-w-3xl text-center text-white">
          <p className="section-subtitle text-brand-pink-400 mb-6">Reserve Your Date</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light leading-tight mb-6">
            Your Story Deserves a Beautiful Backdrop
          </h2>
          <p className="font-sans text-white/70 mb-10 text-sm leading-relaxed max-w-xl mx-auto">
            Limited dates available. Secure your rental now before your date is gone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book" className="btn-gold">
              Book Your Date
            </Link>
            <Link href="/inquiry" className="inline-flex items-center justify-center px-8 py-3.5 border border-white/50 text-white/90 font-sans text-sm font-medium tracking-widest uppercase hover:border-white hover:text-white transition-colors rounded-none">
              Ask a Question
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <p className="section-subtitle">Love Stories</p>
            <h2 className="section-title">What Couples Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-brand-cream p-8 relative">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-brand-pink-500 text-brand-pink-500" />
                  ))}
                </div>
                <p className="font-serif text-lg text-brand-orange-800 italic leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-sans font-semibold text-sm text-brand-orange-700">{t.author}</p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5">{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Instagram strip placeholder ──────────────────────────────────── */}
      <section className="bg-brand-orange-700 py-12">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-brand-pink-400 mb-2">
            Follow Along
          </p>
          <p className="font-serif text-2xl text-white mb-1">@thewildflowervault</p>
          <p className="font-sans text-xs text-white/60">Tag us in your photos!</p>
        </div>
      </section>
    </>
  );
}
