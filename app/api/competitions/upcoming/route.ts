import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const competitions = await prisma.competition.findMany({
      where: {
        status: {
          in: ["DRAFT", "OPEN"],
        },
        registrationDeadline: {
          gte: new Date(),
        },
      },
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            participations: {
              where: {
                status: "ACCEPTED",
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
      take: 6,
    });

    const formattedCompetitions = competitions.map((comp) => {
      const now = new Date();
      const startDate = comp.startDate ? new Date(comp.startDate) : null;
      const registrationDeadline = new Date(comp.registrationDeadline);
      const daysUntilStart = startDate
        ? Math.ceil(
            (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        id: comp.id,
        title: comp.title,
        category: comp.category,
        location:
          `${comp.city || ""} ${comp.commune || ""}`.trim() || comp.address,
        venue: comp.venue,
        startDate: comp.startDate,
        registrationDeadline: comp.registrationDeadline,
        maxParticipants: comp.maxParticipants,
        currentParticipants: comp._count.participations,
        organizer:
          `${comp.organizer.firstName || ""} ${
            comp.organizer.lastName || ""
          }`.trim() || "Organisateur",
        status: comp.status,
        daysUntilStart,
        isUpcoming:
          daysUntilStart !== null && daysUntilStart <= 7 && daysUntilStart > 0,
        isOpen: registrationDeadline > now && comp.status === "OPEN",
        imageUrl: comp.imageUrl,
        bannerUrl: comp.bannerUrl,
      };
    });

    return NextResponse.json(formattedCompetitions);
  } catch (error) {
    console.error("Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}
