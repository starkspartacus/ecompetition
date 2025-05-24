import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les organisateurs peuvent voir les demandes de participation.",
        },
        { status: 403 }
      );
    }

    console.log(
      "🔍 Récupération des demandes de participation en attente pour:",
      session.user.id
    );

    // Récupérer toutes les compétitions de l'organisateur
    const organizerCompetitions =
      await prismaNoTransactions.competition.findMany({
        where: {
          organizerId: session.user.id,
        },
        select: {
          id: true,
          title: true,
        },
      });

    const competitionIds = organizerCompetitions.map((comp) => comp.id);

    if (competitionIds.length === 0) {
      return NextResponse.json({ participations: [] });
    }

    // Récupérer les participations en attente
    const participations = await prismaNoTransactions.participation.findMany({
      where: {
        competitionId: {
          in: competitionIds,
        },
        status: "PENDING",
      },
      include: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        competition: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ ${participations.length} demandes en attente trouvées`);

    // Formater les données
    const formattedParticipations = participations.map((participation) => ({
      id: participation.id,
      participant: {
        id: participation.participant.id,
        firstName: participation.participant.firstName || "",
        lastName: participation.participant.lastName || "",
        email: participation.participant.email || "",
        name:
          `${participation.participant.firstName || ""} ${
            participation.participant.lastName || ""
          }`.trim() || "Participant",
      },
      competition: {
        id: participation.competition.id,
        title: participation.competition.title || "Compétition",
        status: participation.competition.status,
      },
      message: participation.message || "",
      status: participation.status,
      createdAt: participation.createdAt,
      updatedAt: participation.updatedAt,
    }));

    return NextResponse.json({
      participations: formattedParticipations,
      total: formattedParticipations.length,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des demandes de participation:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes de participation" },
      { status: 500 }
    );
  }
}
