import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";

export function FooterV2() {
  return (
    <footer className="bg-[#2A1F1E]">
      <div className="max-w-6xl mx-auto px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="mb-8">
              <span className="font-serif text-3xl tracking-[0.1em] text-white/90">
                The Wildflower Vault
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
              Curated flower walls, backdrops, and photo experiences
              for weddings and celebrations across Iowa.
            </p>
            <div className="flex gap-5">
              <a
                href="https://instagram.com/thewildflowervault"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://facebook.com/thewildflowervault"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-3">
            <h3 className="font-sans text-[10px] tracking-[0.35em] uppercase text-white/30 mb-6">
              Explore
            </h3>
            <ul className="space-y-4">
              {[
                { label: "Collection", href: "/v2/rentals" },
                { label: "Book Now", href: "/book" },
                { label: "Get in Touch", href: "/inquiry" },
                { label: "My Account", href: "/portal" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h3 className="font-sans text-[10px] tracking-[0.35em] uppercase text-white/30 mb-6">
              Get in Touch
            </h3>
            <div className="space-y-4 text-sm text-white/40">
              <p>Des Moines, Iowa<br />& surrounding areas</p>
              <a
                href="mailto:hello@thewildflowervault.com"
                className="block hover:text-white/80 transition-colors"
              >
                hello@thewildflowervault.com
              </a>
            </div>
          </div>
        </div>

        {/* Divider + bottom */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-white/20">
            &copy; {new Date().getFullYear()} The Wild Flower Vault
          </p>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
