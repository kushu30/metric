// src/app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.user.id) }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Also fetch linked accounts
    const accounts = await db.collection("accounts").find(
        { userId: new ObjectId(session.user.id) }
    ).toArray();

    const linkedAccounts = accounts.map(acc => ({
        provider: acc.provider,
        address: acc.providerAccountId,
    }));


    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      balance: user.balance || 0,
      anonAadhaarVerified: !!user.anonAadhaarVerified,
      socialProofVerified: !!user.socialProofVerified,
      linkedAccounts: linkedAccounts,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}