import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createCompetition } from "@/lib/competition-service";
import { uploadImage } from "@/lib/blob";
import { CompetitionStatus } from "@/lib/prisma-schema";
import { connectDB } from "@/lib/mongodb-client";
import { getCompetitionsByOrganizerId } from "@/lib/competition-service";

// Interface pour le type de retour de la compétition
interface Competition {
  id: string;
  _id?: any;
  title: string;
  description?: string;
  category?: string;
  country?: string;
  city?: string;
  commune?: string;
  address?: string;
  venue?: string;
  imageUrl?: string;
  bannerUrl?: string;
  registrationStartDate?: Date;
  registrationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
  status?: string;
  tournamentFormat?: string;
  isPublic?: boolean;
  rules?: string[];
  uniqueCode: string;
  organizerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Tentative de création de compétition via API...");

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.error("Utilisateur non authentifié");
      return NextResponse.json(
        { error: "Vous devez être connecté pour créer une compétition" },
        { status: 401 }
      );
    }

    console.log("Session utilisateur:", session.user);

    // Vérifier le rôle de l'utilisateur
    if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
      console.error("Utilisateur non autorisé:", session.user.role);
      return NextResponse.json(
        { error: "Vous devez être un organisateur pour créer une compétition" },
        { status: 403 }
      );
    }

    // Récupérer l'ID de l'utilisateur
    let userId = session.user.id;

    // Si l'ID n'est pas disponible dans la session, essayer de le récupérer par email
    if (!userId && session.user.email) {
      console.log(
        "ID utilisateur non trouvé dans la session, recherche par email:",
        session.user.email
      );

      // Se connecter à MongoDB
      const db = await connectDB();

      // Rechercher l'utilisateur directement dans MongoDB
      console.log(
        `🔍 Recherche d'utilisateur par email: ${session.user.email}`
      );
      const user = await db
        .collection("User")
        .findOne({ email: session.user.email });

      if (user && user._id) {
        userId = user._id.toString();
        console.log("Utilisateur trouvé par email, ID:", userId);
      } else {
        console.error(
          "Utilisateur non trouvé avec l'email:",
          session.user.email
        );

        // Vérifier si l'utilisateur existe dans la base de données
        const count = await db
          .collection("User")
          .countDocuments({ email: session.user.email });
        console.log(
          `Nombre d'utilisateurs avec l'email ${session.user.email}: ${count}`
        );

        // Lister tous les utilisateurs pour déboguer
        const allUsers = await db
          .collection("User")
          .find({})
          .limit(5)
          .toArray();
        console.log(
          "Échantillon d'utilisateurs dans la base de données:",
          allUsers.map((u) => ({
            _id: u._id ? u._id.toString() : "undefined",
            email: u.email || "undefined",
            role: u.role || "undefined",
          }))
        );

        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }
    }

    if (!userId) {
      console.error("Impossible de déterminer l'ID de l'utilisateur");
      return NextResponse.json(
        { error: "Impossible de déterminer l'ID de l'utilisateur" },
        { status: 400 }
      );
    }

    // Traiter les données du formulaire multipart
    const formData = await request.formData();

    // Extraire les champs de base
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const country = formData.get("country") as string;
    const city = formData.get("city") as string;
    const commune = formData.get("commune") as string;
    const address = formData.get("address") as string;
    const venue = formData.get("venue") as string;
    const maxParticipantsStr = formData.get("maxParticipants") as string;
    const maxParticipants = Number.parseInt(maxParticipantsStr, 10);
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

    // Extraire les règles
    const rulesStr = formData.get("rules") as string;
    const rules = rulesStr ? rulesStr.split(",") : [];

    // Traiter les images
    const imageFile = formData.get("image") as File;
    const bannerFile = formData.get("banner") as File;

    let imageUrl = null;
    let bannerUrl = null;

    // Télécharger l'image principale si elle existe
    if (imageFile && imageFile.size > 0) {
      try {
        const uploadedImage = await uploadImage(imageFile);
        imageUrl = uploadedImage;
        console.log("✅ Image téléchargée avec succès:", imageUrl);
      } catch (error) {
        console.error("❌ Erreur lors du téléchargement de l'image:", error);
      }
    }

    // Télécharger la bannière si elle existe
    if (bannerFile && bannerFile.size > 0) {
      try {
        const uploadedBanner = await uploadImage(bannerFile);
        bannerUrl = uploadedBanner;
        console.log("✅ Bannière téléchargée avec succès:", bannerUrl);
      } catch (error) {
        console.error(
          "❌ Erreur lors du téléchargement de la bannière:",
          error
        );
      }
    }

    // Créer la compétition
    const competition = (await createCompetition({
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
    })) as Competition;

    return NextResponse.json({
      success: true,
      competition: {
        id: competition.id || competition._id?.toString() || "",
        title: competition.title || "",
        uniqueCode: competition.uniqueCode || "",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la compétition" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log("❌ Session non trouvée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'ID de l'utilisateur
    let userId = session.user.id;

    // Si l'ID n'est pas disponible dans la session, essayer de le récupérer par email
    if (!userId && session.user.email) {
      console.log(
        "ID utilisateur non trouvé dans la session, recherche par email:",
        session.user.email
      );

      // Se connecter à MongoDB
      const db = await connectDB();

      // Rechercher l'utilisateur directement dans MongoDB
      console.log(
        `🔍 Recherche d'utilisateur par email: ${session.user.email}`
      );
      const user = await db
        .collection("User")
        .findOne({ email: session.user.email });

      if (user && user._id) {
        userId = user._id.toString();
        console.log("Utilisateur trouvé par email, ID:", userId);
      } else {
        console.error(
          "Utilisateur non trouvé avec l'email:",
          session.user.email
        );
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }
    }

    if (!userId) {
      console.error("Impossible de déterminer l'ID de l'utilisateur");
      return NextResponse.json(
        { error: "Impossible de déterminer l'ID de l'utilisateur" },
        { status: 400 }
      );
    }

    console.log("✅ Session trouvée pour l'utilisateur:", userId);
    console.log(
      "🔍 Récupération des compétitions pour l'organisateur:",
      userId
    );

    // Récupérer les compétitions avec le service
    const competitions = (await getCompetitionsByOrganizerId(
      userId
    )) as Competition[];

    console.log("✅ Compétitions récupérées:", competitions.length);
    console.log(
      "📊 Détails des compétitions:",
      competitions.map((c) => ({
        id: c.id || c._id?.toString() || "",
        title: c.title || "",
        status: c.status || "",
        uniqueCode: c.uniqueCode || "",
      }))
    );

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}
