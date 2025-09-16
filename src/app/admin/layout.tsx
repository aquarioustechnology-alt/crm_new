"use client";

import AppShell from "@/components/app-shell";
import ProtectedRoute from "@/components/protected-route";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Target, Users, BarChart3 } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast-notification";

const adminNavItems = [
  {
    name: "Overview",
    href: "/admin",
    icon: BarChart3,
  },
  {
    name: "Target Management",
    href: "/admin/targets",
    icon: Target,
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requireAdmin={true}>
      <ToastProvider>
        <AppShell>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-slate-400">Manage your CRM system settings and configurations</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Settings className="w-4 h-4" />
              <span>Administrator Access</span>
            </div>
          </div>

          {/* Admin Navigation */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-1 border border-slate-600/50">
            <nav className="flex gap-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium
                      ${
                        isActive
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                          : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Admin Content */}
        <div className="space-y-6">
          {children}
        </div>
      </AppShell>
      </ToastProvider>
    </ProtectedRoute>
  );
}
