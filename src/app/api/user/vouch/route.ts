// src/app/api/user/vouch/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const VOUCH_REWARD = 50; // $50 reward for vouching

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // The user clicking the vouch button is the "voucher"
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized: You must be signed in to vouch for someone.", { status: 401 });
  }
  const voucherId = session.user.id;

  try {
    const { userIdToVouch } = await request.json();

    if (!userIdToVouch || !ObjectId.isValid(userIdToVouch)) {
      return NextResponse.json({ error: "Invalid user ID to vouch for." }, { status: 400 });
    }
    
    if (voucherId === userIdToVouch) {
        return NextResponse.json({ error: "You cannot vouch for yourself." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // --- Update the user being vouched for ---
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(userIdToVouch) },
      { $inc: { vouchCount: 1 } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "User to vouch for not found" }, { status: 404 });
    }
    const vouchee = result;

    // If vouchCount is 2 or more, mark as socially verified
    if ((vouchee.vouchCount || 0) >= 2 && !vouchee.socialProofVerified) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userIdToVouch) },
        { $set: { socialProofVerified: true } }
      );
    }
    
    // --- Reward the voucher ---
    await db.collection("users").updateOne(
        { _id: new ObjectId(voucherId) },
        { $inc: { balance: VOUCH_REWARD } }
    );

    return NextResponse.json({
      message: `Successfully vouched. $${VOUCH_REWARD} has been added to your balance as a reward.`,
      voucheeStatus: {
          socialProofVerified: (vouchee.vouchCount || 0) >= 2,
          vouchCount: vouchee.vouchCount,
      }
    });

  } catch (error) {
    console.error("Vouch API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}