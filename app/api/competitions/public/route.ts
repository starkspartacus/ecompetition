import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const country = searchParams.get("country");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "12");

    console.log("🔍 Récupération des compétitions publiques...");
    console.log(
      `Filtres: code=${code}, pays=${country}, catégorie=${category}, statut=${status}, recherche=${search}`
    );

    // Si un code est fourni, rechercher la compétition spécifique
    if (code) {
      const competition = await db.competitions.findByUniqueCode(code);
      if (!competition) {
        return NextResponse.json({
          competitions: [],
          total: 0,
        });
      }

      return NextResponse.json({
        competitions: [competition],
        total: 1,
      });
    }

    // Récupérer les compétitions publiques avec filtres
    const { competitions, total } =
      await db.competitions.findPublicCompetitions({
        country: country && country !== "all" ? country : undefined,
        category: category && category !== "all" ? category : undefined,
        status: status && status !== "all" ? status.toUpperCase() : undefined,
        search: search || undefined,
        page,
        limit,
      });

    console.log(`✅ ${competitions.length} compétitions trouvées`);

    return NextResponse.json({
      competitions,
      total,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des compétitions publiques:",
      error
    );
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des compétitions",
        competitions: [],
      },
      { status: 500 }
    );
  }
}
