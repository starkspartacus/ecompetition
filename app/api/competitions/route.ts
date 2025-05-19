import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Utiliser getServerSession avec authOptions
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        { message: "Seuls les organisateurs peuvent créer des compétitions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      address,
      venue,
      maxParticipants,
      category,
      registrationDeadline,
      imageUrl,
    } = body;

    // Générer un code unique pour la compétition
    const uniqueCode = nanoid(8).toUpperCase();

    // Créer la compétition
    const competition = await prisma?.competition.create({
      data: {
        title,
        address,
        venue,
        maxParticipants,
        category,
        registrationDeadline: new Date(registrationDeadline),
        imageUrl,
        uniqueCode,
        organizerId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Compétition créée avec succès",
        competition,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la création de la compétition",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Utiliser getServerSession avec authOptions
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    let competitions;

    if (code) {
      // Rechercher une compétition par code
      const competition = await prisma?.competition.findUnique({
        where: {
          uniqueCode: code,
        },
        include: {
          organizer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!competition) {
        return NextResponse.json(
          { message: "Compétition non trouvée" },
          { status: 404 }
        );
      }

      return NextResponse.json({ competition });
    }

    if (session.user.role === "ORGANIZER") {
      // Récupérer les compétitions de l'organisateur
      competitions = await prisma?.competition.findMany({
        where: {
          organizerId: session.user.id,
        },
        include: {
          teams: true,
          participations: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Récupérer les compétitions auxquelles le participant est inscrit
      const participations = await prisma?.participation.findMany({
        where: {
          participantId: session.user.id,
        },
        include: {
          competition: true,
        },
      });

      competitions = participations?.map((p) => p.competition);
    }

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des compétitions",
      },
      { status: 500 }
    );
  }
}
