import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createCompetition,
  getCompetitionsByOrganizerId,
} from "@/lib/competition-service";
import { CompetitionStatus } from "@/lib/prisma-schema";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est un organisateur
    if (session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Seuls les organisateurs peuvent créer des compétitions" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validation des données
    if (!data.name || !data.description || !data.location || !data.category) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    if (
      !data.startDate ||
      !data.endDate ||
      !data.registrationStartDate ||
      !data.registrationEndDate
    ) {
      return NextResponse.json({ error: "Dates manquantes" }, { status: 400 });
    }

    if (!data.maxParticipants || data.maxParticipants < 2) {
      return NextResponse.json(
        { error: "Le nombre minimum de participants est 2" },
        { status: 400 }
      );
    }

    // Convertir les dates en objets Date
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const registrationStartDate = new Date(data.registrationStartDate);
    const registrationEndDate = new Date(data.registrationEndDate);

    // Vérifier que les dates sont valides
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    if (registrationEndDate < registrationStartDate) {
      return NextResponse.json(
        {
          error:
            "La date limite d'inscription doit être postérieure à la date de début d'inscription",
        },
        { status: 400 }
      );
    }

    if (startDate < registrationEndDate) {
      return NextResponse.json(
        {
          error:
            "La date de début de la compétition doit être postérieure à la date limite d'inscription",
        },
        { status: 400 }
      );
    }

    console.log("Tentative de création de compétition via API...");

    // Créer la compétition avec le service
    const competition = await createCompetition({
      name: data.name,
      description: data.description,
      location: data.location,
      venue: data.venue || data.location,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      maxParticipants: data.maxParticipants,
      category: data.category,
      rules: data.rules || [],
      organizerId: session.user.id,
      status: CompetitionStatus.DRAFT,
      isPublic: true,
    });

    console.log("Compétition créée avec succès via API:", competition.id);

    return NextResponse.json({
      message: "Compétition créée avec succès",
      competition,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la compétition" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("❌ Session non trouvée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("✅ Session trouvée pour l'utilisateur:", session.user.id);
    console.log(
      "🔍 Récupération des compétitions pour l'organisateur:",
      session.user.id
    );

    // Récupérer les compétitions avec le service
    const competitions = await getCompetitionsByOrganizerId(session.user.id);

    console.log("✅ Compétitions récupérées:", competitions.length);
    console.log(
      "📊 Détails des compétitions:",
      competitions.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        uniqueCode: c.uniqueCode,
      }))
    );

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}
