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
import { Loan } from "@/types/types";
import { Lock, CheckCircle, Hourglass, Landmark, AlertCircle } from "lucide-react";


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
      const response = await fetch(`/api/loans/default`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
    });
    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.error || "Failed to simulate default.");
    }
    toast.success("Default simulated.", {
        description: `Insurance payout of $${responseData.payoutAmount.toLocaleString()} processed.`,
    });
    fetchUserLoans();
    } catch (error: any) {
        toast.error("Error", { description: error.message });
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

  const LoanTimeline = ({ loan }: { loan: Loan }) => {
    const steps = [
        { name: 'Requested', status: !!loan.requestedAt, icon: <Hourglass/>, date: loan.requestedAt },
        { name: 'Funded', status: !!loan.fundedAt, icon: <Landmark/>, date: loan.fundedAt },
        { name: 'Completed', status: !!loan.repaidAt || !!loan.defaultedAt, icon: loan.defaultedAt ? <AlertCircle className="text-red-500"/> : <CheckCircle className="text-green-500"/>, date: loan.repaidAt || loan.defaultedAt }
    ];

    return (
        <div className="flex justify-between items-center my-2">
            {steps.map((step, index) => (
                <div key={step.name} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.status ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {step.icon}
                    </div>
                    <p className="text-xs mt-1">{step.name}</p>
                    {step.date && <p className="text-xs text-gray-500">{new Date(step.date).toLocaleDateString()}</p>}
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Loan & Repayment History</h1>
        {isLoading ? <p>Loading...</p> : loans.length === 0 ? <p>You have no loan history.</p> : (
            loans.map(loan => {
                const totalDue = calculateTotalDue(loan);
                const progress = (loan.repaidAmount / totalDue) * 100;
                return (
                    <Card key={loan._id}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>${loan.amount.toLocaleString()}</CardTitle>
                                    <CardDescription>{loan.interestRate}% for {loan.duration} months</CardDescription>
                                </div>
                                {getStatusBadge(loan.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <LoanTimeline loan={loan} />
                            <div className="mt-4">
                                <Progress value={progress} className="w-full mb-1" />
                                <span className="text-xs text-muted-foreground">
                                    ${(loan.repaidAmount || 0).toLocaleString()} / ${totalDue.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                </span>
                            </div>
                            {loan.status === 'funded' && (
                                <div className="flex items-center justify-end space-x-2 mt-4">
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
                                    <Button size="sm" variant="destructive" onClick={() => handleDefault(loan._id)} disabled={activeLoanId === loan._id}>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Simulate Default
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })
        )}
    </div>
  );
}