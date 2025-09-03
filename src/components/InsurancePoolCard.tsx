// src/components/InsurancePoolCard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, PiggyBank, HandCoins } from 'lucide-react';


interface PoolData {
  balance: number;
  defaultsCovered: number;
  userContribution: number;
}

export default function InsurancePoolCard() {
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPoolData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/insurance-pool');
      if (!response.ok) throw new Error("Failed to fetch pool data.");
      const data = await response.json();
      setPoolData(data);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurance Pool</CardTitle>
        <CardDescription>Community-backed default protection.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <PiggyBank className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Value Locked</p>
              <p className="text-lg font-bold">
                {isLoading ? "..." : poolData ? `$${poolData.balance.toLocaleString()}` : "$0"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
           <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-500"/>
                <span>Defaults Covered:</span>
           </div>
          <span className="font-semibold">{isLoading ? "..." : poolData?.defaultsCovered ?? 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
                <HandCoins className="w-4 h-4 text-yellow-500"/>
                <span>My Contribution:</span>
            </div>
          <span className="font-semibold">{isLoading ? "..." : poolData ? `$${poolData.userContribution.toLocaleString()}` : "$0"}</span>
        </div>
      </CardContent>
    </Card>
  );
}