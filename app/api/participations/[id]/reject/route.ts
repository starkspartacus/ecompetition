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
            "Non autorisé. Seuls les organisateurs peuvent rejeter les participations.",
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

    // Récupérer le motif de rejet depuis le body de la requête
    const body = await request.json();
    const rejectionReason = body.reason || "Aucune raison spécifiée";

    console.log(
      "❌ Rejet de la participation:",
      participationId,
      "Raison:",
      rejectionReason
    );

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
    const updatedParticipation = await db.participations.updateById(
      participationId,
      {
        status: "REJECTED",
        responseMessage: rejectionReason,
      }
    );

    console.log("❌ Participation rejetée:", participationId);

    // Créer une notification pour le participant
    await db.notifications.create({
      userId: participation.participantId,
      type: "PARTICIPATION_REJECTED",
      title: "Participation rejetée",
      message: `Votre demande de participation à "${competition.title}" a été rejetée. Raison: ${rejectionReason}`,
      link: `/participant/competitions/browse`,
    });

    console.log("✅ Notification envoyée au participant");

    return NextResponse.json({
      success: true,
      message: "Participation rejetée avec succès",
      participation: updatedParticipation,
    });
  } catch (error) {
    console.error("❌ Erreur lors du rejet de la participation:", error);
    return NextResponse.json(
      { error: "Erreur lors du rejet de la participation" },
      { status: 500 }
    );
  }
}
