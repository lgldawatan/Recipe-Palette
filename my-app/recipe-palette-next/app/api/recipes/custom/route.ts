import { adminDb } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

// Enable CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET() {
  try {
    const recipesSnapshot = await adminDb.collection("recipes").get();
    const recipes: Record<string, any> = {};

    recipesSnapshot.forEach((doc) => {
      recipes[doc.id] = doc.data();
    });

    console.log("Custom recipes loaded:", Object.keys(recipes));
    console.log("Sample recipe:", Object.values(recipes)[0]);

    const response = NextResponse.json({ recipes }, { status: 200 });
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error("Error fetching custom recipes:", error);
    const response = NextResponse.json(
      { message: error.message || "Failed to fetch recipes" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
