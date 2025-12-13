import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Missing credentials" },
        { status: 400 }
      );
    }

    const snap = await adminDb.collection("admin").doc("rpadmin").get();

    if (!snap.exists) {
      return NextResponse.json(
        { message: "Admin account not found" },
        { status: 404 }
      );
    }

   
    const admin = snap.data() as {
      username: string;
      passwordHash: string;
    };

    // Check username
    if (admin.username !== username) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check password
    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}
