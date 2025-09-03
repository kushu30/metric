import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Db, ObjectId } from "mongodb";

/**
 * Calculates a user's risk/credit score based on:
 * - Loan history (repaid/defaulted)
 * - Active loan progress
 * - Balance vs requested loan size
 * - Collateral (optional)
 *
 * Score range: 300 (high risk) → 850 (low risk).
 */
export async function calculateRiskScore(
  db: Db,
  userId: string,
  requestData: { amount: number; duration: number; collateral?: number }
): Promise<number> {
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  const userLoans = await db.collection("loans").find({ userId }).toArray();

  if (!user) {
    throw new Error("User not found for scoring.");
  }

  // --- Base score ---
  let score = 650;
  const balance = user.balance || 0;
  const { amount: requestedAmount, duration: requestedDuration, collateral = 0 } = requestData;

  const totalLoans = userLoans.length;
  const repaidLoans = userLoans.filter((l) => l.status === "repaid").length;
  const defaultedLoans = userLoans.filter((l) => l.status === "defaulted").length;
  const activeLoans = userLoans.filter((l) => l.status === "funded");

  // --- SCORING LOGIC ---

  // 1. New User → start near base score, slight tweak by balance.
  if (totalLoans === 0) {
    if (balance < 1000) score -= 20;
    return Math.round(Math.max(300, Math.min(score, 850)));
  }

  // 2. Heavy penalty for defaults.
  score -= defaultedLoans * 200;

  // 3. Reward for fully repaid loans.
  score += repaidLoans * 50;

  // 4. Reliability ratio bonus.
  const reliabilityRatio = (totalLoans - defaultedLoans) / totalLoans;
  score += reliabilityRatio * 75;

  // 5. Progress on active loans.
  activeLoans.forEach((loan) => {
    const totalDue = loan.amount * (1 + (loan.interestRate / 100) * (loan.duration / 12));
    const progress = (loan.repaidAmount || 0) / totalDue;
    score += progress * 30; // up to 30 points per loan
  });

  // 6. Requested loan risk adjustment.
  if (requestedAmount > 0) {
    const debtToBalanceRatio = requestedAmount / (balance + 1);
    if (debtToBalanceRatio > 0.75) score -= 50;
    else if (debtToBalanceRatio < 0.2) score += 20;
  }

  // 7. Penalty for multiple active debts.
  if (activeLoans.length > 2) {
    score -= (activeLoans.length - 2) * 15;
  }

  // 8. Collateral bonus (up to +75).
  if (collateral > 0 && requestedAmount > 0) {
    const collateralRatio = collateral / requestedAmount;
    score += Math.min(collateralRatio, 1) * 75;
  }

  // Clamp score
  const finalScore = Math.max(300, Math.min(score, 850));
  return Math.round(finalScore);
}

// --- POST: Score for a specific loan request ---
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
    console.error("ML API Error (POST):", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// --- GET: General score for dashboard ---
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const client = await clientPromise;
    const db = client.db();

    const score = await calculateRiskScore(db, userId, { amount: 0, duration: 0 });

    return NextResponse.json({ score });
  } catch (error) {
    console.error("ML API Error (GET):", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
