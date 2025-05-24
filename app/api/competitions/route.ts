import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCompetition } from "@/lib/competition-service";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { message: "ID utilisateur non trouvé" },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Créer la compétition
    const competition = await createCompetition({
      title: data.title,
      description: data.description,
      category: data.category,
      country: data.country,
      city: data.city,
      commune: data.commune,
      address: data.address,
      venue: data.venue,
      registrationStartDate: new Date(data.registrationStartDate),
      registrationDeadline: new Date(data.registrationDeadline),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      maxParticipants: data.maxParticipants,
      imageUrl: data.imageUrl,
      bannerUrl: data.bannerUrl,
      organizerId: userId,
      status: data.status || "DRAFT",
      tournamentFormat: data.tournamentFormat,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      rules: data.rules || [],
    });

    return NextResponse.json({ competition });
  } catch (error) {
    console.error("Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la création de la compétition",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { message: "ID utilisateur non trouvé" },
        { status: 400 }
      );
    }

    // Si l'utilisateur est un participant et qu'il y a un code dans la requête, rechercher par code
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    const db = await getDb();

    if (session.user.role === "PARTICIPANT" && code) {
      console.log(
        `Participant recherche une compétition avec le code: ${code}`
      );

      // Rechercher la compétition par code unique
      const competition = await db.collection("Competition").findOne({
        uniqueCode: code,
        isPublic: true,
      });

      if (!competition) {
        // Essayer dans la collection "competitions" (minuscule)
        const altCompetition = await db.collection("competitions").findOne({
          uniqueCode: code,
          isPublic: true,
        });

        if (altCompetition) {
          return NextResponse.json({ competitions: [altCompetition] });
        }

        return NextResponse.json({ competitions: [] });
      }

      return NextResponse.json({ competitions: [competition] });
    }

    // Récupérer les compétitions depuis MongoDB

    // Essayer les deux collections possibles
    let competitions: any[] = [];
    let collectionName = "";

    try {
      // Essayer d'abord "Competition" (majuscule)
      const competitionsCollection = db.collection("Competition");
      competitions = await competitionsCollection
        .find({ organizerId: userId })
        .sort({ createdAt: -1 })
        .toArray();
      collectionName = "Competition";

      // Si aucune compétition n'est trouvée, essayer "competitions" (minuscule)
      if (competitions.length === 0) {
        const altCollection = db.collection("competitions");
        const altCompetitions = await altCollection
          .find({ organizerId: userId })
          .sort({ createdAt: -1 })
          .toArray();

        if (altCompetitions.length > 0) {
          competitions = altCompetitions;
          collectionName = "competitions";
        }
      }
    } catch (error) {
      console.error("Erreur lors de la recherche dans la collection:", error);
      // Essayer la collection alternative si la première échoue
      try {
        const altCollection = db.collection("competitions");
        competitions = await altCollection
          .find({ organizerId: userId })
          .sort({ createdAt: -1 })
          .toArray();
        collectionName = "competitions";
      } catch (innerError) {
        console.error(
          "Erreur lors de la recherche dans la collection alternative:",
          innerError
        );
      }
    }

    console.log(
      `Compétitions trouvées dans la collection "${collectionName}" pour l'organisateur ${userId}:`,
      competitions.length
    );

    // Normaliser les données pour la réponse
    const normalizedCompetitions = competitions.map((competition) => ({
      id:
        competition._id instanceof ObjectId
          ? competition._id.toString()
          : String(competition._id),
      title: competition.title || competition.name || "Sans titre",
      description: competition.description || "",
      category: competition.category || "",
      country: competition.country || "",
      city: competition.city || "",
      commune: competition.commune || null,
      address: competition.address || "",
      venue: competition.venue || "",
      registrationStartDate:
        competition.registrationStartDate?.toISOString() || null,
      registrationDeadline:
        competition.registrationDeadline?.toISOString() || null,
      startDate: competition.startDate?.toISOString() || null,
      endDate: competition.endDate?.toISOString() || null,
      maxParticipants: competition.maxParticipants || 0,
      imageUrl: competition.imageUrl || null,
      bannerUrl: competition.bannerUrl || null,
      status: competition.status || "DRAFT",
      tournamentFormat: competition.tournamentFormat || null,
      isPublic:
        competition.isPublic !== undefined ? competition.isPublic : true,
      rules: competition.rules || [],
      uniqueCode: competition.uniqueCode || "",
      createdAt:
        competition.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt:
        competition.updatedAt?.toISOString() || new Date().toISOString(),
      participants: competition.participants || 0,
      teams: competition.teams || 0,
      matches: competition.matches || 0,
    }));

    return NextResponse.json({ competitions: normalizedCompetitions });
  } catch (error) {
    console.error("Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des compétitions",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
