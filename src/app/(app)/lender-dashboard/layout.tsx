// src/app/(app)/lender-dashboard/layout.tsx
import Link from "next/link";
import { CircleGauge, Briefcase, User } from "lucide-react";

export default function LenderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen relative">
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(600px_260px_at_10%_10%,rgba(16,185,129,.08),transparent_40%),radial-gradient(700px_300px_at_90%_80%,rgba(99,102,241,.06),transparent_45%)]" />
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] p-6 text-white/80">
        <nav className="space-y-4">
          <Link href="/lender-dashboard" className="flex items-center space-x-2 hover:text-white">
            <CircleGauge size={20} />
            <span>Overview</span>
          </Link>
          <Link href="/lender-dashboard/portfolio" className="flex items-center space-x-2 hover:text-white">
            <Briefcase size={20} />
            <span>My Portfolio</span>
          </Link>
          <Link href="/profile" className="flex items-center space-x-2 hover:text-white">
            <User size={20} />
            <span>Profile</span>
          </Link>
        </nav>
      </aside>
      <div className="flex-1 p-8 relative z-10">
        {children}
      </div>
    </div>
  );
}

