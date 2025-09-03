// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreditScoreGauge from "@/components/CreditScoreGauge";
import { toast } from "sonner";
import { Landmark, Wallet, CheckCircle } from "lucide-react";

interface Loan {
  _id: string;
  amount: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
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

  if (isLoading) {
    return <div className="text-white/70">Loading Borrower Overview...</div>;
  }

  const activeLoanAmount = loans.filter(l => l.status === 'funded').reduce((sum, l) => sum + l.amount, 0);
  const totalRepaidCount = loans.filter(l => l.status === 'repaid').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Borrower Overview</h1>
        <Link href="/dashboard/request">
            <Button className="bg-white text-black hover:bg-white/90">Request New Loan</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profile?.balance?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Active Loan Amount</CardTitle>
            <Landmark className="h-4 w-4 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${activeLoanAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.02]">
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
         <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6 border-white/10 bg-white/[0.02]">
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
        <Card className="lg:col-span-2 border-white/10 bg-white/[0.02]">
             <CardHeader>
              <CardTitle className="text-white/80">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your recent loan activity will be displayed here.</p>
            </CardContent>
        </Card>
       </div>
    </div>
  );
}