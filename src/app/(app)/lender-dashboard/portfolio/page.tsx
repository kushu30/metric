// src/app/(app)/lender-dashboard/portfolio/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loan } from "@/types/types";

// This is a mock subscription to listen for loan updates.
// In a real app, this would be a WebSocket or a server-sent event.
const subscribeToLoanUpdates = (callback: (loan: Loan) => void) => {
    const interval = setInterval(() => {
        // Mock a repayment or default event
        if (Math.random() > 0.95) {
            callback({ _id: 'mock_id', status: 'repaid', borrowerIdentifier: 'Mock Borrower' } as Loan);
        }
    }, 5000);
    return () => clearInterval(interval);
};


export default function LenderPortfolioPage() {
  const [fundedLoans, setFundedLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFundedLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/loans/funded-by-me");
      if (!response.ok) throw new Error("Failed to fetch your funded loans.");
      const data: Loan[] = await response.json();
      setFundedLoans(data);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFundedLoans();
    const unsubscribe = subscribeToLoanUpdates((updatedLoan) => {
        toast.info(`Update received for ${updatedLoan.borrowerIdentifier}.`, {
            description: `Status changed to ${updatedLoan.status}. Refreshing portfolio...`,
        });
        fetchFundedLoans();
    });
    return unsubscribe;
  }, [fetchFundedLoans]);

  const getStatusBadge = (status: Loan['status']) => {
    switch (status) {
      case 'funded': return <Badge variant="default" className="bg-blue-500">Active</Badge>;
      case 'repaid': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'defaulted': return <Badge variant="destructive">Defaulted</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateExpectedReturn = (loan: Loan) => {
    return loan.amount * (loan.interestRate / 100) * (loan.duration / 12);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Portfolio</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Funded Loans</CardTitle>
          <CardDescription>A complete history of all loans you have funded.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading portfolio...</p> : fundedLoans.length === 0 ? <p>You have not funded any loans yet.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funded On</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundedLoans.map((loan) => (
                  <TableRow key={loan._id}>
                    <TableCell>{new Date(loan.fundedAt!).toLocaleDateString()}</TableCell>
                    <TableCell>{loan.borrowerIdentifier}</TableCell>
                    <TableCell>${loan.amount.toLocaleString()}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>${calculateExpectedReturn(loan).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}