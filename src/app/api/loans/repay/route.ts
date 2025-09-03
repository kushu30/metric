// src/app/api/loans/repay/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Db, ObjectId } from "mongodb";

// Helper function to calculate risk score, can be moved to a lib file
async function calculateRiskScore(db: Db, userId: string) {
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    const userLoans = await db.collection("loans").find({ userId: userId }).toArray();

    if (!user) {
        throw new Error("User not found for scoring.");
    }

    let score = 500; // Base score
    const balance = user.balance || 0;

    const totalLoans = userLoans.length;
    const repaidLoans = userLoans.filter(l => l.status === 'repaid').length;
    const defaultedLoans = userLoans.filter(l => l.status === 'defaulted').length;
    const activeLoans = userLoans.filter(l => l.status === 'funded');

    // Apply scoring rules
    score -= defaultedLoans * 150;
    score += repaidLoans * 25;
    
    if (totalLoans > 0 && defaultedLoans === 0) {
      const repaymentRatio = repaidLoans / totalLoans;
      score += repaymentRatio * 50;
    }

    activeLoans.forEach(loan => {
        const totalDue = loan.amount * (1 + (loan.interestRate / 100) * (loan.duration / 12));
        const progress = (loan.repaidAmount || 0) / totalDue;
        score += progress * 20;
    });
    
    if (balance > 10000) score += 25;
    if (balance > 25000) score += 25;

    const finalScore = Math.max(300, Math.min(score, 850));
    return Math.round(finalScore);
}


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

    // Recalculate score after successful transaction
    const newScore = await calculateRiskScore(db, userId);

    return NextResponse.json({ ...repaymentResult, newScore });

  } catch (error: any) {
    console.error("Repay Loan API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await dbSession.endSession();
  }
}