import { adminDb } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      idMeal,
      strMeal,
      strCategory,
      strArea,
      strInstructions,
      strMealThumb,
      strYoutube,
      ingredients,
    } = body;

    // Validate required fields
    if (
      !idMeal ||
      !strMeal ||
      !strCategory ||
      !strArea ||
      !strInstructions
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to Firestore under 'recipes' collection
    const recipeRef = adminDb.collection("recipes").doc(String(idMeal));

    const recipeData = {
      idMeal: String(idMeal),
      strMeal,
      strCategory,
      strArea,
      strInstructions,
      strMealThumb,
      strYoutube: strYoutube || "",
      ingredients: ingredients || [],
      updatedAt: new Date().toISOString(),
    };

    console.log(`Saving recipe ${idMeal}:`, recipeData);

    await recipeRef.set(recipeData, { merge: true });

    console.log(`Recipe ${idMeal} saved successfully`);

    return NextResponse.json(
      {
        message: "Recipe updated successfully",
        data: recipeData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating recipe:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update recipe" },
      { status: 500 }
    );
  }
}

