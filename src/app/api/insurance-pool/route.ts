// src/app/api/insurance-pool/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db();
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const db = await getDb();

    const pool = await db.collection("platform_meta").findOne({ docId: "insurancePool" });
    const balance = pool ? pool.balance : 0;

    const defaultsCovered = await db.collection("transactions").countDocuments({ type: "INSURANCE_PAYOUT" });

    let userContribution = 0;
    if (session?.user?.id) {
      const contributions = await db.collection("transactions").find({
        userId: session.user.id,
        type: "INITIAL_CONTRIBUTION"
      }).toArray();
      userContribution = contributions.reduce((acc, curr) => acc + curr.amount, 0);
    }

    return NextResponse.json({
      balance,
      defaultsCovered,
      userContribution,
    });
  } catch (error) {
    console.error("Error fetching insurance pool data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}