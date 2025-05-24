import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    // Si un code est fourni, rechercher la compétition spécifique
    if (code) {
      const competition = await prisma.competition.findFirst({
        where: {
          code: code,
          status: {
            in: [
              "PUBLISHED",
              "REGISTRATION_OPEN",
              "REGISTRATION_CLOSED",
              "IN_PROGRESS",
              "COMPLETED",
            ],
          },
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (!competition) {
        return NextResponse.json(
          { error: "Compétition non trouvée ou code invalide" },
          { status: 404 }
        );
      }

      return NextResponse.json({ competitions: [competition] });
    }

    // Sinon, récupérer toutes les compétitions publiques
    const competitions = await prisma.competition.findMany({
      where: {
        status: {
          in: [
            "PUBLISHED",
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
            "IN_PROGRESS",
            "COMPLETED",
          ],
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des compétitions publiques:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}
