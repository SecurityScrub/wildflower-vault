"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Settings,
  Package,
  MessageSquare,
  Heart,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  CalendarOff,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/rentals", label: "Rentals", icon: Package },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/time-off", label: "Time Off", icon: CalendarOff },
  { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/admin/wedding-planning-leads", label: "Wedding Leads", icon: Heart },
  { href: "/admin/consultations", label: "Consultations", icon: ClipboardList },
  { href: "/admin/weddings", label: "Weddings", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll when drawer open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  const activeItem = NAV_ITEMS.find((item) => isActive(pathname, item.href));

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-brand-orange-700 flex items-center px-4 lg:px-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="lg:hidden -ml-2 mr-2 p-2 text-white/90 hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link href="/admin" className="flex items-center gap-3 min-w-0">
          <span className="font-serif text-white text-base lg:text-lg tracking-wider truncate">
            <span className="hidden sm:inline">Wild Flower Vault</span>
            <span className="sm:hidden">WFV</span>
          </span>
          <span className="bg-brand-pink-500 text-white text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 font-sans tracking-wider uppercase shrink-0">
            Admin
          </span>
        </Link>

        {/* Current section label on mobile */}
        {activeItem && (
          <span className="lg:hidden ml-3 text-white/70 text-xs font-sans uppercase tracking-wider truncate">
            · {activeItem.label}
          </span>
        )}

        <div className="ml-auto flex items-center gap-3 lg:gap-4 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline text-white/60 hover:text-white text-xs font-sans"
          >
            View Site ↗
          </Link>
          <a
            href="/api/auth/signout"
            className="text-white/60 hover:text-white p-1"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </a>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 bg-white border-r border-gray-100 fixed left-0 top-14 bottom-0 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 font-sans text-sm rounded-sm transition-colors ${
                  active
                    ? "bg-brand-orange-50 text-brand-orange-700"
                    : "text-gray-600 hover:bg-brand-orange-50 hover:text-brand-orange-700"
                }`}
              >
                <span className="text-brand-pink-500">
                  <Icon size={16} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-black/40"
          aria-label="Close menu"
        />
        <div
          className={`relative h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-14 bg-brand-orange-700 flex items-center px-4 shrink-0">
            <span className="font-serif text-white text-lg tracking-wider">
              Wild Flower Vault
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto text-white/80 hover:text-white p-1"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 font-sans text-sm rounded-sm transition-colors ${
                    active
                      ? "bg-brand-orange-50 text-brand-orange-700"
                      : "text-gray-700 hover:bg-brand-orange-50 hover:text-brand-orange-700"
                  }`}
                >
                  <span className="text-brand-pink-500">
                    <Icon size={18} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 p-3 space-y-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-gray-600 hover:bg-gray-50 rounded-sm"
            >
              View Site ↗
            </Link>
            <a
              href="/api/auth/signout"
              className="flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-gray-600 hover:bg-gray-50 rounded-sm"
            >
              <LogOut size={16} />
              Sign out
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
