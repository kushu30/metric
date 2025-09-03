// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreditScoreGauge from "@/components/CreditScoreGauge";
import { toast } from "sonner";
import { Landmark, Wallet, CheckCircle, ArrowRight } from "lucide-react";
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
      case 'funded': return <Badge variant="default" className="bg-blue-500/20 text-blue-300 border-blue-500/30">Active</Badge>;
      case 'repaid': return <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">Completed</Badge>;
      case 'pending': return <Badge variant="outline" className="border-white/20 text-white/70">Pending</Badge>;
      case 'defaulted': return <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">Defaulted</Badge>;
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-white/70">Loading Borrower Overview...</div>
        </div>
    );
  }

  const activeLoanAmount = loans.filter(l => l.status === 'funded').reduce((sum, l) => sum + l.amount, 0);
  const totalRepaidCount = loans.filter(l => l.status === 'repaid').length;
  const recentLoans = loans.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Borrower Overview</h1>
        <Link href="/dashboard/request">
            <Button className="bg-white text-black hover:bg-white/90">Request New Loan <ArrowRight className="ml-2 h-4 w-4"/></Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profile?.balance?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Active Loan Amount</CardTitle>
            <Landmark className="h-4 w-4 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${activeLoanAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Loans Repaid</CardTitle>
            <CheckCircle className="h-4 w-4 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRepaidCount}</div>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6 border-white/10 bg-white/[0.03] backdrop-blur-sm">
          {currentScore !== null ? (
            <CreditScoreGauge score={currentScore} />
          ) : (
             <div className="text-center h-full flex flex-col justify-center">
                <p className="text-2xl font-bold text-white/40">N/A</p>
                <p className="text-sm text-white/50">No score available</p>
            </div>
          )}
           <p className="text-center text-sm text-white/60 mt-4">
            Your live trust score based on platform activity.
          </p>
        </Card>
        <Card className="lg:col-span-2 border-white/10 bg-white/[0.03] backdrop-blur-sm">
             <CardHeader>
              <CardTitle className="text-white/80">Recent Activity</CardTitle>
              <CardDescription className="text-white/60">Your most recent loan requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLoans.length > 0 ? (
                <ul className="space-y-3">
                  {recentLoans.map(loan => (
                    <li key={loan._id} className="flex justify-between items-center p-3 rounded-md bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="font-semibold text-white/90">${loan.amount.toLocaleString()}</p>
                        <p className="text-xs text-white/60">
                          Requested on {new Date(loan.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(loan.status)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-white/70">You have no recent loan activity.</p>
                </div>
              )}
            </CardContent>
        </Card>
       </div>
    </div>
  );
}