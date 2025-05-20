import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCompetitionWithoutTransaction } from "@/lib/db-helpers";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";

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

    // Créer la compétition sans transaction
    const competition = await createCompetitionWithoutTransaction({
      name: data.name,
      description: data.description,
      location: data.location,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      maxParticipants: data.maxParticipants,
      category: data.category,
      rules: data.rules || [],
      organizerId: session.user.id,
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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (category) {
      whereClause.category = category;
    }

    // Si l'utilisateur est un organisateur, ne montrer que ses compétitions
    if (session.user.role === "ORGANIZER") {
      whereClause.organizerId = session.user.id;
    }

    // Requête simple sans transaction
    const competitions = await prismaNoTransactions.competition.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}
