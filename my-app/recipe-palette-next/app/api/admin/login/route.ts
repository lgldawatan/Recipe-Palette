import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Missing username or password" },
        { status: 400 }
      );
    }

    //admin collection
    const adminRef = adminDb.collection("admin").doc(username);
    const adminSnap = await adminRef.get();

    if (!adminSnap.exists) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const adminData = adminSnap.data();

    const isValid = await bcrypt.compare(
      password,
      adminData?.passwordHash
    );

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
