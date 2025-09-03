"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <header className="w-full fixed top-0 left-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-bold tracking-tight text-white">
          Metric
        </Link>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse bg-gray-200 rounded-md"></div>
          ) : session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Borrower Dashboard</Button>
              </Link>
              <Link href="/lender-dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Lender Dashboard</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Profile</Button>
              </Link>
              <Button onClick={() => signOut()} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => signIn()} size="sm" className="bg-white text-black hover:bg-white/90">
              Sign In / Sign Up
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}