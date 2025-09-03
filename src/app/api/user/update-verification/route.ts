// src/app/api/user/update-verification/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { verificationType } = await request.json();
        const validTypes = ['anonAadhaar', 'socialProof'];

        if (!verificationType || !validTypes.includes(verificationType)) {
            return NextResponse.json({ error: "Invalid verification type." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const fieldToUpdate = `${verificationType}Verified`;

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { [fieldToUpdate]: true } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Verification status updated." });

    } catch (error) {
        console.error("Verification API Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}