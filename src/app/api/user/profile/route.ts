import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Find all accounts linked to this user ID
    const accounts = await db.collection("accounts").find({ userId: userId }).toArray();

    const linkedAccounts = accounts.map(acc => ({
      provider: acc.provider,
      address: acc.providerAccountId // For wallet, this is the address
    }));

    const userProfile = {
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      balance: user.balance,
      linkedAccounts: linkedAccounts, // Add the linked accounts to the response
    };

    return NextResponse.json(userProfile);

  } catch (error) {
    console.error("Get Profile API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}