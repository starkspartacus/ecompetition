import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const country = searchParams.get("country");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "12"))
    );

    console.log("🔍 Récupération des compétitions publiques...");
    console.log(
      `📊 Filtres: code=${code}, pays=${country}, catégorie=${category}, statut=${status}, recherche=${search}`
    );
    console.log(`📄 Pagination: page=${page}, limit=${limit}`);

    // Si un code est fourni, rechercher la compétition spécifique
    if (code) {
      console.log(`🔎 Recherche par code: "${code}"`);

      try {
        // Recherche par nom exact (code unique)
        let competitions = await db.competitions.findMany({ name: code });

        // Si pas trouvé, recherche partielle dans le nom
        if (competitions.length === 0) {
          console.log("🔄 Recherche partielle dans le nom...");
          competitions = await db.competitions.findMany({});
          competitions = competitions.filter((comp) =>
            comp.name.toLowerCase().includes(code.toLowerCase())
          );
        }

        // Si toujours pas trouvé, recherche dans la description
        if (competitions.length === 0) {
          console.log("🔄 Recherche dans la description...");
          competitions = await db.competitions.findMany({});
          competitions = competitions.filter((comp) =>
            comp.description?.toLowerCase().includes(code.toLowerCase())
          );
        }

        if (competitions.length === 0) {
          console.log("❌ Aucune compétition trouvée pour le code:", code);
          return NextResponse.json({
            competitions: [],
            total: 0,
            message: `Aucune compétition trouvée pour le code "${code}"`,
          });
        }

        // Enrichir la première compétition trouvée
        const competition = competitions[0];
        console.log(`✅ Compétition trouvée: ${competition.name}`);

        try {
          // Enrichir avec l'organisateur
          let organizer = null;
          try {
            organizer = await db.users.findById(
              competition.organizerId.toString()
            );
          } catch (error) {
            console.log(
              "⚠️ Erreur lors de la récupération de l'organisateur:",
              error
            );
          }

          // Enrichir avec les participations
          let participationsCount = 0;
          try {
            const participations = await db.participations.findByCompetition(
              competition._id!.toString()
            );
            participationsCount = participations.filter(
              (p) => p.status === "APPROVED"
            ).length;
          } catch (error) {
            console.log(
              "⚠️ Erreur lors du comptage des participations:",
              error
            );
          }

          const enrichedCompetition = {
            id: competition._id!.toString(),
            name: competition.name,
            title: competition.name,
            description: competition.description || "",
            category: competition.category || "Non spécifié",
            location:
              `${competition.city || ""} ${competition.commune || ""}`.trim() ||
              competition.venue ||
              "Lieu non défini",
            country: competition.country || "",
            venue: competition.venue || "",
            city: competition.city || "",
            address: competition.venue || "",
            startDate: competition.startDateCompetition,
            endDate: competition.endDateCompetition,
            registrationStartDate: competition.registrationStartDate,
            registrationEndDate: competition.registrationDeadline,
            registrationDeadline: competition.registrationDeadline,
            maxParticipants: competition.maxParticipants || 0,
            currentParticipants: participationsCount,
            participants: participationsCount,
            imageUrl: competition.imageUrl,
            bannerUrl: competition.bannerUrl,
            status: competition.status,
            uniqueCode: competition.name,
            organizerName: organizer
              ? `${organizer.firstName || ""} ${
                  organizer.lastName || ""
                }`.trim() || "Organisateur"
              : "Organisateur",
            organizerId: competition.organizerId.toString(),
            createdAt: competition.createdAt,
            updatedAt: competition.updatedAt,
          };

          return NextResponse.json({
            competitions: [enrichedCompetition],
            total: 1,
            message: `Compétition "${competition.name}" trouvée`,
          });
        } catch (enrichError) {
          console.error("⚠️ Erreur lors de l'enrichissement:", enrichError);
          // Retourner les données de base même si l'enrichissement échoue
          const basicCompetition = {
            id: competition._id!.toString(),
            name: competition.name,
            title: competition.name,
            description: competition.description || "",
            category: competition.category || "Non spécifié",
            location: competition.venue || "Lieu non défini",
            country: competition.country || "",
            venue: competition.venue || "",
            city: competition.city || "",
            address: competition.venue || "",
            startDate: competition.startDateCompetition,
            endDate: competition.endDateCompetition,
            registrationStartDate: competition.registrationStartDate,
            registrationEndDate: competition.registrationDeadline,
            registrationDeadline: competition.registrationDeadline,
            maxParticipants: competition.maxParticipants || 0,
            currentParticipants: 0,
            participants: 0,
            imageUrl: competition.imageUrl,
            bannerUrl: competition.bannerUrl,
            status: competition.status,
            uniqueCode: competition.name,
            organizerName: "Organisateur",
            organizerId: competition.organizerId.toString(),
            createdAt: competition.createdAt,
            updatedAt: competition.updatedAt,
          };

          return NextResponse.json({
            competitions: [basicCompetition],
            total: 1,
            message: `Compétition "${competition.name}" trouvée (données partielles)`,
          });
        }
      } catch (searchError) {
        console.error("❌ Erreur lors de la recherche par code:", searchError);
        return NextResponse.json({
          competitions: [],
          total: 0,
          error: "Erreur lors de la recherche par code",
        });
      }
    }

    // Récupération des compétitions publiques avec filtres
    try {
      console.log("📋 Récupération des compétitions publiques...");

      // Construire les options de filtrage
      const options: any = {
        page,
        limit,
      };

      if (country && country !== "all") {
        options.country = country;
      }

      if (category && category !== "all") {
        options.category = category;
      }

      if (status && status !== "all") {
        options.status = status.toUpperCase();
      }

      if (search) {
        options.search = search;
      }

      console.log("🔧 Options de filtrage:", options);

      const result = await db.competitions.findPublicCompetitions(options);

      if (!result || !result.competitions) {
        console.log("⚠️ Aucun résultat retourné par findPublicCompetitions");
        return NextResponse.json({
          competitions: [],
          total: 0,
          page,
          limit,
          hasMore: false,
          filters: {
            country: country || null,
            category: category || null,
            status: status || null,
            search: search || null,
          },
        });
      }

      const { competitions, total } = result;

      console.log(
        `✅ ${competitions.length} compétitions trouvées sur ${total} total`
      );

      // Enrichir les compétitions en parallèle
      const enrichedCompetitions = await Promise.all(
        competitions.map(async (competition: any) => {
          try {
            // Enrichir avec l'organisateur
            let organizer = null;
            try {
              organizer = await db.users.findById(
                competition.organizerId.toString()
              );
            } catch (error) {
              console.log(
                `⚠️ Erreur organisateur pour ${competition.name}:`,
                error
              );
            }

            // Enrichir avec les participations
            let participationsCount = 0;
            try {
              const participations = await db.participations.findByCompetition(
                competition._id!.toString()
              );
              participationsCount = participations.filter(
                (p) => p.status === "APPROVED"
              ).length;
            } catch (error) {
              console.log(
                `⚠️ Erreur participations pour ${competition.name}:`,
                error
              );
            }

            return {
              id: competition._id!.toString(),
              name: competition.name,
              title: competition.name,
              description: competition.description || "",
              category: competition.category || "Non spécifié",
              location:
                `${competition.city || ""} ${
                  competition.commune || ""
                }`.trim() ||
                competition.venue ||
                "Lieu non défini",
              country: competition.country || "",
              venue: competition.venue || "",
              city: competition.city || "",
              address: competition.venue || "",
              startDate: competition.startDateCompetition,
              endDate: competition.endDateCompetition,
              registrationStartDate: competition.registrationStartDate,
              registrationEndDate: competition.registrationDeadline,
              registrationDeadline: competition.registrationDeadline,
              maxParticipants: competition.maxParticipants || 0,
              currentParticipants: participationsCount,
              participants: participationsCount,
              imageUrl: competition.imageUrl,
              bannerUrl: competition.bannerUrl,
              status: competition.status,
              uniqueCode: competition.name,
              organizerName: organizer
                ? `${organizer.firstName || ""} ${
                    organizer.lastName || ""
                  }`.trim() || "Organisateur"
                : "Organisateur",
              organizerId: competition.organizerId.toString(),
              createdAt: competition.createdAt,
              updatedAt: competition.updatedAt,
            };
          } catch (enrichError) {
            console.error(
              `⚠️ Erreur enrichissement pour ${competition.name}:`,
              enrichError
            );
            // Retourner les données de base en cas d'erreur
            return {
              id: competition._id!.toString(),
              name: competition.name,
              title: competition.name,
              description: competition.description || "",
              category: competition.category || "Non spécifié",
              location: competition.venue || "Lieu non défini",
              country: competition.country || "",
              venue: competition.venue || "",
              city: competition.city || "",
              address: competition.venue || "",
              startDate: competition.startDate,
              endDate: competition.endDate,
              registrationStartDate: competition.registrationStartDate,
              registrationEndDate: competition.registrationEndDate,
              registrationDeadline: competition.registrationDeadline,
              maxParticipants: competition.maxParticipants || 0,
              currentParticipants: 0,
              participants: 0,
              imageUrl: competition.imageUrl,
              bannerUrl: competition.bannerUrl,
              status: competition.status,
              uniqueCode: competition.name,
              organizerName: "Organisateur",
              organizerId: competition.organizerId.toString(),
              createdAt: competition.createdAt,
              updatedAt: competition.updatedAt,
            };
          }
        })
      );

      const hasMore = page * limit < total;

      return NextResponse.json({
        competitions: enrichedCompetitions,
        total,
        page,
        limit,
        hasMore,
        filters: {
          country: country || null,
          category: category || null,
          status: status || null,
          search: search || null,
        },
        message: `${enrichedCompetitions.length} compétitions trouvées`,
      });
    } catch (publicError) {
      console.error(
        "❌ Erreur lors de la récupération des compétitions publiques:",
        publicError
      );
      return NextResponse.json({
        competitions: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        error: "Erreur lors de la récupération des compétitions publiques",
      });
    }
  } catch (error) {
    console.error("❌ Erreur globale dans l'API competitions/public:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des compétitions",
        competitions: [],
        total: 0,
        ...(isDevelopment && {
          details: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
