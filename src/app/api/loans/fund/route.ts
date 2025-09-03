import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
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

    const result = await db.collection("loans").updateOne(
      { _id: new ObjectId(loanId), status: "pending" },
      { 
        $set: { 
          status: "funded", 
          lenderId: session.user.id,
          fundedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Loan not found or already funded" }, { status: 404 });
    }

    // This is where you would simulate the token transfer in a real app
    // For now, we just confirm the database update.

    return NextResponse.json({ message: "Loan funded successfully" });

  } catch (error) {
    console.error("Fund Loan API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
