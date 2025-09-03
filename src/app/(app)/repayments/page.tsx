"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Loan {
  _id: string;
  amount: number;
  duration: number;
  interestRate: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  requestedAt: string;
}

export default function RepaymentsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const getStatusBadge = (status: Loan['status']) => {
    switch (status) {
      case 'funded': return <Badge variant="default" className="bg-blue-500">Active</Badge>;
      case 'repaid': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending': return <Badge variant="outline">Pending Review</Badge>;
      case 'defaulted': return <Badge variant="destructive">Defaulted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Loan & Repayment History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Loans</CardTitle>
          <CardDescription>A complete history of all your loan activity on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading loan history...</p> : loans.length === 0 ? <p>You have not requested any loans yet.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Repayment Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan._id}>
                    <TableCell>{new Date(loan.requestedAt).toLocaleDateString()}</TableCell>
                    <TableCell>${loan.amount.toLocaleString()}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>
                      <Progress value={loan.status === 'repaid' ? 100 : loan.status === 'funded' ? 50 : 0} className="w-[80%]" />
                    </TableCell>
                    <TableCell className="text-right">
                      {loan.status === 'funded' && (
                        <div className="flex space-x-2 justify-end">
                           <Button
                            size="sm"
                            onClick={() => handleLoanAction(loan._id, "repay")}
                            disabled={activeLoanId === loan._id}
                          >
                            {activeLoanId === loan._id ? "Processing..." : "Repay Full Amount"}
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
                      )}
                    </TableCell>
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