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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="absolute inset-0 bg-brand-orange-900/60 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=90"
          alt="Elegant flower wall backdrop at a wedding reception"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="relative z-20 text-center text-white px-5 sm:px-6 max-w-5xl mx-auto w-full animate-fade-in">
          <p className="font-sans text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase text-brand-pink-300 mb-4 sm:mb-6">
            Free Consultations · Des Moines, Iowa
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl font-light leading-[1.05] sm:leading-none mb-4 sm:mb-6">
            The Wild Flower <br />
            <em className="text-brand-pink-300">Vault</em>
          </h1>
          <p className="font-sans text-base sm:text-lg text-white/85 max-w-xl mx-auto mb-7 sm:mb-10 leading-relaxed">
            Iowa&apos;s full-service wedding planning team. Book a free consultation —
            we&apos;ll talk through your vision, timeline, and budget. No obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link
              href="/wedding-planning#inquire"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-4 bg-brand-pink-500 hover:bg-brand-pink-600 text-white font-sans text-sm font-medium tracking-widest uppercase transition-colors rounded-none gap-2"
            >
              Book Free Consultation <ArrowRight size={14} />
            </Link>
            <Link
              href="/rentals"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-4 border border-white/60 text-white font-sans text-sm font-medium tracking-widest uppercase hover:bg-white/10 transition-colors rounded-none"
            >
              Browse Rentals
            </Link>
          </div>
          <p className="font-sans text-[11px] sm:text-xs text-white/60 mt-5 sm:mt-6 tracking-wider">
            Free · 24–48 hr response · No obligation
          </p>
        </div>
      </section>

      {/* ─── Intro strip: lead with consultation value props ──────────────── */}
      <section className="bg-brand-orange-700 text-white py-5 sm:py-6">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 md:gap-12 text-center">
            {[
              { icon: <Heart size={18} />, label: "Free Consultations" },
              { icon: <Calendar size={18} />, label: "24–48 hr Response" },
              { icon: <Shield size={18} />, label: "All of Iowa" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-brand-pink-400">{item.icon}</span>
                <span className="font-sans text-[11px] sm:text-xs tracking-[0.2em] uppercase">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Consultation-focused band right under the fold ───────────────── */}
      <section className="py-14 sm:py-20 bg-brand-cream">
        <div className="container mx-auto px-5 sm:px-6 max-w-3xl text-center">
          <p className="section-subtitle">Start Here</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-orange-700 font-light leading-tight mb-5">
            Book Your Free Consultation
          </h2>
          <p className="font-sans text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl mx-auto mb-7 sm:mb-8">
            Every wedding starts with a conversation. Tell us about your day and we&apos;ll
            be in touch within 24&ndash;48 hours to set up a 30-minute consultation —
            phone, video, or in-person at our Des Moines studio.
          </p>
          <Link
            href="/wedding-planning#inquire"
            className="inline-flex items-center justify-center px-7 sm:px-8 py-4 bg-brand-pink-500 hover:bg-brand-pink-600 text-white font-sans text-sm font-medium tracking-widest uppercase transition-colors rounded-none gap-2"
          >
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ─── Featured Rentals ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="text-center mb-10 sm:mb-16">
            <p className="section-subtitle">Our Collection</p>
            <h2 className="section-title">Rental Pieces That Tell Your Story</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
              Each piece is carefully selected to create the perfect backdrop for your most
              treasured moments.
            </p>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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

          <div className="text-center mt-10 sm:mt-14">
            <Link href="/rentals" className="btn-secondary inline-flex items-center gap-2">
              Browse All Rentals <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Services ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="text-center mb-10 sm:mb-16">
            <p className="section-subtitle">Our Services</p>
            <h2 className="section-title">More Than Just Rentals</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
              From full-service planning to day-of coordination, we bring your vision to life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Heart size={24} />,
                title: "Wedding Planning",
                desc: "Full-service, partial, and day-of coordination. Venue selection, vendor curation, timelines, and day-of direction.",
                href: "/wedding-planning#inquire",
                cta: "Book Free Consultation",
                featured: true,
              },
              {
                icon: <PartyPopper size={24} />,
                title: "Event Planning",
                desc: "Birthdays, corporate events, baby showers, brand activations. We handle the logistics so you can enjoy the celebration.",
                href: "/inquiry",
                cta: "Get a Quote",
                featured: false,
              },
              {
                icon: <Sparkles size={24} />,
                title: "Rental Pieces",
                desc: "Flower walls, shimmer walls, photo booths, floral arches, and statement decor — delivered, styled, and removed.",
                href: "/rentals",
                cta: "Browse Rentals",
                featured: false,
              },
            ].map((s) => (
              <div
                key={s.title}
                className={`p-6 sm:p-8 text-center card-hover relative ${
                  s.featured
                    ? "bg-brand-pink-50 ring-2 ring-brand-pink-500"
                    : "bg-brand-cream"
                }`}
              >
                {s.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-pink-500 text-white font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1">
                    Most Popular
                  </span>
                )}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${
                    s.featured
                      ? "bg-brand-pink-500 text-white"
                      : "bg-brand-orange-100 text-brand-orange-700"
                  }`}
                >
                  {s.icon}
                </div>
                <h3 className="font-serif text-xl text-brand-orange-700 mb-3">{s.title}</h3>
                <p className="font-sans text-sm text-gray-600 leading-relaxed mb-5">{s.desc}</p>
                <Link
                  href={s.href}
                  className={`font-sans text-xs tracking-[0.2em] uppercase transition-colors inline-flex items-center gap-1.5 ${
                    s.featured
                      ? "text-brand-pink-600 hover:text-brand-pink-700 font-semibold"
                      : "text-brand-pink-500 hover:text-brand-pink-600"
                  }`}
                >
                  {s.cta} <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-brand-cream">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="text-center mb-10 sm:mb-16">
            <p className="section-subtitle">Simple Process</p>
            <h2 className="section-title">Your Perfect Day Made Easy</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
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
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange-800/80 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1400&q=85"
          alt="Romantic wedding reception"
          fill
          className="object-cover object-center"
        />
        <div className="relative z-20 container mx-auto px-5 sm:px-6 max-w-3xl text-center text-white">
          <p className="section-subtitle text-brand-pink-400 mb-5 sm:mb-6">Ready When You Are</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light leading-tight mb-5 sm:mb-6">
            Let&apos;s Plan the Wedding You&apos;ve Dreamed About
          </h2>
          <p className="font-sans text-white/80 mb-8 sm:mb-10 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            A free 30-minute consultation is the easiest way to start. Tell us about your
            day and we&apos;ll respond within 24&ndash;48 hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto mb-6">
            <Link
              href="/wedding-planning#inquire"
              className="inline-flex items-center justify-center px-7 sm:px-8 py-4 bg-brand-pink-500 hover:bg-brand-pink-600 text-white font-sans text-sm font-medium tracking-widest uppercase transition-colors rounded-none gap-2"
            >
              Book Free Consultation <ArrowRight size={14} />
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-7 sm:px-8 py-4 border border-white/60 text-white font-sans text-sm font-medium tracking-widest uppercase hover:bg-white/10 transition-colors rounded-none"
            >
              Reserve a Rental
            </Link>
          </div>
          <p className="font-sans text-[11px] sm:text-xs text-white/60 tracking-wider">
            Free · 24–48 hr response · No obligation
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="text-center mb-10 sm:mb-16">
            <p className="section-subtitle">Love Stories</p>
            <h2 className="section-title">What Couples Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-brand-cream p-6 sm:p-8 relative">
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
