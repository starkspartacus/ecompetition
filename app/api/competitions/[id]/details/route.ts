import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb-native";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 API Details - Recherche compétition ID: ${params.id}`);

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("❌ API Details - Utilisateur non authentifié");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const competitionId = params.id;
    const userId = session.user.id;

    // Vérifier que l'ID est un ObjectId valide
    if (!ObjectId.isValid(competitionId)) {
      console.log("❌ API Details - ID MongoDB invalide:", competitionId);
      return NextResponse.json(
        { error: "ID de compétition invalide" },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const db = await getDatabase();
    console.log("✅ API Details - Connexion MongoDB établie");

    // Rechercher la compétition dans différentes collections possibles
    const possibleCollections = [
      "competitions",
      "Competition",
      "Competitions",
      "competition",
    ];
    let competition = null;
    let foundInCollection = null;

    for (const collectionName of possibleCollections) {
      try {
        console.log(
          `🔍 API Details - Recherche dans collection: ${collectionName}`
        );
        const collection = db.collection(collectionName);

        // Compter les documents
        const count = await collection.countDocuments();
        console.log(`📊 API Details - ${collectionName}: ${count} documents`);

        if (count > 0) {
          // Chercher par ObjectId
          const result = await collection.findOne({
            _id: new ObjectId(competitionId),
          });
          if (result) {
            competition = result;
            foundInCollection = collectionName;
            console.log(
              `✅ API Details - Compétition trouvée dans: ${collectionName}`
            );
            break;
          }

          // Chercher par ID string si pas trouvé par ObjectId
          const resultByStringId = await collection.findOne({
            id: competitionId,
          });
          if (resultByStringId) {
            competition = resultByStringId;
            foundInCollection = collectionName;
            console.log(
              `✅ API Details - Compétition trouvée par ID string dans: ${collectionName}`
            );
            break;
          }
        }
      } catch (error) {
        console.log(
          `❌ API Details - Erreur dans ${collectionName}:`,
          error instanceof Error ? error.message : "Erreur inconnue"
        );
      }
    }

    if (!competition) {
      console.log(`❌ API Details - Compétition non trouvée: ${competitionId}`);

      // Debug: afficher quelques exemples de documents
      for (const collectionName of possibleCollections) {
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();
          if (count > 0) {
            const samples = await collection.find({}).limit(2).toArray();
            console.log(
              `📋 API Details - Exemples dans ${collectionName}:`,
              samples.map((s) => ({
                _id: s._id?.toString(),
                title: s.title || s.name,
                id: s.id,
              }))
            );
          }
        } catch (error) {
          console.log(
            `❌ API Details - Erreur échantillons ${collectionName}:`,
            error instanceof Error ? error.message : "Erreur inconnue"
          );
        }
      }

      return NextResponse.json(
        {
          error: "Compétition non trouvée",
          searchedId: competitionId,
          searchedCollections: possibleCollections,
        },
        { status: 404 }
      );
    }

    console.log(
      `✅ API Details - Compétition trouvée: ${
        competition.title || competition.name
      }`
    );

    // Calculer les statistiques de la compétition
    const stats = {
      participantCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
    };

    try {
      // Chercher les participations dans différentes collections
      const participationCollections = [
        "participations",
        "Participation",
        "Participations",
        "participation",
      ];

      for (const collectionName of participationCollections) {
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();

          if (count > 0) {
            console.log(
              `📊 API Details - Recherche participations dans: ${collectionName}`
            );

            // Compter les participations pour cette compétition
            const participations = await collection
              .find({
                competitionId: competitionId,
              })
              .toArray();

            if (participations.length > 0) {
              stats.participantCount = participations.length;
              stats.pendingCount = participations.filter(
                (p) => p.status === "pending"
              ).length;
              stats.approvedCount = participations.filter(
                (p) => p.status === "approved"
              ).length;
              stats.rejectedCount = participations.filter(
                (p) => p.status === "rejected"
              ).length;

              console.log(`✅ API Details - Stats trouvées:`, stats);
              break;
            }
          }
        } catch (error) {
          console.log(
            `❌ API Details - Erreur stats ${collectionName}:`,
            error instanceof Error ? error.message : "Erreur inconnue"
          );
        }
      }
    } catch (error) {
      console.log(
        "❌ API Details - Erreur calcul stats:",
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    }

    // Vérifier si l'utilisateur participe déjà
    let isParticipating = false;
    try {
      const participationCollections = [
        "participations",
        "Participation",
        "Participations",
        "participation",
      ];

      for (const collectionName of participationCollections) {
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();

          if (count > 0) {
            const participation = await collection.findOne({
              competitionId: competitionId,
              userId: userId,
            });

            if (participation) {
              isParticipating = true;
              console.log(`✅ API Details - Utilisateur participe déjà`);
              break;
            }
          }
        } catch (error) {
          console.log(
            `❌ API Details - Erreur vérification participation ${collectionName}:`,
            error instanceof Error ? error.message : "Erreur inconnue"
          );
        }
      }
    } catch (error) {
      console.log(
        "❌ API Details - Erreur vérification participation:",
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    }

    // Normaliser les données de la compétition
    const normalizedCompetition = {
      id: competition._id?.toString() || competition.id,
      _id: competition._id,
      title: competition.title || competition.name,
      description: competition.description,
      category: competition.category,
      sport: competition.sport,
      status: competition.status || "draft",
      startDateCompetition:
        competition.startDate || competition.startDateCompetition,
      endDateCompetition: competition.endDate || competition.endDateCompetition,
      registrationDeadline: competition.registrationDeadline,
      maxParticipants: competition.maxParticipants || 100,
      venue: competition.venue,
      address: competition.address,
      city: competition.city,
      country: competition.country,
      imageUrl: competition.imageUrl,
      bannerUrl: competition.bannerUrl,
      organizerId: competition.organizerId || competition.creatorId,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
      rules: competition.rules || [],
      prizes: competition.prizes || [],
      entryFee: competition.entryFee || 0,
      currency: competition.currency || "EUR",
    };

    const response = {
      success: true,
      competition: normalizedCompetition,
      stats,
      isParticipating,
      foundInCollection,
      debug: {
        searchedId: competitionId,
        userId: userId,
        foundInCollection: foundInCollection,
      },
    };

    console.log(
      `✅ API Details - Réponse préparée pour: ${normalizedCompetition.title}`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ API Details - Erreur générale:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la récupération de la compétition",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
