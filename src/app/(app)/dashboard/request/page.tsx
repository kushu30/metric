// src/app/(app)/dashboard/request/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";

const formSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, "Amount must be at least $100.")
    .max(50000, "Amount cannot exceed $50,000."),
  durationValue: z.coerce.number().min(1, "Duration is required."),
  durationUnit: z.enum(["days", "months", "years"]),
  collateral: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LoanTerms {
  creditScore: number;
  interestRate: number;
  maxLoanCap: number;
  totalRepayment: number;
}

interface UserProfile {
    balance: number;
    anonAadhaarVerified: boolean;
    socialProofVerified: boolean;
}

export default function RequestLoanPage() {
  const router = useRouter();
  const [terms, setTerms] = useState<LoanTerms | null>(null);
  const [isCheckingTerms, setIsCheckingTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mtrcPrice] = useState(1); // Mock price for MTRC token

  useEffect(() => {
    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if(res.ok) {
                setUserProfile(data);
            }
        } catch (error) {
            console.error("Failed to fetch profile");
        }
    };
    fetchProfile();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 5000, durationValue: 6, durationUnit: "months", collateral: 0 },
  });

  const getTier = () => {
    if (userProfile?.anonAadhaarVerified && userProfile?.socialProofVerified) {
        return 3;
    }
    if (userProfile?.anonAadhaarVerified) {
        return 2;
    }
    return 1;
  }

  const handleCheckTerms: SubmitHandler<FormValues> = async (values) => {
    setIsCheckingTerms(true);
    setTerms(null);

    let durationInMonths = values.durationValue;
    if (values.durationUnit === "years") durationInMonths = values.durationValue * 12;
    if (values.durationUnit === "days") durationInMonths = Math.ceil(values.durationValue / 30);

    try {
      const scoreResponse = await fetch("/api/ml/risk-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,
          duration: durationInMonths,
          collateral: values.collateral,
        }),
      });
      if (!scoreResponse.ok) throw new Error("Could not fetch credit score.");
      const { score } = await scoreResponse.json();

      let interestRate = 15;
      if (score >= 750) interestRate = 5;
      else if (score >= 600) interestRate = 10;

      const tier = getTier();
      let maxLoanCap = (values.collateral || 0) * 1; // Tier 1
      if (tier === 2) {
        maxLoanCap = (values.collateral || 0) * 2;
      } else if (tier === 3) {
        maxLoanCap = (values.collateral || 0) * 5;
      }


      const totalRepayment = values.amount * (1 + interestRate / 100);

      if (values.amount > maxLoanCap && maxLoanCap > 0) {
        toast.warning("Loan amount exceeds your cap", {
          description: (
            <span>
              Based on your verification status, your maximum loan is ${maxLoanCap.toLocaleString()}.
              <Link href="/profile/verify" className="underline font-bold ml-1">Verify your identity</Link> to increase your limit.
            </span>
          )
        });
      } else if (values.amount > 0 && maxLoanCap === 0 && values.collateral === 0) {
        toast.info("Add Collateral to Get a Loan", {
          description: "Please stake some collateral to be eligible for a loan.",
        });
      }


      setTerms({ creditScore: score, interestRate, maxLoanCap, totalRepayment });
    } catch (error: any) {
      toast.error("Error checking terms", { description: error.message });
    } finally {
      setIsCheckingTerms(false);
    }
  };

    const handleFinalSubmit = async (loanTerms: LoanTerms) => {
    setIsSubmitting(true);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install it.");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
        
      const formValues = form.getValues();
      let durationInMonths = formValues.durationValue;
      if (formValues.durationUnit === "years") durationInMonths = formValues.durationValue * 12;
      if (formValues.durationUnit === "days") durationInMonths = Math.ceil(formValues.durationValue / 30);

      const loanData = {
        amount: Number(formValues.amount),
        duration: durationInMonths,
        creditScore: Number(loanTerms.creditScore),
        interestRate: Number(loanTerms.interestRate),
        collateral: Number(formValues.collateral) || 0,
      };

      // Simulate staking
      if (loanData.collateral > 0) {
        if (!userProfile || userProfile.balance < loanData.collateral) {
            throw new Error("Insufficient balance to stake collateral.");
        }
        toast.info("Staking collateral...", {
            description: `Locking ${(loanData.collateral / mtrcPrice).toLocaleString()} MTRC in the contract.`
        })
        await new Promise(res => setTimeout(res, 2000)); // Simulate transaction time
        setUserProfile(prev => prev ? {...prev, balance: prev.balance - loanData.collateral} : null);
      }

      const response = await fetch("/api/loans/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "The server rejected the request.");
      }

      toast.success("Loan request created successfully!", {
        description: `Your loan of $${loanData.amount.toLocaleString()} (${(loanData.amount / mtrcPrice).toLocaleString()} MTRC) is now pending.`
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("SUBMISSION FAILED:", error);
      toast.error("Submission Failed", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Request a New Loan</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>Enter your desired amount, duration, and optional collateral.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCheckTerms)} className="space-y-6">
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input type="number" placeholder="5,000" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration */}
                <div className="flex items-end space-x-2">
                  <FormField
                    control={form.control}
                    name="durationValue"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Loan Duration</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="durationUnit"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Collateral */}
                <FormField
                  control={form.control}
                  name="collateral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Collateral (Optional): ${field.value?.toLocaleString()}
                      </FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value || 0]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          min={0}
                          max={userProfile?.balance || 0}
                          step={50}
                        />
                      </FormControl>
                      <FormDescription>
                        Staking collateral can improve your loan terms. You can stake up to ${ (userProfile?.balance || 0).toLocaleString()}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isCheckingTerms} className="w-full">
                  {isCheckingTerms ? "Analyzing..." : "Check Terms"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Loan Terms */}
        {terms && (
          <Card>
            <CardHeader>
              <CardTitle>Your Loan Terms</CardTitle>
              <CardDescription>
                Based on your credit score of {terms.creditScore}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <strong>Interest Rate:</strong> {terms.interestRate}%
              </p>
              <p>
                <strong>Total Repayment:</strong> ${terms.totalRepayment.toFixed(2)} (${(terms.totalRepayment / mtrcPrice).toLocaleString()} MTRC)
              </p>
              <p className="text-sm text-gray-500">
                Your max loan cap is ${terms.maxLoanCap.toLocaleString()}.
              </p>
              <Button
                onClick={() => handleFinalSubmit(terms)}
                disabled={isSubmitting || form.getValues("amount") > terms.maxLoanCap}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit Request"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}