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
            "Non autorisé. Seuls les organisateurs peuvent approuver les participations.",
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
      const acceptedParticipations = await db.participations.findByCompetition(
        competition._id!.toString()
      );
      const approvedCount = acceptedParticipations.filter(
        (p) => p.status === "APPROVED"
      ).length;

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
        status: "APPROVED" as any,
        approvalDate: new Date(),
      }
    );

    console.log("✅ Participation approuvée:", participationId);

    // Créer une notification pour le participant
    try {
      await db.notifications.create({
        userId: new ObjectId(participation.participantId.toString()),
        type: "SUCCESS" as any,
        category: "PARTICIPATION" as any,
        title: "Participation approuvée",
        message: `Votre demande de participation à "${competition.name}" a été approuvée !`,
        actionUrl: `/participant/competitions/${competition._id!.toString()}`,
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
      message: "Participation approuvée avec succès",
      participation: {
        id: participationId,
        status: "APPROVED",
        competitionId: competition._id!.toString(),
        competitionName: competition.name,
        participantId: participant._id!.toString(),
        participantName,
        participantEmail: participant.email,
        applicationDate:
          participation.applicationDate || participation.createdAt,
        approvalDate: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'approbation de la participation:",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      {
        error: "Erreur lors de l'approbation de la participation",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
