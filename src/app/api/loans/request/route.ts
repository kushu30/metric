import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  console.log("\n--- [API] /api/loans/request HIT ---");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("[API] Unauthorized: No session found.");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log(`[API] Session found for user ID: ${session.user.id}`);

    const body = await request.json();
    console.log("[API] Received request body:", body);

    const { amount, duration, creditScore, interestRate } = body;

    if (
      typeof amount !== 'number' ||
      typeof duration !== 'number' ||
      typeof creditScore !== 'number' ||
      typeof interestRate !== 'number'
    ) {
      console.error("[API] Validation Failed: Missing or invalid data.");
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
      requestedAt: new Date(),
    };
    console.log("[API] Prepared new loan document:", newLoan);

    const insertResult = await db.collection("loans").insertOne(newLoan);
    console.log("[API] MongoDB insert result:", insertResult);

    if (!insertResult.acknowledged) {
        throw new Error("Database insertion was not acknowledged.");
    }

    console.log(`[API] Successfully inserted loan with ID: ${insertResult.insertedId}`);
    return NextResponse.json({ success: true, loanId: insertResult.insertedId });

  } catch (error) {
    console.error("[API] An error occurred:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}