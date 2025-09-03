// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreditScoreGauge from "@/components/CreditScoreGauge";
import { toast } from "sonner";
import { Landmark, Wallet, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Loan {
  _id: string;
  amount: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  requestedAt: string;
  [key: string]: any;
}

interface UserProfile {
  balance: number;
}

export default function DashboardOverviewPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loansResponse, profileResponse, scoreResponse] = await Promise.all([
        fetch('/api/loans/my-loans'),
        fetch('/api/user/profile'),
        fetch('/api/ml/risk-score', { method: 'GET' })
      ]);

      if (!loansResponse.ok) throw new Error("Failed to fetch loan data.");
      if (!profileResponse.ok) throw new Error("Failed to fetch profile data.");
      if (!scoreResponse.ok) throw new Error("Failed to fetch credit score.");

      const loansData: Loan[] = await loansResponse.json();
      const profileData: UserProfile = await profileResponse.json();
      const scoreData = await scoreResponse.json();

      setLoans(loansData);
      setProfile(profileData);
      setCurrentScore(scoreData.score);
    } catch (error: any) {
      toast.error("Failed to load dashboard", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status: Loan['status']) => {
    switch (status) {
      case 'funded': return <Badge variant="default" className="bg-blue-500">Active</Badge>;
      case 'repaid': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'defaulted': return <Badge variant="destructive">Defaulted</Badge>;
    }
  };

  if (isLoading) {
    return <div>Loading Borrower Overview...</div>;
  }

  const activeLoanAmount = loans.filter(l => l.status === 'funded').reduce((sum, l) => sum + l.amount, 0);
  const totalRepaidCount = loans.filter(l => l.status === 'repaid').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Borrower Overview</h1>
        <Link href="/dashboard/request">
            <Button>Request New Loan</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profile?.balance?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loan Amount</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${activeLoanAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loans Repaid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRepaidCount}</div>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6">
          {currentScore !== null ? (
            <CreditScoreGauge score={currentScore} />
          ) : (
             <div className="text-center h-full flex flex-col justify-center">
                <p className="text-2xl font-bold text-gray-400">N/A</p>
                <p className="text-sm text-gray-500">No score available</p>
            </div>
          )}
           <p className="text-center text-sm text-gray-500 mt-4">
            Your live trust score based on platform activity.
          </p>
        </Card>
        <Card className="lg:col-span-2">
             <CardHeader className="flex justify-between items-center">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/repayments">
                <Button variant="link" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loans.length > 0 ? (
                <ul className="space-y-4">
                  {loans.slice(0, 3).map(loan => (
                    <li key={loan._id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">${loan.amount.toLocaleString()} Loan</p>
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(loan.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(loan.status)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>You have no recent loan activity.</p>
              )}
            </CardContent>
        </Card>
       </div>
    </div>
  );
}