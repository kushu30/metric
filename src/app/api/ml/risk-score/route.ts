// src/app/api/ml/risk-score/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Db, ObjectId } from "mongodb";

// This function remains the same, calculating score based on historical data and request specifics.
export async function calculateRiskScore(db: Db, userId: string, requestData: { amount: number; duration: number }): Promise<number> {
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    const userLoans = await db.collection("loans").find({ userId: userId }).toArray();

    if (!user) {
        throw new Error("User not found for scoring.");
    }

    let score = 650;
    const balance = user.balance || 0;
    const { amount: requestedAmount, duration: requestedDuration } = requestData;

    const totalLoans = userLoans.length;
    const repaidLoans = userLoans.filter(l => l.status === 'repaid').length;
    const defaultedLoans = userLoans.filter(l => l.status === 'defaulted').length;
    const activeLoans = userLoans.filter(l => l.status === 'funded');

    if (totalLoans === 0) {
        if (balance > requestedAmount * 2) score += 50;
        else if (balance < requestedAmount) score -= 50;
        return Math.round(Math.max(300, Math.min(score, 850)));
    }

    score -= defaultedLoans * 200;
    score += repaidLoans * 40;
    
    const reliabilityRatio = (totalLoans - defaultedLoans) / totalLoans;
    score += reliabilityRatio * 50;

    activeLoans.forEach(loan => {
        const totalDue = loan.amount * (1 + (loan.interestRate / 100) * (loan.duration / 12));
        const progress = (loan.repaidAmount || 0) / totalDue;
        score += progress * 25;
    });
    
    const debtToBalanceRatio = requestedAmount / (balance + 1);
    if (debtToBalanceRatio > 0.5) score -= 40;
    else if (debtToBalanceRatio < 0.1) score += 20;

    if (requestedDuration > 18) score -= 15;

    const finalScore = Math.max(300, Math.min(score, 850));
    
    return Math.round(finalScore);
}


// The POST endpoint for getting a score based on a specific loan request.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;
    const requestData = await request.json();

    const client = await clientPromise;
    const db = client.db();
    
    const score = await calculateRiskScore(db, userId, requestData);

    return NextResponse.json({ score });

  } catch (error) {
    console.error("ML API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// The GET endpoint for fetching a general score for the dashboard.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const client = await clientPromise;
    const db = client.db();
    
    // We pass a default/neutral loan request for a general score calculation.
    const score = await calculateRiskScore(db, userId, { amount: 1000, duration: 12 });

    return NextResponse.json({ score });

  } catch (error) {
    console.error("ML API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}