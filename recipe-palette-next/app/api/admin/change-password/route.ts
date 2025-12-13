import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json();

    if (!newPassword) {
      return NextResponse.json(
        { message: "Missing password" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    
    await adminDb
      .collection("admin")
      .doc("rpadmin")
      .set(
        {
          username: "rpadmin",
          passwordHash,
          passwordUpdatedAt: Timestamp.now(),
        },
        { merge: true } 
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update password" },
      { status: 500 }
    );
  }
}
