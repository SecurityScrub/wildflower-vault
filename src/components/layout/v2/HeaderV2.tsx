"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/v2/rentals", label: "Collection" },
  { href: "/book", label: "Book" },
  { href: "/inquiry", label: "Contact" },
];

export function HeaderV2() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-8">
        <div className="flex items-center justify-between h-24">
          <Link href="/v2" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="The Wildflower Vault"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
              priority
            />
            <div className={`transition-colors duration-500 ${scrolled ? "text-brand-charcoal" : "text-white"}`}>
              <span className="font-serif text-lg tracking-[0.15em]">The Wildflower</span>
              <span className="block font-sans text-[10px] tracking-[0.4em] uppercase opacity-60">Vault</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans text-[11px] tracking-[0.25em] uppercase transition-colors duration-300 hover:opacity-100 ${
                  scrolled ? "text-brand-charcoal/70 hover:text-brand-charcoal" : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book"
              className={`font-sans text-[11px] tracking-[0.25em] uppercase px-6 py-2.5 border transition-all duration-300 ${
                scrolled
                  ? "border-brand-charcoal/20 text-brand-charcoal hover:bg-brand-charcoal hover:text-white"
                  : "border-white/30 text-white hover:bg-white hover:text-brand-charcoal"
              }`}
            >
              Reserve
            </Link>
          </div>

          <button
            className={`md:hidden p-2 transition-colors ${scrolled ? "text-brand-charcoal" : "text-white"}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="md:hidden bg-white">
          <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-serif text-2xl text-brand-charcoal/80 hover:text-brand-charcoal"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setIsOpen(false)}
              className="mt-4 text-center font-sans text-[11px] tracking-[0.25em] uppercase px-6 py-3 bg-brand-charcoal text-white"
            >
              Reserve Your Date
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
