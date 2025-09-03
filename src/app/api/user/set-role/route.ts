import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { role } = await request.json();
    const validRoles = ["borrower", "lender", "both"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // 1. Update the user's role
    const userUpdateResult = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $set: { 
          role: role,
          balance: 10000, // Give user a mock starting balance of $10,000
        },
        $setOnInsert: { createdAt: new Date() }
      }
    );

    if (userUpdateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 2. Add initial contribution to the insurance pool
    const contributionAmount = 25;
    await db.collection("platform_meta").updateOne(
      { docId: "insurancePool" },
      { $inc: { balance: contributionAmount } },
      { upsert: true }
    );
    
    // 3. Record the contribution transaction
    await db.collection("transactions").insertOne({
        type: "INITIAL_CONTRIBUTION",
        amount: contributionAmount,
        userId: session.user.id,
        timestamp: new Date(),
    });

    return NextResponse.json({ success: true, role: role });

  } catch (error) {
    console.error("Set Role API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}