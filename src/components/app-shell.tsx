"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, FileText, Settings, LogOut, Shield, Home, Trophy } from "lucide-react";
import { TargetAchievementNotification } from "@/components/target-achievement-notification";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/signin" });
  };

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="text-xl font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            Aquarious CRM
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Main Section */}
          <div className="mb-6">
            <div className="space-y-1">
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Sales Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Sales
            </h3>
            <div className="space-y-1">
              <Link href="/leads">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Users className="w-4 h-4" />
                  Leads
                </Button>
              </Link>
              <Link href="/pipeline">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <BarChart3 className="w-4 h-4" />
                  Pipeline
                </Button>
              </Link>
              <Link href="/achievements">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Trophy className="w-4 h-4" />
                  Achievements
                </Button>
              </Link>
            </div>
          </div>


          {/* Admin Section - Only show for admins */}
          {session?.user?.role === "ADMIN" && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                Administration
              </h3>
              <div className="space-y-1">
                <Link href="/admin">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{session?.user?.name || "User"}</div>
              <div className="text-xs text-slate-400">{session?.user?.email}</div>
              <div className="text-xs text-purple-400 font-medium">
                {session?.user?.role === "ADMIN" ? "Administrator" : "User"}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1 gap-2 text-slate-300 hover:text-white">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 gap-2 text-slate-300 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-900">
        <div className="p-8">
          {children}
        </div>
      </main>

      {/* Global Target Achievement Notifications */}
      <TargetAchievementNotification />
    </div>
  );
}
