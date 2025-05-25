import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les organisateurs peuvent voir les demandes de participation.",
        },
        { status: 403 }
      );
    }

    console.log(
      "🔍 Récupération des demandes de participation en attente pour:",
      session.user.id
    );

    // Valider l'ObjectId de l'organisateur
    if (!ObjectId.isValid(session.user.id)) {
      console.error("❌ ID organisateur invalide:", session.user.id);
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const organizerId = new ObjectId(session.user.id);

    // Récupérer toutes les compétitions de l'organisateur
    const organizerCompetitions = await db.competitions.findByOrganizer(
      organizerId.toString()
    );

    if (!organizerCompetitions || organizerCompetitions.length === 0) {
      console.log("ℹ️ Aucune compétition trouvée pour cet organisateur");
      return NextResponse.json({
        participations: [],
        total: 0,
      });
    }

    console.log(
      `📊 ${organizerCompetitions.length} compétitions trouvées pour l'organisateur`
    );

    // Extraire les IDs des compétitions
    const competitionIds = organizerCompetitions
      .filter((comp) => comp._id)
      .map((comp) => comp._id!.toString());

    if (competitionIds.length === 0) {
      return NextResponse.json({
        participations: [],
        total: 0,
      });
    }

    // Récupérer les participations en attente pour toutes les compétitions
    const allParticipations = [];

    for (const competitionId of competitionIds) {
      try {
        const participations = await db.participations.findByCompetition(
          competitionId
        );
        // Filtrer seulement les participations en attente
        const pendingParticipations = participations.filter(
          (p) => p.status === "PENDING"
        );
        allParticipations.push(...pendingParticipations);
      } catch (error) {
        console.error(
          `⚠️ Erreur lors de la récupération des participations pour la compétition ${competitionId}:`,
          error
        );
        continue;
      }
    }

    // Trier par date de candidature (plus récent en premier)
    allParticipations.sort((a, b) => {
      const dateA = new Date(a.applicationDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.applicationDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    console.log(`✅ ${allParticipations.length} demandes en attente trouvées`);

    // Formater les données pour la réponse
    const formattedParticipations = await Promise.all(
      allParticipations.map(async (participation) => {
        try {
          // Récupérer les détails du participant
          let participant = null;
          if (participation.participantId) {
            participant = await db.users.findById(
              participation.participantId.toString()
            );
          }

          // Récupérer les détails de la compétition
          let competition = null;
          if (participation.competitionId) {
            competition = await db.competitions.findById(
              participation.competitionId.toString()
            );
          }

          return {
            id: participation._id?.toString() || "",
            participant: {
              id: participant?._id?.toString() || "",
              firstName: participant?.firstName || "",
              lastName: participant?.lastName || "",
              email: participant?.email || "",
              name: participant
                ? `${participant.firstName || ""} ${
                    participant.lastName || ""
                  }`.trim() || "Participant"
                : "Participant inconnu",
            },
            competition: {
              id: competition?._id?.toString() || "",
              title: competition?.name || "Compétition",
              name: competition?.name || "Compétition",
              status: competition?.status || "DRAFT",
            },
            message: participation.notes || "",
            notes: participation.notes || "",
            rejectionReason: participation.rejectionReason || "",
            teamName: participation.teamName || "",
            teamMembers: participation.teamMembers || [],
            status: participation.status,
            createdAt: participation.createdAt,
            updatedAt: participation.updatedAt,
            applicationDate: participation.applicationDate,
            approvalDate: participation.approvalDate,
            // Compatibilité avec l'ancien format
            appliedAt: participation.applicationDate,
            approvedAt: participation.approvalDate,
            rejectedAt:
              participation.approvalDate && participation.status === "REJECTED"
                ? participation.approvalDate
                : undefined,
          };
        } catch (enrichError) {
          console.error(
            "⚠️ Erreur lors de l'enrichissement d'une participation:",
            enrichError
          );

          // Retourner les données de base en cas d'erreur d'enrichissement
          return {
            id: participation._id?.toString() || "",
            participant: {
              id: participation.participantId?.toString() || "",
              firstName: "",
              lastName: "",
              email: "",
              name: "Participant",
            },
            competition: {
              id: participation.competitionId?.toString() || "",
              title: "Compétition",
              name: "Compétition",
              status: "DRAFT",
            },
            message: participation.notes || "",
            notes: participation.notes || "",
            rejectionReason: participation.rejectionReason || "",
            teamName: participation.teamName || "",
            teamMembers: participation.teamMembers || [],
            status: participation.status,
            createdAt: participation.createdAt,
            updatedAt: participation.updatedAt,
            applicationDate: participation.applicationDate,
            approvalDate: participation.approvalDate,
            appliedAt: participation.applicationDate,
            approvedAt: participation.approvalDate,
            rejectedAt:
              participation.approvalDate && participation.status === "REJECTED"
                ? participation.approvalDate
                : undefined,
          };
        }
      })
    );

    // Filtrer les participations valides
    const validParticipations = formattedParticipations.filter((p) => p.id);

    console.log(
      `📋 ${validParticipations.length} participations formatées avec succès`
    );

    return NextResponse.json({
      participations: validParticipations,
      total: validParticipations.length,
      organizerCompetitions: organizerCompetitions.length,
      message:
        validParticipations.length === 0
          ? "Aucune demande de participation en attente"
          : `${validParticipations.length} demande(s) en attente`,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des demandes de participation:",
      error
    );

    // Gestion d'erreur détaillée
    if (error instanceof Error) {
      console.error("📝 Message d'erreur:", error.message);
      console.error("📍 Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des demandes de participation",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
