import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent demander à participer.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { competitionId, uniqueCode, message } = body;

    console.log("🎯 Demande de participation:", {
      competitionId,
      uniqueCode,
      userId: session.user.id,
    });

    // Vérifier que l'utilisateur a un ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: "ID utilisateur manquant" },
        { status: 400 }
      );
    }

    // Rechercher la compétition avec méthodes robustes
    let competition: any = null;

    try {
      if (competitionId) {
        console.log("🔍 Recherche par ID:", competitionId);
        if (ObjectId.isValid(competitionId)) {
          competition = await db.competitions.findById(competitionId);
        }
      } else if (uniqueCode) {
        console.log("🔍 Recherche par code:", uniqueCode);

        // 1. Recherche exacte par nom
        const exactMatches = await db.competitions.findMany({
          name: uniqueCode,
        });
        if (exactMatches && exactMatches.length > 0) {
          competition = exactMatches[0];
          console.log("✅ Trouvé par nom exact");
        }

        // 2. Recherche partielle par nom si pas trouvé
        if (!competition) {
          const partialMatches = await db.competitions.findMany({});
          const filtered = partialMatches?.filter((c: any) =>
            c.name?.toLowerCase().includes(uniqueCode.toLowerCase())
          );
          if (filtered && filtered.length > 0) {
            competition = filtered[0];
            console.log("✅ Trouvé par nom partiel");
          }
        }

        // 3. Recherche dans la description si toujours pas trouvé
        if (!competition) {
          const allCompetitions = await db.competitions.findMany({});
          const descriptionMatches = allCompetitions?.filter((c: any) =>
            c.description?.toLowerCase().includes(uniqueCode.toLowerCase())
          );
          if (descriptionMatches && descriptionMatches.length > 0) {
            competition = descriptionMatches[0];
            console.log("✅ Trouvé par description");
          }
        }
      }
    } catch (searchError) {
      console.error("❌ Erreur lors de la recherche:", searchError);
    }

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    console.log("✅ Compétition trouvée:", competition.name);

    // Vérifier le statut de la compétition
    if (competition.status !== "OPEN") {
      let statusMessage =
        "Les inscriptions ne sont pas ouvertes pour cette compétition";
      switch (competition.status) {
        case "DRAFT":
          statusMessage = "Cette compétition est encore en préparation";
          break;
        case "CLOSED":
          statusMessage =
            "Les inscriptions sont fermées pour cette compétition";
          break;
        case "IN_PROGRESS":
          statusMessage =
            "Cette compétition est déjà en cours, impossible de s'inscrire";
          break;
        case "COMPLETED":
          statusMessage = "Cette compétition est terminée";
          break;
        case "CANCELLED":
          statusMessage = "Cette compétition a été annulée";
          break;
      }
      return NextResponse.json({ error: statusMessage }, { status: 400 });
    }

    // Vérifier la date limite d'inscription
    if (
      competition.registrationDeadline &&
      new Date(competition.registrationDeadline) < new Date()
    ) {
      return NextResponse.json(
        { error: "La date limite d'inscription est dépassée" },
        { status: 400 }
      );
    }

    // Compter les participants acceptés pour vérifier la limite
    try {
      const acceptedParticipations = await db.participations.findByCompetition(
        competition._id.toString()
      );
      const acceptedCount =
        acceptedParticipations?.filter((p: any) => p.status === "APPROVED")
          .length || 0;

      if (
        competition.maxParticipants &&
        acceptedCount >= competition.maxParticipants
      ) {
        return NextResponse.json(
          { error: "Le nombre maximum de participants est atteint" },
          { status: 400 }
        );
      }
    } catch (countError) {
      console.error("⚠️ Erreur lors du comptage des participants:", countError);
      // Continue sans bloquer
    }

    // Vérifier si l'utilisateur a déjà une demande pour cette compétition
    let existingParticipation = null;
    try {
      existingParticipation = await db.participations.findExisting(
        competition._id.toString(),
        session.user.id
      );
    } catch (existingError) {
      console.error(
        "⚠️ Erreur lors de la vérification des participations existantes:",
        existingError
      );
      // Continue sans bloquer
    }

    if (existingParticipation) {
      let statusMessage = "";
      switch (existingParticipation.status) {
        case "PENDING":
          statusMessage =
            "Vous avez déjà une demande en attente pour cette compétition";
          break;
        case "APPROVED":
          statusMessage = "Vous êtes déjà inscrit à cette compétition";
          break;
        case "REJECTED":
          statusMessage =
            "Votre demande précédente a été rejetée. Contactez l'organisateur pour plus d'informations";
          break;
        default:
          statusMessage = "Vous avez déjà une demande pour cette compétition";
      }
      return NextResponse.json({ error: statusMessage }, { status: 400 });
    }

    // Créer la demande de participation avec types corrects
    let participation = null;
    try {
      const participationData = {
        competitionId: new ObjectId(competition._id.toString()),
        participantId: new ObjectId(session.user.id),
        status: "PENDING" as any,
        notes: message || "",
        applicationDate: new Date(),
      };

      participation = await db.participations.create(participationData);

      if (!participation) {
        throw new Error("Échec de la création de la participation");
      }

      console.log(
        "✅ Demande de participation créée:",
        participation._id?.toString()
      );
    } catch (createError) {
      console.error(
        "❌ Erreur lors de la création de la participation:",
        createError
      );
      return NextResponse.json(
        { error: "Erreur lors de la création de la demande" },
        { status: 500 }
      );
    }

    // Créer une notification pour l'organisateur
    try {
      const participant = await db.users.findById(session.user.id);
      const participantName =
        `${participant?.firstName || ""} ${
          participant?.lastName || ""
        }`.trim() || "Participant";

      const notificationData = {
        userId: new ObjectId(competition.organizerId.toString()),
        type: "INFO" as any,
        category: "PARTICIPATION" as any,
        title: "Nouvelle demande de participation",
        message: `${participantName} souhaite participer à votre compétition "${competition.name}"`,
        link: `/organizer/participations/${participation._id?.toString()}`,
        data: JSON.stringify({
          competitionId: competition._id.toString(),
          participationId: participation._id?.toString(),
          participantId: session.user.id,
          competitionName: competition.name,
        }),
      };

      await db.notifications.create(notificationData);
      console.log("✅ Notification envoyée à l'organisateur");
    } catch (notificationError) {
      console.error(
        "⚠️ Erreur lors de l'envoi de la notification:",
        notificationError
      );
      // Continue sans bloquer - la participation est créée
    }

    // Réponse enrichie avec toutes les informations
    return NextResponse.json({
      success: true,
      message: "Demande de participation envoyée avec succès",
      data: {
        participationId: participation._id?.toString(),
        competitionId: competition._id.toString(),
        competitionName: competition.name,
        status: "PENDING",
        applicationDate: new Date().toISOString(),
        organizerName: competition.organizerName || "Organisateur",
        maxParticipants: competition.maxParticipants,
        registrationDeadline: competition.registrationDeadline,
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur globale lors de la demande de participation:",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    return NextResponse.json(
      {
        error: "Erreur lors de la demande de participation",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
