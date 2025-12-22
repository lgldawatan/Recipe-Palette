import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebaseAdmin";


async function isAuthenticated() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("adminAuth");
  return !!adminAuth?.value;
}


const DEFAULT_CONTENT = {
  aboutUsText: "At recipe palette., we believe cooking is more than just making meals. It's an art form. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.",
  ourStoryText: "Recipe Palette was born from the love of food and the belief that every kitchen can be a place of creativity. We wanted to create a space where flavors come together, cultures meet, and everyday meals are transformed into vibrant experiences. Whether you're a beginner in the kitchen or a seasoned cook, our platform is designed to inspire, guide, and celebrate your journey.",
  ourMissionText: "Our mission is to inspire home cooks and food lovers to explore diverse recipes, discover vibrant flavors, and transform simple ingredients into extraordinary dishes. At Recipe Palette, we believe that cooking brings joy, creativity, and connection into everyday life.",
  whatWeOfferText: "Global Recipes – Discover dishes from around the world.\n\nCreative Cooking – Transform everyday meals into colorful creations.\n\nSave Favorites – Log in to build your own personal flavor palette.\n\nStep-by-Step Guides – Clear instructions for beginners and experts alike.",
  ourValuesText: "Creativity – Cooking is a canvas for self-expression.\n\nCommunity – Food tastes better when it's shared.\n\nDiversity – Every culture brings flavors worth celebrating.",
  joinUsText: "At Recipe Palette, we celebrate the joy of food and the art of flavor. Explore new dishes, create your own, and share the stories behind every meal. Because every recipe adds color to your journey — and together, they create a palette worth savoring.",
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

    const docRef = adminDb.collection("config").doc("aboutContent");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return NextResponse.json(docSnap.data());
    } else {
      
      await docRef.set(DEFAULT_CONTENT);
      return NextResponse.json(DEFAULT_CONTENT);
    }
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch about content" },
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
    console.log("Received about content to save:", JSON.stringify(body, null, 2));
    
    const docRef = adminDb.collection("config").doc("aboutContent");
    console.log("Saving to Firestore path: config/aboutContent");
    
    await docRef.set(body, { merge: true });

    console.log("Successfully saved about content to Firestore");
    
    const savedDoc = await docRef.get();
    console.log("Verified - data in Firestore:", JSON.stringify(savedDoc.data(), null, 2));
    
    return NextResponse.json({ message: "About content updated successfully" });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: `Failed to update about content: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
