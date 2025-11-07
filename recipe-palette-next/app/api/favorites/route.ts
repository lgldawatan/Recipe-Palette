
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

// ===== CORS: React app origin =====
const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:3001",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(init?: ResponseInit): ResponseInit {
    return {
        ...(init || {}),
        headers: {
            ...(init?.headers || {}),
            ...corsHeaders,
        },
    };
}

export function OPTIONS() {
    return new NextResponse(null, withCors({ status: 204 }));
}

// ===== Auth helper =====
async function getUid(req: NextRequest) {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : "";

    if (!token) throw new Error("Missing Authorization Bearer token");

    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || null };
}

// ===== Helper: build favorite doc =====
function buildFavoriteDoc(meal: any, savedBy: string | null) {
    const idMeal = meal.idMeal;
    const recipeName = meal.strMeal;
    const recipeImage = meal.strMealThumb;

    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
        const ing = (meal[`strIngredient${i}`] || "").trim();
        const meas = (meal[`strMeasure${i}`] || "").trim();
        if (!ing) continue;
        const combo = `${ing}${meas ? ` ${meas}` : ""}`.trim();
        ingredients.push(combo);
    }

    const rawInstr = (meal.strInstructions || "").trim();
    const instructions =
        rawInstr === ""
            ? []
            : rawInstr
                .split(/\r?\n+/)
                .map((s: string) =>
                    s
                        .replace(/^(?:STEP\s*)?\d+(?:[.)\-:])?\s*/i, "")
                        .trim()
                )
                .filter((s: string) => s.length > 0);

    const doc: any = {
        idMeal,
        savedBy,
        recipeName,
        recipeImage,
        ingredients,
        instructions,
    };

    const src = (meal.strSource || "").trim();
    if (src) doc.source = src;

    const yt = (meal.strYoutube || "").trim();
    if (yt) doc.youtube = yt;

    return doc;
}

// ===== GET=====
export async function GET(req: NextRequest) {
    try {
        const { uid } = await getUid(req);

        const snap = await adminDb
            .collection("favorites")
            .doc(uid)
            .collection("recipes")
            .get();

        const out = snap.docs.map((d) => {
            const data: any = d.data();
            const ingredients = Array.isArray(data.ingredients)
                ? data.ingredients
                : [];
            const instructions = Array.isArray(data.instructions)
                ? data.instructions
                : [];

            return {
                idMeal: data.idMeal || d.id,
                savedBy: data.savedBy || null,
                recipeName: data.recipeName,
                recipeImage: data.recipeImage,
                ingredients,
                instructions,
                source: data.source || null,
                youtube: data.youtube || null,


                strMeal: data.recipeName,
                strMealThumb: data.recipeImage,
                strInstructions: instructions.join("\n"),
            };
        });

        return NextResponse.json(out, withCors());
    } catch (err: any) {
        console.error("GET /api/favorites error:", err);
        return NextResponse.json(
            { error: err.message || "Unauthorized" },
            withCors({ status: 401 })
        );
    }
}

// ===== POST=====
export async function POST(req: NextRequest) {
    try {
        const { uid, email } = await getUid(req);
        const { meal } = await req.json();

        if (!meal || !meal.idMeal) {
            return NextResponse.json(
                { error: "Missing meal.idMeal" },
                withCors({ status: 400 })
            );
        }

        const data = buildFavoriteDoc(meal, email);

        await adminDb
            .collection("favorites")
            .doc(uid)
            .collection("recipes")
            .doc(meal.idMeal)
            .set(data);

        return NextResponse.json({ ok: true }, withCors());
    } catch (err: any) {
        console.error("POST /api/favorites error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to save favorite" },
            withCors({ status: 400 })
        );
    }
}

// ===== DELETE=====
export async function DELETE(req: NextRequest) {
    try {
        const { uid } = await getUid(req);
        const { idMeal } = await req.json();

        if (!idMeal) {
            return NextResponse.json(
                { error: "Missing idMeal" },
                withCors({ status: 400 })
            );
        }

        await adminDb
            .collection("favorites")
            .doc(uid)
            .collection("recipes")
            .doc(idMeal)
            .delete();

        return NextResponse.json({ ok: true }, withCors());
    } catch (err: any) {
        console.error("DELETE /api/favorites error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to delete favorite" },
            withCors({ status: 400 })
        );
    }
}
