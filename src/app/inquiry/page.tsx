import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";

export const metadata: Metadata = {
  title: "Inquire",
  description:
    "Have a question about our rental pieces? Send us a message and we'll get back to you within 24 hours.",
};

export default function InquiryPage() {
  return (
    <>
      <section className="pt-32 pb-16 bg-brand-cream">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <p className="section-subtitle">Get in Touch</p>
          <h1 className="section-title">Send an Inquiry</h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-sans text-sm leading-relaxed">
            Not sure what you need? Tell us about your event and we&apos;ll help you find the
            perfect pieces. We respond within 24–48 hours.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-2xl">
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
