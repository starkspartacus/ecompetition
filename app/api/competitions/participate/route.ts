import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

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

    // Rechercher la compétition
    let competition: any;
    if (competitionId) {
      competition = await db.competitions.findById(competitionId);
    } else if (uniqueCode) {
      competition = await db.competitions.findByUniqueCode(uniqueCode);
    }

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier le statut de la compétition
    if (competition.status !== "OPEN") {
      let message =
        "Les inscriptions ne sont pas ouvertes pour cette compétition";
      switch (competition.status) {
        case "DRAFT":
          message = "Cette compétition est encore en préparation";
          break;
        case "CLOSED":
          message = "Les inscriptions sont fermées pour cette compétition";
          break;
        case "IN_PROGRESS":
          message =
            "Cette compétition est déjà en cours, impossible de s'inscrire";
          break;
        case "COMPLETED":
          message = "Cette compétition est terminée";
          break;
        case "CANCELLED":
          message = "Cette compétition a été annulée";
          break;
      }
      return NextResponse.json({ error: message }, { status: 400 });
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

    // Vérifier si l'utilisateur a déjà une demande pour cette compétition
    const existingParticipation =
      await db.participations.findByCompetitionAndParticipant(
        competition.id,
        session.user.id
      );

    if (existingParticipation) {
      let statusMessage = "";
      switch (existingParticipation.status) {
        case "PENDING":
          statusMessage =
            "Vous avez déjà une demande en attente pour cette compétition";
          break;
        case "ACCEPTED":
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

    // Créer la demande de participation
    const participation = await db.participations.create({
      competitionId: competition.id,
      participantId: session.user.id,
      status: "PENDING",
      message: message || "",
    });

    console.log("✅ Demande de participation créée:", participation.id);

    // Créer une notification pour l'organisateur
    const participant = await db.users.findById(session.user.id);
    const participantName =
      `${participant?.firstName || ""} ${participant?.lastName || ""}`.trim() ||
      "Participant";

    await db.notifications.create({
      userId: competition.organizerId,
      type: "PARTICIPATION_REQUEST",
      title: "Nouvelle demande de participation",
      message: `${participantName} souhaite participer à votre compétition "${competition.title}"`,
      link: `/organizer/participations/${participation.id}`,
    });

    console.log("✅ Notification envoyée à l'organisateur");

    return NextResponse.json({
      success: true,
      message: "Demande de participation envoyée avec succès",
      participationId: participation.id,
      competitionTitle: competition.title,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la demande de participation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la demande de participation" },
      { status: 500 }
    );
  }
}
