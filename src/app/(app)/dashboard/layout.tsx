import Link from "next/link";
import { CircleGauge, HandCoins, Landmark, User } from "lucide-react";

// This layout will wrap all pages inside the /dashboard route
export default function BorrowerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r p-6">
        <nav className="space-y-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <CircleGauge size={20} />
            <span>Overview</span>
          </Link>
          <Link href="/dashboard/request" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <Landmark size={20} />
            <span>Request Loan</span>
          </Link>
          <Link href="/dashboard/repayments" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <HandCoins size={20} />
            <span>Repayments</span>
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