// loan-schema.ts
import { z } from "zod";

export const loanRequestSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, { message: "Loan amount must be at least $100." })
    .max(50000, { message: "Loan amount cannot exceed $50,000." }),
  duration: z.coerce
    .number()
    .min(1, { message: "Loan duration must be at least 1 month." })
    .max(24, { message: "Loan duration cannot exceed 24 months." }),
});

export type LoanRequestFormValues = z.infer<typeof loanRequestSchema>;
