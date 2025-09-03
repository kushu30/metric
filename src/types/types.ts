// src/types/types.ts
export interface Loan {
  _id: string;
  amount: number;
  duration: number;
  interestRate: number;
  repaidAmount: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  requestedAt: string;
  fundedAt?: string;
  repaidAt?: string;
  defaultedAt?: string;
  borrowerIdentifier?: string;
  userId: string;
  lenderId?: string;
}