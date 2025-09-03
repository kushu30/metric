import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { newRole } = await request.json();
    const validRoles = ["borrower", "lender", "both"];
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { role: newRole } }
    );

    return NextResponse.json({ success: true, role: newRole });

  } catch (error) {
    console.error("Update Role API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}