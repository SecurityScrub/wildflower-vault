import Link from "next/link";
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-charcoal text-white">
      {/* Main footer */}
      <div className="container mx-auto px-6 max-w-7xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="mb-6">
              <div className="font-serif text-2xl tracking-[0.2em] text-white">
                THE WILD FLOWER
              </div>
              <div className="font-sans text-xs tracking-[0.5em] uppercase text-brand-pink-500 mt-1">
                VAULT
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Wedding planning, event coordination, and elegant rental pieces for
              celebrations throughout Iowa.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/thewildflowervault"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-400 hover:text-brand-pink-500 transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com/thewildflowervault"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gray-400 hover:text-brand-pink-500 transition-colors"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Rentals */}
          <div>
            <h3 className="font-sans text-xs tracking-[0.25em] uppercase text-brand-pink-500 mb-5">
              Rentals
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Flower Walls", href: "/rentals?category=flower-walls" },
                { label: "Photo Booths", href: "/rentals?category=photo-booths" },
                { label: "Backdrops", href: "/rentals?category=backdrops" },
                { label: "All Rentals", href: "/rentals" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-sans text-xs tracking-[0.25em] uppercase text-brand-pink-500 mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Wedding Planning", href: "/inquiry" },
                { label: "Event Planning", href: "/inquiry" },
                { label: "Book a Rental", href: "/book" },
                { label: "My Account", href: "/portal" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-sans text-xs tracking-[0.25em] uppercase text-brand-pink-500 mb-5">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin size={14} className="mt-0.5 shrink-0 text-brand-pink-500" />
                Des Moines, Iowa & surrounding areas
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail size={14} className="shrink-0 text-brand-pink-500" />
                <a
                  href="mailto:hello@thewildflowervault.com"
                  className="hover:text-white transition-colors"
                >
                  hello@thewildflowervault.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 max-w-7xl py-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} The Wild Flower Vault. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
