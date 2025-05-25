import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

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

    if (!participationId || !ObjectId.isValid(participationId)) {
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
      participation.competitionId.toString()
    );

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer le participant
    const participant = await db.users.findById(
      participation.participantId.toString()
    );

    if (!participant) {
      return NextResponse.json(
        { error: "Participant non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'organisateur est bien le propriétaire de la compétition
    if (competition.organizerId.toString() !== session.user.id) {
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
        status: "REJECTED" as any,
        rejectionReason: rejectionReason,
        approvalDate: new Date(),
      }
    );

    console.log("❌ Participation rejetée:", participationId);

    // Créer une notification pour le participant
    try {
      await db.notifications.create({
        userId: new ObjectId(participation.participantId.toString()),
        type: "ERROR" as any,
        category: "PARTICIPATION" as any,
        title: "Participation rejetée",
        message: `Votre demande de participation à "${competition.name}" a été rejetée. Raison: ${rejectionReason}`,
        actionUrl: `/participant/competitions/browse`,
        isRead: false,
      });

      console.log("✅ Notification envoyée au participant");
    } catch (notificationError) {
      console.error(
        "⚠️ Erreur lors de l'envoi de la notification:",
        notificationError
      );
      // Continue même si la notification échoue
    }

    // Préparer la réponse avec les données enrichies
    const participantName =
      `${participant.firstName || ""} ${participant.lastName || ""}`.trim() ||
      "Participant";

    return NextResponse.json({
      success: true,
      message: "Participation rejetée avec succès",
      participation: {
        id: participationId,
        status: "REJECTED",
        competitionId: competition._id!.toString(),
        competitionName: competition.name,
        participantId: participant._id!.toString(),
        participantName,
        participantEmail: participant.email,
        rejectionReason,
        applicationDate:
          participation.applicationDate || participation.createdAt,
        approvalDate: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors du rejet de la participation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      {
        error: "Erreur lors du rejet de la participation",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
