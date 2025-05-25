import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est un participant
    if (session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        { error: "Seuls les participants peuvent rejoindre des compétitions" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validation des données
    if (!data.uniqueCode) {
      return NextResponse.json(
        { error: "Code unique manquant" },
        { status: 400 }
      );
    }

    // Récupérer la compétition par son code unique
    const competition = await db.competitions.findByUniqueCode(data.uniqueCode);

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si la compétition est ouverte aux inscriptions
    const now = new Date();
    if (
      now < competition.registrationStartDate ||
      now > competition.registrationEndDate
    ) {
      return NextResponse.json(
        {
          error: "Les inscriptions pour cette compétition ne sont pas ouvertes",
        },
        { status: 400 }
      );
    }

    // Créer la participation
    const participation = await db.participations.create({
      competitionId: competition.id,
      participantId: session.user.id,
      status: "PENDING",
      registrationDate: new Date(),
    });

    return NextResponse.json({
      message: "Demande de participation envoyée avec succès",
      participation,
    });
  } catch (error) {
    console.error("Erreur lors de la demande de participation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la demande de participation" },
      { status: 500 }
    );
  }
}
