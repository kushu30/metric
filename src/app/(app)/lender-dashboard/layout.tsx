// src/app/(app)/lender-dashboard/layout.tsx
import Link from "next/link";
import { CircleGauge, Briefcase, User } from "lucide-react";

export default function LenderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r p-6">
        <nav className="space-y-4">
          <Link href="/lender-dashboard" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <CircleGauge size={20} />
            <span>Overview</span>
          </Link>
          <Link href="/lender-dashboard/portfolio" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <Briefcase size={20} />
            <span>My Portfolio</span>
          </Link>
          <Link href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <User size={20} />
            <span>Profile</span>
          </Link>
        </nav>
      </aside>
      <div className="flex-1 p-8 bg-gray-50">
        {children}
      </div>
    </div>
  );
}