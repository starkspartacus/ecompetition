import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";
import { createNotification } from "@/lib/notification-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les organisateurs peuvent approuver les participations.",
        },
        { status: 403 }
      );
    }

    const participationId = params.id;

    if (!participationId) {
      return NextResponse.json(
        { error: "ID de participation invalide" },
        { status: 400 }
      );
    }

    console.log("✅ Approbation de la participation:", participationId);

    // Récupérer la participation avec les informations de la compétition et du participant
    const participation = await prismaNoTransactions.participation.findUnique({
      where: { id: participationId },
      include: {
        competition: {
          select: {
            id: true,
            title: true,
            organizerId: true,
            maxParticipants: true,
            status: true,
          },
        },
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Participation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'organisateur est bien le propriétaire de la compétition
    if (participation.competition.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à approuver cette participation" },
        { status: 403 }
      );
    }

    // Vérifier que la participation est en attente
    if (participation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette participation a déjà été traitée" },
        { status: 400 }
      );
    }

    // Vérifier que la compétition est encore ouverte
    if (participation.competition.status !== "OPEN") {
      return NextResponse.json(
        { error: "Cette compétition n'est plus ouverte aux inscriptions" },
        { status: 400 }
      );
    }

    // Vérifier le nombre maximum de participants si défini
    if (participation.competition.maxParticipants) {
      const approvedParticipationsCount =
        await prismaNoTransactions.participation.count({
          where: {
            competitionId: participation.competitionId,
            status: "ACCEPTED",
          },
        });

      if (
        approvedParticipationsCount >= participation.competition.maxParticipants
      ) {
        return NextResponse.json(
          {
            error:
              "Le nombre maximum de participants pour cette compétition a été atteint",
          },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le statut de la participation
    const updatedParticipation =
      await prismaNoTransactions.participation.update({
        where: { id: participationId },
        data: {
          status: "ACCEPTED",
          responseMessage: "Participation approuvée",
        },
      });

    console.log("✅ Participation approuvée:", updatedParticipation.id);

    // Créer une notification pour le participant
    const participantName =
      `${participation.participant.firstName || ""} ${
        participation.participant.lastName || ""
      }`.trim() || "Participant";

    await createNotification({
      userId: participation.participant.id,
      type: "PARTICIPATION_APPROVED",
      title: "Participation approuvée",
      message: `Votre demande de participation à "${participation.competition.title}" a été approuvée !`,
      link: `/participant/competitions/${participation.competition.id}`,
    });

    console.log("✅ Notification envoyée au participant");

    return NextResponse.json({
      success: true,
      message: "Participation approuvée avec succès",
      participation: {
        id: updatedParticipation.id,
        status: updatedParticipation.status,
        competitionId: participation.competition.id,
        competitionTitle: participation.competition.title,
        participantId: participation.participant.id,
        participantName,
        responseMessage: updatedParticipation.responseMessage,
        updatedAt: updatedParticipation.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'approbation de la participation:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de l'approbation de la participation" },
      { status: 500 }
    );
  }
}
