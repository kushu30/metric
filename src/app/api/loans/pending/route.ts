import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const pendingLoans = await db.collection("loans").find({ status: "pending" }).toArray();
    
    const loanDetails = await Promise.all(
      pendingLoans.map(async (loan) => {
        // Defensive check: ensure loan.userId exists and is a valid ObjectId string
        if (!loan.userId || !ObjectId.isValid(loan.userId)) {
          return {
            ...loan,
            borrowerIdentifier: "Unknown Borrower",
          };
        }

        const user = await db.collection("users").findOne({ _id: new ObjectId(loan.userId) });

        // If a user is found, use their details. Otherwise, provide a fallback.
        if (user) {
          return {
            ...loan,
            borrowerIdentifier: user.email || user._id.toString(),
          };
        } else {
          return {
            ...loan,
            borrowerIdentifier: "Borrower Not Found",
          };
        }
      })
    );

    return NextResponse.json(loanDetails);

  } catch (error) {
    console.error("Fetch Pending Loans API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}