// src/app/api/loans/repay/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Db, ObjectId } from "mongodb";
import { calculateRiskScore } from "../../ml/risk-score/route"; // Import the centralized function

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { loanId, amount } = await request.json();

  if (!loanId || !ObjectId.isValid(loanId)) {
    return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const dbSession = client.startSession();

  try {
    const repaymentResult = await dbSession.withTransaction(async () => {
      const loan = await db.collection("loans").findOne({
        _id: new ObjectId(loanId),
        userId: userId,
        status: "funded",
      }, { session: dbSession });

      if (!loan) {
        throw new Error("Loan not found or not in a repayable state");
      }
      
      const borrower = await db.collection("users").findOne({ _id: new ObjectId(userId) }, { session: dbSession });

      const totalDue = loan.amount * (1 + (loan.interestRate / 100) * (loan.duration / 12));
      const remainingDue = totalDue - (loan.repaidAmount || 0);
      const repaymentAmount = amount ? Number(amount) : remainingDue;

      if (repaymentAmount <= 0) throw new Error("Invalid repayment amount");
      if (repaymentAmount > remainingDue + 0.01) throw new Error("Repayment amount exceeds remaining balance.");
      if (borrower && borrower.balance < repaymentAmount) throw new Error("Insufficient balance for this repayment.");

      // Perform balance transfers
      await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $inc: { balance: -repaymentAmount } }, { session: dbSession });
      await db.collection("users").updateOne({ _id: new ObjectId(loan.lenderId) }, { $inc: { balance: repaymentAmount } }, { session: dbSession });

      const newRepaidAmount = (loan.repaidAmount || 0) + repaymentAmount;
      const isFullyRepaid = newRepaidAmount >= totalDue;

      // Update loan status
      await db.collection("loans").updateOne(
        { _id: new ObjectId(loanId) },
        {
          $set: {
            repaidAmount: newRepaidAmount,
            status: isFullyRepaid ? "repaid" : "funded",
            ...(isFullyRepaid && { repaidAt: new Date() }),
          },
        },
        { session: dbSession }
      );
      
      return { message: "Repayment successful", status: isFullyRepaid ? "repaid" : "funded" };
    });

    // Recalculate score after successful transaction using the centralized function
    const newScore = await calculateRiskScore(db, userId, { amount: 0, duration: 0 });

    return NextResponse.json({ ...repaymentResult, newScore });

  } catch (error: any) {
    console.error("Repay Loan API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await dbSession.endSession();
  }
}