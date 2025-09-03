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
      {
        _id: new ObjectId(loanId),
        userId: session.user.id,
        status: "funded",
      },
      {
        $set: {
          status: "defaulted",
          defaultedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Loan not found or not in a state that can be defaulted" },
        { status: 404 }
      );
    }

    // In a real app, this would trigger wallet freezes, etc.
    // For now, it just updates the database.

    return NextResponse.json({ message: "Loan status updated to defaulted" });
  } catch (error) {
    console.error("Default Loan API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}