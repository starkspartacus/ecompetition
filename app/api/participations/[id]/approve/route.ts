import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: participationId } = await params;

    if (!participationId) {
      return NextResponse.json(
        { error: "ID de participation invalide" },
        { status: 400 }
      );
    }

    console.log("✅ Approbation de la participation:", participationId);

    // Récupérer la participation
    const participation = await db.participations.findById(participationId);

    if (!participation) {
      return NextResponse.json(
        { error: "Participation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer la compétition
    const competition = await db.competitions.findById(
      participation.competitionId
    );

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'organisateur est bien le propriétaire de la compétition
    if (competition.organizerId !== session.user.id) {
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
    if (competition.status !== "OPEN") {
      return NextResponse.json(
        { error: "Cette compétition n'est plus ouverte aux inscriptions" },
        { status: 400 }
      );
    }

    // Vérifier le nombre maximum de participants si défini
    if (competition.maxParticipants) {
      const approvedCount = await db.participations.countAcceptedByCompetition(
        competition.id
      );

      if (approvedCount >= competition.maxParticipants) {
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
    const updatedParticipation = await db.participations.updateById(
      participationId,
      {
        status: "ACCEPTED",
        responseMessage: "Participation approuvée",
      }
    );

    console.log("✅ Participation approuvée:", participationId);

    // Créer une notification pour le participant
    const participant = await db.users.findById(participation.participantId);

    await db.notifications.create({
      userId: participation.participantId,
      type: "PARTICIPATION_APPROVED",
      title: "Participation approuvée",
      message: `Votre demande de participation à "${competition.title}" a été approuvée !`,
      link: `/participant/competitions/${competition.id}`,
    });

    console.log("✅ Notification envoyée au participant");

    return NextResponse.json({
      success: true,
      message: "Participation approuvée avec succès",
      participation: updatedParticipation,
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
