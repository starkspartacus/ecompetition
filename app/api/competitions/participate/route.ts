import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";
import { broadcastToOrganizer } from "@/lib/websocket-service";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Non autorisé - Veuillez vous connecter",
        },
        { status: 401 }
      );
    }

    // Récupérer les données de la requête
    const data = await request.json();
    const { competitionId, message, uniqueCode } = data;

    if (!competitionId && !uniqueCode) {
      return NextResponse.json(
        {
          success: false,
          message: "L'ID de la compétition ou le code unique est requis",
        },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const db = await connectDB();
    const competitionsCollection = db.collection("Competition");
    const participationsCollection = db.collection("Participation");
    const usersCollection = db.collection("User");
    const notificationsCollection = db.collection("Notification");

    // Récupérer l'utilisateur
    let userId = session.user.id;

    // Si l'ID n'est pas dans la session, le récupérer depuis la base de données
    if (!userId && session.user.email) {
      const user = await usersCollection.findOne({ email: session.user.email });
      if (user && user._id) {
        userId = user._id.toString();
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID utilisateur manquant dans la session",
        },
        { status: 400 }
      );
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilisateur non trouvé",
        },
        { status: 404 }
      );
    }

    // Récupérer la compétition par ID ou code unique
    let competition;
    if (competitionId) {
      competition = await competitionsCollection.findOne({
        _id: new ObjectId(competitionId),
      });
    } else if (uniqueCode) {
      competition = await competitionsCollection.findOne({ uniqueCode });
    }

    if (!competition) {
      return NextResponse.json(
        {
          success: false,
          message: "Compétition non trouvée",
        },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà participé à cette compétition
    const existingParticipation = await participationsCollection.findOne({
      competitionId: competition._id,
      participantId: new ObjectId(userId),
    });

    if (existingParticipation) {
      return NextResponse.json(
        {
          success: false,
          message: "Vous êtes déjà inscrit à cette compétition",
          participationStatus: existingParticipation.status,
        },
        { status: 400 }
      );
    }

    // Vérifier le statut de la compétition
    const now = new Date();

    // Vérifier si les inscriptions sont ouvertes
    if (competition.status !== "OPEN") {
      if (competition.status === "DRAFT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Les inscriptions ne sont pas encore ouvertes pour cette compétition",
          },
          { status: 400 }
        );
      } else if (competition.status === "CLOSED") {
        return NextResponse.json(
          {
            success: false,
            message: "Les inscriptions sont fermées pour cette compétition",
          },
          { status: 400 }
        );
      } else if (competition.status === "IN_PROGRESS") {
        return NextResponse.json(
          {
            success: false,
            message: "Cette compétition est déjà en cours",
          },
          { status: 400 }
        );
      } else if (competition.status === "COMPLETED") {
        return NextResponse.json(
          {
            success: false,
            message: "Cette compétition est terminée",
          },
          { status: 400 }
        );
      }
    }

    // Vérifier les dates d'inscription
    const registrationDeadline =
      competition.registrationDeadline || competition.registrationEndDate;
    if (registrationDeadline && now > new Date(registrationDeadline)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La période d'inscription est terminée pour cette compétition",
        },
        { status: 400 }
      );
    }

    // Vérifier le nombre maximum de participants
    const currentParticipantsCount =
      await participationsCollection.countDocuments({
        competitionId: competition._id,
        status: { $in: ["PENDING", "APPROVED"] },
      });

    if (
      competition.maxParticipants &&
      currentParticipantsCount >= competition.maxParticipants
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le nombre maximum de participants pour cette compétition est atteint",
        },
        { status: 400 }
      );
    }

    // Créer la participation
    const participationData = {
      competitionId: competition._id,
      participantId: new ObjectId(userId),
      participantName:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      participantEmail: user.email,
      participantPhone: user.phoneNumber || "",
      status: "PENDING",
      message: message || "Demande de participation",
      createdAt: now,
      updatedAt: now,
    };

    const result = await participationsCollection.insertOne(participationData);

    if (!result.acknowledged) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la création de la participation",
        },
        { status: 500 }
      );
    }

    // Créer une notification pour l'organisateur
    const notificationData = {
      type: "PARTICIPATION_REQUEST",
      title: "Nouvelle demande de participation",
      message: `${
        participationData.participantName
      } souhaite participer à votre compétition "${
        competition.title || "Sans titre"
      }"`,
      isRead: false,
      userId: competition.organizerId,
      link: `/organizer/participations/${result.insertedId}`,
      data: {
        competitionId: competition._id.toString(),
        competitionTitle: competition.title || "Sans titre",
        participationId: result.insertedId.toString(),
        participantId: userId,
        participantName: participationData.participantName,
      },
      createdAt: now,
    };

    await notificationsCollection.insertOne(notificationData);

    // Envoyer une notification en temps réel à l'organisateur
    try {
      console.log(
        "Envoi de notification en temps réel à l'organisateur:",
        competition.organizerId.toString()
      );
      await broadcastToOrganizer(
        competition.organizerId.toString(),
        "new_participation",
        {
          participationId: result.insertedId.toString(),
          competitionTitle: competition.title || "Sans titre",
          participantName: participationData.participantName,
          timestamp: now.toISOString(),
        }
      );
    } catch (wsError) {
      console.error(
        "Erreur lors de l'envoi de la notification WebSocket:",
        wsError
      );
      // Continue même si la notification WebSocket échoue
    }

    return NextResponse.json({
      success: true,
      message: "Votre demande de participation a été envoyée avec succès",
      participationId: result.insertedId.toString(),
      competitionTitle: competition.title || "Sans titre",
    });
  } catch (error) {
    console.error("Erreur lors de la participation:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors de la demande de participation. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}
