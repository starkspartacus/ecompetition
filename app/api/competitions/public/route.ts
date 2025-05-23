import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const url = new URL(req.url);
    const country = url.searchParams.get("country");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");

    // Construire le filtre
    const filter: any = {
      isPublic: true,
      status: { $in: ["PUBLISHED", "REGISTRATION_OPEN"] },
    };

    // Ajouter des filtres supplémentaires si fournis
    if (country) {
      filter.country = country;
    }

    if (category) {
      filter.category = category;
    }

    // Recherche textuelle
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    // Récupérer les compétitions depuis MongoDB
    const db = await getDb();
    const competitionsCollection = db.collection("Competition");

    const competitions = await competitionsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Normaliser les données pour la réponse
    const normalizedCompetitions = competitions.map((competition) => ({
      id: competition._id.toString(),
      name: competition.name || competition.title,
      title: competition.title || competition.name,
      description: competition.description || "",
      category: competition.category || "",
      location: competition.location || "",
      country: competition.country || "",
      startDate: competition.startDate?.toISOString() || null,
      endDate: competition.endDate?.toISOString() || null,
      registrationStartDate:
        competition.registrationStartDate?.toISOString() || null,
      registrationEndDate:
        competition.registrationEndDate?.toISOString() || null,
      maxParticipants: competition.maxParticipants || 0,
      currentParticipants: competition.currentParticipants || 0,
      status: competition.status || "DRAFT",
      uniqueCode: competition.uniqueCode || "",
      imageUrl: competition.imageUrl || null,
      createdAt:
        competition.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt:
        competition.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({ competitions: normalizedCompetitions });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des compétitions publiques:",
      error
    );
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des compétitions",
      },
      { status: 500 }
    );
  }
}
