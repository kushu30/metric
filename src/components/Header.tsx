"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <header className="w-full bg-white shadow-sm border-b">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          Metric
        </Link>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse bg-gray-200 rounded-md"></div>
          ) : session ? (
            <>
              {(session.user?.role === "borrower" || session.user?.role === "both") && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Borrower Dashboard</Button>
                </Link>
              )}
              {(session.user?.role === "lender" || session.user?.role === "both") && (
                <Link href="/lender-dashboard">
                  <Button variant="ghost" size="sm">Lender Dashboard</Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="ghost" size="sm">Profile</Button>
              </Link>
              <Button onClick={() => signOut()} size="sm" variant="outline">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => signIn()} size="sm">
              Sign In / Sign Up
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}