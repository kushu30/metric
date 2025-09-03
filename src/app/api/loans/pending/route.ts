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

    // Find all loans with 'pending' status
    const pendingLoans = await db.collection("loans").find({ status: "pending" }).toArray();
    
    // We need to fetch user details (like email or wallet address) for each loan
    // to display to the lender.
    const loanDetails = await Promise.all(
      pendingLoans.map(async (loan) => {
        // Find the user associated with the loan to get their identifier
        const user = await db.collection("users").findOne({ _id: new ObjectId(loan.userId) });
        return {
          ...loan,
          borrowerIdentifier: user?.email || user?._id.toString(), // Use email if available, otherwise fallback to ID
        };
      })
    );

    return NextResponse.json(loanDetails);

  } catch (error) {
    console.error("Fetch Pending Loans API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
