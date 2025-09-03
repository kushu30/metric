import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Find all loans where the lenderId matches the current user's ID
    const fundedLoans = await db
      .collection("loans")
      .find({ lenderId: session.user.id })
      .toArray();

    return NextResponse.json(fundedLoans);

  } catch (error) {
    console.error("Fetch Funded-By-Me Loans API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}