// src/app/api/loans/default/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { calculateRiskScore } from "../../ml/risk-score/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // Assign the validated ID to a constant for type safety
  const userId = session.user.id;

  const { loanId } = await request.json();
  if (!loanId || !ObjectId.isValid(loanId)) {
    return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const dbSession = client.startSession();

  try {
    const result = await dbSession.withTransaction(async () => {
      const loanToDefault = await db.collection("loans").findOne({
        _id: new ObjectId(loanId),
        userId: userId, // Use the type-safe constant
        status: "funded",
      }, { session: dbSession });

      if (!loanToDefault) {
        throw new Error("Loan not found or not in a state that can be defaulted.");
      }

      await db.collection("loans").updateOne(
        { _id: loanToDefault._id },
        { $set: { status: "defaulted", defaultedAt: new Date() } },
        { session: dbSession }
      );

      await db.collection("users").updateOne(
          { _id: new ObjectId(userId) }, // Use the type-safe constant
          { $set: { walletLocked: true } },
          { session: dbSession }
      );

      const insurancePayoutPercentage = 0.8;
      const compensationAmount = loanToDefault.amount * insurancePayoutPercentage;
      
      const insurancePool = await db.collection("platform_meta").findOne({ docId: "insurancePool" }, { session: dbSession });
      const poolBalance = insurancePool?.balance || 0;
      const payoutAmount = Math.min(compensationAmount, poolBalance);

      if (payoutAmount > 0) {
        await db.collection("platform_meta").updateOne(
          { docId: "insurancePool" },
          { $inc: { balance: -payoutAmount } },
          { session: dbSession }
        );
        await db.collection("users").updateOne({ _id: new ObjectId(loanToDefault.lenderId) }, { $inc: { balance: payoutAmount } }, { session: dbSession });

        await db.collection("transactions").insertOne({
          type: "INSURANCE_PAYOUT",
          amount: payoutAmount,
          loanId: loanToDefault._id,
          lenderId: loanToDefault.lenderId,
          timestamp: new Date(),
        }, { session: dbSession });
      }

      const remainingAmount = loanToDefault.amount - payoutAmount;
      if (remainingAmount > 0) {
          await db.collection("repayment_plans").insertOne({
              loanId: loanToDefault._id,
              borrowerId: userId, // Use the type-safe constant
              lenderId: loanToDefault.lenderId,
              remainingAmount: remainingAmount,
              installments: [
                  { amount: remainingAmount / 4, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'pending' },
                  { amount: remainingAmount / 4, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: 'pending' },
                  { amount: remainingAmount / 4, dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), status: 'pending' },
                  { amount: remainingAmount / 4, dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), status: 'pending' },
              ],
              createdAt: new Date(),
          }, { session: dbSession });
      }

      return { payoutAmount };
    });

    const newScore = await calculateRiskScore(db, userId, { amount: 0, duration: 0 }); // Use the type-safe constant

    return NextResponse.json({
      message: "Loan marked as defaulted and insurance payout processed.",
      payoutAmount: result.payoutAmount,
      newScore,
    });

  } catch (error: any) {
    console.error("Default Loan API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await dbSession.endSession();
  }
}