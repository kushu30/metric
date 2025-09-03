"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function InsurancePoolCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/insurance-pool');
      if (!response.ok) throw new Error("Failed to fetch balance.");
      const data = await response.json();
      setBalance(data.balance);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleContribution = async () => {
    try {
      const response = await fetch('/api/insurance-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 25 }) // Mock $25 contribution
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Contribution failed");
      }
      
      const data = await response.json();
      setBalance(data.newBalance);
      toast.success("Contribution successful!");

    } catch (error: any) {
       toast.error("Error", { description: error.message });
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Insurance Pool</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 mb-2">Total Value Locked</p>
        <p className="text-4xl font-bold text-green-600 mb-4">
          {isLoading ? "Loading..." : balance !== null ? `$${balance.toLocaleString()}` : "$0"}
        </p>
        <Button onClick={handleContribution} size="sm">
          Simulate $25 Contribution
        </Button>
      </CardContent>
    </Card>
  );
}