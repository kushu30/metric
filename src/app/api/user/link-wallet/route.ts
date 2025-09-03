import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SiweMessage } from "siwe";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { message, signature } = await request.json();
    if (!message || !signature) {
      return NextResponse.json({ error: "Missing message or signature" }, { status: 400 });
    }

    // Verify the SIWE message
    const siweMessage = new SiweMessage(JSON.parse(message));
    const nextAuthUrl = new URL(process.env.NEXTAUTH_URL as string);
    const result = await siweMessage.verify({
      signature,
      domain: nextAuthUrl.host,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }
    
    const walletAddress = siweMessage.address;
    const client = await clientPromise;
    const db = client.db();

    // Check if another account is already using this wallet address
    const existingAccount = await db.collection("accounts").findOne({ provider: "credentials", providerAccountId: walletAddress });
    if (existingAccount) {
      return NextResponse.json({ error: "This wallet is already linked to another account." }, { status: 409 });
    }

    // Link the wallet by creating a new entry in the 'accounts' collection
    await db.collection("accounts").insertOne({
      userId: new ObjectId(session.user.id),
      type: "credentials",
      provider: "credentials", // or "ethereum" if you prefer
      providerAccountId: walletAddress,
    });

    return NextResponse.json({ success: true, walletAddress });

  } catch (error) {
    console.error("Link Wallet API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}