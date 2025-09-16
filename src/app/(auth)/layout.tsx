import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in • Aquarious CRM",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid md:grid-cols-2 bg-gradient-to-b from-background to-muted/20">
      {/* Left brand panel (hidden on small screens) */}
      <div className="hidden md:flex items-center justify-center p-10">
        <div className="max-w-md w-full card p-8 space-y-6">
          <div className="text-2xl font-semibold">Aquarious CRM</div>
          <p className="text-sm text-muted-foreground">
            Lightweight internal CRM for lead management with zero vendor lock-in.
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• Centralize leads from website, LinkedIn, WhatsApp</li>
            <li>• Quick search & status pipeline</li>
            <li>• CSV import with column mapping</li>
          </ul>
          <div className="text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} Aquarious Technology Pvt. Ltd.
          </div>
        </div>
      </div>

      {/* Right: auth form slot */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
