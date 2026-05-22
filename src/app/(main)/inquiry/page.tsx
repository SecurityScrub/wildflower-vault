import type { Metadata } from "next";
import Image from "next/image";
import { InquiryForm } from "@/components/InquiryForm";
import { Sparkles, Heart, PartyPopper } from "lucide-react";

export const metadata: Metadata = {
  title: "Get in Touch",
  description:
    "Reach out for wedding planning, event planning, or rental inquiries. We'll help bring your vision to life in Des Moines and beyond.",
};

const services = [
  {
    icon: <Heart size={24} />,
    title: "Wedding Planning",
    desc: "From intimate ceremonies to grand receptions — we handle the details so you can enjoy every moment. Venue coordination, vendor management, timelines, and day-of direction.",
  },
  {
    icon: <PartyPopper size={24} />,
    title: "Event Planning",
    desc: "Birthdays, corporate galas, baby showers, brand activations, grand openings — whatever the occasion, we create experiences your guests won't forget.",
  },
  {
    icon: <Sparkles size={24} />,
    title: "Rental Pieces",
    desc: "Flower walls, shimmer walls, photo booths, floral arches, and statement decor — delivered, set up, and removed. The finishing touch that transforms any space.",
  },
];

export default function InquiryPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange-800/80 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1478146059778-26028b07395a?w=1600&q=85"
          alt="Elegant event setup"
          fill
          className="object-cover"
        />
        <div className="relative z-20 container mx-auto px-6 max-w-7xl text-center text-white">
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand-pink-300 mb-4">
            Let&apos;s Create Something Beautiful
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-light leading-tight mb-6">
            Tell Us About Your Vision
          </h1>
          <p className="font-sans text-white/70 max-w-xl mx-auto text-sm leading-relaxed">
            Whether you need a full-service wedding planner, an event coordinator, or a
            show-stopping backdrop — we&apos;re here to make it happen.
          </p>
        </div>
      </section>

      {/* Services overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-14">
            <p className="section-subtitle">What We Offer</p>
            <h2 className="section-title">Planning, Coordination &amp; Rentals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((s) => (
              <div key={s.title} className="bg-brand-cream p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-brand-orange-100 flex items-center justify-center mx-auto mb-5 text-brand-orange-700">
                  {s.icon}
                </div>
                <h3 className="font-serif text-xl text-brand-orange-700 mb-3">{s.title}</h3>
                <p className="font-sans text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section className="py-20 bg-brand-cream">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-12">
            <p className="section-subtitle">Get Started</p>
            <h2 className="font-serif text-3xl md:text-4xl text-brand-orange-700 font-light">
              Send Us a Message
            </h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto font-sans text-sm leading-relaxed">
              Tell us about your event and what you&apos;re looking for.
              We&apos;ll be in touch within 24–48 hours.
            </p>
          </div>
          <div className="bg-white p-8 md:p-10 shadow-sm">
            <InquiryForm />
          </div>
        </div>
      </section>

      {/* Bottom trust strip */}
      <section className="py-12 bg-brand-orange-700 text-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-serif text-2xl mb-1">24–48 hr</p>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-white/60">Response Time</p>
            </div>
            <div>
              <p className="font-serif text-2xl mb-1">Des Moines &amp; Beyond</p>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-white/60">Serving All of Iowa</p>
            </div>
            <div>
              <p className="font-serif text-2xl mb-1">No Obligation</p>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-white/60">Free Consultations</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
