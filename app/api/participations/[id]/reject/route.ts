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
            "Non autorisé. Seuls les organisateurs peuvent rejeter les participations.",
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

    // Récupérer le motif de rejet depuis le body de la requête
    const body = await request.json();
    const rejectionReason = body.reason || "Aucune raison spécifiée";

    // Récupérer la participation avec les informations de la compétition et du participant
    const participation = await prismaNoTransactions.participation.findUnique({
      where: { id: participationId },
      include: {
        competition: {
          select: {
            id: true,
            title: true,
            organizerId: true,
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
        { error: "Vous n'êtes pas autorisé à rejeter cette participation" },
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

    // Mettre à jour le statut de la participation
    const updatedParticipation =
      await prismaNoTransactions.participation.update({
        where: { id: participationId },
        data: {
          status: "REJECTED",
          responseMessage: rejectionReason,
        },
      });

    // Créer une notification pour le participant
    await createNotification({
      userId: participation.participant.id,
      type: "PARTICIPATION_REJECTED",
      title: "Participation rejetée",
      message: `Votre demande de participation à "${participation.competition.title}" a été rejetée. Raison: ${rejectionReason}`,
      link: `/participant/competitions/browse`,
    });

    return NextResponse.json({
      success: true,
      message: "Participation rejetée avec succès",
      participation: {
        id: updatedParticipation.id,
        status: updatedParticipation.status,
        competitionId: participation.competition.id,
        participantId: participation.participant.id,
        participantName: `${participation.participant.firstName} ${participation.participant.lastName}`,
        responseMessage: updatedParticipation.responseMessage,
        updatedAt: updatedParticipation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erreur lors du rejet de la participation:", error);
    return NextResponse.json(
      { error: "Erreur lors du rejet de la participation" },
      { status: 500 }
    );
  }
}
