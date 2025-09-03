"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  const { data: session, status } = useSession();
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await fetch("/api/loans/pending");
        if (!response.ok) {
          throw new Error("Failed to fetch loan requests.");
        }
        const data = await response.json();
        setLoans(data);
      } catch (error: any) {
        toast.error("Error", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchLoans();
    }
  }, [session]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-6xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Lender Dashboard</h1>
          <SignOutButton />
        </header>
        
        <main>
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
                          <Button size="sm">Fund Loan</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
