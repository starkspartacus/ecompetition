import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Vérifier l'ID utilisateur dans la session
    if (!session.user?.id) {
      console.error("ID utilisateur non trouvé dans la session:", session.user);

      // Si l'ID est manquant mais que l'email est présent, essayer de récupérer l'utilisateur
      if (session.user?.email) {
        console.log(
          "ID utilisateur non trouvé dans la session, recherche par email:",
          session.user.email
        );

        const db = await getDb();
        const usersCollection = db.collection("User");
        const user = await usersCollection.findOne({
          email: session.user.email,
        });

        if (user) {
          const userId = user._id ? user._id.toString() : user.id;
          console.log(`Utilisateur trouvé par email, ID: ${userId}`);

          // Utiliser l'ID trouvé pour la suite
          session.user.id = userId;
        } else {
          return NextResponse.json(
            { message: "Utilisateur non trouvé" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { message: "ID utilisateur manquant dans la session" },
          { status: 400 }
        );
      }
    }

    const { competitionId, uniqueCode, message } = await req.json();

    if (!competitionId || !uniqueCode) {
      return NextResponse.json(
        { message: "L'ID de la compétition et le code unique sont requis" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const competitionsCollection = db.collection("Competition");

    // Vérifier si la compétition existe et si le code est correct
    let query = {};

    if (ObjectId.isValid(competitionId)) {
      query = { _id: new ObjectId(competitionId) };
    } else {
      query = { uniqueCode: competitionId };
    }

    const competition = await competitionsCollection.findOne(query);

    if (!competition) {
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    if (competition.uniqueCode !== uniqueCode) {
      return NextResponse.json(
        { message: "Code d'invitation incorrect" },
        { status: 400 }
      );
    }

    // Vérifier si la compétition est ouverte aux inscriptions
    if (
      competition.status !== "OPEN" &&
      competition.status !== "PUBLISHED" &&
      competition.status !== "REGISTRATION_OPEN"
    ) {
      return NextResponse.json(
        {
          message:
            "Les inscriptions ne sont pas ouvertes pour cette compétition",
        },
        { status: 400 }
      );
    }

    // Vérifier si la période d'inscription est valide
    const now = new Date();
    const registrationStartDate = competition.registrationStartDate
      ? new Date(competition.registrationStartDate)
      : null;
    const registrationEndDate = competition.registrationDeadline
      ? new Date(competition.registrationDeadline)
      : competition.registrationEndDate
      ? new Date(competition.registrationEndDate)
      : null;

    if (registrationStartDate && now < registrationStartDate) {
      return NextResponse.json(
        { message: "Les inscriptions ne sont pas encore ouvertes" },
        { status: 400 }
      );
    }

    if (registrationEndDate && now > registrationEndDate) {
      return NextResponse.json(
        { message: "La période d'inscription est terminée" },
        { status: 400 }
      );
    }

    // Vérifier si le nombre maximum de participants est atteint
    if (
      competition.maxParticipants &&
      competition.currentParticipants >= competition.maxParticipants
    ) {
      return NextResponse.json(
        { message: "Le nombre maximum de participants est atteint" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const participationsCollection = db.collection("Participation");
    const existingParticipation = await participationsCollection.findOne({
      competitionId: competition._id,
      participantId: new ObjectId(session.user.id),
    });

    if (existingParticipation) {
      return NextResponse.json(
        { message: "Vous êtes déjà inscrit à cette compétition" },
        { status: 400 }
      );
    }

    // Créer une nouvelle participation
    const participation = {
      competitionId: competition._id,
      participantId: new ObjectId(session.user.id),
      participantName: session.user.name || "Participant",
      participantEmail: session.user.email || "",
      status: "PENDING", // PENDING, APPROVED, REJECTED
      message: message || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await participationsCollection.insertOne(participation);

    // Créer une notification pour l'organisateur
    const notificationsCollection = db.collection("Notification");
    await notificationsCollection.insertOne({
      userId: competition.organizerId,
      type: "PARTICIPATION_REQUEST",
      title: "Nouvelle demande de participation",
      message: `${
        session.user.name || "Un participant"
      } souhaite participer à votre compétition "${
        competition.name || competition.title
      }"`,
      data: {
        competitionId: competition._id.toString(),
        competitionName: competition.name || competition.title,
        participationId: result.insertedId.toString(),
        participantId: session.user.id,
        participantName: session.user.name || "Participant",
      },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "Demande de participation envoyée avec succès",
      participationId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Erreur lors de la demande de participation:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de la demande de participation",
      },
      { status: 500 }
    );
  }
}
