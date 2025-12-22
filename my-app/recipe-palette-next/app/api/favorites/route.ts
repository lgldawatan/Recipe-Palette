
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";


const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:3000",
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

async function getUid(req: NextRequest) {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : "";

    if (!token) throw new Error("Missing Authorization Bearer token");

    try {
        const decoded = await adminAuth.verifyIdToken(token);
        console.log("Token verified for uid:", decoded.uid);
      
        return {
            uid: decoded.uid,
            email: decoded.email || null,
            name: (decoded.name as string) || null,
            photo: (decoded.picture as string) || null,
        };
    } catch (err: any) {
        console.error("Token verification failed:", err?.message || err);
        throw err;
    }
}


function buildFavoriteDoc(meal: any, savedBy: any ) {
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
        recipeName,
        recipeImage,
        ingredients,
        instructions,
    };

    if (savedBy && typeof savedBy === "object") {
        doc.savedBy = {
            uid: savedBy.uid || null,
            name: savedBy.name || null,
            email: savedBy.email || null,
            photo: savedBy.photo || null,
        };
    } else if (savedBy) {
        doc.savedBy = savedBy;
    }

    const src = (meal.strSource || "").trim();
    if (src) doc.source = src;

    const yt = (meal.strYoutube || "").trim();
    if (yt) doc.youtube = yt;

    return doc;
}


export async function GET(req: NextRequest) {
    try {
        const { uid } = await getUid(req);
        console.log("GET /api/favorites for uid:", uid);

        const snap = await adminDb
            .collection("favorites")
            .doc(uid)
            .collection("recipes")
            .get();

        console.log(`Found ${snap.docs.length} favorites for user ${uid}`);

        const out = snap.docs.map((d) => {
            const data: any = d.data();
            const ingredients = Array.isArray(data.ingredients)
                ? data.ingredients
                : [];
            const instructions = Array.isArray(data.instructions)
                ? data.instructions
                : [];

          
            const savedByObj = data.savedBy && typeof data.savedBy === "object" ? data.savedBy : null;
            const savedByName = savedByObj ? savedByObj.name || null : (typeof data.savedBy === "string" ? data.savedBy : null);
            const savedByPhoto = savedByObj ? savedByObj.photo || null : null;

            return {
                idMeal: data.idMeal || d.id,
                savedBy: data.savedBy || null,
                savedByName,
                savedByPhoto,
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
        console.error("GET /api/favorites error:", err?.message || err);
        return NextResponse.json(
            { error: err.message || "Unauthorized" },
            withCors({ status: 401 })
        );
    }
}


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

           
            const savedBy: { uid: string; name: string | null; email: string | null; photo?: string | null } = {
                uid,
                name: null,
                email: email || null,
            };
     
            const tokenInfo = await adminAuth.getUser(uid).catch(() => null);
            if (tokenInfo) {
                savedBy.name = tokenInfo.displayName || null;
                savedBy.photo = tokenInfo.photoURL || null;
            }

            const data = buildFavoriteDoc(meal, savedBy);

        console.log(`POST /api/favorites - saving meal ${meal.idMeal} for uid: ${uid}`);

        await adminDb
            .collection("favorites")
            .doc(uid)
            .collection("recipes")
            .doc(meal.idMeal)
            .set(data);

        console.log(`Saved favorite ${meal.idMeal} for user ${uid}`);
        return NextResponse.json({ ok: true }, withCors());
    } catch (err: any) {
        console.error("POST /api/favorites error:", err?.message || err);
        return NextResponse.json(
            { error: err.message || "Failed to save favorite" },
            withCors({ status: 400 })
        );
    }
}


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

        console.log(`DELETE /api/favorites - deleting ${idMeal} for uid: ${uid}`);

        await adminDb
            .collection("favorites")
            .doc(uid)
            .collection("recipes")
            .doc(idMeal)
            .delete();

        console.log(`Deleted favorite ${idMeal} for user ${uid}`);
        return NextResponse.json({ ok: true }, withCors());
    } catch (err: any) {
        console.error("DELETE /api/favorites error:", err?.message || err);
        return NextResponse.json(
            { error: err.message || "Failed to delete favorite" },
            withCors({ status: 400 })
        );
    }
}
