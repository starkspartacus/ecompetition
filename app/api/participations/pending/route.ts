import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer toutes les participations en attente pour les compétitions de cet organisateur
    const pendingParticipations =
      await prismaNoTransactions.participation.findMany({
        where: {
          status: "PENDING",
          competition: {
            organizerId: session.user.id,
          },
        },
        include: {
          participant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          competition: {
            select: {
              id: true,
              title: true,
              category: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    // Formater les données pour l'interface
    const formattedParticipations = pendingParticipations.map(
      (participation) => ({
        id: participation.id,
        participantId: participation.participantId,
        participantName: `${participation.participant.firstName} ${participation.participant.lastName}`,
        participantEmail: participation.participant.email,
        competitionId: participation.competition.id,
        competitionTitle: participation.competition.title,
        competitionCategory: participation.competition.category,
        message: participation.message,
        createdAt: participation.createdAt,
        status: participation.status,
      })
    );

    return NextResponse.json({
      success: true,
      participations: formattedParticipations,
      count: formattedParticipations.length,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des participations en attente:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des participations" },
      { status: 500 }
    );
  }
}
