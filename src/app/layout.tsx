import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthSessionProvider from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Aquarious CRM",
  description: "Lightweight internal CRM for Aquarious.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <AuthSessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
