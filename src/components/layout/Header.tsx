"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/rentals", label: "Rentals" },
  { href: "/book", label: "Book Now" },
  { href: "/inquiry", label: "Inquire" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-6 max-w-7xl" aria-label="Main navigation">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex flex-col items-start leading-none group"
            aria-label="The Wild Flower Vault – Home"
          >
            <span
              className={cn(
                "font-serif text-xl tracking-[0.2em] transition-colors",
                scrolled ? "text-brand-green-700" : "text-white"
              )}
            >
              THE WILD FLOWER
            </span>
            <span
              className={cn(
                "font-sans text-xs tracking-[0.5em] uppercase transition-colors",
                scrolled ? "text-brand-gold-500" : "text-brand-gold-300"
              )}
            >
              VAULT
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-sans text-xs tracking-[0.2em] uppercase transition-colors hover:text-brand-gold-500",
                  scrolled ? "text-brand-charcoal" : "text-white/90"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className={cn("h-4 w-px", scrolled ? "bg-gray-200" : "bg-white/30")} />

            {session ? (
              <Link
                href={
                  (session.user as typeof session.user & { role?: string })?.role === "ADMIN"
                    ? "/admin"
                    : "/portal"
                }
                className={cn(
                  "flex items-center gap-1.5 font-sans text-xs tracking-[0.2em] uppercase transition-colors hover:text-brand-gold-500",
                  scrolled ? "text-brand-charcoal" : "text-white/90"
                )}
              >
                <User size={14} />
                {(session.user as typeof session.user & { role?: string })?.role === "ADMIN"
                  ? "Admin"
                  : "My Account"}
              </Link>
            ) : (
              <Link
                href="/portal/auth/signin"
                className={cn(
                  "flex items-center gap-1.5 font-sans text-xs tracking-[0.2em] uppercase transition-colors hover:text-brand-gold-500",
                  scrolled ? "text-brand-charcoal" : "text-white/90"
                )}
              >
                <User size={14} />
                Sign In
              </Link>
            )}

            <Link href="/book" className="btn-gold text-xs py-2.5 px-6">
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "md:hidden p-2 transition-colors",
              scrolled ? "text-brand-charcoal" : "text-white"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-sans text-sm tracking-[0.2em] uppercase text-brand-charcoal hover:text-brand-green-700"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-100" />
            {session ? (
              <Link
                href="/portal"
                onClick={() => setIsOpen(false)}
                className="font-sans text-sm tracking-[0.2em] uppercase text-brand-charcoal hover:text-brand-green-700"
              >
                My Account
              </Link>
            ) : (
              <Link
                href="/portal/auth/signin"
                onClick={() => setIsOpen(false)}
                className="font-sans text-sm tracking-[0.2em] uppercase text-brand-charcoal hover:text-brand-green-700"
              >
                Sign In
              </Link>
            )}
            <Link href="/book" onClick={() => setIsOpen(false)} className="btn-primary text-center">
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
