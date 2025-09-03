"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import LoanRequestForm from "@/components/LoanRequestForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Loan {
  _id: string;
  amount: number;
  duration: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  creditScore: number;
  requestedAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);

  const fetchUserLoans = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/loans/my-loans");
      if (!response.ok) throw new Error("Failed to fetch your loans.");
      const data: Loan[] = await response.json();
      setLoans(data);
      if (data.length > 0) {
        setCreditScore(data[0].creditScore);
      } else {
        setCreditScore(null);
      }
    } catch (error: any) {
      toast.error("Error fetching loans", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchUserLoans();
  }, [fetchUserLoans]);

  const handleLoanSubmitted = () => {
    fetchUserLoans();
  };

  const handleLoanAction = async (loanId: string, action: "repay" | "default") => {
    setActiveLoanId(loanId);
    try {
      const response = await fetch(`/api/loans/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `${action} failed.`);
      }
      toast.success(`Loan successfully ${action === "repay" ? "repaid" : "marked as defaulted"}!`);
      fetchUserLoans();
    } catch (error: any) {
      toast.error(`Error`, { description: error.message });
    } finally {
      setActiveLoanId(null);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    redirect("/");
  }

  const fundedLoans = loans.filter((loan) => loan.status === "funded");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-6xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Borrower Dashboard</h1>
          <SignOutButton />
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <LoanRequestForm onLoanSubmitted={handleLoanSubmitted} />

            <Card>
              <CardHeader>
                <CardTitle>Your Active Loans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading loans...</p>
                ) : fundedLoans.length > 0 ? (
                  <ul className="space-y-4">
                    {fundedLoans.map((loan) => (
                      <li key={loan._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold">${loan.amount} for {loan.duration} months</p>
                          <p className="text-sm text-gray-500">
                            Status: <span className="capitalize font-medium text-blue-600">{loan.status}</span>
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <Button
                            size="sm"
                            onClick={() => handleLoanAction(loan._id, "repay")}
                            disabled={activeLoanId === loan._id}
                          >
                            {activeLoanId === loan._id ? "Processing..." : "Repay Loan"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleLoanAction(loan._id, "default")}
                            disabled={activeLoanId === loan._id}
                          >
                            Simulate Default
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>You have no active loans.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center h-fit">
            <h2 className="text-xl font-semibold mb-4 text-gray-600">Your Credit Score</h2>
            <p className="text-5xl font-bold text-blue-600">{creditScore ?? "N/A"}</p>
            <p className="text-sm text-gray-400 mt-2">
              {creditScore ? "Based on your latest loan data." : "Submit a loan request."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}