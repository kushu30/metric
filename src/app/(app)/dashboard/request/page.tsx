// src/app/(app)/dashboard/request/page.tsx
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  amount: z.coerce.number().min(100).max(5000),
  duration: z.coerce.number().min(1).max(24),
});

type FormValues = z.infer<typeof formSchema>;

interface LoanTerms {
  creditScore: number;
  interestRate: number;
  maxLoanCap: number;
  totalRepayment: number;
}

export default function RequestLoanPage() {
  const router = useRouter();
  const [terms, setTerms] = useState<LoanTerms | null>(null);
  const [isCheckingTerms, setIsCheckingTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 1000, duration: 12 },
  });

  const handleCheckTerms: SubmitHandler<FormValues> = async (values) => {
    setIsCheckingTerms(true);
    setTerms(null);
    try {
      const scoreResponse = await fetch("/api/ml/risk-score", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!scoreResponse.ok) throw new Error("Could not fetch credit score.");
      const { score } = await scoreResponse.json();

      let interestRate = 15;
      if (score >= 750) interestRate = 5;
      else if (score >= 600) interestRate = 10;
      
      const maxLoanCap = score * 100;
      const totalRepayment = values.amount * (1 + interestRate / 100);

      if (values.amount > maxLoanCap) {
        toast.warning("Loan amount exceeds your cap", {
          description: `Based on your score of ${score}, your maximum loan is $${maxLoanCap}.`,
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
      const formValues = form.getValues();
      
      const loanData = {
        amount: Number(formValues.amount),
        duration: Number(formValues.duration),
        creditScore: Number(loanTerms.creditScore),
        interestRate: Number(loanTerms.interestRate),
      };

      const response = await fetch("/api/loans/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "The server rejected the request.");
      }

      toast.success("Loan request created successfully!");
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
            <CardDescription>Enter your desired amount and duration.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCheckTerms)} className="space-y-6">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount: ${field.value.toLocaleString()}</FormLabel>
                    <FormControl><Slider value={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} min={100} max={5000} step={100} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Months)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={isCheckingTerms} className="w-full">
                  {isCheckingTerms ? "Analyzing..." : "Check Terms"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        {terms && (
          <Card>
            <CardHeader>
              <CardTitle>Your Loan Terms</CardTitle>
              <CardDescription>Based on your credit score of {terms.creditScore}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><strong>Interest Rate:</strong> {terms.interestRate}%</p>
              <p><strong>Total Repayment:</strong> ${terms.totalRepayment.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Your max loan cap is ${terms.maxLoanCap.toLocaleString()}.</p>
              <Button onClick={() => handleFinalSubmit(terms)} disabled={isSubmitting || form.getValues("amount") > terms.maxLoanCap} className="w-full">
                {isSubmitting ? "Submitting..." : "Confirm & Submit Request"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}