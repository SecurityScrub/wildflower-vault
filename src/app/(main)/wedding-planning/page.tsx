import type { Metadata } from "next";
import Image from "next/image";
import { WeddingPlanningForm } from "@/components/WeddingPlanningForm";
import { Heart, Calendar, Sparkles, ClipboardCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Wedding Planning – The Wild Flower Vault",
  description:
    "Full-service, partial, and day-of wedding planning in Des Moines, Iowa. Request a free consultation with The Wild Flower Vault.",
};

const highlights = [
  {
    icon: <Heart size={22} />,
    title: "A Planner Who Gets You",
    desc: "We listen first. Every wedding starts with understanding your story, style, and what matters most.",
  },
  {
    icon: <ClipboardCheck size={22} />,
    title: "Every Detail Handled",
    desc: "Venue, vendors, timelines, contracts, logistics — we manage it all so you can be fully present.",
  },
  {
    icon: <Sparkles size={22} />,
    title: "Beautiful, Cohesive Design",
    desc: "Florals, decor, rental pieces, and styling that tie your whole day together effortlessly.",
  },
  {
    icon: <Calendar size={22} />,
    title: "Day-Of Confidence",
    desc: "On your wedding day, your only job is to enjoy it. We handle every moving piece behind the scenes.",
  },
];

const packages = [
  {
    name: "Full-Service Planning",
    tagline: "From engagement to send-off.",
    desc: "We design, plan, and execute every detail — venue selection, vendor curation, timeline, design, and day-of direction.",
    bestFor: "Couples who want a partner from day one.",
  },
  {
    name: "Partial Planning",
    tagline: "We pick up where you left off.",
    desc: "You've started — we step in to fill the gaps, manage vendors, finalize details, and run the day.",
    bestFor: "Couples who've booked the basics and need expert help.",
  },
  {
    name: "Day-Of Coordination",
    tagline: "Hand us the keys.",
    desc: "Beginning four to six weeks out, we finalize timelines, confirm vendors, and manage your full wedding day.",
    bestFor: "Couples who planned it themselves and want a seamless day.",
  },
];

export default function WeddingPlanningPage() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange-900/65 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=85"
          alt="Romantic wedding ceremony with floral arch"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="relative z-20 container mx-auto px-6 max-w-4xl text-center text-white">
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand-pink-300 mb-5">
            Wedding Planning &amp; Coordination
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight mb-6">
            Your Day, <em className="text-brand-pink-300">Beautifully</em> Planned
          </h1>
          <p className="font-sans text-white/80 max-w-2xl mx-auto text-base leading-relaxed mb-10">
            From the first vision board to the final send-off, The Wild Flower Vault
            handles every detail so you can be present for every moment.
          </p>
          <a
            href="#inquire"
            className="btn-gold inline-flex"
          >
            Request a Consultation
          </a>
        </div>
      </section>

      {/* ─── Why us ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <p className="section-subtitle">Why The Wild Flower Vault</p>
            <h2 className="section-title">Planning That Feels Effortless</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((h) => (
              <div key={h.title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-brand-orange-100 flex items-center justify-center mx-auto mb-5 text-brand-orange-700">
                  {h.icon}
                </div>
                <h3 className="font-serif text-lg text-brand-orange-700 mb-3">{h.title}</h3>
                <p className="font-sans text-sm text-gray-500 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Packages ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-brand-cream">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <p className="section-subtitle">Planning Packages</p>
            <h2 className="section-title">Pick the Level of Support You Need</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
              Three core packages, each fully customizable to your wedding.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((p) => (
              <div key={p.name} className="bg-white p-8 card-hover flex flex-col">
                <h3 className="font-serif text-2xl text-brand-orange-700 mb-2">{p.name}</h3>
                <p className="font-sans text-xs tracking-widest uppercase text-brand-pink-500 mb-4">
                  {p.tagline}
                </p>
                <p className="font-sans text-sm text-gray-500 leading-relaxed mb-5">{p.desc}</p>
                <div className="mt-auto pt-5 border-t border-gray-100">
                  <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Best for</p>
                  <p className="font-sans text-sm text-brand-orange-700">{p.bestFor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Inquiry form ─────────────────────────────────────────────────── */}
      <section id="inquire" className="py-20 bg-white scroll-mt-24">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-12">
            <p className="section-subtitle">Let&apos;s Talk</p>
            <h2 className="font-serif text-3xl md:text-4xl text-brand-orange-700 font-light">
              Tell Us About Your Wedding
            </h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto font-sans text-sm leading-relaxed">
              Share a few details and we&apos;ll be in touch within 24&ndash;48 hours
              to schedule your complimentary consultation.
            </p>
          </div>
          <div className="bg-brand-cream p-8 md:p-10 shadow-sm">
            <WeddingPlanningForm />
          </div>
        </div>
      </section>

      {/* ─── Trust strip ──────────────────────────────────────────────────── */}
      <section className="py-12 bg-brand-orange-700 text-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-serif text-2xl mb-1">Free</p>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-white/60">
                Consultations
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl mb-1">24&ndash;48 hr</p>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-white/60">
                Response Time
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl mb-1">Des Moines &amp; Beyond</p>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-white/60">
                Serving All of Iowa
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
