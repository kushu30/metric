"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Landmark, Wallet } from "lucide-react";

interface Loan {
  _id: string;
  amount: number;
  duration: number;
  creditScore: number;
  interestRate: number;
  borrowerIdentifier: string;
  status: string;
}

interface UserProfile {
  balance: number;
}

export default function LenderDashboard() {
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [fundedLoans, setFundedLoans] = useState<Loan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fundingLoanId, setFundingLoanId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pendingRes, fundedRes, profileRes] = await Promise.all([
        fetch("/api/loans/pending"),
        fetch("/api/loans/funded-by-me"),
        fetch("/api/user/profile"),
      ]);

      if (!pendingRes.ok) throw new Error("Failed to fetch pending loans.");
      if (!fundedRes.ok) throw new Error("Failed to fetch your funded loans.");
      if (!profileRes.ok) throw new Error("Failed to fetch profile data.");

      const [pendingData, fundedData, profileData] = await Promise.all([
        pendingRes.json(),
        fundedRes.json(),
        profileRes.json(),
      ]);

      setPendingLoans(pendingData);
      setFundedLoans(fundedData);
      setProfile(profileData);
    } catch (error: any) {
      toast.error("Error loading lender dashboard", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setFundingLoanId(null);
    }
  };

  if (isLoading) {
    return <div>Loading Lender Overview...</div>;
  }

  const totalFunded = fundedLoans.reduce((sum, loan) => sum + loan.amount, 0);
  // Calculate potential returns considering duration
const potentialReturns = fundedLoans.reduce((sum, loan) => {
  const durationInMonths = loan.duration || 1; // safeguard
  const interestFraction = loan.interestRate / 100;
  const interestEarned = loan.amount * interestFraction * (durationInMonths / 12);
  return sum + interestEarned;
}, 0);

// Calculate average annualized ROI
const avgAnnualizedROI =
  fundedLoans.length > 0
    ? fundedLoans.reduce((sum, loan) => {
        const durationInMonths = loan.duration || 1;
        const annualizedRate = (loan.interestRate * (12 / durationInMonths));
        return sum + annualizedRate;
      }, 0) / fundedLoans.length
    : 0;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lender Overview</h1>
        <Button onClick={fetchData}>Refresh</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${profile?.balance?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Funded</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFunded.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Potential Returns</CardTitle>
    <TrendingUp className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      ${potentialReturns.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
    <p className="text-xs text-muted-foreground">
      Avg Annualized ROI: {avgAnnualizedROI.toFixed(2)}%
    </p>
  </CardContent>
</Card>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Loan Requests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending Loan Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLoans.length === 0 ? (
              <p>No pending loan requests.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLoans.map((loan) => (
                    <TableRow key={loan._id}>
                      <TableCell className="truncate max-w-[150px]">{loan.borrowerIdentifier}</TableCell>
                      <TableCell>${loan.amount.toLocaleString()}</TableCell>
                      <TableCell>{loan.interestRate}%</TableCell>
                      <TableCell>{loan.creditScore}</TableCell>
                      <TableCell className="text-right">
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

        {/* Portfolio */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Funded Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {fundedLoans.length === 0 ? (
              <p>You haven't funded any loans yet.</p>
            ) : (
              <ul className="space-y-2">
                {fundedLoans.map((loan) => (
                  <li key={loan._id} className="p-2 border rounded">
                    <p className="text-sm font-medium">
                      {loan.borrowerIdentifier} - ${loan.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {loan.status} · {loan.interestRate}% interest
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
