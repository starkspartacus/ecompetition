import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { uploadImageServer } from "@/lib/blob";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Début de la requête GET /api/competitions");

    const session = await getServerSession(authOptions);
    console.log("🔍 Session récupérée:", {
      exists: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            role: session.user.role,
            email: session.user.email,
            name: session.user.name,
          }
        : null,
    });

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    console.log(
      "🔍 Récupération des compétitions pour:",
      session?.user?.role,
      session?.user?.id
    );

    if (!session) {
      console.error("❌ Aucune session trouvée");
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 401 }
      );
    }

    if (!session.user) {
      console.error("❌ Aucun utilisateur dans la session");
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans la session" },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error("❌ ID utilisateur manquant dans la session");
      return NextResponse.json(
        { error: "ID utilisateur manquant" },
        { status: 401 }
      );
    }

    // Si un code est fourni (pour les participants)
    if (code) {
      console.log("🔍 Recherche par code:", code);

      // Recherche par nom (utilisé comme code unique)
      const competitions = await db.competitions.findMany({});
      const competition = competitions.find(
        (c) =>
          c.name?.toLowerCase().includes(code.toLowerCase()) ||
          c.description?.toLowerCase().includes(code.toLowerCase())
      );

      if (!competition) {
        return NextResponse.json(
          { error: "Compétition non trouvée avec ce code" },
          { status: 404 }
        );
      }

      // Enrichir avec les données de l'organisateur
      let organizer = null;
      try {
        organizer = await db.users.findById(competition.organizerId.toString());
      } catch (error) {
        console.warn("⚠️ Impossible de récupérer l'organisateur:", error);
      }

      // Compter les participants acceptés
      let acceptedParticipants = 0;
      try {
        const participations = await db.participations.findByCompetition(
          competition._id!.toString()
        );
        acceptedParticipants = participations.filter(
          (p) => p.status === "APPROVED"
        ).length;
      } catch (error) {
        console.warn("⚠️ Impossible de compter les participants:", error);
      }

      const formattedCompetition = {
        id: competition._id!.toString(),
        title: competition.name,
        name: competition.name,
        description: competition.description || "",
        category: competition.category || "Non spécifié",
        status: competition.status,
        startDateCompetition: competition.startDateCompetition,
        endDateCompetition: competition.endDateCompetition,
        registrationStartDate: competition.registrationStartDate,
        registrationDeadline: competition.registrationDeadline,
        maxParticipants: competition.maxParticipants || 0,
        currentParticipants: acceptedParticipants,
        venue: competition.venue || "",
        city: competition.city || "",
        country: competition.country || "",
        address: competition.address || "",
        commune: competition.commune || "",
        uniqueCode: competition.name || "",
        organizerName: organizer
          ? `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim() ||
            "Organisateur"
          : "Organisateur",
        imageUrl: competition.imageUrl,
        bannerUrl: competition.bannerUrl,
        createdAt: competition.createdAt,
        updatedAt: competition.updatedAt,
      };

      console.log(
        "✅ Compétition trouvée:",
        formattedCompetition.title,
        "- Statut:",
        formattedCompetition.status
      );

      return NextResponse.json({
        competitions: [formattedCompetition],
        total: 1,
      });
    }

    // Pour les organisateurs, récupérer leurs compétitions
    if (session.user.role === "ORGANIZER") {
      const competitions = await db.competitions.findByOrganizer(
        session.user.id
      );

      const formattedCompetitions = await Promise.all(
        competitions.map(async (competition: any) => {
          let acceptedParticipants = 0;
          try {
            const participations = await db.participations.findByCompetition(
              competition.id
            );
            acceptedParticipants = participations.filter(
              (p) => p.status === "APPROVED"
            ).length;
          } catch (error) {
            console.warn(
              "⚠️ Impossible de compter les participants pour",
              competition.id
            );
          }

          return {
            id: competition.id,
            title: competition.name,
            name: competition.name,
            description: competition.description || "",
            category: competition.category || "Non spécifié",
            status: competition.status,
            startDateCompetition: competition.startDateCompetition,
            endDateCompetition: competition.endDateCompetition,
            registrationStartDate: competition.registrationStartDate,
            registrationDeadline: competition.registrationDeadline,
            maxParticipants: competition.maxParticipants || 0,
            currentParticipants: acceptedParticipants,
            venue: competition.venue || "",
            city: competition.city || "",
            country: competition.country || "",
            address: competition.address || "",
            commune: competition.commune || "",
            uniqueCode: competition.name || "",
            imageUrl: competition.imageUrl,
            bannerUrl: competition.bannerUrl,
            createdAt: competition.createdAt,
            updatedAt: competition.updatedAt,
          };
        })
      );

      return NextResponse.json({
        competitions: formattedCompetitions,
        total: formattedCompetitions.length,
      });
    }

    // Pour les participants, récupérer toutes les compétitions publiques
    const { competitions, total } =
      await db.competitions.findPublicCompetitions({});

    const formattedCompetitions = await Promise.all(
      competitions.map(async (competition: any) => {
        let organizer = null;
        let acceptedParticipants = 0;

        try {
          organizer = await db.users.findById(competition.organizerId);
        } catch (error) {
          console.warn(
            "⚠️ Impossible de récupérer l'organisateur pour",
            competition.id
          );
        }

        try {
          const participations = await db.participations.findByCompetition(
            competition.id
          );
          acceptedParticipants = participations.filter(
            (p) => p.status === "APPROVED"
          ).length;
        } catch (error) {
          console.warn(
            "⚠️ Impossible de compter les participants pour",
            competition.id
          );
        }

        return {
          id: competition.id,
          title: competition.name,
          name: competition.name,
          description: competition.description || "",
          category: competition.category || "Non spécifié",
          status: competition.status,
          startDateCompetition: competition.startDateCompetition,
          endDateCompetition: competition.endDateCompetition,
          registrationStartDate: competition.registrationStartDate,
          registrationDeadline: competition.registrationDeadline,
          maxParticipants: competition.maxParticipants || 0,
          currentParticipants: acceptedParticipants,
          venue: competition.venue || "",
          city: competition.city || "",
          country: competition.country || "",
          address: competition.address || "",
          commune: competition.commune || "",
          uniqueCode: competition.name || "",
          organizerName: organizer
            ? `${organizer.firstName || ""} ${
                organizer.lastName || ""
              }`.trim() || "Organisateur"
            : "Organisateur",
          imageUrl: competition.imageUrl,
          bannerUrl: competition.bannerUrl,
          createdAt: competition.createdAt,
          updatedAt: competition.updatedAt,
        };
      })
    );

    return NextResponse.json({
      competitions: formattedCompetitions,
      total,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les organisateurs peuvent créer des compétitions.",
        },
        { status: 403 }
      );
    }

    console.log("🏆 Création d'une nouvelle compétition par:", session.user.id);

    // Traitement des FormData (avec fichiers)
    const formData = await request.formData();
    const data: any = {};

    // Extraire tous les champs du FormData
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        // Gérer les fichiers
        data[key] = value;
      } else if (typeof value === "string") {
        data[key] = value;
      }
    }

    console.log("📝 Données reçues:", Object.keys(data));

    const {
      title,
      description,
      category,
      startDate,
      endDate,
      registrationStartDate,
      registrationDeadline,
      maxParticipants,
      venue,
      address,
      city,
      commune,
      country,
      rules,
      prizes,
      isPublic,
      status,
      image,
      banner,
    } = data;

    // Validation des champs requis
    if (!title || !category || !startDate || !venue) {
      return NextResponse.json(
        {
          error:
            "Champs requis manquants (titre, catégorie, date de début, lieu)",
        },
        { status: 400 }
      );
    }

    // Validation des dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const regDeadline = registrationDeadline
      ? new Date(registrationDeadline)
      : null;

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Date de début invalide" },
        { status: 400 }
      );
    }

    if (end && (isNaN(end.getTime()) || end <= start)) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début" },
        { status: 400 }
      );
    }

    if (regDeadline && (isNaN(regDeadline.getTime()) || regDeadline >= start)) {
      return NextResponse.json(
        {
          error:
            "La date limite d'inscription doit être avant la date de début",
        },
        { status: 400 }
      );
    }

    // Upload des images vers Vercel Blob
    let imageUrl: string | undefined = undefined;
    let bannerUrl: string | undefined = undefined;

    try {
      if (image && image instanceof File && image.size > 0) {
        console.log("📤 Upload de l'image principale:", image.name, image.size);
        imageUrl = await uploadImageServer(image, "competition");
        console.log("✅ Image uploadée:", imageUrl);
      }

      if (banner && banner instanceof File && banner.size > 0) {
        console.log("📤 Upload de la bannière:", banner.name, banner.size);
        bannerUrl = await uploadImageServer(banner, "banner");
        console.log("✅ Bannière uploadée:", bannerUrl);
      }
    } catch (uploadError) {
      console.error("❌ Erreur lors de l'upload des images:", uploadError);
      // Continuer sans les images plutôt que d'échouer complètement
    }

    // Préparer les données pour la création
    const competitionData = {
      name: title,
      description: description || "",
      category: category as any,
      status: (status || "DRAFT") as any,
      startDate: start,
      endDate: end || undefined,
      registrationStartDate: registrationStartDate
        ? new Date(registrationStartDate)
        : new Date(),
      registrationDeadline:
        regDeadline || new Date(start.getTime() - 24 * 60 * 60 * 1000),
      maxParticipants: Number.parseInt(maxParticipants) || 50,
      venue,
      city: city || "",
      country: country || "",
      commune: commune || "",
      address: address || "",
      imageUrl,
      bannerUrl,
      rules: Array.isArray(rules) ? rules.join("\n") : rules || "",
      prizes: Array.isArray(prizes) ? prizes.join("\n") : prizes || "",
      isPublic: Boolean(isPublic),
      organizerId: new ObjectId(session.user.id),
    };

    // Créer la compétition avec le service MongoDB
    const competition = await db.competitions.create(competitionData);

    if (!competition) {
      throw new Error("Échec de la création de la compétition");
    }

    console.log(
      "✅ Compétition créée avec succès:",
      competition._id?.toString()
    );
    console.log("🖼️ Images:", { imageUrl, bannerUrl });

    // Formater la réponse
    const formattedCompetition = {
      id: competition._id!.toString(),
      title: competition.name,
      name: competition.name,
      description: competition.description || "",
      category: competition.category,
      status: competition.status,
      startDateCompetition: competition.startDateCompetition,
      endDateCompetition: competition.endDateCompetition,
      registrationStartDate: competition.registrationStartDate,
      registrationDeadline: competition.registrationDeadline,
      maxParticipants: competition.maxParticipants,
      venue: competition.venue,
      city: competition.city,
      country: competition.country,
      imageUrl: competition.imageUrl,
      bannerUrl: competition.bannerUrl,
      rules: competition.rules,
      prizes: competition.prizes,
      isPublic: competition.isPublic,
      organizerId: competition.organizerId.toString(),
      uniqueCode: competition.name,
      currentParticipants: 0,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
    };

    return NextResponse.json({
      success: true,
      competition: formattedCompetition,
      message: "Compétition créée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la compétition:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      {
        error: `Erreur lors de la création de la compétition: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
