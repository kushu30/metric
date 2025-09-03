import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getDb = async () => {
  const client = await clientPromise;
  return client.db();
};

const getPoolDoc = async () => {
  const db = await getDb();
  return db.collection("platform_meta").findOne({ docId: "insurancePool" });
};

// GET request handler to fetch the current balance
export async function GET(request: Request) {
  try {
    const pool = await getPoolDoc();
    const balance = pool ? pool.balance : 0;
    return NextResponse.json({ balance });
  } catch (error) {
    console.error("Error fetching insurance pool balance:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST request handler to add contributions
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { amount } = await request.json();
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: "Invalid contribution amount" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("platform_meta").updateOne(
      { docId: "insurancePool" },
      { $inc: { balance: amount } },
      { upsert: true } // Creates the document if it doesn't exist
    );

    const updatedPool = await getPoolDoc();
    return NextResponse.json({ newBalance: updatedPool?.balance });

  } catch (error) {
    console.error("Error contributing to insurance pool:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}