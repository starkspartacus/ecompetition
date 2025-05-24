import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notification-service";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent s'inscrire à une compétition.",
        },
        { status: 403 }
      );
    }

    const { competitionId, competitionCode } = await request.json();

    if (!competitionId && !competitionCode) {
      return NextResponse.json(
        { error: "ID de compétition ou code requis" },
        { status: 400 }
      );
    }

    // Rechercher la compétition par ID ou par titre (comme code alternatif)
    let competition;
    if (competitionId) {
      competition = await prismaNoTransactions.competition.findUnique({
        where: { id: competitionId },
        include: {
          organizer: true,
        },
      });
    } else {
      // Recherche par titre si pas d'ID (utilisation du titre comme code)
      competition = await prismaNoTransactions.competition.findFirst({
        where: {
          title: {
            contains: competitionCode,
            mode: "insensitive",
          },
        },
        include: {
          organizer: true,
        },
      });
    }

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la compétition est ouverte aux inscriptions (statut DRAFT permet les inscriptions)
    if (
      competition.status === "CLOSED" ||
      competition.status === "COMPLETED" ||
      competition.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          error: "Les inscriptions pour cette compétition ne sont pas ouvertes",
        },
        { status: 400 }
      );
    }

    // Vérifier que le participant n'est pas déjà inscrit
    const existingParticipation =
      await prismaNoTransactions.participation.findFirst({
        where: {
          competitionId: competition.id,
          participantId: session.user.id,
        },
      });

    if (existingParticipation) {
      return NextResponse.json(
        {
          error: "Vous êtes déjà inscrit à cette compétition",
          participationId: existingParticipation.id,
        },
        { status: 400 }
      );
    }

    // Vérifier que la compétition n'a pas atteint sa limite de participants
    if (competition.maxParticipants) {
      const currentParticipants =
        await prismaNoTransactions.participation.count({
          where: {
            competitionId: competition.id,
            status: "ACCEPTED",
          },
        });

      if (currentParticipants >= competition.maxParticipants) {
        return NextResponse.json(
          { error: "Cette compétition a atteint sa limite de participants" },
          { status: 400 }
        );
      }
    }

    // Créer la participation
    const participation = await prismaNoTransactions.participation.create({
      data: {
        competitionId: competition.id,
        participantId: session.user.id,
        status: "PENDING",
      },
    });

    // Créer une notification pour l'organisateur
    await createNotification({
      userId: competition.organizerId,
      type: "PARTICIPATION_REQUEST",
      title: "Nouvelle demande de participation",
      message: `${session.user.name} souhaite participer à votre compétition "${competition.title}"`,
      link: `/organizer/competitions/${competition.id}/participants`,
    });

    return NextResponse.json({
      success: true,
      message: "Demande de participation envoyée avec succès",
      participationId: participation.id,
      competition: {
        id: competition.id,
        title: competition.title,
        status: competition.status,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la demande de participation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la demande de participation" },
      { status: 500 }
    );
  }
}
