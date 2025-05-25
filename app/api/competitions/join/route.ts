import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [JOIN] Début de la demande de participation");

    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("❌ [JOIN] Session non trouvée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log(
      `👤 [JOIN] Utilisateur: ${session.user.email} (${session.user.role})`
    );

    // Vérifier si l'utilisateur est un participant
    if (session.user.role !== "PARTICIPANT") {
      console.log("❌ [JOIN] Utilisateur non autorisé - rôle incorrect");
      return NextResponse.json(
        { error: "Seuls les participants peuvent rejoindre des compétitions" },
        { status: 403 }
      );
    }

    const data = await request.json();
    console.log("📝 [JOIN] Données reçues:", data);

    // Validation des données
    if (!data.uniqueCode) {
      console.log("❌ [JOIN] Code unique manquant");
      return NextResponse.json(
        { error: "Code unique manquant" },
        { status: 400 }
      );
    }

    console.log(
      `🔍 [JOIN] Recherche de la compétition avec le code: ${data.uniqueCode}`
    );

    // Récupérer la compétition par son code unique (recherche par nom)
    let competition = null;

    try {
      // 1. Recherche exacte par nom
      console.log("🔍 [JOIN] Recherche exacte par nom...");
      const exactMatches = await db.competitions.findMany({
        name: data.uniqueCode,
      });
      if (exactMatches && exactMatches.length > 0) {
        competition = exactMatches[0];
        console.log("✅ [JOIN] Compétition trouvée par nom exact");
      }
    } catch (error) {
      console.log("⚠️ [JOIN] Erreur lors de la recherche exacte:", error);
    }

    if (!competition) {
      try {
        // 2. Recherche partielle par nom
        console.log("🔍 [JOIN] Recherche partielle par nom...");
        const partialMatches = await db.competitions.findMany({});
        if (partialMatches && partialMatches.length > 0) {
          competition = partialMatches.find(
            (c) =>
              c.name &&
              c.name.toLowerCase().includes(data.uniqueCode.toLowerCase())
          );
          if (competition) {
            console.log("✅ [JOIN] Compétition trouvée par nom partiel");
          }
        }
      } catch (error) {
        console.log("⚠️ [JOIN] Erreur lors de la recherche partielle:", error);
      }
    }

    if (!competition) {
      try {
        // 3. Recherche dans la description
        console.log("🔍 [JOIN] Recherche dans la description...");
        const allCompetitions = await db.competitions.findMany({});
        if (allCompetitions && allCompetitions.length > 0) {
          competition = allCompetitions.find(
            (c) =>
              c.description &&
              c.description
                .toLowerCase()
                .includes(data.uniqueCode.toLowerCase())
          );
          if (competition) {
            console.log("✅ [JOIN] Compétition trouvée par description");
          }
        }
      } catch (error) {
        console.log(
          "⚠️ [JOIN] Erreur lors de la recherche par description:",
          error
        );
      }
    }

    if (!competition) {
      console.log("❌ [JOIN] Compétition non trouvée");
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    console.log(
      `✅ [JOIN] Compétition trouvée: ${competition.name} (ID: ${competition._id})`
    );

    // Vérifier si la compétition est ouverte aux inscriptions
    const now = new Date();
    console.log(
      `📅 [JOIN] Vérification des dates - Maintenant: ${now.toISOString()}`
    );
    console.log(
      `📅 [JOIN] Début inscriptions: ${competition.registrationStartDate?.toISOString()}`
    );
    console.log(
      `📅 [JOIN] Fin inscriptions: ${competition.registrationDeadline?.toISOString()}`
    );

    if (
      competition.registrationStartDate &&
      now < competition.registrationStartDate
    ) {
      console.log("❌ [JOIN] Les inscriptions ne sont pas encore ouvertes");
      return NextResponse.json(
        {
          error:
            "Les inscriptions pour cette compétition ne sont pas encore ouvertes",
        },
        { status: 400 }
      );
    }

    if (
      competition.registrationDeadline &&
      now > competition.registrationDeadline
    ) {
      console.log("❌ [JOIN] Les inscriptions sont fermées");
      return NextResponse.json(
        { error: "Les inscriptions pour cette compétition sont fermées" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà une participation
    console.log("🔍 [JOIN] Vérification des participations existantes...");
    try {
      const existingParticipation = await db.participations.findExisting(
        competition._id!.toString(),
        session.user.id
      );

      if (existingParticipation) {
        console.log(
          `⚠️ [JOIN] Participation existante trouvée avec statut: ${existingParticipation.status}`
        );

        switch (existingParticipation.status) {
          case "PENDING":
            return NextResponse.json(
              {
                error:
                  "Vous avez déjà une demande de participation en attente pour cette compétition",
              },
              { status: 400 }
            );
          case "APPROVED":
            return NextResponse.json(
              { error: "Vous participez déjà à cette compétition" },
              { status: 400 }
            );
          case "REJECTED":
            console.log(
              "ℹ️ [JOIN] Participation précédente rejetée, autorisation de nouvelle demande"
            );
            break;
          default:
            return NextResponse.json(
              {
                error:
                  "Vous avez déjà une participation pour cette compétition",
              },
              { status: 400 }
            );
        }
      }
    } catch (error) {
      console.log(
        "⚠️ [JOIN] Erreur lors de la vérification des participations:",
        error
      );
      // Continue même si la vérification échoue
    }

    // Vérifier la limite de participants
    if (competition.maxParticipants && competition.maxParticipants > 0) {
      console.log(
        `👥 [JOIN] Vérification de la limite de participants (max: ${competition.maxParticipants})`
      );
      try {
        const approvedParticipations =
          await db.participations.findByCompetition(
            competition._id!.toString()
          );
        const approvedCount = approvedParticipations
          ? approvedParticipations.filter((p) => p.status === "APPROVED").length
          : 0;

        console.log(
          `👥 [JOIN] Participants approuvés: ${approvedCount}/${competition.maxParticipants}`
        );

        if (approvedCount >= competition.maxParticipants) {
          console.log("❌ [JOIN] Limite de participants atteinte");
          return NextResponse.json(
            { error: "Cette compétition a atteint sa limite de participants" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.log(
          "⚠️ [JOIN] Erreur lors de la vérification de la limite:",
          error
        );
        // Continue même si la vérification échoue
      }
    }

    // Créer la participation
    console.log("💾 [JOIN] Création de la participation...");
    const participationData = {
      competitionId: new ObjectId(competition._id!.toString()),
      participantId: new ObjectId(session.user.id),
      status: "PENDING" as any,
      applicationDate: new Date(),
      notes: data.message || "Demande de participation via code unique",
    };

    console.log("📝 [JOIN] Données de participation:", participationData);

    const participation = await db.participations.create(participationData);

    if (!participation) {
      console.log("❌ [JOIN] Échec de la création de la participation");
      return NextResponse.json(
        { error: "Erreur lors de la création de la participation" },
        { status: 500 }
      );
    }

    console.log(
      `✅ [JOIN] Participation créée avec succès (ID: ${participation._id})`
    );

    // Enrichir les données de réponse
    const enrichedParticipation = {
      id: participation._id!.toString(),
      competitionId: competition._id!.toString(),
      competitionName: competition.name,
      participantId: session.user.id,
      status: participation.status,
      applicationDate: participation.applicationDate,
      notes: participation.notes,
    };

    // Envoyer une notification à l'organisateur
    console.log("📧 [JOIN] Envoi de notification à l'organisateur...");
    try {
      // Récupérer les informations du participant
      const participant = await db.users.findById(session.user.id);
      const participantName = participant
        ? `${participant.firstName || ""} ${
            participant.lastName || ""
          }`.trim() || participant.email
        : session.user.email;

      // Créer la notification avec les propriétés correctes du modèle
      const notificationData = {
        userId: new ObjectId(competition.organizerId.toString()),
        type: "INFO" as any,
        title: "Nouvelle demande de participation",
        message: `${participantName} souhaite participer à votre compétition "${competition.name}"`,
        isRead: false,
        createdAt: new Date(),
      };

      await db.notifications.create(notificationData);

      console.log("✅ [JOIN] Notification envoyée à l'organisateur");
    } catch (error) {
      console.log(
        "⚠️ [JOIN] Erreur lors de l'envoi de la notification:",
        error
      );
      // Continue même si la notification échoue
    }

    console.log("🎉 [JOIN] Demande de participation traitée avec succès");

    const responseData = {
      success: true,
      message: "Demande de participation envoyée avec succès",
      participation: enrichedParticipation,
      competition: {
        id: competition._id!.toString(),
        name: competition.name,
        description: competition.description,
        status: competition.status,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(
      "💥 [JOIN] Erreur lors de la demande de participation:",
      error
    );

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    const responseData = {
      error: "Erreur lors de la demande de participation",
      details: errorMessage,
    };

    if (process.env.NODE_ENV === "development" && error instanceof Error) {
      (responseData as any).stack = error.stack;
    }

    return NextResponse.json(responseData, { status: 500 });
  }
}
