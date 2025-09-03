// src/app/api/user/pre-auth-update/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { email, fullName, panNumber, termsAccepted, walletAddress } =
      await request.json();

    if (!email || !fullName || !panNumber || !termsAccepted) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const session = await getServerSession(authOptions);

    // Pull existing Google user (if logged in already)
    const existingUser = session
      ? await db.collection("users").findOne({ email: session.user?.email })
      : null;

    const updateData = {
      // Form data overrides only when provided
      name: fullName || existingUser?.name,
      email: email,
      panNumber: panNumber, // ⚠️ Encrypt in production
      termsAccepted: new Date(),
      hasOnboarded: true,
      // Preserve Google image if available, fallback to avatar generator
      image: existingUser?.image || `https://avatar.vercel.sh/${email}`,
    };

    // Use wallet address (if supplied) or fall back to email
    const filter = walletAddress
      ? { _id: new ObjectId(walletAddress) }
      : { email: email };

    await db
      .collection("users")
      .updateOne(filter, { $set: updateData }, { upsert: true });

    return NextResponse.json({ message: "User data staged successfully." });
  } catch (error) {
    console.error("Pre-auth update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
