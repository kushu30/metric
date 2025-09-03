// src/app/(app)/repayments/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Loan {
  _id: string;
  amount: number;
  duration: number;
  interestRate: number;
  repaidAmount: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  requestedAt: string;
}

export default function RepaymentsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [repaymentAmounts, setRepaymentAmounts] = useState<Record<string, string>>({});
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);

  const fetchUserLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/loans/my-loans");
      if (!response.ok) throw new Error("Failed to fetch your loans.");
      const data: Loan[] = await response.json();
      setLoans(data);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserLoans();
  }, [fetchUserLoans]);

  const handleRepayment = async (loanId: string, amount?: number) => {
    setActiveLoanId(loanId);
    try {
      const response = await fetch(`/api/loans/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, amount }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Repayment failed.`);
      }
      toast.success(`Repayment successful!`, {
        description: `Your new credit score is ${responseData.newScore}.`,
      });
      setRepaymentAmounts(prev => ({ ...prev, [loanId]: '' }));
      fetchUserLoans();
    } catch (error: any)
{
      toast.error(`Error`, { description: error.message });
    } finally {
      setActiveLoanId(null);
    }
  };

  const handleDefault = async (loanId: string) => {
    setActiveLoanId(loanId);
    try {
      // Logic from your original file
    } finally {
      setActiveLoanId(null);
    }
  };

  const getStatusBadge = (status: Loan['status']) => {
    switch (status) {
      case 'funded': return <Badge variant="default" className="bg-blue-500">Active</Badge>;
      case 'repaid': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'defaulted': return <Badge variant="destructive">Defaulted</Badge>;
    }
  };

  const calculateTotalDue = (loan: Loan) => loan.amount * (1 + (loan.interestRate / 100) * (loan.duration / 12));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Loan & Repayment History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Loans</CardTitle>
          <CardDescription>Manage your active loans and view your loan history.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : loans.length === 0 ? <p>You have no loan history.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Repayment Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const totalDue = calculateTotalDue(loan);
                  const progress = (loan.repaidAmount / totalDue) * 100;
                  return (
                    <TableRow key={loan._id}>
                      <TableCell>
                        <div className="font-medium">${loan.amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{loan.interestRate}% for {loan.duration} months</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(loan.status)}</TableCell>
                      <TableCell>
                        <Progress value={progress} className="w-[80%]" />
                        <span className="text-xs text-muted-foreground">
                          ${(loan.repaidAmount || 0).toLocaleString()} / ${totalDue.toLocaleString(undefined, {maximumFractionDigits: 2})}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {loan.status === 'funded' && (
                          <div className="flex items-center justify-end space-x-2">
                             <Input 
                                type="number" 
                                placeholder="Amount" 
                                className="w-28 h-8"
                                value={repaymentAmounts[loan._id] || ''}
                                onChange={(e) => setRepaymentAmounts({...repaymentAmounts, [loan._id]: e.target.value})}
                              />
                              <Button size="sm" variant="outline" onClick={() => handleRepayment(loan._id, parseFloat(repaymentAmounts[loan._id]))} disabled={activeLoanId === loan._id || !repaymentAmounts[loan._id]}>
                                Pay
                              </Button>
                           <Button size="sm" onClick={() => handleRepayment(loan._id)} disabled={activeLoanId === loan._id}>
                            Pay Full
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}