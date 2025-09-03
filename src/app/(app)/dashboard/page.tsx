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
  creditScore: number;
  [key: string]: any;
}

interface UserProfile {
  balance: number;
}

export default function DashboardOverviewPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loansResponse, profileResponse] = await Promise.all([
        fetch('/api/loans/my-loans'),
        fetch('/api/user/profile')
      ]);

      if (!loansResponse.ok) throw new Error("Failed to fetch loan data.");
      if (!profileResponse.ok) throw new Error("Failed to fetch profile data.");

      const loansData: Loan[] = await loansResponse.json();
      const profileData: UserProfile = await profileResponse.json();

      setLoans(loansData);
      setProfile(profileData);
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
    return <div>Loading Borrower Overview...</div>;
  }

  const creditScore = loans.length > 0 ? loans[0].creditScore : null;
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

      {/* KPI Cards */}
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
      
      {/* Main Content Area */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6">
          {creditScore !== null ? (
            <CreditScoreGauge score={creditScore} />
          ) : (
             <div className="text-center h-full flex flex-col justify-center">
                <p className="text-2xl font-bold text-gray-400">N/A</p>
                <p className="text-sm text-gray-500">No score available</p>
            </div>
          )}
           <p className="text-center text-sm text-gray-500 mt-4">
            {creditScore ? "Based on your latest loan application." : "Request a loan to get a score."}
          </p>
        </Card>
        <Card className="lg:col-span-2">
             <CardHeader>
              <CardTitle>Loan Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your recent loan activity will be displayed here.</p>
              {/* You can re-integrate the LoanStatusChart here or a list of recent loans */}
            </CardContent>
        </Card>
       </div>
    </div>
  );
}