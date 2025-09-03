import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { loanRequestSchema } from "@/lib/schemas/loan-schema";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validation = loanRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    
    const { amount, duration } = validation.data;
    const userId = session.user.id;

    // Call the mock ML API to get a credit score
    // Note: This relies on NEXTAUTH_URL being set correctly in your .env.local
    const mlApiUrl = new URL("/api/ml/risk-score", process.env.NEXTAUTH_URL);
    const mlResponse = await fetch(mlApiUrl.toString(), {
      method: 'POST',
      body: JSON.stringify({ userId }), // Send user data for scoring in a real app
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!mlResponse.ok) {
        throw new Error("Failed to fetch credit score from ML service.");
    }
    
    const { score } = await mlResponse.json();

    const client = await clientPromise;
    const db = client.db();
    
    // Store the loan in a 'loans' collection
    const newLoanRequest = {
      userId,
      amount,
      duration,
      creditScore: score,
      status: "pending", // Other statuses: funded, repaid, defaulted
      requestedAt: new Date(),
    };

    const result = await db.collection("loans").insertOne(newLoanRequest);

    return NextResponse.json({ 
        message: "Loan request submitted successfully.",
        loanId: result.insertedId,
        creditScore: score,
    });

  } catch (error) {
    console.error("Loan Request API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
