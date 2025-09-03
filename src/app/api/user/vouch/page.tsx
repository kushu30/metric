import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $inc: { vouchCount: 1 } },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updatedUser = result.value;

    // If vouchCount >= 2, mark verified
    if ((updatedUser.vouchCount || 0) >= 2 && !updatedUser.socialProofVerified) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { socialProofVerified: true } }
      );
      updatedUser.socialProofVerified = true;
    }

    return NextResponse.json({
      message: "Vouch recorded",
      socialProofVerified: !!updatedUser.socialProofVerified,
      vouchCount: updatedUser.vouchCount || 0,
    });
  } catch (error) {
    console.error("Vouch API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
