import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Settings,
  Package,
  MessageSquare,
  LogOut,
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/admin/orders", label: "Orders", icon: <ShoppingBag size={16} /> },
    { href: "/admin/rentals", label: "Rentals", icon: <Package size={16} /> },
    { href: "/admin/calendar", label: "Calendar", icon: <Calendar size={16} /> },
    { href: "/admin/inquiries", label: "Inquiries", icon: <MessageSquare size={16} /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-brand-orange-700 flex items-center px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="font-serif text-white text-lg tracking-wider">Wild Flower Vault</span>
          <span className="bg-brand-pink-500 text-white text-xs px-2 py-0.5 font-sans tracking-wider uppercase">
            Admin
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" target="_blank" className="text-white/60 hover:text-white text-xs font-sans">
            View Site ↗
          </Link>
          <a href="/api/auth/signout" className="text-white/60 hover:text-white">
            <LogOut size={16} />
          </a>
        </div>
      </div>

      <div className="flex pt-14 min-h-screen">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-100 fixed left-0 top-14 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-gray-600 hover:bg-brand-orange-50 hover:text-brand-orange-700 rounded-sm transition-colors"
              >
                <span className="text-brand-pink-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="ml-56 flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
