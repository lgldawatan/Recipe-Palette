import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Default home content
const DEFAULT_CONTENT = {
  bannerText: "DISCOVER TASTE INSPIRATION\n\nExplore a palette of recipes, discover vibrant flavors, and let your kitchen become the canvas for your culinary art. Turn everyday cooking into moments of creativity and delight.",
  bannerImage: "/banner1.png",
  aboutUsText: "At recipe palette. we believe cooking is more than just making meals—it's an art. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.",
  aboutUsImage: "/banner6.png",
  addToFavoritesText: "Whether you're trying something new or perfecting a family classic, recipe palette. is your space to learn, create, and celebrate the joy of food. Sign up to save your favorite recipes and build your personal flavor palette.",
  addToFavoritesImage: "/banner7.png",
};

export async function GET(req: NextRequest) {
  try {
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
    // Return default content on error
    return NextResponse.json(DEFAULT_CONTENT);
  }
}
