import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { LayoutDashboard, Calendar, User, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/portal/auth/signin");
  }

  const navItems = [
    { href: "/portal", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/portal/bookings", label: "My Bookings", icon: <Calendar size={16} /> },
    { href: "/portal/account", label: "Account", icon: <User size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="pt-20 container mx-auto px-6 max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 sticky top-28">
              <div className="mb-6">
                <p className="font-serif text-lg text-brand-orange-700">
                  {session?.user?.name ?? "Welcome back"}
                </p>
                <p className="font-sans text-xs text-gray-400 mt-1">{session?.user?.email}</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-gray-600 hover:bg-brand-orange-50 hover:text-brand-orange-700 transition-colors"
                  >
                    <span className="text-brand-pink-500">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <hr className="my-3 border-gray-100" />
                <a
                  href="/api/auth/signout"
                  className="flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </a>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
