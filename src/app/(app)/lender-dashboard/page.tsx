"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import InsurancePoolCard from "@/components/InsurancePoolCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LoanRequest {
  _id: string;
  amount: number;
  duration: number;
  creditScore: number;
  borrowerIdentifier: string;
  status: string;
}

export default function LenderDashboard() {
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fundingLoanId, setFundingLoanId] = useState<string | null>(null);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/loans/pending");
      if (!response.ok) throw new Error("Failed to fetch loan requests.");
      const data = await response.json();
      setLoans(data);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleFundLoan = async (loanId: string) => {
    setFundingLoanId(loanId);
    try {
      const response = await fetch("/api/loans/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Funding failed.");
      }

      toast.success("Loan funded successfully!");
      setLoans((prevLoans) => prevLoans.filter((loan) => loan._id !== loanId));
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setFundingLoanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-6xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Lender Dashboard
          </h1>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pending Loan Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading requests...</p>
                ) : loans.length === 0 ? (
                  <p>No pending loan requests at the moment.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Borrower</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Credit Score</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.map((loan) => (
                        <TableRow key={loan._id}>
                          <TableCell>{loan.borrowerIdentifier}</TableCell>
                          <TableCell>${loan.amount}</TableCell>
                          <TableCell>{loan.duration} months</TableCell>
                          <TableCell>{loan.creditScore}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleFundLoan(loan._id)}
                              disabled={fundingLoanId === loan._id}
                            >
                              {fundingLoanId === loan._id ? "Funding..." : "Fund Loan"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <InsurancePoolCard />
          </div>
        </main>
      </div>
    </div>
  );
}