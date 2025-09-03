// src/app/api/loans/request/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { amount, duration, creditScore, interestRate } = body;

    if (
      typeof amount !== 'number' ||
      typeof duration !== 'number' ||
      typeof creditScore !== 'number' ||
      typeof interestRate !== 'number'
    ) {
      return NextResponse.json({ error: "Missing or invalid required loan data" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newLoan = {
      userId: session.user.id,
      amount,
      duration,
      creditScore,
      interestRate,
      status: "pending",
      repaidAmount: 0, // Initialize repaid amount
      requestedAt: new Date(),
    };

    const insertResult = await db.collection("loans").insertOne(newLoan);

    if (!insertResult.acknowledged) {
        throw new Error("Database insertion was not acknowledged.");
    }

    return NextResponse.json({ success: true, loanId: insertResult.insertedId });

  } catch (error) {
    console.error("[API] An error occurred:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}