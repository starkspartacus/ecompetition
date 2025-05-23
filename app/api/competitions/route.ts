import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCompetition } from "@/lib/competition-service";
import { CompetitionStatus } from "@/lib/prisma-schema";
import { connectDB } from "@/lib/mongodb-client";
import { uploadImage } from "@/lib/blob";

// POST: Créer une nouvelle compétition
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("Session utilisateur:", session.user);

    // Récupérer l'ID de l'utilisateur
    let userId = session.user.id;
    if (!userId && session.user.email) {
      console.log(
        `ID utilisateur non trouvé dans la session, recherche par email: ${session.user.email}`
      );

      // Établir la connexion à MongoDB
      const db = await connectDB();

      // Rechercher l'utilisateur par email
      const user = await db
        .collection("User")
        .findOne({ email: session.user.email });

      if (user && user._id) {
        userId = user._id.toString();
        console.log(`Utilisateur trouvé par email, ID: ${userId}`);
      } else {
        // Essayer de lister tous les utilisateurs pour déboguer
        console.log(
          "Utilisateur non trouvé, liste des utilisateurs disponibles:"
        );
        const users = await db.collection("User").find({}).limit(10).toArray();
        console.log(`${users.length} utilisateurs trouvés:`);
        users.forEach((u, i) => {
          console.log(
            `Utilisateur ${i + 1}: ID=${u._id}, Email=${u.email || "N/A"}`
          );
        });
      }
    }

    if (!userId) {
      console.log("Impossible de déterminer l'ID de l'utilisateur");
      return NextResponse.json(
        { error: "Impossible de déterminer l'ID de l'utilisateur" },
        { status: 400 }
      );
    }

    // Vérifier si la requête est multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Traiter les données du formulaire multipart
      const formData = await request.formData();

      // Extraire les données de base
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      const country = formData.get("country") as string;
      const city = formData.get("city") as string;
      const commune = formData.get("commune") as string;
      const address = formData.get("address") as string;
      const venue = formData.get("venue") as string;
      const maxParticipantsStr = formData.get("maxParticipants") as string;
      const maxParticipants = maxParticipantsStr
        ? Number.parseInt(maxParticipantsStr, 10)
        : 0;
      const tournamentFormat = formData.get("tournamentFormat") as string;
      const isPublicStr = formData.get("isPublic") as string;
      const isPublic = isPublicStr === "true";

      // Extraire les dates
      const registrationStartDateStr = formData.get(
        "registrationStartDate"
      ) as string;
      const registrationDeadlineStr = formData.get(
        "registrationDeadline"
      ) as string;
      const startDateStr = formData.get("startDate") as string;
      const endDateStr = formData.get("endDate") as string;

      const registrationStartDate = new Date(registrationStartDateStr);
      const registrationDeadline = new Date(registrationDeadlineStr);
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      // Extraire les règles - Correction du traitement des règles
      const rulesStr = formData.get("rules") as string;
      console.log("Règles reçues:", rulesStr);

      // Traiter les règles comme une chaîne séparée par des virgules
      let rules = [];
      if (rulesStr) {
        // Vérifier si la chaîne est au format JSON
        if (rulesStr.startsWith("[") && rulesStr.endsWith("]")) {
          try {
            rules = JSON.parse(rulesStr);
          } catch (error) {
            console.error("Erreur lors du parsing JSON des règles:", error);
            // Fallback: traiter comme une chaîne séparée par des virgules
            rules = rulesStr.split(",").map((rule) => rule.trim());
          }
        } else {
          // Traiter comme une chaîne séparée par des virgules
          rules = rulesStr.split(",").map((rule) => rule.trim());
        }
      }

      console.log("Règles traitées:", rules);

      // Traiter les images
      const imageFile = formData.get("image") as File;
      const bannerFile = formData.get("banner") as File;

      let imageUrl = null;
      let bannerUrl = null;

      // Télécharger l'image principale si elle existe
      if (imageFile && imageFile.size > 0) {
        try {
          imageUrl = await uploadImage(imageFile);
          console.log(`✅ Image téléchargée avec succès: ${imageUrl}`);
        } catch (error) {
          console.error("❌ Erreur lors du téléchargement de l'image:", error);
        }
      }

      // Télécharger la bannière si elle existe
      if (bannerFile && bannerFile.size > 0) {
        try {
          bannerUrl = await uploadImage(bannerFile);
          console.log(`✅ Bannière téléchargée avec succès: ${bannerUrl}`);
        } catch (error) {
          console.error(
            "❌ Erreur lors du téléchargement de la bannière:",
            error
          );
        }
      }

      // Créer la compétition
      console.log("Tentative de création de compétition via API...");
      const competition = await createCompetition({
        title,
        description,
        category,
        country,
        city,
        commune,
        address,
        venue,
        registrationStartDate,
        registrationDeadline,
        startDate,
        endDate,
        maxParticipants,
        imageUrl,
        bannerUrl,
        organizerId: userId,
        status: CompetitionStatus.OPEN,
        tournamentFormat,
        isPublic,
        rules,
      });

      return NextResponse.json({
        message: "Compétition créée avec succès",
        competition: {
          id: competition.id,
          title: competition.title,
          status: competition.status,
          uniqueCode: competition.uniqueCode,
        },
      });
    } else {
      // Traiter les données JSON
      const data = await request.json();

      // Créer la compétition
      const competition = await createCompetition({
        ...data,
        organizerId: userId,
      });

      return NextResponse.json({
        message: "Compétition créée avec succès",
        competition: {
          id: competition.id,
          title: competition.title,
          status: competition.status,
          uniqueCode: competition.uniqueCode,
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de la compétition",
      },
      { status: 500 }
    );
  }
}

// GET: Récupérer toutes les compétitions de l'organisateur
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'ID de l'utilisateur
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur non trouvé" },
        { status: 400 }
      );
    }

    // Établir la connexion à MongoDB
    const db = await connectDB();

    // Récupérer les compétitions de l'organisateur
    const competitions = await db
      .collection("Competition")
      .find({ organizerId: userId })
      .toArray();

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des compétitions",
      },
      { status: 500 }
    );
  }
}
