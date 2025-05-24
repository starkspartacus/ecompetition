import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    console.log(
      "🔍 Récupération des compétitions pour:",
      session?.user?.role,
      session?.user?.id
    );

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const db = await getDb();

    // Si un code est fourni (pour les participants)
    if (code) {
      console.log("🔍 Recherche par code:", code);

      const competition = await db
        .collection("Competition")
        .findOne({ uniqueCode: code });

      if (!competition) {
        return NextResponse.json(
          { error: "Compétition non trouvée avec ce code" },
          { status: 404 }
        );
      }

      // Récupérer l'organisateur
      const organizer = await db
        .collection("User")
        .findOne({ _id: new ObjectId(competition.organizerId) });

      // Compter les participants acceptés
      const acceptedParticipants = await db
        .collection("Participation")
        .countDocuments({
          competitionId: new ObjectId(competition._id),
          status: "ACCEPTED",
        });

      const formattedCompetition = {
        id: competition._id.toString(),
        title: competition.title,
        description: competition.description || "",
        category: competition.category || "Non spécifié",
        status: competition.status,
        startDate: competition.startDate,
        endDate: competition.endDate,
        registrationDeadline: competition.registrationDeadline,
        maxParticipants: competition.maxParticipants || 0,
        currentParticipants: acceptedParticipants,
        venue: competition.venue || "",
        city: competition.city || "",
        country: competition.country || "",
        address: competition.address || "",
        uniqueCode: competition.uniqueCode || "",
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
      const competitions = await db
        .collection("Competition")
        .find({ organizerId: new ObjectId(session.user.id) })
        .sort({ createdAt: -1 })
        .toArray();

      const formattedCompetitions = await Promise.all(
        competitions.map(async (competition: any) => {
          const acceptedParticipants = await db
            .collection("Participation")
            .countDocuments({
              competitionId: new ObjectId(competition._id),
              status: "ACCEPTED",
            });

          return {
            id: competition._id.toString(),
            title: competition.title,
            description: competition.description || "",
            category: competition.category || "Non spécifié",
            status: competition.status,
            startDate: competition.startDate,
            endDate: competition.endDate,
            registrationDeadline: competition.registrationDeadline,
            maxParticipants: competition.maxParticipants || 0,
            currentParticipants: acceptedParticipants,
            venue: competition.venue || "",
            city: competition.city || "",
            country: competition.country || "",
            address: competition.address || "",
            uniqueCode: competition.uniqueCode || "",
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
    const competitions = await db
      .collection("Competition")
      .find({
        status: { $in: ["OPEN", "CLOSED", "IN_PROGRESS", "COMPLETED"] },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedCompetitions = await Promise.all(
      competitions.map(async (competition: any) => {
        const organizer = await db
          .collection("User")
          .findOne({ _id: new ObjectId(competition.organizerId) });
        const acceptedParticipants = await db
          .collection("Participation")
          .countDocuments({
            competitionId: new ObjectId(competition._id),
            status: "ACCEPTED",
          });

        return {
          id: competition._id.toString(),
          title: competition.title,
          description: competition.description || "",
          category: competition.category || "Non spécifié",
          status: competition.status,
          startDate: competition.startDate,
          endDate: competition.endDate,
          registrationDeadline: competition.registrationDeadline,
          maxParticipants: competition.maxParticipants || 0,
          currentParticipants: acceptedParticipants,
          venue: competition.venue || "",
          city: competition.city || "",
          country: competition.country || "",
          address: competition.address || "",
          uniqueCode: competition.uniqueCode || "",
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
      total: formattedCompetitions.length,
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

    // Gérer les données FormData (pour les fichiers) ou JSON
    const contentType = request.headers.get("content-type");
    let data: any = {};

    if (contentType?.includes("multipart/form-data")) {
      // Traitement des FormData (avec fichiers)
      const formData = await request.formData();

      // Extraire tous les champs du FormData
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          // Gérer les fichiers plus tard si nécessaire
          data[key] = value;
        } else {
          data[key] = value;
        }
      }
    } else {
      // Traitement JSON standard
      const rawBody = await request.text();
      if (!rawBody || rawBody.trim() === "") {
        return NextResponse.json(
          { error: "Corps de la requête vide" },
          { status: 400 }
        );
      }

      try {
        data = JSON.parse(rawBody);
      } catch (parseError) {
        console.error("❌ Erreur de parsing JSON:", parseError);
        console.error("❌ Corps reçu:", rawBody.substring(0, 200));
        return NextResponse.json(
          { error: "Format JSON invalide" },
          { status: 400 }
        );
      }
    }

    console.log("🏆 Création d'une nouvelle compétition par:", session.user.id);

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
      imageUrl,
      bannerUrl,
      rules,
      prizes,
      isPublic,
      status,
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

    if (start <= new Date()) {
      return NextResponse.json(
        { error: "La date de début doit être dans le futur" },
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

    const db = await getDb();

    // Générer un code unique
    const generateUniqueCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let uniqueCode = generateUniqueCode();

    // Vérifier l'unicité du code
    let codeExists = await db.collection("Competition").findOne({ uniqueCode });
    while (codeExists) {
      uniqueCode = generateUniqueCode();
      codeExists = await db.collection("Competition").findOne({ uniqueCode });
    }

    // Créer la compétition
    const competitionData = {
      title,
      description: description || "",
      category,
      status: status || "DRAFT",
      startDate: start,
      endDate: end,
      registrationStartDate: registrationStartDate
        ? new Date(registrationStartDate)
        : new Date(),
      registrationDeadline:
        regDeadline || new Date(start.getTime() - 24 * 60 * 60 * 1000), // 1 jour avant par défaut
      maxParticipants: Number.parseInt(maxParticipants) || 50,
      venue,
      address: address || "",
      city: city || "",
      commune: commune || "",
      country: country || "",
      imageUrl: imageUrl || null,
      bannerUrl: bannerUrl || null,
      rules: Array.isArray(rules) ? rules : rules ? [rules] : [],
      prizes: Array.isArray(prizes) ? prizes : prizes ? [prizes] : [],
      isPublic: Boolean(isPublic),
      uniqueCode,
      organizerId: new ObjectId(session.user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("Competition")
      .insertOne(competitionData);
    const competitionId = result.insertedId.toString();

    console.log(
      "✅ Compétition créée avec succès:",
      competitionId,
      "- Code:",
      uniqueCode
    );

    return NextResponse.json({
      success: true,
      competition: {
        id: competitionId,
        ...competitionData,
        organizerId: session.user.id,
        uniqueCode,
      },
      message: "Compétition créée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la compétition" },
      { status: 500 }
    );
  }
}
