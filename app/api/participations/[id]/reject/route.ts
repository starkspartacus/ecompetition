import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { broadcastToUser } from "@/lib/websocket-service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANIZER") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { competitionId, participantId } = await req.json();

    if (!params.id || !competitionId || !participantId) {
      return NextResponse.json(
        { message: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Vérifier que la compétition appartient à l'organisateur
    const competitionsCollection = db.collection("Competition");
    const competition = await competitionsCollection.findOne({
      _id: new ObjectId(competitionId),
      organizerId: new ObjectId(session.user.id),
    });

    if (!competition) {
      return NextResponse.json(
        { message: "Compétition non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Vérifier que la participation existe et est en attente
    const participationsCollection = db.collection("Participation");
    const participation = await participationsCollection.findOne({
      _id: new ObjectId(params.id),
      competitionId: new ObjectId(competitionId),
      participantId: new ObjectId(participantId),
      status: "PENDING",
    });

    if (!participation) {
      return NextResponse.json(
        { message: "Demande de participation non trouvée ou déjà traitée" },
        { status: 404 }
      );
    }

    // Mettre à jour le statut de la participation
    await participationsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: "REJECTED",
          updatedAt: new Date(),
          rejectedBy: new ObjectId(session.user.id),
          rejectedAt: new Date(),
        },
      }
    );

    // Créer une notification pour le participant
    const notificationsCollection = db.collection("Notification");
    await notificationsCollection.insertOne({
      userId: new ObjectId(participantId),
      type: "PARTICIPATION_REJECTED",
      title: "Participation refusée",
      message: `Votre demande de participation à la compétition "${competition.title}" a été refusée.`,
      data: {
        competitionId: competitionId,
        competitionName: competition.title,
        participationId: params.id,
      },
      read: false,
      createdAt: new Date(),
    });

    // Envoyer une notification en temps réel au participant
    try {
      await broadcastToUser(participantId, "notification", {
        type: "PARTICIPATION_REJECTED",
        title: "Participation refusée",
        message: `Votre demande de participation à la compétition "${competition.title}" a été refusée.`,
        data: {
          competitionId: competitionId,
          competitionName: competition.title,
          participationId: params.id,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification en temps réel:",
        error
      );
      // Ne pas échouer la requête si la notification échoue
    }

    return NextResponse.json({
      message: "Demande de participation refusée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du refus de la participation:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors du refus de la participation" },
      { status: 500 }
    );
  }
}
