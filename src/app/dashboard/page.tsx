"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import LoanRequestForm from "@/components/LoanRequestForm";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [creditScore, setCreditScore] = useState<number | null>(null);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    redirect("/");
  }

  const handleLoanSubmitted = (data: { creditScore: number }) => {
    setCreditScore(data.creditScore);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-6xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Borrower Dashboard</h1>
          <SignOutButton />
        </header>
        
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
             <LoanRequestForm onLoanSubmitted={handleLoanSubmitted} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-600">Your Credit Score</h2>
            <p className="text-5xl font-bold text-blue-600">
              {creditScore ?? "N/A"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {creditScore ? "Based on your latest request." : "Submit a loan request to see your score."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}