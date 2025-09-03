// src/app/api/loans/fund/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const lenderId = session.user.id;

  const { loanId } = await request.json();
  if (!loanId || !ObjectId.isValid(loanId)) {
    return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
  }

  const client = await clientPromise;
  const dbSession = client.startSession();

  try {
    const fundedLoan = await dbSession.withTransaction(async () => {
      const db = client.db();

      const loan = await db.collection("loans").findOne({ _id: new ObjectId(loanId), status: "pending" }, { session: dbSession });
      if (!loan) {
        throw new Error("Loan not found or already funded.");
      }

      const lender = await db.collection("users").findOne({ _id: new ObjectId(lenderId) }, { session: dbSession });
      if (!lender || lender.balance < loan.amount) {
        throw new Error("Insufficient balance to fund this loan.");
      }

      await db.collection("users").updateOne(
        { _id: new ObjectId(lenderId) },
        { $inc: { balance: -loan.amount } },
        { session: dbSession }
      );

      await db.collection("users").updateOne(
        { _id: new ObjectId(loan.userId) },
        { $inc: { balance: loan.amount } },
        { session: dbSession }
      );

      const result = await db.collection("loans").findOneAndUpdate(
        { _id: new ObjectId(loanId), status: "pending" },
        {
          $set: {
            status: "funded",
            lenderId: lenderId,
            fundedAt: new Date(),
          },
        },
        { returnDocument: "after", session: dbSession }
      );

      if (!result) {
        throw new Error("Failed to update the loan document.");
      }
      return result;
    });

    return NextResponse.json({ message: "Loan funded successfully", loan: fundedLoan });

  } catch (error: any) {
    console.error("Fund Loan API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await dbSession.endSession();
  }
}