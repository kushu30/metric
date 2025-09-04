import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Db, ObjectId, MongoClient } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const VOUCH_REWARD = 50; // $50 reward for vouching

// Define a type for our User document for better type safety
interface User {
  _id: ObjectId;
  vouchCount?: number;
  socialProofVerified?: boolean;
  balance?: number;
  // ... other user fields
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // The user clicking the vouch button is the "voucher"
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized: You must be signed in to vouch.", { status: 401 });
  }
  const voucherId = new ObjectId(session.user.id);

  let client: MongoClient | undefined;

  try {
    const { userIdToVouch } = await request.json();

    if (!userIdToVouch || !ObjectId.isValid(userIdToVouch)) {
      return NextResponse.json({ error: "Invalid user ID provided." }, { status: 400 });
    }

    const voucheeId = new ObjectId(userIdToVouch);

    if (voucherId.equals(voucheeId)) {
      return NextResponse.json({ error: "You cannot vouch for yourself." }, { status: 400 });
    }

    client = await clientPromise;
    const db = client.db();

    // --- 1. PREVENT DUPLICATE VOUCHING ---
    // Check if this voucher has already vouched for this user
    const existingVouch = await db.collection("vouches").findOne({
      voucherId: voucherId,
      voucheeId: voucheeId,
    });

    if (existingVouch) {
      return NextResponse.json({ error: "You have already vouched for this person." }, { status: 409 }); // 409 Conflict
    }

    // --- 2. USE A TRANSACTION FOR ATOMICITY ---
    const transactionSession = client.startSession();
    let finalVoucheeStatus: { socialProofVerified: boolean; vouchCount: number; } | null = null;

    try {
      await transactionSession.withTransaction(async () => {
        // --- Get the user being vouched for ---
        const vouchee = await db.collection<User>("users").findOne({ _id: voucheeId }, { session: transactionSession });

        if (!vouchee) {
            // We must throw an error inside a transaction to abort it
            throw new Error("User to vouch for not found");
        }
        
        const currentVouchCount = vouchee.vouchCount || 0;
        const newVouchCount = currentVouchCount + 1;
        const shouldBeVerified = newVouchCount >= 2;

        const updateData: { $inc: { vouchCount: 1 }, $set?: { socialProofVerified: boolean } } = {
            $inc: { vouchCount: 1 }
        };

        if (shouldBeVerified && !vouchee.socialProofVerified) {
            updateData.$set = { socialProofVerified: true };
        }
        
        // --- Update the user being vouched for ---
        await db.collection("users").updateOne(
          { _id: voucheeId },
          updateData,
          { session: transactionSession }
        );

        // --- Reward the voucher ---
        await db.collection("users").updateOne(
          { _id: voucherId },
          { $inc: { balance: VOUCH_REWARD } },
          { session: transactionSession }
        );

        // --- Record the vouch to prevent duplicates in the future ---
        await db.collection("vouches").insertOne(
          {
            voucherId: voucherId,
            voucheeId: voucheeId,
            createdAt: new Date(),
          },
          { session: transactionSession }
        );

        finalVoucheeStatus = {
            socialProofVerified: shouldBeVerified,
            vouchCount: newVouchCount,
        };
      });
    } catch (error: any) {
        // Handle specific transaction errors, like the user not being found
        if (error.message === "User to vouch for not found") {
            return NextResponse.json({ error: "User to vouch for not found" }, { status: 404 });
        }
        // Re-throw other errors to be caught by the outer catch block
        throw error;
    } finally {
      await transactionSession.endSession();
    }

    if (!finalVoucheeStatus) {
        throw new Error("Transaction failed to complete and did not return a status.");
    }

    return NextResponse.json({
      message: `Successfully vouched. $${VOUCH_REWARD} has been added to your balance.`,
      voucheeStatus: finalVoucheeStatus,
    });

  } catch (error) {
    console.error("Vouch API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
