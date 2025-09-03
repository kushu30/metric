"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreditScoreGauge from "@/components/CreditScoreGauge";

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
  const [creditScore, setCreditScore] = useState(75);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch all this data from different API endpoints
      // For now, we continue with mock data for the overview
      const MOCK_DATA = {
          loans: [{ _id: "1", amount: 5000, status: "funded" }],
          profile: { balance: 8500 },
          creditScore: 82,
      };
      await new Promise(res => setTimeout(res, 500));
      setLoans(MOCK_DATA.loans);
      setProfile(MOCK_DATA.profile);
      setCreditScore(MOCK_DATA.creditScore);
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
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

  const activeLoans = loans.filter(l => l.status === 'funded');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Borrower Overview</h1>
        <Link href="/dashboard/request">
            <Button>Request New Loan</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6">
          <CreditScoreGauge score={creditScore} />
          <p className="text-center text-sm text-gray-500 mt-4">
            Based on your repayment history and wallet activity.
          </p>
        </Card>
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
                Mock Wallet Balance: ${profile?.balance.toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Loans ({activeLoans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activeLoans.length > 0 ? (
                <p>You have {activeLoans.length} active loan(s).</p>
              ) : (
                <p>You have no active loans.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}