import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Récupération des compétitions à venir...");

    // Récupérer la session (optionnelle pour cette route publique)
    const session = await getServerSession(authOptions);
    console.log("👤 Session utilisateur:", session?.user?.email || "Anonyme");

    // Paramètres de requête
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const categoryParam = searchParams.get("category");
    const countryParam = searchParams.get("country");

    const limit = limitParam ? Math.min(Number.parseInt(limitParam), 50) : 6; // Max 50 pour éviter la surcharge
    console.log(
      `📊 Paramètres: limit=${limit}, category=${categoryParam}, country=${countryParam}`
    );

    // Date actuelle pour les calculs
    const now = new Date();
    const nowISO = now.toISOString();

    // Construire les filtres pour les compétitions à venir
    const filters: any = {
      status: { $in: ["OPEN", "CLOSED"] }, // Compétitions ouvertes ou fermées mais pas encore commencées
      registrationDeadline: { $gte: now }, // Date limite d'inscription pas encore passée
    };

    // Filtres optionnels
    if (categoryParam && categoryParam !== "all") {
      filters.category = categoryParam;
    }

    if (countryParam && countryParam !== "all") {
      filters.country = countryParam;
    }

    console.log("🔍 Filtres appliqués:", JSON.stringify(filters, null, 2));

    // Récupérer les compétitions avec filtres
    const competitions = await db.competitions.findMany(filters);
    console.log(`📋 ${competitions.length} compétitions trouvées avant tri`);

    // Filtrage et tri côté application pour plus de précision
    const upcomingCompetitions = competitions
      .filter((comp) => {
        // Vérifier que la compétition n'a pas encore commencé
        if (comp.startDateCompetition) {
          const startDate = new Date(comp.startDateCompetition);
          return startDate > now;
        }
        return true; // Garder si pas de date de début définie
      })
      .sort((a, b) => {
        // Trier par date de début (les plus proches en premier)
        const dateA = a.startDateCompetition
          ? new Date(a.startDateCompetition).getTime()
          : Number.POSITIVE_INFINITY;
        const dateB = b.startDateCompetition
          ? new Date(b.startDateCompetition).getTime()
          : Number.POSITIVE_INFINITY;
        return dateA - dateB;
      })
      .slice(0, limit); // Limiter le nombre de résultats

    console.log(
      `🎯 ${upcomingCompetitions.length} compétitions à venir après filtrage`
    );

    // Enrichir les données pour chaque compétition
    const enrichedCompetitions = await Promise.all(
      upcomingCompetitions.map(async (competition) => {
        try {
          // Récupérer l'organisateur
          let organizer = null;
          try {
            if (ObjectId.isValid(competition.organizerId.toString())) {
              const organizerData = await db.users.findById(
                competition.organizerId.toString()
              );
              if (organizerData) {
                organizer = {
                  id: organizerData._id!.toString(),
                  name: `${organizerData.firstName} ${organizerData.lastName}`.trim(),
                  email: organizerData.email,
                  avatar: organizerData.image || null,
                };
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ Erreur lors de la récupération de l'organisateur pour ${competition.name}:`,
              error
            );
          }

          // Récupérer les participations
          let participantCount = 0;
          let acceptedParticipants = 0;
          try {
            const participations = await db.participations.findByCompetition(
              competition._id!.toString()
            );
            participantCount = participations.length;
            acceptedParticipants = participations.filter(
              (p) => p.status === "APPROVED"
            ).length;
          } catch (error) {
            console.warn(
              `⚠️ Erreur lors de la récupération des participations pour ${competition.name}:`,
              error
            );
          }

          // Calculs de dates
          const registrationDeadline = new Date(
            competition.registrationDeadline
          );
          const startDate = competition.startDateCompetition
            ? new Date(competition.startDateCompetition)
            : null;
          const endDate = competition.endDateCompetition
            ? new Date(competition.endDateCompetition)
            : null;

          // Calcul des jours restants
          const daysUntilDeadline = Math.ceil(
            (registrationDeadline.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const daysUntilStart = startDate
            ? Math.ceil(
                (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
            : null;

          // Statuts calculés
          const isRegistrationOpen =
            now < registrationDeadline && competition.status === "OPEN";
          const isUpcoming = startDate ? startDate > now : true;
          const isFull = competition.maxParticipants
            ? acceptedParticipants >= competition.maxParticipants
            : false;

          return {
            id: competition._id!.toString(),
            name: competition.name,
            description: competition.description,
            category: competition.category,
            sport: competition.category,
            country: competition.country,
            city: competition.city,
            commune: competition.commune,
            venue: competition.venue,
            imageUrl: competition.imageUrl,
            bannerUrl: competition.bannerUrl,
            status: competition.status,

            // Dates
            registrationStartDate: competition.registrationStartDate,
            registrationDeadline: competition.registrationDeadline,
            startDate: competition.startDateCompetition,
            endDate: competition.endDateCompetition,

            // Participants
            maxParticipants: competition.maxParticipants,
            participantCount,
            acceptedParticipants,
            availableSpots: competition.maxParticipants
              ? competition.maxParticipants - acceptedParticipants
              : null,

            // Organisateur
            organizer: organizer || {
              id: competition.organizerId.toString(),
              name: "Organisateur",
              email: "Non disponible",
              avatar: null,
            },

            // Calculs
            daysUntilDeadline,
            daysUntilStart,
            isRegistrationOpen,
            isUpcoming,
            isFull,

            // Métadonnées
            createdAt: competition.createdAt,
            updatedAt: competition.updatedAt,
          };
        } catch (error) {
          console.error(
            `❌ Erreur lors de l'enrichissement de la compétition ${competition.name}:`,
            error
          );

          // Retourner des données de base en cas d'erreur
          return {
            id: competition._id!.toString(),
            name: competition.name,
            description: competition.description,
            category: competition.category,
            sport: competition.category,
            country: competition.country,
            city: competition.city,
            commune: competition.commune,
            venue: competition.venue,
            imageUrl: competition.imageUrl,
            bannerUrl: competition.bannerUrl,
            status: competition.status,
            registrationStartDate: competition.registrationStartDate,
            registrationDeadline: competition.registrationDeadline,
            startDate: competition.startDateCompetition,
            endDate: competition.endDateCompetition,
            maxParticipants: competition.maxParticipants,
            participantCount: 0,
            acceptedParticipants: 0,
            availableSpots: competition.maxParticipants,
            organizer: {
              id: competition.organizerId.toString(),
              name: "Organisateur",
              email: "Non disponible",
              avatar: null,
            },
            daysUntilDeadline: Math.ceil(
              (new Date(competition.registrationDeadline).getTime() -
                now.getTime()) /
                (1000 * 60 * 60 * 24)
            ),
            daysUntilStart: competition.startDateCompetition
              ? Math.ceil(
                  (new Date(competition.startDateCompetition).getTime() -
                    now.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null,
            isRegistrationOpen:
              now < new Date(competition.registrationDeadline) &&
              competition.status === "OPEN",
            isUpcoming: competition.startDateCompetition
              ? new Date(competition.startDateCompetition) > now
              : true,
            isFull: false,
            createdAt: competition.createdAt,
            updatedAt: competition.updatedAt,
          };
        }
      })
    );

    // Statistiques globales
    const totalUpcoming = enrichedCompetitions.length;
    const openForRegistration = enrichedCompetitions.filter(
      (c) => c.isRegistrationOpen
    ).length;
    const startingSoon = enrichedCompetitions.filter(
      (c) => c.daysUntilStart !== null && c.daysUntilStart <= 7
    ).length;

    console.log(`✅ Données enrichies pour ${totalUpcoming} compétitions`);
    console.log(
      `📊 Statistiques: ${openForRegistration} ouvertes, ${startingSoon} commencent bientôt`
    );

    // Réponse finale
    const response = {
      success: true,
      data: {
        competitions: enrichedCompetitions,
        pagination: {
          total: totalUpcoming,
          limit,
          hasMore: competitions.length > limit,
        },
        filters: {
          category: categoryParam || "all",
          country: countryParam || "all",
          appliedAt: nowISO,
        },
        stats: {
          total: totalUpcoming,
          openForRegistration,
          startingSoon,
          categories: [...new Set(enrichedCompetitions.map((c) => c.category))],
          countries: [...new Set(enrichedCompetitions.map((c) => c.country))],
        },
      },
      message:
        totalUpcoming > 0
          ? `${totalUpcoming} compétition(s) à venir trouvée(s)`
          : "Aucune compétition à venir trouvée",
      timestamp: nowISO,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des compétitions à venir:",
      error
    );

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    const response = {
      success: false,
      error: "Erreur lors de la récupération des compétitions à venir",
      details:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
      data: {
        competitions: [],
        pagination: { total: 0, limit: 6, hasMore: false },
        filters: {
          category: "all",
          country: "all",
          appliedAt: new Date().toISOString(),
        },
        stats: {
          total: 0,
          openForRegistration: 0,
          startingSoon: 0,
          categories: [],
          countries: [],
        },
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
