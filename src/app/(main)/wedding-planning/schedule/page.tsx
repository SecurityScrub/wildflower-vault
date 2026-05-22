import Link from "next/link";
import { ConsultationForm } from "@/components/ConsultationForm";

export const metadata = {
  title: "Schedule a Consultation — The Wild Flower Vault",
  description:
    "Book a complimentary 30-minute wedding planning consultation with The Wild Flower Vault.",
};

export default async function SchedulePage(props: {
  searchParams: Promise<{ name?: string; email?: string; partner?: string; phone?: string; leadId?: string }>;
}) {
  const sp = await props.searchParams;

  return (
    <div className="bg-brand-cream-50 min-h-screen">
      <section className="bg-brand-orange-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20 text-center">
          <p className="font-sans text-xs uppercase tracking-widest text-brand-pink-200 mb-3">
            Wedding Planning &middot; Free Consultation
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-4">
            Let&rsquo;s find a time to chat
          </h1>
          <p className="font-sans text-base text-white/80 max-w-xl mx-auto">
            Pick any 30-minute slot below. You&rsquo;ll get a calendar invite by email — no phone tag.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <div className="bg-white p-8 sm:p-10 shadow-sm">
          <ConsultationForm
            defaultName={sp.name ?? ""}
            defaultEmail={sp.email ?? ""}
            defaultPartnerName={sp.partner ?? ""}
            defaultPhone={sp.phone ?? ""}
            leadId={sp.leadId}
          />
        </div>

        <div className="text-center mt-8">
          <p className="font-sans text-sm text-gray-500">
            Not ready to schedule yet?{" "}
            <Link href="/wedding-planning" className="text-brand-orange-700 hover:underline">
              Submit a written inquiry instead →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
