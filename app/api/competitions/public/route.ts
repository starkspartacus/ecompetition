import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const country = searchParams.get("country");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    console.log("🔍 Récupération des compétitions publiques...");
    console.log(
      `Filtres: code=${code}, pays=${country}, catégorie=${category}, statut=${status}, recherche=${search}`
    );

    // Construire les filtres
    const where: any = {
      status: {
        in: ["OPEN", "CLOSED", "IN_PROGRESS", "COMPLETED"],
      },
    };

    // Si un code est fourni, rechercher la compétition spécifique
    if (code) {
      where.uniqueCode = code;
    }

    // Filtres additionnels
    if (country && country !== "all") {
      where.country = country;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    // Récupérer les compétitions avec les relations
    const competitions = await prismaNoTransactions.competition.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        participations: {
          where: {
            status: "ACCEPTED",
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ ${competitions.length} compétitions trouvées`);

    // Formater les données pour l'affichage
    const formattedCompetitions = competitions.map((competition) => ({
      id: competition.id,
      name: competition.title,
      title: competition.title,
      description: competition.description || "",
      category: competition.category || "Non spécifié",
      location:
        `${competition.city || ""} ${competition.commune || ""}`.trim() ||
        competition.address ||
        "Lieu non défini",
      country: competition.country || "",
      venue: competition.venue || "",
      city: competition.city || "",
      address: competition.address || "",
      startDate: competition.startDate,
      endDate: competition.endDate,
      registrationStartDate: competition.registrationStartDate,
      registrationDeadline: competition.registrationDeadline,
      maxParticipants: competition.maxParticipants || 0,
      currentParticipants: competition.participations.length,
      participants: competition.participations.length,
      imageUrl: competition.imageUrl,
      bannerUrl: competition.bannerUrl,
      status: competition.status,
      uniqueCode: competition.uniqueCode || "",
      organizerName:
        `${competition.organizer.firstName || ""} ${
          competition.organizer.lastName || ""
        }`.trim() || "Organisateur",
      organizerId: competition.organizer.id,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
    }));

    return NextResponse.json({
      competitions: formattedCompetitions,
      total: formattedCompetitions.length,
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
