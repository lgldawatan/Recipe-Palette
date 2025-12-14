import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebaseAdmin";

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("adminAuth");
  return !!adminAuth?.value;
}

// Default home content
const DEFAULT_CONTENT = {
  bannerText: "DISCOVER TASTE INSPIRATION\n\nExplore a palette of recipes, discover vibrant flavors, and let your kitchen become the canvas for your culinary art. Turn everyday cooking into moments of creativity and delight.",
  aboutUsText: "At recipe palette. we believe cooking is more than just making meals—it's an art. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.",
  addToFavoritesText: "Whether you're trying something new or perfecting a family classic, recipe palette. is your space to learn, create, and celebrate the joy of food. Sign up to save your favorite recipes and build your personal flavor palette.",
};

export async function GET(req: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const docRef = adminDb.collection("config").doc("homeContent");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return NextResponse.json(docSnap.data());
    } else {
      // Initialize with default content if doesn't exist
      await docRef.set(DEFAULT_CONTENT);
      return NextResponse.json(DEFAULT_CONTENT);
    }
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch home content" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.log("PUT request - Not authenticated");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Saving to Firestore:", body);
    
    const docRef = adminDb.collection("config").doc("homeContent");
    await docRef.set(body, { merge: true });

    console.log("Successfully saved to Firestore");
    return NextResponse.json({ message: "Home content updated successfully" });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: `Failed to update home content: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
