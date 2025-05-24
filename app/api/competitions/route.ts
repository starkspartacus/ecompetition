import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Seuls les organisateurs peuvent créer des compétitions" },
        { status: 403 }
      );
    }

    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur non trouvé" },
        { status: 400 }
      );
    }

    let data;
    try {
      // Vérifier si le body existe et n'est pas vide
      const body = await request.text();
      if (!body || body.trim() === "") {
        return NextResponse.json(
          { error: "Corps de la requête vide" },
          { status: 400 }
        );
      }

      data = JSON.parse(body);
    } catch (parseError) {
      console.error("❌ Erreur de parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Format JSON invalide" },
        { status: 400 }
      );
    }

    // Validation des champs requis
    const requiredFields = [
      "title",
      "description",
      "category",
      "startDate",
      "endDate",
      "registrationDeadline",
    ];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Champs requis manquants: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validation des dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const registrationDeadline = new Date(data.registrationDeadline);
    const now = new Date();

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      isNaN(registrationDeadline.getTime())
    ) {
      return NextResponse.json(
        { error: "Format de date invalide" },
        { status: 400 }
      );
    }

    if (startDate <= now) {
      return NextResponse.json(
        { error: "La date de début doit être dans le futur" },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début" },
        { status: 400 }
      );
    }

    if (registrationDeadline >= startDate) {
      return NextResponse.json(
        {
          error:
            "La date limite d'inscription doit être avant la date de début",
        },
        { status: 400 }
      );
    }

    // Générer un code unique pour la compétition
    const uniqueCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    console.log("🏆 Création d'une nouvelle compétition:", data.title);

    // Créer la compétition avec Prisma
    const competition = await prismaNoTransactions.competition.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        country: data.country || null,
        city: data.city || null,
        commune: data.commune || null,
        address: data.address || "",
        venue: data.venue || "",
        registrationStartDate: data.registrationStartDate
          ? new Date(data.registrationStartDate)
          : new Date(),
        registrationDeadline: registrationDeadline,
        startDate: startDate,
        endDate: endDate,
        maxParticipants: Number.parseInt(data.maxParticipants) || 50,
        imageUrl: data.imageUrl || null,
        bannerUrl: data.bannerUrl || null,
        organizerId: userId,
        status: data.status || "DRAFT",
        tournamentFormat: data.tournamentFormat || null,
        isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
        rules: Array.isArray(data.rules) ? data.rules : [],
        uniqueCode: uniqueCode,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log("✅ Compétition créée avec succès:", competition.id);

    // Formater la réponse
    const formattedCompetition = {
      id: competition.id,
      title: competition.title,
      description: competition.description,
      category: competition.category,
      country: competition.country,
      city: competition.city,
      commune: competition.commune,
      address: competition.address,
      venue: competition.venue,
      registrationStartDate: competition.registrationStartDate?.toISOString(),
      registrationDeadline: competition.registrationDeadline?.toISOString(),
      startDate: competition.startDate?.toISOString(),
      endDate: competition.endDate?.toISOString(),
      maxParticipants: competition.maxParticipants,
      imageUrl: competition.imageUrl,
      bannerUrl: competition.bannerUrl,
      status: competition.status,
      tournamentFormat: competition.tournamentFormat,
      isPublic: competition.isPublic,
      rules: competition.rules,
      uniqueCode: competition.uniqueCode,
      organizerName:
        `${competition.organizer.firstName || ""} ${
          competition.organizer.lastName || ""
        }`.trim() || "Organisateur",
      createdAt: competition.createdAt.toISOString(),
      updatedAt: competition.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { competition: formattedCompetition },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la création de la compétition",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    console.log(
      "🔍 Récupération des compétitions pour:",
      session.user.role,
      session.user.id
    );

    // Si c'est un participant avec un code, rechercher la compétition spécifique
    if (session.user.role === "PARTICIPANT" && code) {
      const competition = await prismaNoTransactions.competition.findFirst({
        where: {
          uniqueCode: code,
          status: {
            in: ["OPEN", "CLOSED", "IN_PROGRESS", "COMPLETED"],
          },
        },
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

      if (!competition) {
        return NextResponse.json(
          { error: "Compétition non trouvée avec ce code" },
          { status: 404 }
        );
      }

      const formattedCompetition = {
        id: competition.id,
        title: competition.title,
        description: competition.description,
        category: competition.category,
        status: competition.status,
        startDate: competition.startDate,
        endDate: competition.endDate,
        registrationDeadline: competition.registrationDeadline,
        maxParticipants: competition.maxParticipants,
        currentParticipants: competition.participations.length,
        participants: competition.participations.length,
        venue: competition.venue,
        city: competition.city,
        country: competition.country,
        uniqueCode: competition.uniqueCode,
        organizerName:
          `${competition.organizer.firstName || ""} ${
            competition.organizer.lastName || ""
          }`.trim() || "Organisateur",
      };

      return NextResponse.json({ competitions: [formattedCompetition] });
    }

    // Si c'est un organisateur, récupérer ses compétitions
    if (session.user.role === "ORGANIZER") {
      const competitions = await prismaNoTransactions.competition.findMany({
        where: {
          organizerId: session.user.id,
        },
        include: {
          participations: {
            where: {
              status: "ACCEPTED",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedCompetitions = competitions.map((competition) => ({
        id: competition.id,
        title: competition.title,
        description: competition.description,
        category: competition.category,
        status: competition.status,
        startDate: competition.startDate,
        endDate: competition.endDate,
        registrationDeadline: competition.registrationDeadline,
        maxParticipants: competition.maxParticipants,
        currentParticipants: competition.participations.length,
        participants: competition.participations.length,
        venue: competition.venue,
        city: competition.city,
        country: competition.country,
        uniqueCode: competition.uniqueCode,
        createdAt: competition.createdAt,
        updatedAt: competition.updatedAt,
      }));

      console.log(
        `✅ ${formattedCompetitions.length} compétitions trouvées pour l'organisateur`
      );

      return NextResponse.json({ competitions: formattedCompetitions });
    }

    // Pour les participants sans code, rediriger vers les compétitions publiques
    return NextResponse.json({ competitions: [] });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}
