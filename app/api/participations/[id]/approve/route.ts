import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { createNotification } from "@/lib/notification-service";
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

    if (!participationId) {
      return NextResponse.json(
        { error: "ID de participation invalide" },
        { status: 400 }
      );
    }

    console.log("✅ Approbation de la participation:", participationId);

    const db = await getDb();

    // Récupérer la participation
    const participation = await db
      .collection("Participation")
      .findOne({ _id: new ObjectId(participationId) });

    if (!participation) {
      return NextResponse.json(
        { error: "Participation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer la compétition
    const competition = await db
      .collection("Competition")
      .findOne({ _id: new ObjectId(participation.competitionId) });

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer le participant
    const participant = await db
      .collection("User")
      .findOne({ _id: new ObjectId(participation.participantId) });

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
      const approvedParticipationsCount = await db
        .collection("Participation")
        .countDocuments({
          competitionId: new ObjectId(competition._id),
          status: "ACCEPTED",
        });

      if (approvedParticipationsCount >= competition.maxParticipants) {
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
    await db.collection("Participation").updateOne(
      { _id: new ObjectId(participationId) },
      {
        $set: {
          status: "ACCEPTED",
          responseMessage: "Participation approuvée",
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ Participation approuvée:", participationId);

    // Créer une notification pour le participant
    const participantName =
      `${participant.firstName || ""} ${participant.lastName || ""}`.trim() ||
      "Participant";

    await createNotification({
      userId: participant._id.toString(),
      type: "PARTICIPATION_APPROVED",
      title: "Participation approuvée",
      message: `Votre demande de participation à "${competition.title}" a été approuvée !`,
      link: `/participant/competitions/${competition._id}`,
    });

    console.log("✅ Notification envoyée au participant");

    return NextResponse.json({
      success: true,
      message: "Participation approuvée avec succès",
      participation: {
        id: participationId,
        status: "ACCEPTED",
        competitionId: competition._id.toString(),
        competitionTitle: competition.title,
        participantId: participant._id.toString(),
        participantName,
        responseMessage: "Participation approuvée",
        updatedAt: new Date(),
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
