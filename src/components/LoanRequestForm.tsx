"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loanRequestSchema, LoanRequestFormValues } from "@/lib/schemas/loan-schema";
import { toast } from "sonner";

interface LoanRequestFormProps {
  onLoanSubmitted: (data: { creditScore: number }) => void;
}

export default function LoanRequestForm({ onLoanSubmitted }: LoanRequestFormProps) {
  const form = useForm<LoanRequestFormValues>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      amount: 1000,
      duration: 12,
    },
  });

  const onSubmit: SubmitHandler<LoanRequestFormValues> = async (values) => {
    try {
      const response = await fetch("/api/loans/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      toast.success("Loan request submitted!", {
        description: `Your new credit score is ${data.creditScore}.`,
      });
      
      onLoanSubmitted({ creditScore: data.creditScore });
      form.reset();

    } catch (error: any) {
      toast.error("Submission failed.", {
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a New Loan</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Duration (Months)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Loan Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}