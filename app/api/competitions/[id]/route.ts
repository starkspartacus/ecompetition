import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

// GET: Récupérer une compétition par ID ou code unique
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = context.params;

    console.log(`🔍 Recherche de la compétition avec ID/code: ${id}`);

    // Rechercher par ID ou code unique
    let competition = await db.competitions.findById(id);

    if (!competition) {
      competition = await db.competitions.findByUniqueCode(id);
    }

    if (!competition) {
      console.log(`❌ Compétition non trouvée avec ID/code: ${id}`);
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    console.log(`✅ Compétition trouvée: ${competition.name || "Sans titre"}`);

    return NextResponse.json(competition);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la compétition:",
      error
    );
    return NextResponse.json(
      {
        message: `Erreur: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour une compétition
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = context.params;
    const data = await request.json();

    // Vérifier si la compétition existe et appartient à l'organisateur
    const existingCompetition = await db.competitions.findById(id);

    if (
      !existingCompetition ||
      existingCompetition.organizerId.toString() !== session.user.id
    ) {
      return NextResponse.json(
        {
          message:
            "Compétition non trouvée ou vous n'êtes pas autorisé à la modifier",
        },
        { status: 404 }
      );
    }

    // Mettre à jour la compétition
    const updatedCompetition = await db.competitions.updateById(id, data);

    if (!updatedCompetition) {
      return NextResponse.json(
        { message: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Compétition mise à jour avec succès",
      competition: updatedCompetition,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la compétition:", error);
    return NextResponse.json(
      {
        message: `Erreur: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      },
      { status: 500 }
    );
  }
}
