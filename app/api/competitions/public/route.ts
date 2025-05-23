import { NextResponse } from "next/server";
import { getPublicCompetitions } from "@/lib/competition-service";

export async function GET(request: Request) {
  try {
    console.log("🔍 Récupération des compétitions publiques...");

    // Récupérer les paramètres de l'URL
    const url = new URL(request.url);
    const country = url.searchParams.get("country") || "all";
    const category = url.searchParams.get("category") || "all";

    console.log(`Filtres: pays=${country}, catégorie=${category}`);

    // Récupérer les compétitions publiques avec les filtres
    const competitions = await getPublicCompetitions({
      country: country !== "all" ? country : undefined,
      category: category !== "all" ? category : undefined,
    });

    console.log(`✅ Compétitions publiques récupérées: ${competitions.length}`);

    // Normaliser les données pour l'affichage
    const normalizedCompetitions = competitions.map((comp) => ({
      id: comp.id || comp._id?.toString(),
      name: comp.name || comp.title || "Sans titre",
      title: comp.title || comp.name || "Sans titre",
      description: comp.description || "",
      category: comp.category || "Non spécifié",
      location:
        comp.location ||
        `${comp.address || ""}, ${comp.city || ""}, ${comp.country || ""}`,
      country: comp.country || "",
      startDate: comp.startDate,
      endDate: comp.endDate,
      registrationStartDate: comp.registrationStartDate,
      registrationEndDate:
        comp.registrationEndDate || comp.registrationDeadline,
      maxParticipants: comp.maxParticipants || 0,
      currentParticipants: comp.currentParticipants || comp.participants || 0,
      imageUrl: comp.imageUrl || null,
      status: comp.status || "DRAFT",
      uniqueCode: comp.uniqueCode || "",
      createdAt: comp.createdAt || new Date(),
      updatedAt: comp.updatedAt || new Date(),
    }));

    return NextResponse.json({ competitions: normalizedCompetitions });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des compétitions publiques:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}
