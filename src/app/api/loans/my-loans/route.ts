import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const userLoans = await db
      .collection("loans")
      .find({ userId: session.user.id })
      .sort({ requestedAt: -1 }) // Sort by most recent
      .toArray();

    return NextResponse.json(userLoans);

  } catch (error) {
    console.error("Fetch My Loans API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}