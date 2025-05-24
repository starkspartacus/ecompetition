import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";
import { createNotification } from "@/lib/notification-service";

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
    let competition;
    if (competitionId) {
      competition = await prismaNoTransactions.competition.findUnique({
        where: { id: competitionId },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          participations: {
            where: {
              status: "ACCEPTED",
            },
          },
        },
      });
    } else if (uniqueCode) {
      competition = await prismaNoTransactions.competition.findFirst({
        where: { uniqueCode },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          participations: {
            where: {
              status: "ACCEPTED",
            },
          },
        },
      });
    }

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier le statut de la compétition
    if (competition.status !== "OPEN") {
      return NextResponse.json(
        {
          error: "Les inscriptions ne sont pas ouvertes pour cette compétition",
        },
        { status: 400 }
      );
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

    // Vérifier le nombre maximum de participants
    if (
      competition.maxParticipants &&
      competition.participations.length >= competition.maxParticipants
    ) {
      return NextResponse.json(
        { error: "Le nombre maximum de participants est atteint" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà une demande pour cette compétition
    const existingParticipation =
      await prismaNoTransactions.participation.findFirst({
        where: {
          competitionId: competition.id,
          participantId: session.user.id,
        },
      });

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

    // Récupérer les informations du participant
    const participant = await prismaNoTransactions.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant non trouvé" },
        { status: 404 }
      );
    }

    // Créer la demande de participation
    const participation = await prismaNoTransactions.participation.create({
      data: {
        competitionId: competition.id,
        participantId: session.user.id,
        status: "PENDING",
        message: message || "",
      },
    });

    console.log("✅ Demande de participation créée:", participation.id);

    // Créer une notification pour l'organisateur
    const participantName =
      `${participant.firstName || ""} ${participant.lastName || ""}`.trim() ||
      "Participant";

    await createNotification({
      userId: competition.organizer.id,
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
