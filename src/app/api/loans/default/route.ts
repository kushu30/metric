import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { loanId } = await request.json();
  if (!loanId || !ObjectId.isValid(loanId)) {
    return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const loansCollection = db.collection("loans");
  const metaCollection = db.collection("platform_meta");
  const transactionsCollection = db.collection("transactions");

  try {
    const loanToDefault = await loansCollection.findOne({
      _id: new ObjectId(loanId),
      userId: session.user.id,
      status: "funded",
    });

    if (!loanToDefault) {
      return NextResponse.json(
        { error: "Loan not found or not in a state that can be defaulted" },
        { status: 404 }
      );
    }

    const updateResult = await loansCollection.updateOne(
      { _id: loanToDefault._id },
      { $set: { status: "defaulted", defaultedAt: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("Failed to update loan status.");
    }

    const compensationPercentage = 0.5; // 50% payout
    const compensationAmount = loanToDefault.amount * compensationPercentage;
    
    const insurancePool = await metaCollection.findOne({ docId: "insurancePool" });
    const poolBalance = insurancePool?.balance || 0;

    const payoutAmount = Math.min(compensationAmount, poolBalance);

    if (payoutAmount > 0) {
      await metaCollection.updateOne(
        { docId: "insurancePool" },
        { $inc: { balance: -payoutAmount } },
        { upsert: true }
      );

      await transactionsCollection.insertOne({
        type: "INSURANCE_PAYOUT",
        amount: payoutAmount,
        loanId: loanToDefault._id,
        lenderId: loanToDefault.lenderId,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      message: "Loan marked as defaulted and insurance payout processed.",
      payoutAmount: payoutAmount,
    });

  } catch (error) {
    console.error("Default Loan API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}