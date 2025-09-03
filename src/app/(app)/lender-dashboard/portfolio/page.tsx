// src/app/(app)/lender-dashboard/portfolio/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Loan {
  _id: string;
  amount: number;
  duration: number;
  interestRate: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  borrowerIdentifier: string;
  fundedAt: string;
}

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
                    <TableCell>{new Date(loan.fundedAt).toLocaleDateString()}</TableCell>
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